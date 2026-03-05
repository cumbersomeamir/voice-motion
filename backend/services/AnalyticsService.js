'use strict';

const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Hub = require('../models/Hub');
const AgentCall = require('../models/AgentCall');
const VoiceAgent = require('../models/VoiceAgent');
const { redisGet, redisSet } = require('../config/redis');
const logger = require('../utils/logger');

const CACHE_TTL = 300; // 5 minutes

class AnalyticsService {
  /**
   * Get dashboard overview stats for an organization
   * @param {string} organizationId
   * @param {Object} dateRange - { from: Date, to: Date }
   */
  async getDashboardStats(organizationId, dateRange = {}) {
    const { from = this._startOfDay(new Date()), to = new Date() } = dateRange;
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const cacheKey = `analytics:dashboard:${organizationId}:${from.toDateString()}`;
    const cached = await redisGet(cacheKey);
    if (cached) return cached;

    const [conversationStats, agentCallStats, hubStats] = await Promise.all([
      this._getConversationStats(orgObjId, from, to),
      this._getAgentCallStats(orgObjId, from, to),
      this._getHubStats(orgObjId, from, to),
    ]);

    const result = {
      period: { from, to },
      conversations: conversationStats,
      agentCalls: agentCallStats,
      hubs: hubStats,
      generatedAt: new Date(),
    };

    await redisSet(cacheKey, result, CACHE_TTL);
    return result;
  }

  /**
   * Get conversation analytics with breakdowns
   * @param {string} organizationId
   * @param {Object} options
   */
  async getConversationAnalytics(organizationId, options = {}) {
    const {
      from = this._startOfMonth(new Date()),
      to = new Date(),
      hubId,
      groupBy = 'day', // 'day', 'week', 'month'
    } = options;

    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const matchStage = {
      organizationId: orgObjId,
      status: 'analyzed',
      createdAt: { $gte: from, $lte: to },
    };

    if (hubId) {
      matchStage.hubId = new mongoose.Types.ObjectId(hubId);
    }

    const dateGroupFormat = {
      day: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
      week: { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } },
      month: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
    };

    const [volumeTrend, sentimentBreakdown, objectionTypes, topSopScores, languageBreakdown] = await Promise.all([
      // Volume trend
      Conversation.aggregate([
        { $match: matchStage },
        { $group: { _id: dateGroupFormat[groupBy], count: { $sum: 1 }, avgDuration: { $avg: '$duration' } } },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),

      // Sentiment breakdown
      Conversation.aggregate([
        { $match: matchStage },
        { $group: { _id: '$sentiment.overall', count: { $sum: 1 }, avgScore: { $avg: '$sentiment.score' } } },
      ]),

      // Objection type frequency
      Conversation.aggregate([
        { $match: { ...matchStage, 'objections.0': { $exists: true } } },
        { $unwind: '$objections' },
        { $group: { _id: '$objections.type', count: { $sum: 1 }, resolvedCount: { $sum: { $cond: ['$objections.resolved', 1, 0] } } } },
        { $sort: { count: -1 } },
      ]),

      // SOP score distribution
      Conversation.aggregate([
        { $match: { ...matchStage, sopScore: { $ne: null } } },
        {
          $group: {
            _id: null,
            avgSopScore: { $avg: '$sopScore' },
            minSopScore: { $min: '$sopScore' },
            maxSopScore: { $max: '$sopScore' },
            p50: { $percentile: { input: '$sopScore', p: [0.5], method: 'approximate' } },
            p75: { $percentile: { input: '$sopScore', p: [0.75], method: 'approximate' } },
          },
        },
      ]),

      // Language breakdown
      Conversation.aggregate([
        { $match: matchStage },
        { $group: { _id: '$customerLanguage', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      period: { from, to, groupBy },
      volumeTrend,
      sentimentBreakdown,
      objectionTypes,
      sopScoreStats: topSopScores[0] || { avgSopScore: null },
      languageBreakdown,
    };
  }

  /**
   * Get hub performance comparison
   * @param {string} organizationId
   * @param {Object} dateRange
   */
  async getHubPerformance(organizationId, dateRange = {}) {
    const { from = this._startOfMonth(new Date()), to = new Date() } = dateRange;
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const hubPerformance = await Conversation.aggregate([
      {
        $match: {
          organizationId: orgObjId,
          status: 'analyzed',
          createdAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: '$hubId',
          totalConversations: { $sum: 1 },
          avgSopScore: { $avg: '$sopScore' },
          avgSentimentScore: { $avg: '$sentiment.score' },
          avgDuration: { $avg: '$duration' },
          positiveCount: { $sum: { $cond: [{ $eq: ['$sentiment.overall', 'positive'] }, 1, 0] } },
          negativeCount: { $sum: { $cond: [{ $eq: ['$sentiment.overall', 'negative'] }, 1, 0] } },
          withObjections: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$objections', []] } }, 0] }, 1, 0] } },
          followUpsTriggered: { $sum: { $cond: ['$followUpTriggered', 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'hubs',
          localField: '_id',
          foreignField: '_id',
          as: 'hub',
        },
      },
      { $unwind: { path: '$hub', preserveNullAndEmpty: true } },
      {
        $project: {
          hubId: '$_id',
          hubName: '$hub.name',
          city: '$hub.city',
          state: '$hub.state',
          totalConversations: 1,
          avgSopScore: { $round: ['$avgSopScore', 1] },
          avgSentimentScore: { $round: ['$avgSentimentScore', 2] },
          avgDuration: { $round: ['$avgDuration', 0] },
          positiveCount: 1,
          negativeCount: 1,
          withObjections: 1,
          followUpsTriggered: 1,
          sentimentPositiveRate: {
            $round: [{ $multiply: [{ $divide: ['$positiveCount', '$totalConversations'] }, 100] }, 1],
          },
        },
      },
      { $sort: { avgSopScore: -1 } },
    ]);

    return { period: { from, to }, hubs: hubPerformance };
  }

  /**
   * Get salesperson performance
   * @param {string} organizationId
   * @param {string} hubId (optional)
   * @param {Object} dateRange
   */
  async getSalespersonPerformance(organizationId, hubId, dateRange = {}) {
    const { from = this._startOfMonth(new Date()), to = new Date() } = dateRange;
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const matchStage = {
      organizationId: orgObjId,
      status: 'analyzed',
      createdAt: { $gte: from, $lte: to },
    };

    if (hubId) {
      matchStage.hubId = new mongoose.Types.ObjectId(hubId);
    }

    const performance = await Conversation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$salesPersonId',
          totalConversations: { $sum: 1 },
          avgSopScore: { $avg: '$sopScore' },
          avgSentimentScore: { $avg: '$sentiment.score' },
          avgDuration: { $avg: '$duration' },
          positiveCount: { $sum: { $cond: [{ $eq: ['$sentiment.overall', 'positive'] }, 1, 0] } },
          followUpsTriggered: { $sum: { $cond: ['$followUpTriggered', 1, 0] } },
          highIntentCount: { $sum: { $cond: [{ $gte: ['$intentSignals.purchaseIntent', 0.7] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmpty: true } },
      {
        $project: {
          userId: '$_id',
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          email: '$user.email',
          totalConversations: 1,
          avgSopScore: { $round: ['$avgSopScore', 1] },
          avgSentimentScore: { $round: ['$avgSentimentScore', 2] },
          avgDuration: { $round: ['$avgDuration', 0] },
          positiveRate: {
            $round: [{ $multiply: [{ $divide: ['$positiveCount', '$totalConversations'] }, 100] }, 1],
          },
          followUpsTriggered: 1,
          highIntentCount: 1,
        },
      },
      { $sort: { avgSopScore: -1 } },
      { $limit: 50 },
    ]);

    return { period: { from, to }, salespersons: performance };
  }

  /**
   * Aggregate and update hub daily stats
   * Called by the analytics aggregator job
   * @param {Date} date - Date to aggregate for
   */
  async aggregateHubDailyStats(date = new Date()) {
    const start = this._startOfDay(date);
    const end = this._endOfDay(date);

    const hubs = await Hub.find({ isActive: true }).lean();
    let updatedCount = 0;

    for (const hub of hubs) {
      try {
        const [stats] = await Conversation.aggregate([
          {
            $match: {
              hubId: hub._id,
              createdAt: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: null,
              conversationsToday: { $sum: 1 },
              avgSentiment: { $avg: '$sentiment.score' },
              avgSopScore: { $avg: '$sopScore' },
              withHighIntent: {
                $sum: { $cond: [{ $gte: ['$intentSignals.purchaseIntent', 0.7] }, 1, 0] },
              },
            },
          },
        ]);

        const conversionRate = stats
          ? Math.round((stats.withHighIntent / stats.conversationsToday) * 100 * 10) / 10
          : 0;

        await Hub.findByIdAndUpdate(hub._id, {
          $set: {
            'stats.conversationsToday': stats?.conversationsToday || 0,
            'stats.conversionRate': conversionRate,
            'stats.avgSentiment': Math.round((stats?.avgSentiment || 0) * 100) / 100,
            'stats.avgSopScore': Math.round(stats?.avgSopScore || 0),
            'stats.lastUpdated': new Date(),
          },
          $inc: {
            'stats.totalConversations': stats?.conversationsToday || 0,
          },
        });

        updatedCount++;
      } catch (err) {
        logger.error(`Failed to aggregate stats for hub ${hub._id}: ${err.message}`);
      }
    }

    logger.info(`Hub daily stats aggregated for ${date.toDateString()}: ${updatedCount} hubs updated`);
    return { updatedCount };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  async _getConversationStats(orgObjId, from, to) {
    const [result] = await Conversation.aggregate([
      {
        $match: { organizationId: orgObjId, createdAt: { $gte: from, $lte: to } },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          analyzed: { $sum: { $cond: [{ $eq: ['$status', 'analyzed'] }, 1, 0] } },
          processing: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          avgDuration: { $avg: '$duration' },
          avgSopScore: { $avg: '$sopScore' },
          avgSentiment: { $avg: '$sentiment.score' },
          followUps: { $sum: { $cond: ['$followUpTriggered', 1, 0] } },
        },
      },
    ]);

    return result || { total: 0, analyzed: 0, processing: 0, failed: 0 };
  }

  async _getAgentCallStats(orgObjId, from, to) {
    const [result] = await AgentCall.aggregate([
      {
        $match: { organizationId: orgObjId, createdAt: { $gte: from, $lte: to } },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          totalMinutes: { $sum: '$costMinutes' },
          avgDuration: { $avg: '$duration' },
        },
      },
    ]);

    return result || { total: 0, completed: 0, failed: 0, totalMinutes: 0 };
  }

  async _getHubStats(orgObjId, from, to) {
    const totalHubs = await Hub.countDocuments({ organizationId: orgObjId, isActive: true });
    const activeHubs = await Conversation.distinct('hubId', {
      organizationId: orgObjId,
      createdAt: { $gte: from, $lte: to },
    });

    return { total: totalHubs, active: activeHubs.length };
  }

  _startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  _endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  _startOfMonth(date) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

module.exports = new AnalyticsService();

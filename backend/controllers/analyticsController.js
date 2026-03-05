'use strict';

const AnalyticsService = require('../services/AnalyticsService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler.middleware');

function parseDateRange(query) {
  const { from, to } = query;
  const dateRange = {};

  if (from) {
    dateRange.from = new Date(from);
    if (isNaN(dateRange.from)) throw new AppError('Invalid "from" date format', 400, 'INVALID_DATE');
  }
  if (to) {
    dateRange.to = new Date(to);
    if (isNaN(dateRange.to)) throw new AppError('Invalid "to" date format', 400, 'INVALID_DATE');
  }

  return dateRange;
}

/**
 * GET /api/v1/analytics/dashboard
 */
async function getDashboard(req, res, next) {
  try {
    const organizationId = req.user.organizationId;
    const dateRange = parseDateRange(req.query);
    const stats = await AnalyticsService.getDashboardStats(organizationId, dateRange);
    return sendSuccess(res, { stats });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/analytics/conversations
 */
async function getConversationAnalytics(req, res, next) {
  try {
    const organizationId = req.user.organizationId;
    const { groupBy = 'day', hubId } = req.query;

    const options = {
      ...parseDateRange(req.query),
      groupBy,
      hubId,
    };

    const analytics = await AnalyticsService.getConversationAnalytics(organizationId, options);
    return sendSuccess(res, { analytics });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/analytics/hubs
 */
async function getHubPerformance(req, res, next) {
  try {
    const organizationId = req.user.organizationId;
    const dateRange = parseDateRange(req.query);
    const data = await AnalyticsService.getHubPerformance(organizationId, dateRange);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/analytics/salespersons
 */
async function getSalespersonPerformance(req, res, next) {
  try {
    const organizationId = req.user.organizationId;
    const { hubId } = req.query;
    const dateRange = parseDateRange(req.query);
    const data = await AnalyticsService.getSalespersonPerformance(organizationId, hubId, dateRange);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/analytics/objections
 * Objection analysis breakdown
 */
async function getObjectionAnalysis(req, res, next) {
  try {
    const mongoose = require('mongoose');
    const Conversation = require('../models/Conversation');
    const organizationId = req.user.organizationId;
    const { hubId } = req.query;
    const { from, to } = parseDateRange(req.query);

    const matchStage = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      status: 'analyzed',
      'objections.0': { $exists: true },
    };

    if (from || to) {
      matchStage.createdAt = {};
      if (from) matchStage.createdAt.$gte = from;
      if (to) matchStage.createdAt.$lte = to;
    }

    if (hubId) {
      matchStage.hubId = new mongoose.Types.ObjectId(hubId);
    }

    const breakdown = await Conversation.aggregate([
      { $match: matchStage },
      { $unwind: '$objections' },
      {
        $group: {
          _id: '$objections.type',
          count: { $sum: 1 },
          resolved: { $sum: { $cond: ['$objections.resolved', 1, 0] } },
          resolutionRate: { $avg: { $cond: ['$objections.resolved', 1, 0] } },
          examples: { $push: { $substr: ['$objections.text', 0, 200] } },
        },
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          resolved: 1,
          resolutionRate: { $round: [{ $multiply: ['$resolutionRate', 100] }, 1] },
          examples: { $slice: ['$examples', 3] },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return sendSuccess(res, { breakdown });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/analytics/sentiment-trend
 */
async function getSentimentTrend(req, res, next) {
  try {
    const mongoose = require('mongoose');
    const Conversation = require('../models/Conversation');
    const organizationId = req.user.organizationId;
    const { groupBy = 'day', hubId } = req.query;
    const { from, to } = parseDateRange(req.query);

    const matchStage = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      status: 'analyzed',
      'sentiment.overall': { $ne: null },
    };

    if (from || to) {
      matchStage.createdAt = {};
      if (from) matchStage.createdAt.$gte = from;
      if (to) matchStage.createdAt.$lte = to;
    }

    if (hubId) matchStage.hubId = new mongoose.Types.ObjectId(hubId);

    const dateGroupFormat = {
      day: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
      week: { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } },
      month: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
    };

    const trend = await Conversation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: dateGroupFormat[groupBy] || dateGroupFormat.day,
          avgScore: { $avg: '$sentiment.score' },
          positive: { $sum: { $cond: [{ $eq: ['$sentiment.overall', 'positive'] }, 1, 0] } },
          neutral: { $sum: { $cond: [{ $eq: ['$sentiment.overall', 'neutral'] }, 1, 0] } },
          negative: { $sum: { $cond: [{ $eq: ['$sentiment.overall', 'negative'] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          period: '$_id',
          avgScore: { $round: ['$avgScore', 2] },
          positive: 1,
          neutral: 1,
          negative: 1,
          total: 1,
          positiveRate: { $round: [{ $multiply: [{ $divide: ['$positive', '$total'] }, 100] }, 1] },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    return sendSuccess(res, { trend, groupBy });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getConversationAnalytics,
  getHubPerformance,
  getSalespersonPerformance,
  getObjectionAnalysis,
  getSentimentTrend,
};

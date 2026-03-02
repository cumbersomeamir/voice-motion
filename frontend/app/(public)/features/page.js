'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Mic, Brain, BarChart3, Zap, CheckCircle, ArrowRight, Play,
  PhoneCall, Globe, Shield, Target, TrendingUp, Users, MessageSquare,
  Clock, Award, ChevronRight, Layers, Database, Bell
} from 'lucide-react'

export const metadata = {
  title: 'Features — Voice Intelligence Platform',
  description: 'Explore VoiceMotion AI features: Scribe conversation intelligence, AI voice agents, and real-time analytics — built for Indian car dealerships.',
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const tabs = ['Conversation Intelligence', 'AI Voice Agents', 'Analytics Dashboard']

const scribeFeatures = [
  {
    icon: Mic,
    title: 'Real-time Multilingual Transcription',
    desc: 'Transcribes conversations live in 14 Indian languages. Handles code-switching (Hindi-English, Tamil-English), regional accents, and dealership jargon.',
  },
  {
    icon: Brain,
    title: 'Automatic Call Summarization',
    desc: 'AI-generated summaries delivered within 30 seconds of call completion. Captures key discussion points, customer preferences, and action items.',
  },
  {
    icon: Target,
    title: 'Intent & Stage Detection',
    desc: 'Automatically classifies call intent: Inquiry, Test Drive Request, Price Negotiation, Objection, Closing, or After-Sales. Maps to your sales funnel.',
  },
  {
    icon: TrendingUp,
    title: 'Sentiment Analysis',
    desc: 'Moment-by-moment sentiment tracking. Know exactly when a call turned negative and why. Identify what your best executives say to flip hesitant customers.',
  },
  {
    icon: Users,
    title: 'Competitor Intelligence',
    desc: 'Automatically flags competitor mentions (Maruti vs Hyundai, Kia Seltos vs Creta). Tracks which competitors are most often compared against your models.',
  },
  {
    icon: Zap,
    title: 'Smart Action Extraction',
    desc: 'Extracts commitments and follow-ups from natural conversation. "I\'ll call you on Monday" becomes a CRM task automatically. No manual entry.',
  },
]

const agentFeatures = [
  {
    icon: PhoneCall,
    title: 'Inbound Inquiry Handling',
    desc: 'AI agents answer calls 24/7, collect customer details, understand vehicle interest, and qualify leads — before any human is involved.',
  },
  {
    icon: MessageSquare,
    title: 'Appointment Booking',
    desc: 'Agents check your calendar and book test drives directly. Sends confirmation to customer via SMS and WhatsApp in their preferred language.',
  },
  {
    icon: Clock,
    title: 'Follow-up Call Automation',
    desc: 'Automatically calls back leads who expressed interest but didn\'t visit. Recaptures up to 35% of leads that would otherwise be lost.',
  },
  {
    icon: Globe,
    title: 'Native Language Conversations',
    desc: 'Agents speak fluent Hindi, Tamil, Telugu, Kannada, Bengali, and 9 more languages. Not robotic translation — natural conversation.',
  },
  {
    icon: Shield,
    title: 'Human Escalation',
    desc: 'When a customer is ready to commit or has complex queries, the AI seamlessly transfers to your best available executive with full context.',
  },
  {
    icon: Bell,
    title: 'Post-Service Follow-up',
    desc: 'After service visits, agents automatically call customers for feedback, satisfaction scores, and upsell opportunities for service packages.',
  },
]

const analyticsFeatures = [
  {
    icon: BarChart3,
    title: 'Conversion Funnel Analytics',
    desc: 'Track every call from inquiry to booking. See exactly where deals drop off and which executives convert best at each stage.',
  },
  {
    icon: TrendingUp,
    title: 'Performance Leaderboards',
    desc: 'Real-time rankings of sales executives by conversion rate, call quality, response time, and customer satisfaction scores.',
  },
  {
    icon: Layers,
    title: 'Objection Pattern Analysis',
    desc: 'Discover the top 10 objections your customers raise. See which responses work best. Build a playbook from your own conversation data.',
  },
  {
    icon: Database,
    title: 'Multi-Location Dashboard',
    desc: 'For dealer groups: compare performance across all your outlets. Identify your star performers and replicate their approach at other locations.',
  },
  {
    icon: Target,
    title: 'AI Coaching Highlights',
    desc: 'Every week, get a curated set of call clips — best practices from top performers, coaching opportunities for junior executives.',
  },
  {
    icon: Award,
    title: 'Custom Reports & Exports',
    desc: 'Schedule and export weekly performance reports for management reviews. Export to Excel, PDF, or connect to your BI tools via API.',
  },
]

const tabData = [
  { label: 'Conversation Intelligence', features: scribeFeatures, badge: 'Scribe', color: 'cyan' },
  { label: 'AI Voice Agents', features: agentFeatures, badge: 'Agents', color: 'orange' },
  { label: 'Analytics Dashboard', features: analyticsFeatures, badge: 'Insights', color: 'cyan' },
]

const integrations = [
  'Tata DMS', 'Maruti ARENA', 'Hyundai HDMS', 'Kia KDMS', 'Mahindra EDMS',
  'WhatsApp Business', 'Truecaller', 'Justdial', 'CarDekho', 'Cars24',
  'Salesforce', 'Zoho CRM', 'Leadsquared', 'Exotel', 'Ozonetel',
]

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden grid-lines">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/04 rounded-full blur-[120px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-8"
          >
            Platform Features
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold mb-6"
          >
            Built for Indian
            <br />
            <span className="gradient-text">Automotive Sales</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-xl max-w-3xl mx-auto mb-12"
          >
            Three powerful modules working in concert: Scribe captures every conversation,
            AI Agents handle 24/7 follow-up, and Analytics turns data into coaching.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/demo" className="px-6 py-3 bg-secondary hover:bg-secondary/90 text-white rounded-xl font-semibold transition-all shadow-glow-orange">
              See a Live Demo
            </Link>
            <Link href="/pricing" className="px-6 py-3 glass border border-white/10 hover:border-accent/30 text-white rounded-xl font-semibold transition-all">
              View Pricing
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="sticky top-16 z-30 bg-[#0A0E1A]/90 backdrop-blur-xl border-b border-white/05">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0">
            {tabData.map((tab, index) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(index)}
                className={`relative flex-1 sm:flex-none px-6 py-4 text-sm font-medium transition-all duration-300 ${
                  activeTab === index
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
                {activeTab === index && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Content */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Section header */}
              <div className="text-center mb-16">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold mb-6 ${
                  tabData[activeTab].color === 'cyan'
                    ? 'border-accent/30 bg-accent/10 text-accent'
                    : 'border-secondary/30 bg-secondary/10 text-secondary'
                }`}>
                  {tabData[activeTab].badge}
                </span>
                <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
                  {activeTab === 0 && 'Scribe — Conversation Intelligence'}
                  {activeTab === 1 && 'AI Voice Agents — 24/7 Automation'}
                  {activeTab === 2 && 'Analytics — Data-Driven Coaching'}
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  {activeTab === 0 && 'Every call, every language, every insight — captured automatically with 98.5% accuracy.'}
                  {activeTab === 1 && 'Deploy AI agents that speak your customers\' language and never sleep.'}
                  {activeTab === 2 && 'Turn thousands of conversation data points into a competitive advantage.'}
                </p>
              </div>

              {/* Feature grid */}
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {tabData[activeTab].features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    variants={fadeUp}
                    className={`glass rounded-2xl p-6 border card-hover group ${
                      tabData[activeTab].color === 'cyan'
                        ? 'border-white/08 hover:border-accent/30'
                        : 'border-white/08 hover:border-secondary/30'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      tabData[activeTab].color === 'cyan'
                        ? 'bg-accent/15 text-accent'
                        : 'bg-secondary/15 text-secondary'
                    }`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-display text-lg font-bold mb-3">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* How Scribe Works — detailed visual */}
      <section className="py-24 bg-surface/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">Under the Hood</h2>
            <p className="text-gray-400 text-lg">How VoiceMotion processes your dealership calls</p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-8 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { step: '1', title: 'Call Received', desc: 'IVR, mobile, or WhatsApp call arrives', icon: PhoneCall },
                { step: '2', title: 'Audio Captured', desc: 'Encrypted and streamed to AI pipeline', icon: Mic },
                { step: '3', title: 'Transcribed', desc: '98.5% accurate multilingual STT', icon: Brain },
                { step: '4', title: 'Analyzed', desc: 'NLP extracts intent, sentiment, entities', icon: Zap },
                { step: '5', title: 'Actioned', desc: 'CRM tasks, alerts, summaries sent', icon: CheckCircle },
              ].map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-4 relative">
                    <step.icon className="w-7 h-7 text-accent" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-surface-2 border border-accent/50 flex items-center justify-center text-xs font-bold text-accent">
                      {step.step}
                    </div>
                  </div>
                  <div className="font-semibold text-sm mb-2">{step.title}</div>
                  <div className="text-gray-500 text-xs">{step.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Integrates With Your Stack</h2>
            <p className="text-gray-400 text-lg">Works with the tools Indian dealerships already use</p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {integrations.map((integration) => (
              <span
                key={integration}
                className="px-4 py-2 glass border border-white/08 rounded-xl text-sm font-medium text-gray-300 hover:border-accent/30 hover:text-accent transition-all cursor-default"
              >
                {integration}
              </span>
            ))}
          </div>
          <div className="text-center mt-8 text-gray-500 text-sm">
            + REST API for custom integrations · Webhook support · CSV export
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-surface/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Start Your Free Trial Today
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            30 days free. No credit card required. Setup in 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo" className="px-8 py-4 bg-secondary hover:bg-secondary/90 text-white rounded-xl font-bold text-lg shadow-glow-orange hover:shadow-glow-orange-lg transition-all">
              Get a Demo
            </Link>
            <Link href="/how-it-works" className="px-8 py-4 glass border border-white/10 hover:border-white/20 text-white rounded-xl font-bold text-lg transition-all">
              How It Works
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  PhoneCall, Mic, Brain, Zap, CheckCircle, ArrowRight,
  Shield, Clock, Settings, Users, TrendingUp, Globe
} from 'lucide-react'

export const metadata = {
  title: 'How It Works — VoiceMotion AI',
  description: 'See how VoiceMotion AI integrates with your dealership in 5 simple phases: connect, capture, analyze, act, and optimize.',
}

const phases = [
  {
    phase: '01',
    title: 'Connect Your Phone Infrastructure',
    subtitle: '48-hour setup, zero disruption',
    icon: Settings,
    color: 'accent',
    steps: [
      'Our integration team connects VoiceMotion to your existing IVR, EPABX, or mobile numbers',
      'No hardware changes or capital expenditure required',
      'Supports all major Indian telephony providers: Exotel, Ozonetel, Knowlarity, Tata Tele',
      'WhatsApp Business and CRM connected simultaneously',
      'Test environment validated before going live',
    ],
    visual: {
      title: 'Supported Systems',
      items: ['Exotel', 'Ozonetel', 'Knowlarity', 'Tata Tele', 'Vodafone IVR', 'WhatsApp API', 'Zoho CRM', 'Leadsquared'],
    },
  },
  {
    phase: '02',
    title: 'Every Call Captured Automatically',
    subtitle: 'Zero manual recording. Zero missed conversations.',
    icon: Mic,
    color: 'secondary',
    steps: [
      'Every inbound and outbound call is automatically captured — nothing is missed',
      'Audio encrypted in transit using AES-256. Stored in India-based data centers',
      'Call metadata captured: caller ID, duration, time, executive, location',
      'Handles concurrent calls across all your dealership locations simultaneously',
      'Configurable retention policies: 30, 90, 180, or 365 days',
    ],
    visual: {
      title: 'Live Call Stats',
      items: ['Recording Rate: 100%', 'Avg Call Duration: 4m 32s', 'Calls Today: 247', 'Locations Active: 7'],
    },
  },
  {
    phase: '03',
    title: 'AI Transcribes and Analyzes',
    subtitle: '98.5% accuracy. 30-second turnaround.',
    icon: Brain,
    color: 'accent',
    steps: [
      'Custom ASR models trained on 3M+ Indian automotive conversations',
      'Handles code-switching (Hindi-English, Tamil-English), accents, background noise',
      'NLP pipeline extracts: intent, sentiment, entities, next actions, competitor mentions',
      'Speaker diarization separates customer from executive throughout the call',
      'Language auto-detected — no configuration needed per call',
    ],
    visual: {
      title: 'Extraction Example',
      items: [
        'Intent: High Purchase',
        'Model: Hyundai Creta SX',
        'Budget: ₹11-12 Lakh',
        'Next Step: Test Drive',
        'Competitor: Kia Seltos',
        'Sentiment: Positive 87%',
      ],
    },
  },
  {
    phase: '04',
    title: 'Actions Taken Automatically',
    subtitle: 'From insight to action without lifting a finger.',
    icon: Zap,
    color: 'secondary',
    steps: [
      'Hot leads immediately alerted to senior sales executives via WhatsApp and app push',
      'CRM tasks automatically created for every follow-up commitment made in the call',
      'Customers receive WhatsApp confirmations and brochures without executive involvement',
      'Manager coaching alerts triggered for calls with low sentiment or missed opportunities',
      'AI Voice Agents automatically call back uncontacted leads within 15 minutes',
    ],
    visual: {
      title: 'Auto-Actions Fired',
      items: ['CRM Task Created', 'Manager Alert Sent', 'WhatsApp Brochure', 'AI Callback Queued', 'Coaching Flag Raised'],
    },
  },
  {
    phase: '05',
    title: 'Continuous Optimization',
    subtitle: 'Your team gets smarter every week.',
    icon: TrendingUp,
    color: 'accent',
    steps: [
      'Weekly AI coaching reports identify top performers and their winning scripts',
      'Managers receive curated call clips to share in team meetings',
      'Conversion funnel shows exactly where your pipeline leaks',
      'A/B test different call scripts and measure impact on conversion rate',
      'Quarterly business reviews with your dedicated VoiceMotion success manager',
    ],
    visual: {
      title: 'Weekly Improvement',
      items: [
        '+8% Conversion Rate',
        '-15% Objection Rate',
        '+22% Follow-up Rate',
        '3 Top Scripts Identified',
      ],
    },
  },
]

const faqs = [
  {
    q: 'How long does the integration take?',
    a: 'Most dealerships are live within 48 hours. Our integration team handles everything. For complex setups with multiple locations, it can take up to 5 business days.',
  },
  {
    q: 'Do my executives need to install anything?',
    a: 'No. Recording happens at the telephony layer — executives don\'t need to do anything differently. The VoiceMotion web app and mobile app are optional for viewing their own scores.',
  },
  {
    q: 'What happens to calls in regional languages?',
    a: 'VoiceMotion natively transcribes and analyzes in 14 Indian languages. If a customer speaks Tamil and the executive responds in English, both are handled correctly in one call.',
  },
  {
    q: 'Is customer consent required for recording?',
    a: 'Yes. VoiceMotion includes a configurable IVR announcement that informs callers their call may be recorded for quality purposes, fully compliant with Indian IT Act requirements.',
  },
  {
    q: 'How is call data secured?',
    a: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Data is hosted exclusively in Mumbai AWS data centers. We are SOC 2 Type II certified and DPDP 2023 compliant.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden grid-lines">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/03 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-8"
          >
            Platform Overview
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold mb-6"
          >
            From Call to Closed Deal
            <br />
            <span className="gradient-text">in 5 Phases</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-xl max-w-3xl mx-auto"
          >
            VoiceMotion AI fits into your existing workflow in 48 hours.
            No rip-and-replace. No training overhead. Just instant intelligence.
          </motion.p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 relative">
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-accent/20 to-transparent -translate-x-1/2" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {phases.map((phase, index) => (
            <motion.div
              key={phase.phase}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
              }`}
            >
              {/* Content */}
              <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      phase.color === 'accent' ? 'bg-accent/15' : 'bg-secondary/15'
                    }`}
                  >
                    <phase.icon className={`w-7 h-7 ${phase.color === 'accent' ? 'text-accent' : 'text-secondary'}`} />
                  </div>
                  <div
                    className={`font-mono text-4xl font-bold ${
                      phase.color === 'accent' ? 'text-accent/30' : 'text-secondary/30'
                    }`}
                  >
                    {phase.phase}
                  </div>
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">{phase.title}</h2>
                <p
                  className={`text-lg font-medium mb-6 ${
                    phase.color === 'accent' ? 'text-accent' : 'text-secondary'
                  }`}
                >
                  {phase.subtitle}
                </p>
                <ul className="space-y-3">
                  {phase.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle
                        className={`w-5 h-5 mt-0.5 shrink-0 ${
                          phase.color === 'accent' ? 'text-accent' : 'text-secondary'
                        }`}
                      />
                      <span className="text-gray-300 text-sm leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual */}
              <div className={index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                <div className="glass rounded-2xl p-8 border border-white/08">
                  <div
                    className={`text-sm font-semibold mb-6 ${
                      phase.color === 'accent' ? 'text-accent' : 'text-secondary'
                    }`}
                  >
                    {phase.visual.title}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {phase.visual.items.map((item, i) => (
                      <div
                        key={i}
                        className={`rounded-xl p-3 border text-sm font-medium ${
                          phase.color === 'accent'
                            ? 'bg-accent/05 border-accent/20 text-accent'
                            : 'bg-secondary/05 border-secondary/20 text-secondary'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4 mb-2 opacity-70" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 bg-surface/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Enterprise-Grade Security</h2>
            <p className="text-gray-400 text-lg">Your data never leaves India. Your customers' privacy is protected.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { icon: Shield, label: 'SOC 2 Type II', desc: 'Certified' },
              { icon: Globe, label: 'Data in India', desc: 'Mumbai AWS' },
              { icon: Shield, label: 'DPDP 2023', desc: 'Compliant' },
              { icon: Shield, label: 'AES-256', desc: 'Encryption' },
              { icon: Clock, label: '99.9%', desc: 'Uptime SLA' },
              { icon: Users, label: 'ISO 27001', desc: 'In Progress' },
            ].map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="glass rounded-xl p-4 border border-white/08 text-center"
              >
                <item.icon className="w-8 h-8 text-accent mx-auto mb-3" />
                <div className="font-bold text-sm">{item.label}</div>
                <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Common Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="glass rounded-xl p-6 border border-white/08"
              >
                <h3 className="font-semibold text-white mb-3">{faq.q}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-surface/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Live in 48 hours. No hardware. No disruption. Just results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo" className="px-8 py-4 bg-secondary hover:bg-secondary/90 text-white rounded-xl font-bold text-lg shadow-glow-orange transition-all">
              Request Free Demo
            </Link>
            <Link href="/pricing" className="px-8 py-4 glass border border-white/10 hover:border-white/20 text-white rounded-xl font-bold text-lg transition-all">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

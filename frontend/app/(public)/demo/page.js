'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Upload, Play, Pause, RefreshCw, CheckCircle, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Live Demo — VoiceMotion AI',
  description: 'Try VoiceMotion AI live. Upload a conversation or use our sample to see real-time transcription, sentiment analysis, and AI insights in action.',
}

const SAMPLE_TRANSCRIPT = [
  { speaker: 'salesperson', time: '0:00', lang: 'Hindi', text: 'Namaste sir, aaj aap Fortuner dekhna chahte hain na? Bahut achha choice hai.' },
  { speaker: 'customer', time: '0:08', lang: 'Hindi', text: 'Haan, but iska price thoda zyada lag raha hai. Mere budget mein thoda stretch hoga.' },
  { speaker: 'salesperson', time: '0:18', lang: 'Hindi', text: 'Sir, hum aapke liye special EMI plan arrange kar sakte hain. SBI ke through 7.5% interest pe 5 saal ka loan.' },
  { speaker: 'customer', time: '0:30', lang: 'Hindi', text: 'Hmm... maintenance cost kaisa rahega? Aur fuel efficiency?' },
  { speaker: 'salesperson', time: '0:42', lang: 'Hindi', text: 'Petrol version mein 10 kmpl milta hai city mein, highway pe 13-14. Maintenance ek saal warranty ke saath free hai.' },
  { speaker: 'customer', time: '0:58', lang: 'Hindi', text: 'Okay. Kya mujhe test drive karni hogi ek baar diesel version bhi?' },
  { speaker: 'salesperson', time: '1:10', lang: 'Hindi', text: 'Bilkul sir! Main abhi arrange karta hoon. Diesel version 14 kmpl deta hai highway pe.' },
]

const INSIGHTS = {
  objections: [
    { type: 'Price Concern', severity: 'high', text: '"price thoda zyada lag raha hai"', timestamp: '0:08' },
    { type: 'Budget Constraint', severity: 'medium', text: '"budget mein thoda stretch hoga"', timestamp: '0:08' },
    { type: 'Fuel Efficiency Query', severity: 'low', text: '"fuel efficiency kaisa rahega"', timestamp: '0:30' },
  ],
  sentiment: { overall: 'positive', score: 72, trend: 'improving' },
  signals: [
    { type: 'High Intent', desc: 'Customer requested diesel test drive — strong buying signal' },
    { type: 'EMI Openness', desc: 'Customer receptive to EMI financing discussion' },
    { type: 'Feature Evaluation', desc: 'Active comparison of petrol vs diesel models' },
  ],
  sopScore: 84,
  summary: [
    'Customer interested in Fortuner but has price/budget concerns',
    'Salesperson successfully introduced EMI financing option',
    'Strong buying signal: customer requested diesel variant test drive',
  ],
}

export default function DemoPage() {
  const [stage, setStage] = useState('idle') // idle | recording | processing | results
  const [progress, setProgress] = useState(0)
  const [activeSegment, setActiveSegment] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleSampleDemo = () => {
    setStage('processing')
    setProgress(0)

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setStage('results')
          return 100
        }
        return prev + 2
      })
    }, 50)
  }

  const handleReset = () => {
    setStage('idle')
    setProgress(0)
    setActiveSegment(null)
    setIsPlaying(false)
  }

  return (
    <main className="min-h-screen bg-[#0A0E1A] pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="text-[#FF4C1C] text-sm font-semibold uppercase tracking-wider">Live Demo</span>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white mt-3 mb-4">
            See VoiceMotion AI in Action
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Upload a conversation or use our pre-loaded sample to experience real-time
            transcription, insights, and AI agent generation.
          </p>
        </motion.div>

        {/* Stage: Idle */}
        {stage === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
          >
            <button
              onClick={handleSampleDemo}
              className="group bg-gradient-to-br from-[#FF4C1C]/20 to-[#FF8C00]/10 border border-[#FF4C1C]/30 rounded-2xl p-8 text-left hover:border-[#FF4C1C]/60 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-[#FF4C1C]/20 flex items-center justify-center mb-4">
                <Play className="w-7 h-7 text-[#FF4C1C]" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Use Sample Conversation</h3>
              <p className="text-gray-400 text-sm">
                Pre-loaded Hindi test drive conversation between salesperson and customer.
                See AI magic instantly.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[#FF4C1C] font-medium text-sm">
                Try it now <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              className="group bg-[#111827] border border-white/10 rounded-2xl p-8 text-left hover:border-white/20 transition-all opacity-60 cursor-not-allowed"
              disabled
            >
              <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                <Upload className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Upload Your Recording</h3>
              <p className="text-gray-400 text-sm">
                Upload an MP3/WAV file from your dealership. Available after account creation.
              </p>
              <div className="mt-4 flex items-center gap-2 text-gray-500 font-medium text-sm">
                Sign up to unlock <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </motion.div>
        )}

        {/* Stage: Processing */}
        {stage === 'processing' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-12">
              <div className="w-20 h-20 rounded-full bg-[#FF4C1C]/10 flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="w-10 h-10 text-[#FF4C1C] animate-spin" />
              </div>
              <h3 className="text-white font-bold text-2xl mb-2">Processing Audio...</h3>
              <p className="text-gray-400 mb-8">
                ElevenLabs Scribe is transcribing your conversation in real-time
              </p>

              <div className="space-y-3">
                {[
                  { label: 'Language Detection', done: progress > 20 },
                  { label: 'Speaker Diarization', done: progress > 40 },
                  { label: 'Transcription (Hindi)', done: progress > 60 },
                  { label: 'Sentiment Analysis', done: progress > 80 },
                  { label: 'Objection Detection', done: progress > 90 },
                  { label: 'AI Insights Generation', done: progress >= 100 },
                ].map((step) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      step.done ? 'bg-emerald-500/20' : 'bg-white/5'
                    }`}>
                      {step.done && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <span className={`text-sm ${step.done ? 'text-emerald-400' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF4C1C] to-[#FF8C00] rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-gray-500 text-sm mt-2">{progress}% complete</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stage: Results */}
        {stage === 'results' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-2xl">Analysis Complete</h2>
                <p className="text-gray-400 text-sm mt-1">Hindi test drive conversation — 1:25 duration</p>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Transcript */}
              <div className="lg:col-span-2 bg-[#111827] border border-white/5 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF4C1C] animate-pulse" />
                  Live Transcript
                  <span className="ml-auto text-xs text-[#00D4FF] font-medium">Hindi · 98.5% accuracy</span>
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {SAMPLE_TRANSCRIPT.map((seg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-4 rounded-xl border ${
                        seg.speaker === 'salesperson'
                          ? 'bg-[#FF4C1C]/5 border-[#FF4C1C]/15'
                          : 'bg-[#00D4FF]/5 border-[#00D4FF]/15'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${
                          seg.speaker === 'salesperson' ? 'text-[#FF4C1C]' : 'text-[#00D4FF]'
                        }`}>
                          {seg.speaker === 'salesperson' ? 'Sales' : 'Customer'}
                        </span>
                        <span className="text-xs text-gray-600">{seg.time}</span>
                        <span className="text-xs text-gray-600 ml-auto">{seg.lang}</span>
                      </div>
                      <p className="text-gray-200 text-sm">{seg.text}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Insights Panel */}
              <div className="space-y-4">
                {/* Sentiment */}
                <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                  <h4 className="text-white font-semibold text-sm mb-3">Overall Sentiment</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-emerald-400 font-bold text-xl">Positive</p>
                      <p className="text-gray-500 text-xs">Score: 72/100 · Improving</p>
                    </div>
                  </div>
                </div>

                {/* SOP Score */}
                <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                  <h4 className="text-white font-semibold text-sm mb-3">SOP Compliance</h4>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-[#00D4FF]">84</span>
                    <span className="text-gray-500 text-sm mb-1">/100</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full mt-2">
                    <div className="h-full w-[84%] bg-[#00D4FF] rounded-full" />
                  </div>
                </div>

                {/* Objections */}
                <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                  <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Objections Detected
                  </h4>
                  <div className="space-y-2">
                    {INSIGHTS.objections.map((obj, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                          obj.severity === 'high' ? 'bg-red-400' : obj.severity === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                        }`} />
                        <div>
                          <p className="text-white text-xs font-medium">{obj.type}</p>
                          <p className="text-gray-500 text-xs">{obj.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Signals */}
                <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                  <h4 className="text-white font-semibold text-sm mb-3">Buying Signals</h4>
                  <div className="space-y-2">
                    {INSIGHTS.signals.map((sig, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-emerald-400 text-xs font-medium">{sig.type}</p>
                          <p className="text-gray-500 text-xs">{sig.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="bg-gradient-to-r from-[#FF4C1C]/10 to-[#FF8C00]/5 border border-[#FF4C1C]/20 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-3">AI Summary</h3>
              <ul className="space-y-2">
                {INSIGHTS.summary.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-[#FF4C1C] mt-1">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="text-center pt-6">
              <h3 className="text-white font-bold text-2xl mb-3">
                Ready to do this for your dealership?
              </h3>
              <p className="text-gray-400 mb-6">
                Get real-time insights for every test drive conversation across all your hubs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/register"
                  className="px-8 py-4 bg-gradient-to-r from-[#FF4C1C] to-[#FF8C00] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20"
                >
                  Start Free Trial — 14 Days
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
                >
                  Talk to Sales
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Mic,
  Brain,
  BarChart3,
  Zap,
  ChevronRight,
  Star,
  Play,
  CheckCircle,
  ArrowRight,
  Globe,
  Shield,
  Clock,
  TrendingUp,
  Users,
  PhoneCall,
  MessageSquare,
  Target,
  Award,
  Building2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

// --- Animation variants ---
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

// --- Counter component ---
function AnimatedCounter({ target, suffix = '', prefix = '', duration = 2 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!inView) return
    const start = Date.now()
    const isFloat = String(target).includes('.')
    const numTarget = parseFloat(target)

    const animate = () => {
      const elapsed = (Date.now() - start) / 1000
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * numTarget
      setCount(isFloat ? current.toFixed(1) : Math.floor(current))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [inView, target, duration])

  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  )
}

// --- Waveform Hero ---
function HeroWaveform() {
  const bars = Array.from({ length: 40 }, (_, i) => i)
  return (
    <div className="flex items-center justify-center gap-1 h-24">
      {bars.map((i) => (
        <div
          key={i}
          className="waveform-bar"
          style={{
            animationDelay: `${(i * 0.05) % 1.5}s`,
            animationDuration: `${1.2 + (i % 5) * 0.15}s`,
            height: `${8 + Math.sin(i * 0.7) * 20}px`,
          }}
        />
      ))}
    </div>
  )
}

// --- Stats ticker data ---
const tickerItems = [
  '35% Higher Conversion Rate',
  '20% Revenue Uplift',
  '50% Fewer Missed Follow-ups',
  '98.5% Transcription Accuracy',
  '14 Indian Languages Supported',
  '3M+ Calls Analyzed',
  '10x Faster Coaching Insights',
  '₹2.8 Lakh Avg Revenue Saved per Dealership',
  'Maruti | Hyundai | Tata | Mahindra | Kia',
  'Hindi | Tamil | Telugu | Kannada | Bengali',
]

// --- Problems ---
const problems = [
  {
    icon: PhoneCall,
    title: 'Calls Are a Black Box',
    desc: 'You have no visibility into what your sales executives actually say or promise on the phone. Complaints arise, deals fall through, and you never know why.',
    color: 'secondary',
  },
  {
    icon: Users,
    title: 'Training Is Guesswork',
    desc: 'Sales coaching is based on gut feeling, not data. High performers have secret techniques that never get shared. New hires take 6 months to ramp up.',
    color: 'accent',
  },
  {
    icon: Clock,
    title: 'Follow-ups Fall Through Cracks',
    desc: 'Customers express intent — "I\'ll visit on Saturday" — but busy executives forget. No system captures commitments made in Hindi, Tamil, or regional dialects.',
    color: 'secondary',
  },
  {
    icon: Globe,
    title: 'Multilingual Chaos',
    desc: 'Your customers speak Hindi, Tamil, Kannada, Telugu, Marathi. Every tool in the market is English-only. Critical context is lost in translation — or never captured at all.',
    color: 'accent',
  },
]

// --- Solution steps ---
const solutionSteps = [
  {
    step: '01',
    title: 'Every Call Captured',
    desc: 'Integrates with your phone system — IVR, mobile, WhatsApp calls — to automatically record and process every customer interaction.',
    icon: Mic,
  },
  {
    step: '02',
    title: 'AI Transcription & Translation',
    desc: 'Our multilingual AI transcribes conversations in 14 Indian languages with 98.5% accuracy. Hindi, Tamil, Telugu, Kannada, Bengali — all handled natively.',
    icon: Brain,
  },
  {
    step: '03',
    title: 'Intelligence Extracted',
    desc: 'Automatically identifies customer intent, objections, next steps, competitor mentions, and sales stage. Zero manual effort.',
    icon: Zap,
  },
  {
    step: '04',
    title: 'Actioned & Coached',
    desc: 'Alerts sent for hot leads, coaching highlights shared with managers, follow-up tasks auto-created in your CRM.',
    icon: BarChart3,
  },
]

// --- Features ---
const features = [
  {
    icon: Mic,
    title: 'Scribe — Conversation Intelligence',
    desc: 'Real-time transcription and analysis of every sales call in 14 Indian languages. Get call summaries, sentiment analysis, and key topic extraction instantly.',
    badge: 'Core',
    color: 'cyan',
  },
  {
    icon: Brain,
    title: 'AI Voice Agents',
    desc: 'Deploy 24/7 AI agents that handle initial inquiry, qualification, appointment booking, and follow-up calls — speaking naturally in your customer\'s language.',
    badge: 'New',
    color: 'orange',
  },
  {
    icon: BarChart3,
    title: 'Analytics Command Center',
    desc: 'Real-time dashboards showing conversion rates by exec, common objections, peak call times, and competitive intelligence extracted from conversations.',
    badge: 'Core',
    color: 'cyan',
  },
  {
    icon: Target,
    title: 'Sales Coaching Engine',
    desc: 'AI identifies best practices from your top performers and automatically creates coaching highlights for managers to share with the entire team.',
    badge: 'Pro',
    color: 'orange',
  },
  {
    icon: CheckCircle,
    title: 'Compliance & Quality Monitoring',
    desc: 'Automatically checks if mandatory disclosures, schemes, and pricing information was communicated correctly. Never face compliance issues again.',
    badge: 'Enterprise',
    color: 'cyan',
  },
  {
    icon: Zap,
    title: 'Smart Follow-up Automation',
    desc: 'Captures every commitment made in a call — "I\'ll send you the brochure", "Callback tomorrow 3 PM" — and auto-creates tasks in your CRM.',
    badge: 'Core',
    color: 'orange',
  },
  {
    icon: Shield,
    title: 'Data Residency in India',
    desc: 'All your conversation data stays within India. Compliant with IT Act, DPDP 2023 and RBI guidelines. SOC 2 Type II certified infrastructure.',
    badge: 'Trust',
    color: 'cyan',
  },
  {
    icon: Building2,
    title: 'Hub-Level Intelligence',
    desc: 'Aggregate insights across all your dealership locations. Compare performance, share winning scripts, and identify regional patterns from a single dashboard.',
    badge: 'Enterprise',
    color: 'orange',
  },
]

// --- Metrics ---
const metrics = [
  { value: '35', suffix: '%', label: 'Higher Conversion Rate', desc: 'Average across 150+ dealerships' },
  { value: '20', suffix: '%', label: 'Revenue Uplift', desc: 'In first 6 months of deployment' },
  { value: '50', suffix: '%', label: 'Fewer Missed Follow-ups', desc: 'Via automated task capture' },
  { value: '98.5', suffix: '%', label: 'Transcription Accuracy', desc: 'Even in noisy dealership environments' },
  { value: '10', suffix: 'x', label: 'Faster Coaching Cycles', desc: 'From quarterly to weekly' },
  { value: '3', suffix: 'M+', label: 'Calls Analyzed', desc: 'Across our platform to date' },
]

// --- Testimonials ---
const testimonials = [
  {
    name: 'Rajesh Sharma',
    title: 'GM Sales, Fortune Motors (Maruti Suzuki)',
    location: 'Lucknow, UP',
    quote:
      'We had no idea what our executives were saying on calls. VoiceMotion showed us that 40% of inquiries never got a proper follow-up. Within 3 months, our bookings went up 28%. The Hindi transcription is incredibly accurate — even local UP dialects.',
    rating: 5,
    avatar: 'RS',
  },
  {
    name: 'Priya Venkatesh',
    title: 'Director, Prestige Hyundai',
    location: 'Chennai, TN',
    quote:
      'Our customers speak Tamil and our executives mix it with English. No other tool could handle this. VoiceMotion captures everything — code-switched conversations, regional slang, everything. The AI agent handles 60% of our after-hours calls now.',
    rating: 5,
    avatar: 'PV',
  },
  {
    name: 'Anil Kumar Garg',
    title: 'Owner, Garg Auto Group',
    location: 'Bangalore, KA',
    quote:
      'I have 7 outlets and I could never monitor quality across all of them. Now I get a daily digest of every hot lead, every missed opportunity, every compliance issue — in Kannada, Telugu, and English. VoiceMotion paid for itself in the first month.',
    rating: 5,
    avatar: 'AK',
  },
]

// --- Pricing teaser ---
const pricingPlans = [
  {
    name: 'Starter',
    price: '29,999',
    desc: 'Single dealership, up to 5 seats',
    cta: 'Start Free Trial',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '89,999',
    desc: 'Up to 3 locations, 20 seats, AI agents',
    cta: 'Most Popular',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    desc: 'Unlimited locations, dedicated support',
    cta: 'Contact Sales',
    highlight: false,
  },
]

// --- CTA Form schema ---
const ctaSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  dealership: z.string().min(2, 'Dealership name required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  locations: z.string().min(1, 'Please select number of locations'),
})

// --- Main Page ---
export default function HomePage() {
  const [activeStep, setActiveStep] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const controls = useAnimation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(ctaSchema) })

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % solutionSteps.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const onSubmit = async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    toast.success('Demo request received! Our team will call you within 2 hours.')
    reset()
  }

  return (
    <div className="overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-lines">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[#0A0E1A]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${4 + (i % 4) * 3}px`,
              height: `${4 + (i % 4) * 3}px`,
              background: i % 2 === 0 ? '#00D4FF' : '#FF4C1C',
              left: `${10 + i * 7}%`,
              top: `${20 + (i * 17) % 60}%`,
              animation: `particle-float ${6 + i * 0.5}s linear ${i * 0.8}s infinite`,
            }}
          />
        ))}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-8"
          >
            <div className="w-2 h-2 bg-accent rounded-full animate-ping-slow" />
            Now supporting 14 Indian languages — including Bhojpuri & Odia
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05] mb-6"
          >
            Every Car Sale
            <br />
            <span className="gradient-text">Starts With a Call.</span>
            <br />
            We Make Every
            <br />
            Call Count.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            VoiceMotion AI transforms every dealership conversation into actionable intelligence.
            Transcribe, analyze, and automate follow-ups in{' '}
            <span className="text-accent font-medium">Hindi, Tamil, Telugu, Kannada</span> and 10 more
            Indian languages. Built exclusively for Indian automotive sales.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/demo"
              className="group flex items-center gap-2 px-8 py-4 bg-secondary hover:bg-secondary/90 text-white rounded-xl font-semibold text-lg transition-all duration-300 shadow-glow-orange hover:shadow-glow-orange-lg hover:-translate-y-1"
            >
              Get a Live Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/features"
              className="group flex items-center gap-2 px-8 py-4 glass border border-white/10 hover:border-accent/40 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:-translate-y-1"
            >
              <Play className="w-5 h-5 text-accent" />
              See How It Works
            </Link>
          </motion.div>

          {/* Waveform visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="glass rounded-2xl p-6 sm:p-8 border border-white/08">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
                <span className="text-sm text-gray-400 font-mono">LIVE — Analyzing call from Raj Motors, Pune</span>
                <div className="ml-auto flex items-center gap-2 text-xs text-accent">
                  <Mic className="w-3 h-3" />
                  Recording
                </div>
              </div>
              <HeroWaveform />
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'Sentiment', value: 'Positive 87%', color: 'text-green-400' },
                  { label: 'Intent', value: 'High Purchase', color: 'text-accent' },
                  { label: 'Next Action', value: 'Schedule Test Drive', color: 'text-secondary' },
                ].map((item) => (
                  <div key={item.label} className="bg-surface-2/50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                    <div className={`text-sm font-semibold ${item.color}`}>{item.value}</div>
                  </div>
                ))}
              </div>
              {/* Transcript preview */}
              <div className="mt-4 text-left space-y-2">
                <div className="flex gap-2 text-sm">
                  <span className="text-secondary font-medium w-20 shrink-0">Customer:</span>
                  <span className="text-gray-300">"Mujhe Brezza chahiye, silver color mein... budget hai ₹12 lakh tak"</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="text-accent font-medium w-20 shrink-0">Executive:</span>
                  <span className="text-gray-300">"Sir, Brezza LXi is available at ₹11.58 lakh, best option for your budget..."</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500"
          >
            {[
              '150+ Dealerships',
              'Maruti Certified Partner',
              'SOC 2 Type II',
              'DPDP 2023 Compliant',
              'Data Hosted in India',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                {item}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* STATS TICKER */}
      <section className="py-4 border-y border-white/05 bg-surface/30 overflow-hidden">
        <div className="flex gap-8">
          <div className="ticker-animation flex gap-8 shrink-0 whitespace-nowrap">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="text-sm font-medium text-gray-400 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent/70 inline-block" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="py-24 sm:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-secondary/30 bg-secondary/10 text-secondary text-sm font-medium mb-6">
              The Problem
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl font-bold mb-6">
              Indian Dealerships Are Flying Blind
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg max-w-2xl mx-auto">
              The average Indian dealership handles 500+ calls per month. Less than 5% of these
              conversations are ever reviewed. The rest? Lost revenue, missed opportunities, and
              unhappy customers.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {problems.map((problem) => (
              <motion.div
                key={problem.title}
                variants={scaleIn}
                className="glass rounded-2xl p-6 border border-white/08 card-hover border-glow-orange group"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    problem.color === 'secondary'
                      ? 'bg-secondary/15 text-secondary'
                      : 'bg-accent/15 text-accent'
                  }`}
                >
                  <problem.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-bold mb-3">{problem.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{problem.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SOLUTION / HOW IT WORKS */}
      <section className="py-24 sm:py-32 bg-surface/20 relative overflow-hidden">
        <div className="absolute inset-0 grid-lines opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-20"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-6">
              The Solution
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl font-bold mb-6">
              Intelligence From Every Conversation
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg max-w-2xl mx-auto">
              VoiceMotion plugs into your existing phone infrastructure in under 48 hours.
              No hardware changes. No disruption. Just instant intelligence.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Steps */}
            <div className="space-y-4">
              {solutionSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => setActiveStep(index)}
                  className={`cursor-pointer rounded-xl p-5 border transition-all duration-300 ${
                    activeStep === index
                      ? 'border-accent/40 bg-accent/05 shadow-glow-cyan'
                      : 'border-white/05 bg-transparent hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-mono text-sm font-bold transition-all duration-300 ${
                        activeStep === index
                          ? 'bg-accent text-primary'
                          : 'bg-surface-2 text-gray-500'
                      }`}
                    >
                      {step.step}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold mb-2">{step.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="glass rounded-2xl p-8 border border-white/08">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {activeStep === 0 && (
                      <>
                        <div className="text-accent font-mono text-sm">Call Capture Active</div>
                        <div className="flex items-center gap-3 bg-surface-2 rounded-xl p-4">
                          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                            <PhoneCall className="w-5 h-5 text-secondary" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">+91 98765 43210 → Showroom</div>
                            <div className="text-xs text-gray-500">Incoming call captured automatically</div>
                          </div>
                          <div className="ml-auto">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {['IVR', 'Mobile', 'WhatsApp'].map((src) => (
                            <div key={src} className="bg-surface-2 rounded-lg p-3 text-center text-xs text-gray-400">
                              {src}
                              <div className="mt-1 text-accent text-xs">✓ Connected</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {activeStep === 1 && (
                      <>
                        <div className="text-accent font-mono text-sm">Transcribing in Hindi...</div>
                        <div className="space-y-3">
                          {[
                            { speaker: 'Customer', text: '"Haan, mujhe Creta dikhani thi... silver ya white mein"', lang: 'Hindi' },
                            { speaker: 'Executive', text: '"Bilkul sir, Creta SX option available hai, 10.99 lakh mein"', lang: 'Hindi' },
                          ].map((line, i) => (
                            <div key={i} className="bg-surface-2 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-medium ${i === 0 ? 'text-secondary' : 'text-accent'}`}>{line.speaker}</span>
                                <span className="text-xs text-gray-600 bg-surface rounded px-2 py-0.5">{line.lang}</span>
                              </div>
                              <p className="text-sm text-gray-300">{line.text}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Brain className="w-3 h-3 text-accent" />
                          Accuracy: 98.5% · Language: Hindi · Dialect: Delhi NCR
                        </div>
                      </>
                    )}
                    {activeStep === 2 && (
                      <>
                        <div className="text-accent font-mono text-sm">Insights Extracted</div>
                        <div className="space-y-3">
                          {[
                            { label: 'Intent', value: 'Purchase — High', color: 'text-green-400' },
                            { label: 'Vehicle Interest', value: 'Hyundai Creta SX', color: 'text-accent' },
                            { label: 'Budget', value: '₹10-12 Lakh', color: 'text-accent' },
                            { label: 'Preferred Color', value: 'Silver or White', color: 'text-gray-300' },
                            { label: 'Competitor Mention', value: 'Kia Seltos (considered)', color: 'text-yellow-400' },
                            { label: 'Next Action', value: 'Schedule Test Drive', color: 'text-secondary' },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/05">
                              <span className="text-xs text-gray-500">{item.label}</span>
                              <span className={`text-xs font-semibold ${item.color}`}>{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {activeStep === 3 && (
                      <>
                        <div className="text-accent font-mono text-sm">Actions Created</div>
                        <div className="space-y-3">
                          {[
                            { type: 'CRM Task', desc: 'Schedule test drive — Raj Kumar, Creta SX', icon: CheckCircle, color: 'text-green-400' },
                            { type: 'Manager Alert', desc: 'Hot lead identified — ₹11L potential', icon: Zap, color: 'text-secondary' },
                            { type: 'WhatsApp', desc: 'Brochure sent automatically', icon: MessageSquare, color: 'text-accent' },
                          ].map((action, i) => (
                            <div key={i} className="flex items-start gap-3 bg-surface-2 rounded-lg p-3">
                              <action.icon className={`w-4 h-4 mt-0.5 shrink-0 ${action.color}`} />
                              <div>
                                <div className="text-xs text-gray-500">{action.type}</div>
                                <div className="text-sm text-gray-300">{action.desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-6">
              Platform Features
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl font-bold mb-6">
              Everything You Need to Win More Sales
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg max-w-2xl mx-auto">
              Purpose-built for Indian automotive dealerships. Not a generic tool retrofitted for India.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={scaleIn}
                className={`glass rounded-2xl p-6 border card-hover group transition-all duration-300 ${
                  feature.color === 'cyan'
                    ? 'border-white/08 hover:border-accent/30 hover:shadow-glow-cyan'
                    : 'border-white/08 hover:border-secondary/30 hover:shadow-glow-orange'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      feature.color === 'cyan'
                        ? 'bg-accent/15 text-accent'
                        : 'bg-secondary/15 text-secondary'
                    }`}
                  >
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      feature.badge === 'New'
                        ? 'bg-secondary/20 text-secondary'
                        : feature.badge === 'Enterprise'
                        ? 'bg-purple-500/20 text-purple-400'
                        : feature.badge === 'Trust'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-accent/15 text-accent'
                    }`}
                  >
                    {feature.badge}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold mb-3 leading-tight">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Link
              href="/features"
              className="group inline-flex items-center gap-2 text-accent font-semibold hover:gap-3 transition-all duration-300"
            >
              Explore all features
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* METRICS SECTION */}
      <section className="py-24 sm:py-32 bg-surface/20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Numbers That Move the Needle
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg">
              Measured across 150+ live Indian dealerships. Not projections — real results.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="font-display text-5xl sm:text-6xl font-bold gradient-text mb-2">
                  <AnimatedCounter target={metric.value} suffix={metric.suffix} />
                </div>
                <div className="text-white font-semibold text-lg mb-1">{metric.label}</div>
                <div className="text-gray-500 text-sm">{metric.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-6">
              <Award className="w-4 h-4" />
              Customer Stories
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl font-bold mb-6">
              Trusted by India's Top Dealerships
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="glass rounded-2xl p-8 border border-white/08 card-hover"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-gray-300 text-sm leading-relaxed mb-6">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{testimonial.name}</div>
                    <div className="text-xs text-gray-500">{testimonial.title}</div>
                    <div className="text-xs text-gray-600">{testimonial.location}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="py-24 sm:py-32 bg-surface/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-6">
              Simple Pricing
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Pricing That Makes Sense for Dealerships
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg">
              No per-minute charges. No hidden fees. Just flat monthly pricing.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`rounded-2xl p-8 border relative ${
                  plan.highlight
                    ? 'border-accent/50 bg-accent/05 shadow-glow-cyan'
                    : 'glass border-white/08'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-primary text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="text-lg font-semibold text-white mb-2">{plan.name}</div>
                <div className="font-display text-4xl font-bold mb-2">
                  {plan.price === 'Custom' ? (
                    <span className="gradient-text">Custom</span>
                  ) : (
                    <>
                      <span className="text-2xl">₹</span>
                      <span>{plan.price}</span>
                      <span className="text-lg font-normal text-gray-400">/mo</span>
                    </>
                  )}
                </div>
                <div className="text-sm text-gray-400 mb-6">{plan.desc}</div>
                <Link
                  href="/pricing"
                  className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    plan.highlight
                      ? 'bg-accent text-primary hover:bg-accent/90'
                      : 'border border-white/15 text-white hover:border-white/30 hover:bg-white/05'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing" className="text-accent text-sm hover:underline">
              See full pricing comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* LANGUAGES SECTION */}
      <section className="py-16 border-y border-white/05">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="font-display text-2xl font-bold mb-2">14 Indian Languages, Zero Compromise</div>
              <div className="text-gray-400 text-sm">Native understanding — not just translation</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Bengali',
                'Marathi', 'Gujarati', 'Malayalam', 'Punjabi', 'Odia',
                'Assamese', 'Bhojpuri', 'Rajasthani', 'English',
              ].map((lang) => (
                <span key={lang} className="px-3 py-1.5 text-xs font-medium bg-surface-2 border border-white/08 rounded-full text-gray-300">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/05 via-transparent to-secondary/05" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/03 rounded-full blur-[100px]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Ready to Transform Your
              <br />
              <span className="gradient-text">Dealership's Sales?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-4">
              Join 150+ dealerships already using VoiceMotion AI.
              Get a personalized demo in your language within 2 hours.
            </p>
            <p className="text-sm text-gray-500">No commitment required · 30-day free trial · Setup in 48 hours</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass rounded-2xl p-8 sm:p-10 border border-white/08"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
                  <input
                    {...register('name')}
                    placeholder="Rajesh Sharma"
                    className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Dealership Name</label>
                  <input
                    {...register('dealership')}
                    placeholder="Fortune Motors Pvt Ltd"
                    className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                  />
                  {errors.dealership && <p className="text-red-400 text-xs mt-1">{errors.dealership.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Mobile Number</label>
                  <input
                    {...register('phone')}
                    placeholder="98765 43210"
                    className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                  />
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Number of Locations</label>
                  <select
                    {...register('locations')}
                    className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                  >
                    <option value="" className="bg-surface-2">Select...</option>
                    <option value="1" className="bg-surface-2">1 Location</option>
                    <option value="2-3" className="bg-surface-2">2-3 Locations</option>
                    <option value="4-10" className="bg-surface-2">4-10 Locations</option>
                    <option value="10+" className="bg-surface-2">10+ Locations</option>
                  </select>
                  {errors.locations && <p className="text-red-400 text-xs mt-1">{errors.locations.message}</p>}
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-secondary hover:bg-secondary/90 disabled:opacity-60 text-white rounded-xl font-bold text-base transition-all duration-300 shadow-glow-orange hover:shadow-glow-orange-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Get My Free Demo
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              <p className="text-xs text-gray-600 text-center">
                By submitting, you agree to our Privacy Policy. We will call you within 2 business hours.
              </p>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

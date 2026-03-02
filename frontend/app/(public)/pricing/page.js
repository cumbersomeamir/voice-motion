'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle, X, ChevronDown, Zap, Shield, Users, Building2, ArrowRight, Phone } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    tagline: 'For single-location dealerships getting started with AI',
    price: { monthly: '29,999', annual: '24,999' },
    annualSavings: '60,000',
    seats: '5 seats',
    calls: 'Up to 1,000 calls/month',
    locations: '1 dealership location',
    highlight: false,
    color: 'default',
    cta: 'Start Free Trial',
    ctaLink: '/register',
    features: [
      'Call recording & storage (90 days)',
      'Real-time transcription — 14 languages',
      'Auto call summarization',
      'Intent & sentiment detection',
      'CRM task auto-creation',
      'WhatsApp follow-up automation',
      'Executive performance dashboard',
      'Email alerts for hot leads',
      'Basic analytics & reports',
      'Email & chat support',
      'Standard integrations (Zoho, Leadsquared)',
    ],
    notIncluded: [
      'AI Voice Agents',
      'Multi-location dashboard',
      'Coaching highlight clips',
      'Custom compliance rules',
      'Dedicated success manager',
      'API access',
    ],
  },
  {
    name: 'Growth',
    tagline: 'For growing dealer groups scaling across locations',
    price: { monthly: '89,999', annual: '74,999' },
    annualSavings: '1,80,000',
    seats: '20 seats',
    calls: 'Up to 5,000 calls/month',
    locations: 'Up to 3 locations',
    highlight: true,
    color: 'accent',
    cta: 'Start Free Trial',
    ctaLink: '/register',
    features: [
      'Everything in Starter',
      'AI Voice Agents (2 concurrent)',
      '24/7 inbound call handling',
      'Automated appointment booking',
      'Lead follow-up automation',
      'Multi-location dashboard',
      'Cross-location performance comparison',
      'Weekly coaching highlight clips',
      'Objection pattern analysis',
      'Competitor mention tracking',
      'CRM: Salesforce, HubSpot, Zoho, Leadsquared',
      'Priority support (4hr response)',
      'Monthly success review call',
      'API access (1,000 calls/day)',
    ],
    notIncluded: [
      'Custom compliance rules',
      'Dedicated success manager',
      'White-label reports',
      'Custom AI training on your data',
    ],
  },
  {
    name: 'Enterprise',
    tagline: 'For large dealer groups and OEM-level deployments',
    price: { monthly: 'Custom', annual: 'Custom' },
    annualSavings: null,
    seats: 'Unlimited',
    calls: 'Unlimited calls',
    locations: 'Unlimited locations',
    highlight: false,
    color: 'secondary',
    cta: 'Contact Sales',
    ctaLink: '/contact',
    features: [
      'Everything in Growth',
      'Unlimited AI Voice Agents',
      'Custom compliance monitoring',
      'White-label dashboard option',
      'Custom AI model training',
      'Dedicated success manager',
      'SLA: 99.9% uptime guarantee',
      'On-premise deployment option',
      'Custom data retention policies',
      'VAPT security audit',
      'Executive QBR meetings',
      'API: Unlimited calls',
      'SSO / SAML integration',
      'Custom DMS integrations',
    ],
    notIncluded: [],
  },
]

const comparisonFeatures = [
  { category: 'Core Intelligence', features: [
    { name: 'Call Recording & Storage', starter: '90 days', growth: '1 year', enterprise: 'Custom' },
    { name: 'Multilingual Transcription', starter: true, growth: true, enterprise: true },
    { name: 'Languages Supported', starter: '14', growth: '14', enterprise: '14' },
    { name: 'Call Summarization', starter: true, growth: true, enterprise: true },
    { name: 'Intent Detection', starter: true, growth: true, enterprise: true },
    { name: 'Sentiment Analysis', starter: 'Basic', growth: 'Advanced', enterprise: 'Custom' },
    { name: 'Competitor Tracking', starter: false, growth: true, enterprise: true },
  ]},
  { category: 'AI Voice Agents', features: [
    { name: 'Inbound Handling', starter: false, growth: '2 concurrent', enterprise: 'Unlimited' },
    { name: 'Appointment Booking', starter: false, growth: true, enterprise: true },
    { name: 'Follow-up Automation', starter: 'WhatsApp only', growth: 'Call + WhatsApp', enterprise: 'Custom' },
    { name: 'Languages', starter: '-', growth: '14', enterprise: '14' },
  ]},
  { category: 'Analytics & Coaching', features: [
    { name: 'Executive Leaderboard', starter: true, growth: true, enterprise: true },
    { name: 'Coaching Highlights', starter: false, growth: 'Weekly', enterprise: 'Custom' },
    { name: 'Objection Analysis', starter: 'Basic', growth: 'Advanced', enterprise: 'Custom' },
    { name: 'Multi-location Dashboard', starter: false, growth: true, enterprise: true },
    { name: 'Custom Reports', starter: false, growth: 'Standard', enterprise: 'Custom' },
  ]},
  { category: 'Support & Security', features: [
    { name: 'Support Response', starter: '24 hours', growth: '4 hours', enterprise: '1 hour' },
    { name: 'Dedicated Success Manager', starter: false, growth: false, enterprise: true },
    { name: 'API Access', starter: false, growth: '1,000/day', enterprise: 'Unlimited' },
    { name: 'Data Residency', starter: 'India', growth: 'India', enterprise: 'India/Custom' },
    { name: 'SOC 2 Type II', starter: true, growth: true, enterprise: true },
    { name: 'DPDP 2023 Compliance', starter: true, growth: true, enterprise: true },
  ]},
]

const faqs = [
  {
    q: 'Is there a free trial?',
    a: 'Yes! Starter and Growth plans include a 30-day free trial with full access. No credit card required. Enterprise customers get a personalized 30-day pilot.',
  },
  {
    q: 'How does billing work? Is it per minute?',
    a: 'No per-minute charges. VoiceMotion uses flat monthly billing based on your plan and call volume tier. Predictable costs, no surprises. Annual plans save up to 17%.',
  },
  {
    q: 'Can I change plans mid-month?',
    a: 'Yes. You can upgrade at any time — your new plan activates immediately and we pro-rate the difference. Downgrades take effect at the next billing cycle.',
  },
  {
    q: 'What if I exceed my call volume limit?',
    a: 'We will alert you at 80% usage. You can purchase additional capacity at ₹15/call overage, or upgrade to the next plan. We never cut off your service abruptly.',
  },
  {
    q: 'Do you offer discounts for OEM partnerships?',
    a: 'Yes. We have special pricing for Maruti NEXA, Hyundai HMIL, Tata Motors, and Mahindra channel partners. Contact our sales team for OEM pricing.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept all major methods: NEFT/RTGS, UPI, debit/credit cards, and cheque for annual enterprise contracts. GST invoice provided for all plans.',
  },
  {
    q: 'Is there an onboarding fee?',
    a: 'No setup fees for Starter and Growth plans. Enterprise implementations with custom integrations may have a one-time implementation fee discussed upfront.',
  },
  {
    q: 'Can I get a demo before buying?',
    a: 'Absolutely. We offer a 45-minute personalized demo with your own dealership data (or mock data). Book one at voicemotion.ai/demo or call us.',
  },
]

function ComparisonValue({ value }) {
  if (value === true) return <CheckCircle className="w-5 h-5 text-accent mx-auto" />
  if (value === false) return <X className="w-5 h-5 text-gray-600 mx-auto" />
  return <span className="text-sm text-gray-300 text-center block">{value}</span>
}

export default function PricingPage() {
  const [billing, setBilling] = useState('monthly')
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden grid-lines">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/04 rounded-full blur-[120px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-8"
          >
            Simple, Transparent Pricing
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold mb-6"
          >
            No Per-Minute Charges.
            <br />
            <span className="gradient-text">Just Results.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-xl max-w-2xl mx-auto mb-8"
          >
            Flat monthly pricing for Indian dealerships. Cancel anytime.
            30-day free trial on all plans.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-3 bg-surface rounded-xl p-1 border border-white/08"
          >
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                billing === 'monthly' ? 'bg-accent text-primary' : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                billing === 'annual' ? 'bg-accent text-primary' : 'text-gray-400 hover:text-white'
              }`}
            >
              Annual
              <span className="text-xs bg-secondary text-white px-2 py-0.5 rounded-full font-bold">Save 17%</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.12 }}
                className={`rounded-2xl p-8 border relative ${
                  plan.highlight
                    ? 'border-accent/40 bg-gradient-to-b from-accent/05 to-transparent shadow-glow-cyan'
                    : 'glass border-white/08'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-accent text-primary text-xs font-bold rounded-full tracking-wide">
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-6">
                  <div className="font-display text-2xl font-bold text-white mb-2">{plan.name}</div>
                  <div className="text-sm text-gray-400 leading-relaxed">{plan.tagline}</div>
                </div>

                <div className="mb-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={billing}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {plan.price.monthly === 'Custom' ? (
                        <div className="font-display text-4xl font-bold gradient-text">Custom</div>
                      ) : (
                        <>
                          <div className="font-display text-4xl sm:text-5xl font-bold text-white">
                            <span className="text-2xl">₹</span>
                            {billing === 'annual' ? plan.price.annual : plan.price.monthly}
                            <span className="text-lg font-normal text-gray-400">/mo</span>
                          </div>
                          {billing === 'annual' && plan.annualSavings && (
                            <div className="text-xs text-green-400 mt-1">
                              Save ₹{plan.annualSavings} per year
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <div className="flex flex-col gap-1.5 mt-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      {plan.seats}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-600" />
                      {plan.calls}
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-600" />
                      {plan.locations}
                    </div>
                  </div>
                </div>

                <Link
                  href={plan.ctaLink}
                  className={`block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all duration-300 mb-8 ${
                    plan.highlight
                      ? 'bg-accent text-primary hover:bg-accent/90 shadow-glow-cyan'
                      : plan.color === 'secondary'
                      ? 'bg-secondary text-white hover:bg-secondary/90 shadow-glow-orange'
                      : 'border border-white/15 text-white hover:bg-white/05 hover:border-white/30'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 inline ml-2" />
                </Link>

                <div className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-accent' : 'text-green-400'}`} />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5 text-sm opacity-40">
                      <X className="w-4 h-4 mt-0.5 shrink-0 text-gray-600" />
                      <span className="text-gray-500 line-through">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8 text-sm text-gray-500">
            All prices exclusive of 18% GST. · Annual plans billed upfront. ·{' '}
            <Link href="/contact" className="text-accent hover:underline">Custom volume pricing available</Link>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-surface/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">Full Feature Comparison</h2>
            <p className="text-gray-400 text-lg">Everything that\'s included in each plan</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/08">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/08">
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm w-1/3">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.name} className="py-4 px-4 text-center">
                      <div className={`font-display font-bold ${plan.highlight ? 'text-accent' : 'text-white'}`}>
                        {plan.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((category) => (
                  <>
                    <tr key={category.category} className="bg-surface/40">
                      <td colSpan={4} className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr key={feature.name} className="border-t border-white/05 hover:bg-white/02 transition-colors">
                        <td className="py-3.5 px-6 text-sm text-gray-300">{feature.name}</td>
                        <td className="py-3.5 px-4"><ComparisonValue value={feature.starter} /></td>
                        <td className="py-3.5 px-4 bg-accent/02"><ComparisonValue value={feature.growth} /></td>
                        <td className="py-3.5 px-4"><ComparisonValue value={feature.enterprise} /></td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">Pricing FAQs</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-xl border border-white/08 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-white text-sm">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ml-4 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 text-sm text-gray-400 leading-relaxed border-t border-white/05 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-surface/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/03 via-transparent to-secondary/03" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Zap className="w-12 h-12 text-accent mx-auto mb-6" />
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Start Your 30-Day Free Trial
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            No credit card. No commitment. Full platform access. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-8 py-4 bg-secondary hover:bg-secondary/90 text-white rounded-xl font-bold text-lg shadow-glow-orange transition-all">
              Start Free Trial
            </Link>
            <Link href="/contact" className="px-8 py-4 glass border border-white/10 hover:border-accent/30 text-white rounded-xl font-bold text-lg transition-all flex items-center gap-2 justify-center">
              <Phone className="w-5 h-5" />
              Talk to Sales
            </Link>
          </div>
          <p className="text-xs text-gray-600 mt-6">
            Questions? Call us: <span className="text-gray-400">+91 80 4655 7890</span> (Mon-Sat, 9am-7pm IST)
          </p>
        </div>
      </section>
    </div>
  )
}

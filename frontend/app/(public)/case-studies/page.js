import Link from 'next/link'
import { ArrowRight, TrendingUp, Building2, Clock, CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Case Studies — VoiceMotion AI',
  description: 'Real results from Indian car dealerships using VoiceMotion AI voice intelligence platform.',
}

export default function CaseStudiesPage() {
  return (
    <main className="min-h-screen bg-[#0A0E1A] pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 pt-12">
          <span className="text-[#FF4C1C] text-sm font-semibold uppercase tracking-wider">Case Studies</span>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white mt-3 mb-4">
            Real Results. Real Dealerships.
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            See how leading Indian auto dealerships transformed their sales with VoiceMotion AI.
          </p>
        </div>

        {/* Featured Case Study */}
        <div className="bg-[#111827] border border-white/5 rounded-3xl overflow-hidden mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Stats Side */}
            <div className="bg-gradient-to-br from-[#FF4C1C]/20 to-[#FF8C00]/10 p-12">
              <div className="mb-8">
                <span className="text-[#FF4C1C] text-sm font-semibold uppercase tracking-wider">Featured Case Study</span>
                <h2 className="text-white font-display font-bold text-3xl mt-2">
                  15-Hub Mumbai Dealership Increases Conversions by 35% in 90 Days
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: '35%', label: 'Conversion Uplift', icon: TrendingUp },
                  { value: '90', label: 'Days to ROI', icon: Clock },
                  { value: '15', label: 'Hubs Deployed', icon: Building2 },
                  { value: '₹2.1Cr', label: 'Additional Revenue', icon: CheckCircle },
                ].map(({ value, label, icon: Icon }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-4">
                    <Icon className="w-6 h-6 text-[#FF4C1C] mb-2" />
                    <p className="text-3xl font-bold text-white">{value}</p>
                    <p className="text-gray-400 text-sm">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Story Side */}
            <div className="p-12">
              <div className="mb-6">
                <p className="text-gray-500 text-sm font-medium mb-1">Organization</p>
                <p className="text-white font-semibold">Metro Auto Group (name anonymized)</p>
              </div>
              <div className="mb-6">
                <p className="text-gray-500 text-sm font-medium mb-1">Challenge</p>
                <p className="text-gray-300 leading-relaxed">
                  With 15 hubs across Mumbai, Thane, and Navi Mumbai, Metro Auto had no visibility
                  into what was happening in test drives. Follow-up was manual, inconsistent, and
                  limited to 150 calls/day across all hubs.
                </p>
              </div>
              <div className="mb-6">
                <p className="text-gray-500 text-sm font-medium mb-1">Solution</p>
                <p className="text-gray-300 leading-relaxed">
                  Deployed VoiceMotion AI across all 15 hubs. Every test drive conversation
                  transcribed in Hindi/Marathi, objections auto-flagged, and AI voice agents
                  calling high-intent leads within 2 hours of test drive completion.
                </p>
              </div>
              <div className="mb-8">
                <p className="text-gray-500 text-sm font-medium mb-2">Key Results</p>
                <ul className="space-y-2">
                  {[
                    'Went from 150 to 1,200+ follow-up calls per day',
                    'Average response time: 23 minutes (from 2 days)',
                    'SOP compliance improved from 60% to 89%',
                    'Customer satisfaction scores up 20%',
                  ].map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <blockquote className="border-l-4 border-[#FF4C1C] pl-4 mb-6">
                <p className="text-white italic leading-relaxed">
                  "VoiceMotion AI gave us superpowers. We went from flying blind to having full
                  visibility across all 15 hubs. Our team knows exactly where to focus every morning."
                </p>
                <cite className="text-gray-400 text-sm mt-2 block">— VP Sales, Metro Auto Group</cite>
              </blockquote>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF4C1C] to-[#FF8C00] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Get Similar Results <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* More Case Studies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {[
            {
              title: 'Pan-India OEM Dealer Network Reduces Calling Costs by 52%',
              hubs: 300, city: 'Delhi NCR + PAN India', metric: '52% cost reduction',
              desc: 'A top-3 OEM dealer network with 300 hubs nationwide automated their entire follow-up calling operation, reducing cost per contact from ₹85 to ₹41.',
            },
            {
              title: 'Regional Dealer Achieves 98.5% Hindi Transcription Accuracy',
              hubs: 8, city: 'Lucknow, UP', metric: '98.5% accuracy',
              desc: 'A growing dealership in Uttar Pradesh serving primarily Hindi-speaking customers achieved industry-leading transcription accuracy across Bhojpuri and Hindi dialects.',
            },
          ].map((cs) => (
            <div key={cs.title} className="bg-[#111827] border border-white/5 rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium text-[#FF4C1C] bg-[#FF4C1C]/10 border border-[#FF4C1C]/20 px-2.5 py-1 rounded-full">
                  {cs.metric}
                </span>
                <span className="text-xs text-gray-500">{cs.hubs} Hubs · {cs.city}</span>
              </div>
              <h3 className="text-white font-bold text-xl mb-4">{cs.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">{cs.desc}</p>
              <Link href="/contact" className="inline-flex items-center gap-1 text-[#FF4C1C] text-sm font-medium hover:gap-2 transition-all">
                Get full case study <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-[#FF4C1C]/10 to-[#FF8C00]/5 border border-[#FF4C1C]/20 rounded-2xl p-12">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Be Our Next Success Story
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Every dealership that has deployed VoiceMotion AI has seen measurable uplift
            in conversions within 30 days. Yours can be next.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#FF4C1C] to-[#FF8C00] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-lg shadow-lg shadow-orange-500/20"
          >
            Start Your Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </main>
  )
}

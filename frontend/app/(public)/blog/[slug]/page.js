import Link from 'next/link'
import { ArrowLeft, Clock, User, Calendar } from 'lucide-react'
import { posts } from '../page'

export async function generateStaticParams() {
  return posts.map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }) {
  const post = posts.find(p => p.slug === params.slug)
  if (!post) return { title: 'Not Found' }
  return {
    title: `${post.title} — VoiceMotion AI Blog`,
    description: post.excerpt,
  }
}

const postContent = {
  'why-70-percent-first-time-buyers-need-voice-guidance': `
India added over 4 million new car owners in 2025 alone. What's remarkable is that more than 70% of them were purchasing their first car ever. This isn't just a statistic — it's a fundamental shift in who walks into your showroom.

## The First-Timer Profile

The typical first-time car buyer in India today is:
- 28–38 years old, urban or semi-urban
- First-generation car owner in their family
- Digitally savvy but overwhelmed by choices
- Heavily influenced by word-of-mouth and online reviews
- Financing 80–90% of the purchase through EMI

## Why They Need More Hand-Holding

Unlike repeat buyers who know what they want, first-timers arrive with questions about everything — insurance, maintenance, EMI calculations, road tax, registration, and more. A single 60-minute test drive isn't enough to answer all their questions.

What happens? They leave saying "we'll think about it" — and 60% of them never come back to the same dealership.

## Where Voice AI Changes Everything

Voice AI doesn't replace your salesperson. It augments them. Here's how:

**During the Test Drive:** Real-time transcription captures every question the customer asks. Our AI flags the unanswered ones.

**Post Test Drive:** An AI voice agent calls the customer within 2 hours — the golden window — with personalized answers to their specific questions. "Sir, you asked about the EMI for 48 months. At SBI's current rate of 7.5%, your EMI would be ₹18,250."

**The Result:** 35% higher conversion among first-time buyers at dealerships using VoiceMotion AI.

The data is clear: first-time buyers who receive a personalized follow-up call within 2 hours are 4x more likely to complete the purchase.
  `,
}

export default function BlogPost({ params }) {
  const post = posts.find(p => p.slug === params.slug)

  if (!post) {
    return (
      <main className="min-h-screen bg-[#0A0E1A] pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Post Not Found</h1>
          <Link href="/blog" className="text-[#FF4C1C] hover:underline">Back to Blog</Link>
        </div>
      </main>
    )
  }

  const content = postContent[post.slug] || `
# ${post.title}

${post.excerpt}

## Introduction

The Indian automotive market is undergoing a profound transformation, driven by technology, changing consumer behavior, and the proliferation of AI-powered tools that are reshaping how cars are sold and bought.

## Key Insights

Voice intelligence technology is enabling dealerships across India to capture, analyze, and act on thousands of customer conversations simultaneously. What was once a manual, error-prone process is now automated with 98.5% accuracy across 14 Indian languages.

## The VoiceMotion Advantage

By integrating ElevenLabs' Scribe transcription engine with a proprietary LLM analysis pipeline, VoiceMotion AI delivers actionable insights within seconds of conversation completion. Sales managers can now see what's happening in every hub, for every salesperson, across every test drive — in real time.

## Conclusion

The future of Indian auto sales is voice-intelligent. Dealerships that adopt this technology today will have a significant competitive advantage in the years to come.
  `

  return (
    <main className="min-h-screen bg-[#0A0E1A] pt-20 pb-16">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-10 mt-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {/* Header */}
        <header className="mb-12">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border text-[#FF4C1C] bg-[#FF4C1C]/10 border-[#FF4C1C]/20 mb-4">
            {post.category}
          </span>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            {post.title}
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed mb-8">{post.excerpt}</p>
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 pb-8 border-b border-white/5">
            <span className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF4C1C] to-[#FF8C00] flex items-center justify-center text-white text-xs font-bold">
                {post.author[0]}
              </div>
              {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          {content.trim().split('\n').map((line, i) => {
            if (line.startsWith('## ')) {
              return <h2 key={i} className="text-2xl font-bold text-white mt-10 mb-4">{line.slice(3)}</h2>
            }
            if (line.startsWith('# ')) {
              return <h1 key={i} className="text-3xl font-bold text-white mt-10 mb-4">{line.slice(2)}</h1>
            }
            if (line.startsWith('**') && line.endsWith('**')) {
              return <p key={i} className="text-[#FF4C1C] font-semibold mt-6 mb-2">{line.slice(2, -2)}</p>
            }
            if (line.startsWith('- ')) {
              return <li key={i} className="text-gray-300 ml-4 mb-1">{line.slice(2)}</li>
            }
            if (line.trim() === '') {
              return <br key={i} />
            }
            return <p key={i} className="text-gray-300 leading-relaxed mb-4">{line}</p>
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-[#FF4C1C]/10 to-[#FF8C00]/5 border border-[#FF4C1C]/20 rounded-2xl p-8 text-center">
          <h3 className="text-white font-bold text-2xl mb-3">
            Ready to Transform Your Dealership?
          </h3>
          <p className="text-gray-400 mb-6">
            Join hundreds of dealerships already using VoiceMotion AI to close more deals.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#FF4C1C] to-[#FF8C00] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Book a Free Demo →
          </Link>
        </div>
      </article>
    </main>
  )
}

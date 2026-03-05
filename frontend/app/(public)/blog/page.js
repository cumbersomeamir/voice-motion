import Link from 'next/link'
import { ArrowRight, Clock, User } from 'lucide-react'

export const metadata = {
  title: 'Blog — VoiceMotion AI',
  description: 'Insights on voice AI, car dealership sales, and conversation intelligence for the Indian auto market.',
}

export const posts = [
  {
    slug: 'why-70-percent-first-time-buyers-need-voice-guidance',
    title: 'Why 70% of First-Time Car Buyers Need Voice Guidance',
    excerpt: 'India\'s auto market is booming, but 70% of buyers are first-timers navigating an overwhelming process. Here\'s how voice AI bridges the gap.',
    category: 'Industry Insights',
    readTime: '6 min read',
    author: 'Priya Mehta',
    date: '2026-02-15',
    image: '/blog/first-time-buyers.jpg',
  },
  {
    slug: 'ai-solving-language-problem-indian-auto-sales',
    title: 'How AI is Solving the Language Problem in Indian Auto Sales',
    excerpt: 'With 22 official languages and hundreds of dialects, India\'s linguistic diversity creates a massive challenge for car sales. AI voice agents are the answer.',
    category: 'Technology',
    readTime: '8 min read',
    author: 'Arjun Kapoor',
    date: '2026-02-08',
    image: '/blog/language-ai.jpg',
  },
  {
    slug: 'the-60-minute-test-drive-what-salesperson-really-says',
    title: 'The 60-Minute Test Drive: What Your Salesperson Really Says',
    excerpt: 'We analyzed 10,000+ test drive conversations. The patterns we found will surprise every sales manager in India.',
    category: 'Research',
    readTime: '10 min read',
    author: 'Dr. Rohan Verma',
    date: '2026-01-28',
    image: '/blog/test-drive.jpg',
  },
  {
    slug: 'objection-handling-at-scale-200-calls-to-3-million-minutes',
    title: 'Objection Handling at Scale: From 200 Calls to 3 Million Minutes',
    excerpt: 'How a 300-hub dealership network went from manually handling 200 follow-up calls per day to automating 3 million minutes of AI-powered conversations.',
    category: 'Case Study',
    readTime: '12 min read',
    author: 'Priya Mehta',
    date: '2026-01-15',
    image: '/blog/scale.jpg',
  },
  {
    slug: 'roi-calculator-voice-ai-dealership',
    title: 'ROI Calculator: What Voice AI Means for Your Dealership',
    excerpt: 'We built a comprehensive ROI model for Indian car dealerships adopting voice AI. The numbers are compelling — here\'s the full breakdown.',
    category: 'Business',
    readTime: '7 min read',
    author: 'Vikram Singh',
    date: '2026-01-05',
    image: '/blog/roi.jpg',
  },
]

const categoryColors = {
  'Industry Insights': 'text-[#FF4C1C] bg-[#FF4C1C]/10 border-[#FF4C1C]/20',
  'Technology': 'text-[#00D4FF] bg-[#00D4FF]/10 border-[#00D4FF]/20',
  'Research': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Case Study': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'Business': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
}

export default function BlogPage() {
  const [featured, ...rest] = posts

  return (
    <main className="min-h-screen bg-[#0A0E1A] pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 pt-12">
          <span className="text-[#FF4C1C] text-sm font-semibold uppercase tracking-wider">Blog</span>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white mt-3 mb-4">
            Voice AI Insights for
            <br />
            <span className="text-[#FF4C1C]">Indian Auto Dealers</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Research, case studies, and thought leadership on voice intelligence,
            AI sales agents, and dealership optimization.
          </p>
        </div>

        {/* Featured Post */}
        <Link href={`/blog/${featured.slug}`} className="block mb-12 group">
          <div className="bg-[#111827] border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="bg-gradient-to-br from-[#FF4C1C]/20 to-[#FF8C00]/10 h-64 lg:h-auto flex items-center justify-center">
                <div className="text-center">
                  <div className="text-7xl font-black text-[#FF4C1C]/20 font-display">01</div>
                  <div className="text-white font-bold">Featured</div>
                </div>
              </div>
              <div className="p-10">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border mb-4 ${categoryColors[featured.category]}`}>
                  {featured.category}
                </span>
                <h2 className="text-white font-display font-bold text-3xl mb-4 group-hover:text-[#FF4C1C] transition-colors">
                  {featured.title}
                </h2>
                <p className="text-gray-400 leading-relaxed mb-6">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" /> {featured.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {featured.readTime}
                  </span>
                </div>
                <div className="mt-6 flex items-center gap-2 text-[#FF4C1C] font-semibold">
                  Read Article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Rest of Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rest.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all h-full">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border mb-4 ${categoryColors[post.category]}`}>
                  {post.category}
                </span>
                <h3 className="text-white font-bold text-xl mb-3 group-hover:text-[#FF4C1C] transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">{post.excerpt}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {post.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {post.readTime}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}

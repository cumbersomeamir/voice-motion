import Link from 'next/link'
import { Mic, Twitter, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  Product: [
    { label: 'Features', href: '/features' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Live Demo', href: '/demo' },
    { label: 'API Docs', href: '/api-docs' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Case Studies', href: '/case-studies' },
    { label: 'Contact', href: '/contact' },
    { label: 'Careers', href: '/careers' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Security', href: '/security' },
    { label: 'Compliance', href: '/compliance' },
  ],
}

const languages = [
  'Hindi', 'Tamil', 'Telugu', 'Marathi', 'Kannada',
  'Bengali', 'Gujarati', 'Punjabi', 'Malayalam', 'Odia',
  'Urdu', 'Rajasthani', 'Bhojpuri', 'English',
]

export default function Footer() {
  return (
    <footer className="bg-[#0A0E1A] border-t border-white/5">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF4C1C] to-[#FF8C00] flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                VoiceMotion<span className="text-[#FF4C1C]"> AI</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Voice intelligence platform for Indian car dealerships. Record, transcribe,
              analyze, and act on every test-drive conversation — in 14 Indian languages.
            </p>
            <p className="text-[#FF4C1C] text-sm font-medium italic mb-6">
              "Har Baat Sunein. Har Deal Pakken."
            </p>
            {/* Contact Info */}
            <div className="space-y-2">
              <a href="mailto:hello@voicemotion.ai" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                hello@voicemotion.ai
              </a>
              <a href="tel:+918000000000" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                +91 80000 00000
              </a>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4" />
                Mumbai, Maharashtra, India
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-white font-semibold text-sm mb-4">{section}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Languages */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <h4 className="text-white font-semibold text-sm mb-3">
            Supported Languages — 14 Indian Languages
          </h4>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <span
                key={lang}
                className="px-3 py-1 text-xs font-medium bg-white/5 text-gray-400 rounded-full border border-white/5"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} VoiceMotion AI. All rights reserved. Made in India 🇮🇳
          </p>
          <div className="flex items-center gap-4">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

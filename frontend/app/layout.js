import { Inter, Syne, JetBrains_Mono, Noto_Sans_Devanagari } from 'next/font/google'
import './globals.css'
import ReduxProvider from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-devanagari',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata = {
  metadataBase: new URL('https://voicemotion.ai'),
  title: {
    default: 'VoiceMotion AI - Voice Intelligence Platform for Indian Car Dealerships',
    template: '%s | VoiceMotion AI',
  },
  description:
    'Transform every customer call into actionable intelligence. VoiceMotion AI transcribes, analyzes, and acts on dealership conversations in 14 Indian languages — Hindi, Tamil, Telugu, Kannada, and more.',
  keywords: [
    'voice AI',
    'car dealership AI',
    'conversation intelligence',
    'India',
    'automotive AI',
    'voice analytics',
    'Hindi voice AI',
    'Tamil voice AI',
    'dealership CRM',
    'AI voice agent',
    'call analysis',
    'multilingual AI',
  ],
  authors: [{ name: 'VoiceMotion AI Team' }],
  creator: 'VoiceMotion AI',
  publisher: 'VoiceMotion AI',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://voicemotion.ai',
    siteName: 'VoiceMotion AI',
    title: 'VoiceMotion AI - Voice Intelligence for Indian Car Dealerships',
    description:
      'Transform every customer call into actionable intelligence. Works in 14 Indian languages.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'VoiceMotion AI Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VoiceMotion AI - Voice Intelligence for Indian Car Dealerships',
    description:
      'Transform every customer call into actionable intelligence in 14 Indian languages.',
    images: ['/og-image.jpg'],
    creator: '@voicemotionai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  category: 'technology',
}

export const viewport = {
  themeColor: '#0A0E1A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${syne.variable} ${jetbrainsMono.variable} ${notoSansDevanagari.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[#0A0E1A] text-gray-100 font-sans antialiased">
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  )
}

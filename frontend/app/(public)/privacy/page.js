export const metadata = {
  title: 'Privacy Policy — VoiceMotion AI',
  description: 'VoiceMotion AI Privacy Policy. How we collect, use, and protect your data.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0A0E1A] pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-12 mb-12">
          <h1 className="font-display text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: March 1, 2026</p>
        </div>
        <div className="prose prose-invert max-w-none space-y-8">
          {[
            {
              title: '1. Data We Collect',
              content: `VoiceMotion AI collects audio recordings from test drive sessions (with explicit consent), transcription data, user account information, and usage analytics. Customer phone numbers are encrypted at rest using AES-256 encryption. We never store raw audio beyond 30 days unless opted into extended retention.`,
            },
            {
              title: '2. How We Use Your Data',
              content: `Audio data is used solely for transcription and analysis purposes. We do not sell data to third parties. Analytics data is used to improve our AI models and provide you with actionable insights. All processing is done within India's data sovereignty requirements.`,
            },
            {
              title: '3. Data Security',
              content: `We employ industry-standard security measures including AES-256 encryption at rest, TLS 1.3 for data in transit, SOC 2 Type II compliance, regular penetration testing, and a bug bounty program. Access to customer data is limited to authorized personnel only.`,
            },
            {
              title: '4. Your Rights',
              content: `Under India's Digital Personal Data Protection Act (DPDPA) 2023, you have the right to access, correct, and delete your personal data. Contact privacy@voicemotion.ai to exercise these rights. We will respond within 30 days.`,
            },
            {
              title: '5. Data Retention',
              content: `Audio recordings: 30 days (default) or up to 1 year (enterprise). Transcripts: As per your subscription plan. Account data: Retained while account is active + 90 days after cancellation. Analytics aggregates: Indefinitely (anonymized).`,
            },
            {
              title: '6. Third-Party Services',
              content: `We use ElevenLabs for voice transcription and agent services. AWS S3 (Mumbai region) for secure audio storage. MongoDB Atlas (India region) for database. All third-party processors are bound by data processing agreements.`,
            },
            {
              title: '7. Contact Us',
              content: `For privacy-related queries, contact our Data Protection Officer at privacy@voicemotion.ai or write to us at VoiceMotion AI, Level 5, WeWork BKC, Bandra Kurla Complex, Mumbai 400051.`,
            },
          ].map(({ title, content }) => (
            <section key={title}>
              <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
              <p className="text-gray-400 leading-relaxed">{content}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}

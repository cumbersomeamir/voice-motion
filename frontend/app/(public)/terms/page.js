export const metadata = {
  title: 'Terms of Service — VoiceMotion AI',
  description: 'VoiceMotion AI Terms of Service and acceptable use policy.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0A0E1A] pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-12 mb-12">
          <h1 className="font-display text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-gray-400">Last updated: March 1, 2026</p>
        </div>
        <div className="space-y-8">
          {[
            {
              title: '1. Acceptance of Terms',
              content: 'By accessing or using VoiceMotion AI, you agree to be bound by these Terms of Service. If you are entering into these Terms on behalf of an organization, you represent that you have authority to bind that organization.',
            },
            {
              title: '2. Service Description',
              content: 'VoiceMotion AI provides a B2B SaaS platform for voice transcription, conversation intelligence, and AI voice agent services for car dealerships in India. The service includes ElevenLabs-powered transcription, LLM-based analysis, and automated voice agent calling.',
            },
            {
              title: '3. Subscription and Billing',
              content: 'Services are billed monthly via Razorpay. Subscription fees are non-refundable unless otherwise stated. Usage beyond plan limits will be billed as overages at ₹2/minute for agent calls. A 7-day grace period applies for failed payments before service suspension.',
            },
            {
              title: '4. Data and Recording Consent',
              content: 'You are solely responsible for obtaining explicit consent from all parties before recording conversations. VoiceMotion AI requires that you comply with all applicable Indian laws including IT Act 2000, DPDPA 2023, and any sector-specific regulations. Unauthorized recording is strictly prohibited.',
            },
            {
              title: '5. Acceptable Use',
              content: 'You may not use VoiceMotion AI for illegal purposes, to violate any individual\'s privacy rights without consent, to harass or discriminate against customers, or to circumvent any legal requirements. We reserve the right to suspend accounts violating these terms without notice.',
            },
            {
              title: '6. SLA and Uptime',
              content: 'VoiceMotion AI guarantees 99.5% uptime for Growth and Enterprise plans. Downtime credits apply as per the SLA schedule. Scheduled maintenance will be communicated 48 hours in advance. Emergency maintenance may occur without notice for security patches.',
            },
            {
              title: '7. Limitation of Liability',
              content: 'VoiceMotion AI\'s total liability is limited to the fees paid in the 3 months preceding the claim. We are not liable for any indirect, incidental, or consequential damages. This limitation applies to all claims including but not limited to loss of revenue or data.',
            },
            {
              title: '8. Governing Law',
              content: 'These Terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra. Parties agree to attempt good-faith resolution before initiating legal proceedings.',
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

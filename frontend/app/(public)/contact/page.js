'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock, CheckCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', dealership: '', hubs: '', city: '', message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    toast.success('Demo booked! Our team will call you within 24 hours.')
  }

  return (
    <main className="min-h-screen bg-[#0A0E1A] pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 pt-12">
          <span className="text-[#FF4C1C] text-sm font-semibold uppercase tracking-wider">Contact Us</span>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-white mt-3 mb-4">
            Let's Talk About Your Dealership
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Book a free personalized demo. We'll show you exactly how VoiceMotion AI
            can transform your specific dealership setup.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">Get in Touch</h3>
              <div className="space-y-4">
                {[
                  { Icon: Mail, label: 'Email', value: 'hello@voicemotion.ai', href: 'mailto:hello@voicemotion.ai' },
                  { Icon: Phone, label: 'Phone', value: '+91 80000 00000', href: 'tel:+918000000000' },
                  { Icon: MapPin, label: 'HQ', value: 'Mumbai, Maharashtra' },
                  { Icon: Clock, label: 'Response', value: 'Within 24 hours' },
                ].map(({ Icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FF4C1C]/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#FF4C1C]" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">{label}</p>
                      {href ? (
                        <a href={href} className="text-white hover:text-[#FF4C1C] transition-colors">{value}</a>
                      ) : (
                        <p className="text-white">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
              <h4 className="text-white font-semibold mb-3">What happens next?</h4>
              <div className="space-y-3">
                {[
                  'Our team calls you within 24 hours',
                  '30-min personalized demo of VoiceMotion AI',
                  'Custom pricing based on your hub count',
                  '14-day free trial setup — same day',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FF4C1C]/10 flex items-center justify-center text-[#FF4C1C] text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-gray-400 text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#111827] border border-emerald-500/20 rounded-2xl p-12 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-white font-bold text-2xl mb-2">Demo Booked!</h3>
                <p className="text-gray-400">
                  Our team will call you at <span className="text-white">{formData.phone}</span> within 24 hours
                  to schedule your personalized demo.
                </p>
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-[#111827] border border-white/5 rounded-2xl p-8 space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { name: 'name', label: 'Full Name *', placeholder: 'Rajesh Kumar', type: 'text', required: true },
                    { name: 'phone', label: 'Phone *', placeholder: '+91 98765 43210', type: 'tel', required: true },
                    { name: 'email', label: 'Work Email', placeholder: 'rajesh@dealership.com', type: 'email' },
                    { name: 'dealership', label: 'Dealership Name *', placeholder: 'XYZ Motors Pvt Ltd', type: 'text', required: true },
                    { name: 'city', label: 'City', placeholder: 'Mumbai', type: 'text' },
                  ].map(({ name, label, placeholder, type, required }) => (
                    <div key={name}>
                      <label className="block text-sm text-gray-400 mb-1">{label}</label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        required={required}
                        value={formData[name]}
                        onChange={e => setFormData(prev => ({ ...prev, [name]: e.target.value }))}
                        className="w-full bg-[#1F2937] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-[#FF4C1C]/50 transition-colors"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Number of Hubs</label>
                    <select
                      value={formData.hubs}
                      onChange={e => setFormData(prev => ({ ...prev, hubs: e.target.value }))}
                      className="w-full bg-[#1F2937] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#FF4C1C]/50 transition-colors"
                    >
                      <option value="">Select...</option>
                      <option>1 Hub</option>
                      <option>2–5 Hubs</option>
                      <option>6–10 Hubs</option>
                      <option>10+ Hubs</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Message (Optional)</label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your dealership setup, specific challenges, or any questions..."
                    value={formData.message}
                    onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full bg-[#1F2937] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-[#FF4C1C]/50 transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-[#FF4C1C] to-[#FF8C00] text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-lg"
                >
                  <Send className="w-5 h-5" /> Book My Free Demo
                </button>
                <p className="text-center text-xs text-gray-500">
                  No commitment. No credit card. 14-day free trial included.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

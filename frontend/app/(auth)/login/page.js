'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mic, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    window.location.href = '/dashboard'
  }

  return (
    <main className="min-h-screen bg-[#0A0E1A] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4C1C] to-[#FF8C00] flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">
              VoiceMotion<span className="text-[#FF4C1C]"> AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-400 mt-2">Sign in to your dashboard</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111827] border border-white/5 rounded-2xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email address</label>
              <input
                type="email"
                required
                placeholder="you@dealership.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full bg-[#1F2937] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-[#FF4C1C]/50 transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm text-gray-400">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-[#FF4C1C] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full bg-[#1F2937] border border-white/10 rounded-lg px-4 py-3 pr-10 text-white placeholder:text-gray-500 outline-none focus:border-[#FF4C1C]/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#FF4C1C] to-[#FF8C00] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-[#FF4C1C] hover:underline font-medium">
                Start free trial
              </Link>
            </p>
          </div>
        </motion.div>

        <p className="text-center text-xs text-gray-600 mt-6">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="hover:text-gray-400">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="hover:text-gray-400">Privacy Policy</Link>
        </p>
      </div>
    </main>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, MessageSquare, BarChart3, Mic2,
  Building2, Settings, CreditCard, Mic, LogOut,
  ChevronRight, Bell, Search
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: MessageSquare, label: 'Conversations', href: '/dashboard/conversations' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Mic2, label: 'Voice Agents', href: '/dashboard/voice-agents' },
  { icon: Building2, label: 'Hubs', href: '/dashboard/hubs' },
]

const bottomItems = [
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  { icon: CreditCard, label: 'Billing', href: '/dashboard/billing' },
]

export default function Sidebar({ collapsed = false }) {
  const pathname = usePathname()

  return (
    <aside className={`fixed left-0 top-0 h-full bg-[#111827] border-r border-white/5 z-40 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF4C1C] to-[#FF8C00] flex items-center justify-center shrink-0">
          <Mic className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-white whitespace-nowrap">
            VoiceMotion<span className="text-[#FF4C1C]"> AI</span>
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                  active
                    ? 'bg-[#FF4C1C]/10 text-[#FF4C1C] border border-[#FF4C1C]/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
                {!collapsed && active && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom Items */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        {bottomItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                active
                  ? 'bg-[#FF4C1C]/10 text-[#FF4C1C]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}

        {/* User Info */}
        {!collapsed && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF4C1C] to-[#FF8C00] flex items-center justify-center text-white text-sm font-bold shrink-0">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">Growth Plan</p>
              </div>
              <LogOut className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

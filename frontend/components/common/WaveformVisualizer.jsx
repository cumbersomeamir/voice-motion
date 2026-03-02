'use client'

import { useEffect, useRef } from 'react'

export default function WaveformVisualizer({ isActive = true, color = '#FF4C1C', bars = 40, className = '' }) {
  const barsRef = useRef([])

  useEffect(() => {
    if (!isActive) return

    const intervals = barsRef.current.map((bar, i) => {
      if (!bar) return null
      const delay = Math.random() * 500
      const duration = 400 + Math.random() * 600

      const interval = setInterval(() => {
        const height = isActive ? 20 + Math.random() * 80 : 10
        bar.style.height = `${height}%`
      }, duration)

      return interval
    })

    return () => intervals.forEach(i => i && clearInterval(i))
  }, [isActive])

  return (
    <div className={`flex items-center gap-[2px] ${className}`} style={{ height: '60px' }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          ref={el => barsRef.current[i] = el}
          className="flex-1 rounded-full transition-all duration-300"
          style={{
            backgroundColor: color,
            height: `${10 + Math.random() * 60}%`,
            opacity: isActive ? 0.8 : 0.3,
            transitionDelay: `${i * 10}ms`,
          }}
        />
      ))}
    </div>
  )
}

export function StaticWaveform({ color = '#FF4C1C', className = '' }) {
  const heights = [20, 40, 60, 80, 60, 40, 70, 90, 70, 50, 80, 60, 40, 70, 90, 60, 40, 60, 80, 50]

  return (
    <div className={`flex items-center gap-[3px] ${className}`} style={{ height: '48px' }}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-full"
          style={{ height: `${h}%`, backgroundColor: color, opacity: 0.7 }}
        />
      ))}
    </div>
  )
}

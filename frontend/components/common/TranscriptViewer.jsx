'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import Badge from '../ui/Badge'

const SPEAKER_COLORS = {
  salesperson: { bg: 'bg-[#FF4C1C]/10', border: 'border-[#FF4C1C]/20', dot: 'bg-[#FF4C1C]', label: 'Sales' },
  customer: { bg: 'bg-[#00D4FF]/10', border: 'border-[#00D4FF]/20', dot: 'bg-[#00D4FF]', label: 'Customer' },
  unknown: { bg: 'bg-white/5', border: 'border-white/10', dot: 'bg-gray-500', label: 'Unknown' },
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function TranscriptViewer({ segments = [], objections = [], highlightObjections = true }) {
  const [searchQuery, setSearchQuery] = useState('')

  const objectionTimestamps = new Set(objections.map(o => o.timestamp))

  const filteredSegments = searchQuery
    ? segments.filter(s => s.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : segments

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search transcript..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-[#1F2937] border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#FF4C1C]/50"
        />
      </div>

      {/* Segments */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {filteredSegments.map((seg, i) => {
          const config = SPEAKER_COLORS[seg.speakerLabel] || SPEAKER_COLORS.unknown
          const isObjection = highlightObjections && objectionTimestamps.has(seg.startTime)

          return (
            <div
              key={i}
              className={clsx(
                'p-4 rounded-xl border transition-all',
                config.bg, config.border,
                isObjection && 'ring-1 ring-amber-500/50'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={clsx('w-2 h-2 rounded-full', config.dot)} />
                <span className="text-xs font-semibold text-gray-300">{config.label}</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {formatTime(seg.startTime)} — {formatTime(seg.endTime)}
                </span>
                {seg.language && (
                  <Badge variant="default" className="text-xs">{seg.language}</Badge>
                )}
                {isObjection && (
                  <Badge variant="warning">Objection</Badge>
                )}
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">{seg.text}</p>
              {seg.confidence && (
                <p className="mt-1 text-xs text-gray-600">Confidence: {Math.round(seg.confidence * 100)}%</p>
              )}
            </div>
          )
        })}

        {filteredSegments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No segments found{searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}
      </div>
    </div>
  )
}

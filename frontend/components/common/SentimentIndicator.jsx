import { clsx } from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const sentimentConfig = {
  positive: { label: 'Positive', color: 'text-emerald-400', bg: 'bg-emerald-500/10', Icon: TrendingUp },
  negative: { label: 'Negative', color: 'text-red-400', bg: 'bg-red-500/10', Icon: TrendingDown },
  neutral: { label: 'Neutral', color: 'text-gray-400', bg: 'bg-gray-500/10', Icon: Minus },
}

export default function SentimentIndicator({ sentiment = 'neutral', score, showLabel = true, size = 'md' }) {
  const config = sentimentConfig[sentiment] || sentimentConfig.neutral
  const { Icon } = config

  return (
    <div className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1', config.bg)}>
      <Icon className={clsx('shrink-0', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4', config.color)} />
      {showLabel && (
        <span className={clsx('font-medium', size === 'sm' ? 'text-xs' : 'text-sm', config.color)}>
          {config.label}
          {score !== undefined && ` (${Math.round(score * 100)}%)`}
        </span>
      )}
    </div>
  )
}

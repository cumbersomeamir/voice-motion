import { clsx } from 'clsx'

export default function Skeleton({ className, ...props }) {
  return (
    <div
      className={clsx('animate-pulse rounded-lg bg-white/5', className)}
      {...props}
    />
  )
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="bg-[#111827] rounded-xl border border-white/5 p-6 space-y-4">
      <Skeleton className="h-4 w-3/4" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === rows - 1 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

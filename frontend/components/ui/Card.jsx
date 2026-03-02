import { clsx } from 'clsx'

export default function Card({ className, children, glass = false, hover = false, ...props }) {
  return (
    <div
      className={clsx(
        'rounded-xl border',
        glass
          ? 'bg-white/5 backdrop-blur-sm border-white/10'
          : 'bg-[#111827] border-white/5',
        hover && 'hover:border-[#FF4C1C]/30 hover:bg-[#1F2937] transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={clsx('px-6 py-4 border-b border-white/5', className)} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={clsx('px-6 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={clsx('px-6 py-4 border-t border-white/5', className)} {...props}>
      {children}
    </div>
  )
}

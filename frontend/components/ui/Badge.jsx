import { clsx } from 'clsx'

const variants = {
  default: 'bg-white/10 text-gray-300 border border-white/10',
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border border-red-500/20',
  info: 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20',
  orange: 'bg-[#FF4C1C]/10 text-[#FF4C1C] border border-[#FF4C1C]/20',
}

export default function Badge({ variant = 'default', className, children, ...props }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

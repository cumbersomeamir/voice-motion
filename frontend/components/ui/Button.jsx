import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-gradient-to-r from-[#FF4C1C] to-[#FF8C00] text-white hover:opacity-90 shadow-lg shadow-orange-500/20',
  secondary: 'bg-white/5 text-white border border-white/10 hover:bg-white/10',
  outline: 'border border-[#FF4C1C] text-[#FF4C1C] hover:bg-[#FF4C1C]/10',
  ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
  accent: 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 hover:bg-[#00D4FF]/20',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
}

const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF4C1C]/50 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : leftIcon ? (
        leftIcon
      ) : null}
      {children}
      {!isLoading && rightIcon && rightIcon}
    </button>
  )
})

Button.displayName = 'Button'

export default Button

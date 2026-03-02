import { forwardRef } from 'react'
import { clsx } from 'clsx'

const Input = forwardRef(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  ...props
}, ref) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-300">{label}</label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full bg-[#1F2937] border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none transition-all',
            'focus:ring-2 focus:ring-[#FF4C1C]/50 focus:border-[#FF4C1C]',
            error ? 'border-red-500' : 'border-white/10 hover:border-white/20',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  )
})

Input.displayName = 'Input'

export default Input

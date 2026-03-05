'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  hideCloseButton = false,
  className,
}) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
    }
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose?.()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={clsx(
              'relative w-full bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden',
              sizes[size],
              className
            )}
          >
            {/* Header */}
            {(title || !hideCloseButton) && (
              <div className="flex items-start justify-between p-6 border-b border-white/05">
                <div>
                  {title && (
                    <h2 className="font-display text-xl font-bold text-white">{title}</h2>
                  )}
                  {description && (
                    <p className="text-sm text-gray-400 mt-1">{description}</p>
                  )}
                </div>
                {!hideCloseButton && (
                  <button
                    onClick={onClose}
                    className="ml-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all shrink-0"
                    aria-label="Close modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function ModalFooter({ children, className }) {
  return (
    <div className={clsx('flex items-center justify-end gap-3 pt-4 border-t border-white/05', className)}>
      {children}
    </div>
  )
}

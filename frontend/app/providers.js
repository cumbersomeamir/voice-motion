'use client'

import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store } from '../store'

export default function ReduxProvider({ children }) {
  return (
    <Provider store={store}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1F2937',
            color: '#F9FAFB',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
          success: {
            iconTheme: { primary: '#00D4FF', secondary: '#0A0E1A' },
          },
          error: {
            iconTheme: { primary: '#FF4C1C', secondary: '#0A0E1A' },
          },
        }}
      />
    </Provider>
  )
}

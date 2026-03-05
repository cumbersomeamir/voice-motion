import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import conversationsReducer from './slices/conversationsSlice'
import analyticsReducer from './slices/analyticsSlice'
import voiceAgentsReducer from './slices/voiceAgentsSlice'
import hubsReducer from './slices/hubsSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    conversations: conversationsReducer,
    analytics: analyticsReducer,
    voiceAgents: voiceAgentsReducer,
    hubs: hubsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser'],
      },
    }),
})

export default store

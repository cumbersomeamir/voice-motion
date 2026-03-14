import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  summary: {
    totalCalls: 0,
    avgSentiment: 0,
    conversionRate: 0,
    avgDurationSeconds: 0,
  },
  trends: [],
  topExecutives: [],
  isLoading: false,
  error: null,
}

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setAnalyticsData: (state, action) => {
      state.summary = action.payload.summary || state.summary
      state.trends = action.payload.trends || []
      state.topExecutives = action.payload.topExecutives || []
    },
    setAnalyticsLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setAnalyticsError: (state, action) => {
      state.error = action.payload
    },
    resetAnalytics: () => initialState,
  },
})

export const {
  setAnalyticsData,
  setAnalyticsLoading,
  setAnalyticsError,
  resetAnalytics,
} = analyticsSlice.actions

export default analyticsSlice.reducer

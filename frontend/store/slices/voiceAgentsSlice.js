import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  agents: [],
  selectedAgentId: null,
  isLoading: false,
  error: null,
}

const voiceAgentsSlice = createSlice({
  name: 'voiceAgents',
  initialState,
  reducers: {
    setVoiceAgents: (state, action) => {
      state.agents = action.payload
    },
    setSelectedVoiceAgent: (state, action) => {
      state.selectedAgentId = action.payload
    },
    setVoiceAgentsLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setVoiceAgentsError: (state, action) => {
      state.error = action.payload
    },
  },
})

export const {
  setVoiceAgents,
  setSelectedVoiceAgent,
  setVoiceAgentsLoading,
  setVoiceAgentsError,
} = voiceAgentsSlice.actions

export default voiceAgentsSlice.reducer

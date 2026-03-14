import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  selectedHubId: null,
  isLoading: false,
  error: null,
}

const hubsSlice = createSlice({
  name: 'hubs',
  initialState,
  reducers: {
    setHubs: (state, action) => {
      state.items = action.payload
    },
    setSelectedHub: (state, action) => {
      state.selectedHubId = action.payload
    },
    setHubsLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setHubsError: (state, action) => {
      state.error = action.payload
    },
  },
})

export const { setHubs, setSelectedHub, setHubsLoading, setHubsError } = hubsSlice.actions

export default hubsSlice.reducer

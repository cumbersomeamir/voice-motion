import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sidebarOpen: true,
  theme: 'dark',
  activeModal: null,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    setTheme: (state, action) => {
      state.theme = action.payload
    },
    setActiveModal: (state, action) => {
      state.activeModal = action.payload
    },
  },
})

export const { setSidebarOpen, setTheme, setActiveModal } = uiSlice.actions

export default uiSlice.reducer

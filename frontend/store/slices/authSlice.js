import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Login failed')
      }
      return await response.json()
    } catch (err) {
      return rejectWithValue(err.message || 'Network error')
    }
  }
)

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await fetch('/api/auth/logout', { method: 'POST' })
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    // Mock user for demo
    mockUser: {
      id: 'usr_001',
      name: 'Rajesh Sharma',
      email: 'rajesh@fortunemotors.in',
      role: 'admin',
      dealership: 'Fortune Motors Pvt Ltd',
      plan: 'Growth',
      locations: 3,
      avatar: 'RS',
    },
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
    },
    setToken: (state, action) => {
      state.token = action.payload
    },
    clearAuth: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
    // For demo purposes
    loginDemo: (state) => {
      state.user = state.mockUser
      state.isAuthenticated = true
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
  },
})

export const { setUser, setToken, clearAuth, clearError, loginDemo } = authSlice.actions
export default authSlice.reducer

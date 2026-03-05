import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Mock data for dashboard
export const MOCK_CONVERSATIONS = [
  {
    id: 'conv_001',
    caller: '+91 98765 43210',
    callerName: 'Suresh Kumar',
    executive: 'Amit Singh',
    location: 'Pune - Kothrud',
    duration: '5:42',
    date: '2026-03-02T10:35:00Z',
    language: 'Hindi',
    sentiment: 'positive',
    sentimentScore: 85,
    intent: 'Purchase',
    stage: 'Test Drive Requested',
    vehicleInterest: 'Hyundai Creta SX',
    budget: '₹12L',
    callScore: 8.2,
    summary: 'Customer interested in Creta SX. Budget ₹12L. Requested test drive for Saturday. Competitor: Kia Seltos mentioned.',
    tags: ['Hot Lead', 'Test Drive', 'High Intent'],
    transcript: [
      { speaker: 'Customer', text: 'Mujhe Creta ke baare mein jaankari chahiye', time: '0:05' },
      { speaker: 'Executive', text: 'Sir, Creta SX available hai ₹11.89L mein', time: '0:12' },
    ],
    insights: {
      entities: { vehicle: 'Hyundai Creta SX', budget: '₹12 Lakh', testDrive: 'Saturday' },
      objections: ['Price slightly high'],
      competitor: 'Kia Seltos',
      nextAction: 'Schedule test drive',
    },
    status: 'completed',
  },
  {
    id: 'conv_002',
    caller: '+91 87654 32109',
    callerName: 'Priya Patel',
    executive: 'Kavitha Nair',
    location: 'Mumbai - Andheri',
    duration: '3:18',
    date: '2026-03-02T09:50:00Z',
    language: 'Gujarati',
    sentiment: 'neutral',
    sentimentScore: 58,
    intent: 'Inquiry',
    stage: 'Information Gathering',
    vehicleInterest: 'Maruti Brezza',
    budget: '₹9L',
    callScore: 6.5,
    summary: 'First-time buyer asking about Brezza pricing and financing. Needs follow-up with detailed EMI options.',
    tags: ['First-time Buyer', 'Follow-up Required'],
    transcript: [],
    insights: {
      entities: { vehicle: 'Maruti Brezza', budget: '₹9 Lakh' },
      objections: ['EMI not clear'],
      competitor: null,
      nextAction: 'Send EMI calculator',
    },
    status: 'completed',
  },
  {
    id: 'conv_003',
    caller: '+91 76543 21098',
    callerName: 'Anand Krishnamurthy',
    executive: 'Ravi Kumar',
    location: 'Bangalore - Whitefield',
    duration: '8:05',
    date: '2026-03-02T09:15:00Z',
    language: 'Kannada',
    sentiment: 'very_positive',
    sentimentScore: 94,
    intent: 'Close',
    stage: 'Price Negotiation',
    vehicleInterest: 'Toyota Innova Crysta',
    budget: '₹25L',
    callScore: 9.1,
    summary: 'Serious buyer. Negotiating on accessories package. High probability of closing this week.',
    tags: ['Hot Lead', 'Negotiation', 'Close Ready'],
    transcript: [],
    insights: {
      entities: { vehicle: 'Toyota Innova Crysta', budget: '₹25 Lakh' },
      objections: ['Want accessories at discount'],
      competitor: null,
      nextAction: 'Manager approval for accessories bundle',
    },
    status: 'completed',
  },
  {
    id: 'conv_004',
    caller: '+91 65432 10987',
    callerName: 'Fatima Sheikh',
    executive: 'Mohammed Rafi',
    location: 'Hyderabad - Banjara Hills',
    duration: '4:30',
    date: '2026-03-01T16:40:00Z',
    language: 'Telugu',
    sentiment: 'negative',
    sentimentScore: 32,
    intent: 'Complaint',
    stage: 'After-Sales',
    vehicleInterest: null,
    budget: null,
    callScore: 4.2,
    summary: 'Customer unhappy about service delay. Car has been in service for 5 days. Needs immediate escalation.',
    tags: ['Complaint', 'Escalate', 'Service Issue'],
    transcript: [],
    insights: {
      entities: {},
      objections: ['Service delay unacceptable'],
      competitor: null,
      nextAction: 'Escalate to service manager',
    },
    status: 'escalated',
  },
  {
    id: 'conv_005',
    caller: '+91 54321 09876',
    callerName: 'Deepak Bansal',
    executive: 'Sunita Rao',
    location: 'Delhi - Connaught Place',
    duration: '6:12',
    date: '2026-03-01T15:20:00Z',
    language: 'Hindi',
    sentiment: 'positive',
    sentimentScore: 76,
    intent: 'Purchase',
    stage: 'Test Drive Completed',
    vehicleInterest: 'Tata Nexon EV Max',
    budget: '₹18L',
    callScore: 7.8,
    summary: 'Test drive done. Customer liked the car. Waiting on charging infrastructure clarification. Follow-up tomorrow.',
    tags: ['EV Inquiry', 'Follow-up Tomorrow', 'High Intent'],
    transcript: [],
    insights: {
      entities: { vehicle: 'Tata Nexon EV Max', budget: '₹18 Lakh' },
      objections: ['Home charging setup unclear'],
      competitor: 'MG ZS EV',
      nextAction: 'Share charging guide and home charging cost estimate',
    },
    status: 'follow_up',
  },
]

export const fetchConversations = createAsyncThunk(
  'conversations/fetch',
  async (params = {}, { rejectWithValue }) => {
    try {
      // Return mock data for now
      await new Promise((r) => setTimeout(r, 500))
      return MOCK_CONVERSATIONS
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

const conversationsSlice = createSlice({
  name: 'conversations',
  initialState: {
    items: [],
    selectedId: null,
    isLoading: false,
    error: null,
    filters: {
      search: '',
      sentiment: 'all',
      intent: 'all',
      location: 'all',
      dateRange: '7d',
      language: 'all',
    },
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
    },
  },
  reducers: {
    setSelectedConversation: (state, action) => {
      state.selectedId = action.payload
    },
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        sentiment: 'all',
        intent: 'all',
        location: 'all',
        dateRange: '7d',
        language: 'all',
      }
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload
        state.pagination.total = action.payload.length
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const { setSelectedConversation, setFilter, clearFilters, setPage } =
  conversationsSlice.actions
export default conversationsSlice.reducer

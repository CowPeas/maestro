import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { AppDispatch } from '../index';

interface Threat {
  id: number;
  description: string;
  classification: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved';
  layer: string;
  likelihood: number;
  impact: number;
}

interface ThreatsState {
  threats: Threat[];
  loading: boolean;
  error: string | null;
}

const initialState: ThreatsState = {
  threats: [],
  loading: false,
  error: null,
};

export const analyzeSystem = createAsyncThunk<Threat[], string>(
  'threats/analyzeSystem',
  async (input: string) => {
    const response = await axios.post<Threat[]>('/api/analyze', { input });
    return response.data;
  }
);

export const fetchThreats = createAsyncThunk<Threat[]>(
  'threats/fetchThreats',
  async () => {
    const response = await axios.get<Threat[]>('/api/threats');
    return response.data;
  }
);

export const createThreat = createAsyncThunk<
  Threat,
  Omit<Threat, 'id'>,
  { rejectValue: string }
>('threats/createThreat', async (threatData, { rejectWithValue }) => {
  try {
    const response = await axios.post<Threat>('/api/threats', threatData);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to create threat');
  }
});

const threatsSlice = createSlice({
  name: 'threats',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(analyzeSystem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(analyzeSystem.fulfilled, (state, action: PayloadAction<Threat[]>) => {
        state.loading = false;
        state.threats = action.payload;
      })
      .addCase(analyzeSystem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to analyze system';
      })
      .addCase(fetchThreats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThreats.fulfilled, (state, action: PayloadAction<Threat[]>) => {
        state.loading = false;
        state.threats = action.payload;
      })
      .addCase(fetchThreats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch threats';
      })
      .addCase(createThreat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createThreat.fulfilled, (state, action: PayloadAction<Threat>) => {
        state.loading = false;
        state.threats.push(action.payload);
      })
      .addCase(createThreat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create threat';
      });
  },
});

export default threatsSlice.reducer; 
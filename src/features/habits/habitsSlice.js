import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import localforage from 'localforage';

const STORAGE_KEY = 'habits';

// Async thunks
export const fetchHabits = createAsyncThunk(
  'habits/fetchHabits',
  async () => {
    const habits = await localforage.getItem(STORAGE_KEY) || [];
    return habits;
  }
);

const saveHabits = async (habits) => {
  try {
    await localforage.setItem(STORAGE_KEY, habits);
  } catch (error) {
    console.error('Error saving habits:', error);
    throw error;
  }
};

export const addHabit = createAsyncThunk(
  'habits/addHabit',
  async (newHabit, { getState }) => {
    const { habits } = getState().habits;
    const habit = {
      ...newHabit,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      streak: 0,
      completedDates: []
    };
    const updatedHabits = [...habits, habit];
    await saveHabits(updatedHabits);
    return habit;
  }
);

export const updateHabit = createAsyncThunk(
  'habits/updateHabit',
  async (updatedHabit, { getState }) => {
    const { habits } = getState().habits;
    const updatedHabits = habits.map(habit => 
      habit.id === updatedHabit.id ? { ...habit, ...updatedHabit } : habit
    );
    await saveHabits(updatedHabits);
    return updatedHabits;
  }
);

export const deleteHabit = createAsyncThunk(
  'habits/deleteHabit',
  async (habitId, { getState }) => {
    const { habits } = getState().habits;
    const updatedHabits = habits.filter(habit => habit.id !== habitId);
    await saveHabits(updatedHabits);
    return habitId;
  }
);

export const toggleHabitCompletion = createAsyncThunk(
  'habits/toggleHabitCompletion',
  async ({ habitId, date }, { getState }) => {
    const { habits } = getState().habits;
    const today = new Date(date).toISOString().split('T')[0];
    
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const completedDates = [...habit.completedDates];
        const dateIndex = completedDates.findIndex(d => d.date === today);
        
        if (dateIndex === -1) {
          // Add completion
          completedDates.push({ date: today, completed: true });
        } else {
          // Toggle completion
          completedDates[dateIndex].completed = !completedDates[dateIndex].completed;
        }
        
        // Calculate streak
        const sortedDates = [...completedDates]
          .filter(d => d.completed)
          .map(d => new Date(d.date).getTime())
          .sort((a, b) => a - b);
        
        let streak = 0;
        const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
        
        for (let i = sortedDates.length - 1; i >= 0; i--) {
          const currentDate = new Date(sortedDates[i]);
          const prevDate = i > 0 ? new Date(sortedDates[i - 1]) : null;
          
          if (i === sortedDates.length - 1) {
            // For the most recent date, check if it's today or yesterday
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (currentDate.toDateString() === today.toDateString() || 
                currentDate.toDateString() === yesterday.toDateString()) {
              streak = 1;
            }
          } else if (prevDate && (currentDate - prevDate) / oneDay <= 2) {
            // Check if dates are consecutive (allow for one missed day)
            streak++;
          } else {
            break;
          }
        }
        
        return {
          ...habit,
          completedDates,
          streak,
          lastCompleted: today
        };
      }
      return habit;
    });
    
    await saveHabits(updatedHabits);
    return { habitId, date };
  }
);

const initialState = {
  habits: [],
  status: 'idle',
  error: null
};

const habitSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch habits
    builder.addCase(fetchHabits.pending, (state) => {
      state.status = 'loading';
    });
    builder.addCase(fetchHabits.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.habits = action.payload;
    });
    builder.addCase(fetchHabits.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.error.message;
    });

    // Add habit
    builder.addCase(addHabit.fulfilled, (state, action) => {
      state.habits.push(action.payload);
    });

    // Update habit
    builder.addCase(updateHabit.fulfilled, (state, action) => {
      state.habits = action.payload;
    });

    // Delete habit
    builder.addCase(deleteHabit.fulfilled, (state, action) => {
      state.habits = state.habits.filter(habit => habit.id !== action.payload);
    });
  }
});

// Selectors
export const selectAllHabits = state => state.habits.habits;
export const selectHabitById = (state, habitId) => 
  state.habits.habits.find(habit => habit.id === habitId);
export const selectHabitsByDate = (state, date) => {
  const targetDate = new Date(date).toISOString().split('T')[0];
  return state.habits.habits.map(habit => {
    const completedDate = habit.completedDates.find(d => d.date === targetDate);
    return {
      ...habit,
      completed: completedDate ? completedDate.completed : false
    };
  });
};

export const selectHabitsStatus = state => state.habits.status;
export const selectHabitsError = state => state.habits.error;

export default habitSlice.reducer;

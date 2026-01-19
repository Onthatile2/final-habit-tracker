import { createSlice } from '@reduxjs/toolkit';
import { format } from 'date-fns';

const initialState = {
  tasks: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    taskAdded: (state, action) => {
      state.tasks.push({
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completed: false
      });
    },
    taskUpdated: (state, action) => {
      const { id, ...updatedFields } = action.payload;
      const existingTask = state.tasks.find(task => task.id === id);
      if (existingTask) {
        Object.assign(existingTask, {
          ...updatedFields,
          updatedAt: new Date().toISOString()
        });
      }
    },
    taskDeleted: (state, action) => {
      const { id } = action.payload;
      state.tasks = state.tasks.filter(task => task.id !== id);
    },
    taskToggled: (state, action) => {
      const { id } = action.payload;
      const existingTask = state.tasks.find(task => task.id === id);
      if (existingTask) {
        existingTask.completed = !existingTask.completed;
        existingTask.updatedAt = new Date().toISOString();
      }
    },
    tasksLoaded: (state, action) => {
      state.tasks = action.payload;
      state.status = 'succeeded';
    },
    tasksLoading: (state) => {
      state.status = 'loading';
    },
    tasksError: (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    }
  }
});

export const {
  taskAdded,
  taskUpdated,
  taskDeleted,
  taskToggled,
  tasksLoaded,
  tasksLoading,
  tasksError
} = taskSlice.actions;

export default taskSlice.reducer;

// Selectors
export const selectAllTasks = state => state.tasks.tasks;
export const selectTaskById = (state, taskId) => 
  state.tasks.tasks.find(task => task.id === taskId);
export const selectTasksByDate = (state, date) => 
  state.tasks.tasks.filter(task => 
    format(new Date(task.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
  );
export const selectTasksByType = (state, type) => 
  state.tasks.tasks.filter(task => task.type === type);

export const selectTaskStatus = state => state.tasks.status;
export const selectTaskError = state => state.tasks.error;
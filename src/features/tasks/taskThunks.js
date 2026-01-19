import { tasksLoaded, tasksLoading, tasksError } from './taskSlice';
import localforage from 'localforage';

// Load tasks from local storage
export const fetchTasks = () => async (dispatch) => {
  try {
    dispatch(tasksLoading());
    const tasks = await localforage.getItem('tasks') || [];
    dispatch(tasksLoaded(tasks));
  } catch (err) {
    dispatch(tasksError(err.toString()));
  }
};

// Save tasks to local storage
const saveTasks = async (tasks) => {
  try {
    await localforage.setItem('tasks', tasks);
  } catch (err) {
    console.error('Failed to save tasks:', err);
    throw err;
  }
};

// Add a new task
export const addNewTask = (taskData) => async (dispatch, getState) => {
  try {
    const action = taskAdded(taskData);
    dispatch(action);
    const { tasks } = getState().tasks;
    await saveTasks(tasks);
    return action.payload;
  } catch (err) {
    console.error('Failed to add task:', err);
    throw err;
  }
};

// Update an existing task
export const updateTask = (taskData) => async (dispatch, getState) => {
  try {
    dispatch(taskUpdated(taskData));
    const { tasks } = getState().tasks;
    await saveTasks(tasks);
  } catch (err) {
    console.error('Failed to update task:', err);
    throw err;
  }
};

// Delete a task
export const deleteTask = (taskId) => async (dispatch, getState) => {
  try {
    dispatch(taskDeleted({ id: taskId }));
    const { tasks } = getState().tasks;
    await saveTasks(tasks);
  } catch (err) {
    console.error('Failed to delete task:', err);
    throw err;
  }
};

// Toggle task completion status
export const toggleTask = (taskId) => async (dispatch, getState) => {
  try {
    dispatch(taskToggled({ id: taskId }));
    const { tasks } = getState().tasks;
    await saveTasks(tasks);
  } catch (err) {
    console.error('Failed to toggle task:', err);
    throw err;
  }
};
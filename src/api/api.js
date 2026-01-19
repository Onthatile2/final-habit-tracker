const API_URL = 'http://localhost:3001';

export const api = {
  // User endpoints
  async register(userData) {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async login(credentials) {
    const { email, password } = credentials;
    const response = await fetch(`${API_URL}/users?email=${email}&password=${password}`);
    const users = await response.json();
    return users[0] || null;
  },

  // Habit endpoints
  async getHabits(userId) {
    const response = await fetch(`${API_URL}/habits?userId=${userId}`);
    return response.json();
  },

  async createHabit(habit) {
    const response = await fetch(`${API_URL}/habits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(habit),
    });
    return response.json();
  },

  // Task endpoints
  async getTasks(userId) {
    const response = await fetch(`${API_URL}/tasks?userId=${userId}`);
    return response.json();
  },

  async createTask(task) {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
    return response.json();
  },
};
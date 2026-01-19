import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from sessionStorage on initial load
  useEffect(() => {
    const loadUser = () => {
      try {
        const userData = sessionStorage.getItem('currentUser');
        if (userData) {
          setCurrentUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error loading user from sessionStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await fetch(`http://localhost:3001/users?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
      const users = await response.json();
      
      if (users && users.length > 0) {
        const user = users[0];
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
        return { success: true };
      }
      return { success: false, error: 'Invalid email or password' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Failed to login. Please try again.' };
    }
  };

  // Logout function
  const logout = () => {
    sessionStorage.removeItem('currentUser');
    setCurrentUser(null);
    navigate('/signin');
  };

  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
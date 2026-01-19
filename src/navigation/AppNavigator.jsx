import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import localforage from 'localforage';
import { CircularProgress, Box } from '@mui/material';

// Lazy load screens for better performance
const OnboardingScreen = React.lazy(() => import('../screens/OnboardingScreen'));
const SignInScreen = React.lazy(() => import('../screens/SignInScreen'));
const SignUpScreen = React.lazy(() => import('../screens/SignUpScreen'));
const DashboardScreen = React.lazy(() => import('../screens/DashboardScreen'));
const NewHabitScreen = React.lazy(() => import('../screens/NewHabitScreen'));

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          p={3}
          textAlign="center"
        >
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Initialize localForage
localforage.config({
  name: 'HabitTracker',
  storeName: 'habits',
  description: 'Habit Tracker Local Storage'
});

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await localforage.getItem('currentUser');
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [location]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return isAuthenticated ? children : <Navigate to="/signin" state={{ from: location }} replace />;
};

const PublicRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await localforage.getItem('currentUser');
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [location]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// Loading component for Suspense
const LoadingSpinner = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    width="100%"
  >
    <CircularProgress />
  </Box>
);

const AppNavigator = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Navigate to="/onboarding" replace />} />
          
          {/* Public routes */}
          <Route path="/onboarding" element={
            <PublicRoute>
              <OnboardingScreen />
            </PublicRoute>
          } />
          
          <Route path="/signin" element={
            <PublicRoute>
              <SignInScreen />
            </PublicRoute>
          } />
          
          <Route path="/signup" element={
            <PublicRoute>
              <SignUpScreen />
            </PublicRoute>
          } />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <DashboardScreen />
            </PrivateRoute>
          } />
          
          <Route path="/habits/new" element={
            <PrivateRoute>
              <NewHabitScreen />
            </PrivateRoute>
          } />
          
          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppNavigator;

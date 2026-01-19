import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks } from './features/tasks/tasksThunks';
import { fetchHabits } from './features/habits/habitSlice';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import screens with React.lazy for code splitting
const OnboardingScreen = React.lazy(() => import('./screens/OnboardingScreen'));
const SignInScreen = React.lazy(() => import('./screens/SignInScreen'));
const SignUpScreen = React.lazy(() => import('./screens/SignUpScreen'));
const DashboardScreen = React.lazy(() => import('./screens/DashboardScreen'));
const NewHabitScreen = React.lazy(() => import('./screens/NewHabitScreen'));
const CalendarScreen = React.lazy(() => import('./screens/CalendarScreen'));
const ProfileScreen = React.lazy(() => import('./screens/ProfileScreen'));

// Loading component
const LoadingFallback = () => (
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

// Wrapper component for lazy loading
const LazyLoad = ({ children }) => (
  <React.Suspense fallback={<LoadingFallback />}>
    {children}
  </React.Suspense>
);

// Protected route component
const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!currentUser) {
    // Redirect to signin but save the current location they were trying to go to
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#7C3AED',
    },
    secondary: {
      main: '#10B981',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

function AppContent() {
  const dispatch = useDispatch();
  const { currentUser, loading } = useAuth();

  // Fetch data when the app loads and user is authenticated
  useEffect(() => {
    if (currentUser) {
      dispatch(fetchTasks());
      dispatch(fetchHabits());
    }
  }, [dispatch, currentUser]);

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ flex: '1 0 auto', pb: 8 }}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={
            <LazyLoad>
              <OnboardingScreen />
            </LazyLoad>
          } />
          <Route path="/signin" element={
            <LazyLoad>
              <SignInScreen />
            </LazyLoad>
          } />
          <Route path="/signup" element={
            <LazyLoad>
              <SignUpScreen />
            </LazyLoad>
          } />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={
              <LazyLoad>
                <DashboardScreen />
              </LazyLoad>
            } />
            <Route path="/habits/new" element={
              <LazyLoad>
                <NewHabitScreen />
              </LazyLoad>
            } />
            <Route path="/calendar" element={
              <LazyLoad>
                <CalendarScreen />
              </LazyLoad>
            } />
            <Route path="/profile" element={
              <LazyLoad>
                <ProfileScreen />
              </LazyLoad>
            } />
          </Route>

          {/* Redirect all other routes to onboarding */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </LocalizationProvider>
  );
}

export default App;

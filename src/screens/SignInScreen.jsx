import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  TextField,
  Typography,
  Button,
  InputAdornment,
  IconButton,
  Divider,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const SignInScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Check for success message from registration
  useEffect(() => {
    if (location.state?.showSuccessMessage) {
      setSnackbar({
        open: true,
        message: location.state.showSuccessMessage,
        severity: 'success',
      });
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }

    // Pre-fill email if coming from registration
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSignIn = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setSnackbar({
        open: true,
        message: 'Please enter both email and password',
        severity: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        console.log('User signed in successfully, redirecting...');
        // Get the intended destination or default to dashboard
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'Invalid email or password',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error during sign in:', error);
      setSnackbar({
        open: true,
        message: error.message || 'An error occurred during sign in. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box sx={styles.container}>
      <Box sx={styles.card}>
        <Box sx={styles.header}>
          <Typography variant="h4" component="h1" sx={styles.title}>
            Welcome Back
          </Typography>
          <Typography variant="body1" sx={styles.subtitle}>
            Sign in to continue to Habit Tracker Pro
          </Typography>
        </Box>


        <Box component="form" onSubmit={handleSignIn} sx={styles.form} autoComplete="off">
          {/* Hidden dummy fields to prevent autofill */}
          <input type="text" name="fakeusernameremembered" style={{ position: 'absolute', top: '-9999px' }} tabIndex="-1" autoComplete="off" />
          <input type="password" name="fakepasswordremembered" style={{ position: 'absolute', top: '-9999px' }} tabIndex="-1" autoComplete="new-password" />

          <Box sx={styles.inputContainer}>
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              type="text"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="new-password"
              sx={styles.input}
            />
          </Box>

          <Box sx={styles.inputContainer}>
            <TextField
              fullWidth
              label="Password"
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              sx={styles.input}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={styles.forgotPassword}>
            <Link to="/forgot-password" style={styles.forgotPasswordLink}>
              Forgot Password?
            </Link>
          </Box>

          <Button
            variant="contained"
            fullWidth
            type="submit"
            disabled={loading}
            sx={styles.signInButton}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {' '}
              <Link
                to="/signup"
                style={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >

              </Link>
            </Typography>
          </Box>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <MuiAlert
              elevation={6}
              variant="filled"
              onClose={handleCloseSnackbar}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </MuiAlert>
          </Snackbar>


          <Box sx={styles.signUpContainer}>
            <Typography variant="body2" sx={styles.signUpText}>
              Don't have an account?{' '}
              <Link to="/signup" style={styles.signUpLink}>
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    p: 2,
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '40px',
  },
  header: {
    textAlign: 'center',
    mb: 4,
  },
  title: {
    fontWeight: 'bold',
    color: '#111827',
    mb: 1,
  },
  subtitle: {
    color: '#6B7280',
    mb: 4,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    mb: 2,
  },
  input: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      backgroundColor: '#F9FAFB',
    },
    '& .MuiInputLabel-root': {
      color: '#6B7280',
    },
  },
  forgotPassword: {
    display: 'flex',
    justifyContent: 'flex-end',
    mb: 3,
  },
  forgotPasswordLink: {
    color: '#7C3AED',
    fontSize: '14px',
    fontWeight: 500,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  signInButton: {
    py: 1.5,
    borderRadius: '12px',
    backgroundColor: '#7C3AED',
    textTransform: 'none',
    fontSize: '16px',
    fontWeight: 600,
    '&:hover': {
      backgroundColor: '#6D28D9',
    },
    '&.Mui-disabled': {
      backgroundColor: '#DDD5FE',
      color: '#FFFFFF',
    },
  },
  dividerContainer: {
    display: 'flex',
    alignItems: 'center',
    my: 3,
  },
  dividerText: {
    color: '#9CA3AF',
    px: 2,
  },
  googleButton: {
    py: 1.5,
    borderRadius: '12px',
    borderColor: '#E5E7EB',
    textTransform: 'none',
    fontSize: '16px',
    fontWeight: 500,
    color: '#374151',
    mb: 3,
    '&:hover': {
      borderColor: '#D1D5DB',
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
  },
  googleIcon: {
    width: '20px',
    height: '20px',
    backgroundColor: '#4285F4',
    color: '#FFFFFF',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    mr: 1,
  },
  signUpContainer: {
    textAlign: 'center',
    mt: 2,
  },
  signUpText: {
    color: '#6B7280',
  },
  signUpLink: {
    color: '#7C3AED',
    fontWeight: 600,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
};

export default SignInScreen;

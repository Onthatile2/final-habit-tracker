import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert as MuiAlert,
  Snackbar,
  useTheme,
  styled
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';

// Custom styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 16,
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

const SocialButton = styled(Button)(({ theme }) => ({
  padding: '10px',
  borderRadius: 12,
  textTransform: 'none',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const SignUpScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  const handleInputChange = (name, value) => {
    // If the field is phoneNumber, only allow numbers
    if (name === 'phoneNumber' && value !== '' && !/^\d*$/.test(value)) {
      return; // Don't update if not a number
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Passwords do not match',
        severity: 'error',
      });
      return;
    }

    if (formData.password.length < 8) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 8 characters long',
        severity: 'error',
      });
      return;
    }

    if (!formData.firstName || !formData.email || !formData.phoneNumber || !formData.password) {
      setSnackbar({
        open: true,
        message: 'Please fill in all fields',
        severity: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      // Check if user already exists by querying the API
      const response = await fetch(`http://localhost:3001/users?email=${encodeURIComponent(formData.email)}`);
      const existingUsers = await response.json();

      if (existingUsers && existingUsers.length > 0) {
        setSnackbar({
          open: true,
          message: 'An account with this email already exists',
          severity: 'error',
        });
        return;
      }

      // Create new user with all required fields
      const newUser = {
        email: formData.email,
        password: formData.password, // In a real app, never store plain passwords
        name: formData.firstName,
        phoneNumber: formData.phoneNumber,
        createdAt: new Date().toISOString()
      };

      // Save user to JSON server
      const userResponse = await fetch('http://localhost:3001/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to register user');
      }

      const savedUser = await userResponse.json();
      console.log('User registered:', savedUser);

      // Automatically log in the user after registration
      const loginResult = await login(formData.email, formData.password);

      if (loginResult.success) {
        // Redirect to dashboard or the intended destination
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });

        // Show success message
        setSnackbar({
          open: true,
          message: 'Registration successful! Welcome to your dashboard.',
          severity: 'success',
        });
      } else {
        // If auto-login fails, redirect to sign in page with success message
        navigate('/signin', {
          state: {
            showSuccessMessage: 'Registration successful! Please sign in.',
            email: formData.email // Pre-fill the email in the sign-in form
          }
        });
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setSnackbar({
        open: true,
        message: error.message || 'An error occurred during registration. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Create Account
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Let's get started. Create an account to continue.
        </Typography>
      </Box>

      <StyledPaper elevation={0}>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="First Name"
            margin="normal"
            variant="outlined"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            required
            autoComplete="off"
            sx={{ mb: 2 }}
          />

          <TextField
            label="Phone Number"
            variant="outlined"
            fullWidth
            margin="normal"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            required
            autoComplete="off"
            inputProps={{
              inputMode: 'tel',
              pattern: '[0-9]*',
              maxLength: 15,
            }}
            helperText="Enter 10-digit phone number"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Email"
            margin="normal"
            variant="outlined"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())}
            required
            autoComplete="off"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Password"
            margin="normal"
            variant="outlined"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
            autoComplete="new-password"
            helperText="Must be at least 8 characters"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label="Confirm Password"
            margin="normal"
            variant="outlined"
            type={showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            required
            autoComplete="new-password"
            helperText="Must match password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={24} sx={{ color: 'white', mr: 1 }} />
                Creating Account...
              </Box>
            ) : (
              'Create Account'
            )}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link
                to="/signin"
                style={{
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </Box>
      </StyledPaper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
    </Container>
  );
};

export default SignUpScreen;

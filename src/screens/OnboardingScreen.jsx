import React from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const OnboardingScreen = () => {
  const navigate = useNavigate();
  return (
    <Box sx={styles.container}>
      <Box sx={styles.backgroundImageContainer}>
        <Box 
          component="img"
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
          sx={{
            ...styles.backgroundImage,
            objectFit: 'cover',
            objectPosition: 'center 30%'
          }}
          alt="People tracking their habits on mobile devices"
        />
      </Box>
      
      <Box sx={styles.content}>
        <Typography variant="h4" component="h1" sx={styles.title}>
          Habit Tracker Pro
        </Typography>
        <Typography variant="body1" sx={styles.subtitle}>
          Build better habits, one day at a time. Track your progress and achieve your goals with our simple and effective habit tracker.
        </Typography>
        
        <Button 
          variant="contained" 
          size="large"
          fullWidth
          sx={styles.button}
          onClick={() => navigate('/signup')}
        >
          Create Account
        </Button>

        <Button 
          variant="outlined" 
          size="large"
          fullWidth
          sx={{ ...styles.button, mt: 2, backgroundColor: 'transparent' }}
          onClick={() => navigate('/signin')}
        >
          Sign In
        </Button>
        
        <Typography variant="caption" sx={styles.termsText}>
          By continuing, you agree to our Terms of Use and Privacy Policy
        </Typography>
      </Box>
    </Box>
  );
};

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
  },
  backgroundImageContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: '30px',
    borderTopRightRadius: '30px',
    padding: '30px',
    paddingBottom: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333333',
    mb: 2,
  },
  subtitle: {
    fontSize: '16px',
    color: '#666666',
    mb: 5,
    px: 2.5,
    lineHeight: 1.5,
    maxWidth: '600px',
  },
  button: {
    backgroundColor: '#7C3AED',
    py: 2,
    px: 5,
    borderRadius: '30px',
    width: '100%',
    maxWidth: '300px',
    mb: 2.5,
    '&:hover': {
      backgroundColor: '#6D28D9',
    },
  },
  termsText: {
    fontSize: '12px',
    color: '#999999',
    px: 3.75,
    lineHeight: 1.5,
    maxWidth: '400px',
  },
};

export default OnboardingScreen;

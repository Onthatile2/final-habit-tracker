import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { format, isSameDay, parseISO } from 'date-fns';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  useTheme,
  Container,
  Paper,
  Grid,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

const DashboardScreen = () => {
  const navigate = useNavigate();
  const { currentUser, logout, loading: authLoading } = useAuth();
  const theme = useTheme();

  console.log('Dashboard rendered', {
    currentUser,
    authLoading,
    hasToken: !!sessionStorage.getItem('currentUser')
  });

  // State for habits and tasks
  const [habits, setHabits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Format date for display
  const formatDate = (date) => {
    return format(new Date(date), 'EEEE, MMMM d, yyyy');
  };

  // Calculate habit completion percentage
  const calculateCompletion = (habit) => {
    if (!habit.completions || habit.completions.length === 0) return 0;
    const completedCount = habit.completions.filter(c => c.completed).length;
    return Math.round((completedCount / habit.completions.length) * 100);
  };

  // Open completion dialog
  const openCompletionDialog = (habit) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayCompletion = habit.completions?.find(c => c.date === today);
    setSelectedHabit(habit);
    setCompletionPercentage(todayCompletion?.percentage || 0);
    setCompletionDialogOpen(true);
  };

  // Save habit completion percentage
  const saveHabitCompletion = async () => {
    try {
      if (!selectedHabit) return;

      const today = format(new Date(), 'yyyy-MM-dd');
      const completionIndex = selectedHabit.completions?.findIndex(c => c.date === today) ?? -1;
      let updatedCompletions = [...(selectedHabit.completions || [])];

      if (completionIndex >= 0) {
        updatedCompletions[completionIndex] = {
          date: today,
          percentage: completionPercentage,
          completed: completionPercentage === 100
        };
      } else {
        updatedCompletions.push({
          date: today,
          percentage: completionPercentage,
          completed: completionPercentage === 100
        });
      }

      await axios.patch(`http://localhost:3001/habits/${selectedHabit.id}`, {
        completions: updatedCompletions
      });

      setHabits(prevHabits =>
        prevHabits.map(h =>
          h.id === selectedHabit.id
            ? { ...h, completions: updatedCompletions }
            : h
        )
      );

      setCompletionDialogOpen(false);
      showSnackbar('Habit progress updated!');
    } catch (error) {
      console.error('Error updating habit:', error);
      showSnackbar('Failed to update habit', 'error');
    }
  };

  // Delete habit
  const handleDeleteHabit = async () => {
    try {
      if (!habitToDelete) return;

      await axios.delete(`http://localhost:3001/habits/${habitToDelete.id}`);

      setHabits(prevHabits => prevHabits.filter(h => h.id !== habitToDelete.id));
      setDeleteDialogOpen(false);
      setHabitToDelete(null);
      showSnackbar('Habit deleted successfully!');
    } catch (error) {
      console.error('Error deleting habit:', error);
      showSnackbar('Failed to delete habit', 'error');
    }
  };

  const openDeleteDialog = (habit) => {
    setHabitToDelete(habit);
    setDeleteDialogOpen(true);
  };

  // Show snackbar helper function
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Load user data
  const loadUserData = useCallback(async () => {
    if (!currentUser) {
      console.log('No current user, skipping data load');
      return;
    }

    try {
      setLoading(true);
      console.log('Current user ID:', currentUser.id);

      // Fetch all habits
      const habitsResponse = await axios.get('http://localhost:3001/habits');
      const userHabits = habitsResponse.data.filter(habit => habit.userId === currentUser.id);
      console.log('Filtered user habits:', userHabits);

      // Fetch all tasks
      const tasksResponse = await axios.get('http://localhost:3001/tasks');
      const userTasks = tasksResponse.data.filter(task => task.userId === currentUser.id);

      // Update state
      setHabits(userHabits);
      setTasks(userTasks);
    } catch (error) {
      console.error('Error loading user data:', error);
      showSnackbar('Failed to load your data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load data on component mount and when currentUser changes
  useEffect(() => {
    console.log('useEffect triggered', { currentUser });
    if (currentUser) {
      console.log('Loading user data for:', currentUser.id);
      loadUserData();
    } else {
      console.log('No current user, not loading data');
      setLoading(false);
    }
  }, [currentUser, loadUserData]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (error) {
      console.error('Error logging out:', error);
      showSnackbar('Failed to log out', 'error');
    }
  };

  // Navigate to add new habit
  const handleAddHabit = () => {
    navigate('/habits/new');
  };

  // Navigate to profile page
  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Show loading state
  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated, redirect to sign in
  if (!currentUser) {
    console.log('No current user, redirecting to signin');
    navigate('/signin');
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Habit Tracker
          </Typography>
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={handleProfileClick}
            sx={{ ml: 1 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
              </Box>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {currentUser?.name || 'User'}
              </Typography>
            </Box>
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4, flex: 1, pb: '80px' }}>
        {/* Welcome Section */}
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            Welcome back, {currentUser.name || 'User'}!
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {formatDate(new Date())}
          </Typography>
        </Box>

        {/* Stats Overview */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Habits
                </Typography>
                <Typography variant="h4">
                  {habits.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Today's Progress
                </Typography>
                <Typography variant="h4">
                  {habits.length > 0
                    ? `${Math.round(
                      habits.reduce((acc, habit) => {
                        const todayCompletion = habit.completions?.find(c =>
                          c.date && isSameDay(parseISO(c.date), new Date())
                        );
                        return acc + (todayCompletion?.completed ? 1 : 0);
                      }, 0) / habits.length * 100
                    )}%`
                    : '0%'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Upcoming Tasks
                </Typography>
                <Typography variant="h4">
                  {tasks.filter(task => !task.completed).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Today's Habits */}
        <Box mb={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Today's Habits</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddHabit}
            >
              Add Habit
            </Button>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : habits.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No habits found. Add your first habit to get started!
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                sx={{ mt: 2 }}
                onClick={handleAddHabit}
              >
                Add Your First Habit
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {habits.map((habit) => {
                const todayCompletion = habit.completions?.find(c =>
                  c.date && isSameDay(parseISO(c.date), new Date())
                );
                const completionPercentage = todayCompletion?.percentage || 0;

                return (
                  <Grid item xs={12} key={habit.id}>
                    <Card
                      sx={{
                        '&:hover': {
                          boxShadow: theme.shadows[4]
                        },
                        mb: 2
                      }}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" flex={1}>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                openCompletionDialog(habit);
                              }}
                              color={completionPercentage === 100 ? 'success' : completionPercentage > 0 ? 'primary' : 'default'}
                            >
                              {completionPercentage === 100 ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                            </IconButton>
                            <Box ml={2} flex={1}>
                              <Typography variant="h6" component="div">
                                {habit.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {habit.frequency || 'Daily'} • {habit.category || 'General'}
                              </Typography>
                            </Box>
                          </Box>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Box textAlign="right">
                              <Typography variant="caption" color="text.secondary">
                                {completionPercentage}% today
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={completionPercentage}
                                sx={{ width: 100, height: 8, borderRadius: 4, mt: 0.5 }}
                              />
                            </Box>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(habit);
                              }}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          py: 2,
          textAlign: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          zIndex: 1000
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Habit tracker@2026
        </Typography>
      </Box>

      {/* Add Habit Button */}
      <Box sx={{ position: 'fixed', bottom: 80, right: 24, zIndex: 1001 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddHabit}
          sx={{
            borderRadius: '50%',
            minWidth: '56px',
            width: '56px',
            height: '56px',
            boxShadow: theme.shadows[4],
            '&:hover': {
              boxShadow: theme.shadows[8],
            },
          }}
        >
          <AddIcon />
        </Button>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Completion Percentage Dialog */}
      <Dialog open={completionDialogOpen} onClose={() => setCompletionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Completion Percentage</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 3, pb: 2 }}>
            <Typography variant="h4" align="center" color="primary" gutterBottom>
              {completionPercentage}%
            </Typography>
            <Slider
              value={completionPercentage}
              onChange={(e, newValue) => setCompletionPercentage(newValue)}
              step={10}
              marks
              min={0}
              max={100}
              valueLabelDisplay="auto"
              sx={{ mt: 2 }}
            />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              How much of "{selectedHabit?.name}" did you complete today?
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompletionDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveHabitCompletion} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Habit?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{habitToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteHabit} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardScreen;

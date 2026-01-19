import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  InputAdornment,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Icon
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Custom styled components
const ColorCircle = styled('div')(({ color, selected }) => ({
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  border: selected ? '3px solid #7C3AED' : 'none',
  '&:hover': {
    transform: 'scale(1.1)',
    transition: 'transform 0.2s',
  },
}));

const IconButtonStyled = styled(Button)(({ selected }) => ({
  minWidth: 'auto',
  width: 50,
  height: 50,
  fontSize: '24px',
  borderRadius: '12px',
  margin: '8px',
  padding: 0,
  border: selected ? '2px solid #7C3AED' : '1px solid #E5E7EB',
  '&:hover': {
    transform: 'scale(1.05)',
    transition: 'transform 0.2s',
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(2),
  borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
}));

const NewHabitScreen = () => {
  const navigate = useNavigate();
  const [habitName, setHabitName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🏃');
  const [selectedColor, setSelectedColor] = useState('#7C3AED');
  const [frequency, setFrequency] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const icons = ['🏃', '📚', '💧', '🏋️', '🧘', '🎯', '✏️', '📱'];
  const colors = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Function to add a new task
  const addTask = () => {
    if (newTask.trim()) {
      const taskToAdd = {
        id: Date.now().toString(),
        text: newTask.trim(),
        completed: false
      };
      setTasks(prevTasks => [...prevTasks, taskToAdd]);
      setNewTask('');
    }
  };

  // Get current user from session storage
  const getCurrentUser = () => {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
      navigate('/signin');
      return null;
    }
    return JSON.parse(userData);
  };

  const handleSaveHabit = async () => {
    if (!habitName.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a habit name',
        severity: 'error',
      });
      return;
    }
    
    // Ensure tasks are properly formatted before saving
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      text: task.text,
      completed: task.completed || false
    }));

    setLoading(true);
    console.log('=== Starting to save habit ===');

    try {
      // Get current user
      const user = getCurrentUser();
      if (!user) return;

      const newHabit = {
        userId: user.id,
        name: habitName.trim(),
        description: description.trim(),
        icon: selectedIcon,
        color: selectedColor,
        tasks: formattedTasks,
        frequency,
        progress: 0,
        completedDates: [],
        createdAt: new Date().toISOString()
      };

      console.log('Saving new habit:', newHabit);

      // Save habit to JSON server
      const response = await fetch('http://localhost:3001/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newHabit),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save habit');
      }

      const savedHabit = await response.json();
      console.log('Habit saved successfully:', savedHabit);

      // Show success message and navigate back
      setSnackbar({
        open: true,
        message: 'Habit created successfully!',
        severity: 'success',
      });

      // Reset form
      setHabitName('');
      setDescription('');
      setTasks([]);
      setNewTask('');
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error saving habit:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error saving habit. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          New Habit
        </Typography>
      </Box>

      <StyledPaper elevation={0}>
        <Box sx={{ mb: 4 }}>
          {/* Task Input */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <FormLabel sx={{ mb: 1, fontWeight: 'medium' }}>Add Tasks (Optional)</FormLabel>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Enter a task"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTask();
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={addTask}
                disabled={!newTask.trim()}
                sx={{ minWidth: 'auto' }}
              >
                <AddIcon />
              </Button>
            </Box>

            {/* Task List */}
            {tasks.length > 0 && (
              <Paper variant="outlined" sx={{ p: 1, mb: 3, maxHeight: 200, overflow: 'auto' }}>
                <List dense>
                  {tasks.map((task, index) => (
                    <React.Fragment key={task.id}>
                      <ListItem>
                        <ListItemText
                          primary={task.text}
                          sx={{ textDecoration: task.completed ? 'line-through' : 'none' }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => {
                              const updatedTasks = [...tasks];
                              updatedTasks.splice(index, 1);
                              setTasks(updatedTasks);
                            }}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < tasks.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}
          </FormControl>
          <TextField
            fullWidth
            label="Habit Name"
            variant="outlined"
            placeholder="e.g., Drink water"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label="Description (Optional)"
            variant="outlined"
            placeholder="Add a short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 4 }}
          />

          <FormControl component="fieldset" sx={{ mb: 4, width: '100%' }}>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'medium' }}>Icon</FormLabel>
            <Grid container spacing={1} justifyContent="center">
              {icons.map((icon, index) => (
                <Grid key={index}>
                  <IconButtonStyled
                    variant={selectedIcon === icon ? 'contained' : 'outlined'}
                    onClick={() => setSelectedIcon(icon)}
                    selected={selectedIcon === icon}
                  >
                    {icon}
                  </IconButtonStyled>
                </Grid>
              ))}
            </Grid>
          </FormControl>

          <FormControl component="fieldset" sx={{ mb: 4, width: '100%' }}>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'medium' }}>Color</FormLabel>
            <Grid container spacing={2} justifyContent="center">
              {colors.map((color, index) => (
                <Grid key={index}>
                  <ColorCircle
                    color={color}
                    selected={selectedColor === color}
                    onClick={() => setSelectedColor(color)}
                  />
                </Grid>
              ))}
            </Grid>
          </FormControl>

          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'medium' }}>Frequency</FormLabel>
            <RadioGroup
              row
              aria-label="frequency"
              name="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              sx={{ justifyContent: 'space-between' }}
            >
              {['daily', 'weekly', 'monthly'].map((freq) => (
                <FormControlLabel
                  key={freq}
                  value={freq}
                  control={<Radio />}
                  label={freq.charAt(0).toUpperCase() + freq.slice(1)}
                  sx={{
                    flex: 1,
                    m: 0,
                    border: frequency === freq ? '1px solid #7C3AED' : '1px solid #E5E7EB',
                    borderRadius: '8px',
                    mx: 1,
                    px: 2,
                    py: 1,
                    '& .MuiFormControlLabel-label': {
                      textAlign: 'center',
                      width: '100%',
                    },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSaveHabit}
          disabled={loading || !habitName.trim()}
          sx={{
            py: 1.5,
            borderRadius: '12px',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            mt: 2,
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Habit'}
        </Button>
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

export default NewHabitScreen;

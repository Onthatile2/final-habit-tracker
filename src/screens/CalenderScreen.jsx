import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import localforage from 'localforage';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton,
  Checkbox,
  Chip,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { format, isSameDay, parseISO, addDays, isToday, isTomorrow, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AddTaskDialog from '../components/AddTaskDialog';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

// Storage key with user-specific prefix
const STORAGE_PREFIX = 'habitTracker';
const TASKS_KEY = 'tasks';

const getStorageKey = (userId) => `${STORAGE_PREFIX}_${userId}_${TASKS_KEY}`;

function CalendarScreen() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' or 'week'
  const [openAddTask, setOpenAddTask] = useState(false);
  const [tasks, setTasks] = useState({});
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Get days for weekly view
  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    end: endOfWeek(selectedDate, { weekStartsOn: 1 })
  });

  // Load tasks from storage on component mount
  useEffect(() => {
    const loadTasks = async () => {
      console.log('Starting to load tasks...');
      try {
        setLoading(true);
        
        // First try to get user from localForage
        let user = null;
        try {
          console.log('Trying to get user from localForage...');
          user = await localforage.getItem('currentUser');
          console.log('User from localForage:', user ? 'User found' : 'No user in localForage');
        } catch (forageError) {
          console.error('Error reading from localForage:', forageError);
        }
        
        // If no user in localForage, try localStorage
        if (!user?.id) {
          console.warn('No user found in localForage, checking localStorage...');
          try {
            const storedUser = localStorage.getItem('currentUser');
            console.log('Raw user from localStorage:', storedUser ? 'Found' : 'Not found');
            
            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                console.log('Parsed user from localStorage:', parsedUser);
                
                if (parsedUser?.id) {
                  console.log('Found valid user in localStorage, migrating to localForage...');
                  try {
                    await localforage.setItem('currentUser', parsedUser);
                    user = parsedUser;
                    console.log('Successfully migrated user to localForage');
                  } catch (migrateError) {
                    console.error('Failed to migrate user to localForage:', migrateError);
                    // Continue with the parsed user from localStorage
                    user = parsedUser;
                  }
                } else {
                  console.warn('User in localStorage has no ID:', parsedUser);
                }
              } catch (parseError) {
                console.error('Error parsing stored user data:', parseError);
              }
            } else {
              console.warn('No user data found in localStorage');
            }
          } catch (localStorageError) {
            console.error('Error accessing localStorage:', localStorageError);
          }
          
          if (!user?.id) {
            const errorMsg = 'No authenticated user found, redirecting to signin';
            console.error(errorMsg);
            setSnackbar({
              open: true,
              message: 'Please sign in to view your tasks',
              severity: 'error',
            });
            navigate('/signin');
            return;
          }
        }
        
        const storageKey = getStorageKey(user.id);
        console.log('Loading tasks with storage key:', storageKey);
        
        // Try localForage first
        let savedTasks = null;
        try {
          console.log('Trying to load tasks from localForage...');
          savedTasks = await localforage.getItem(storageKey);
          console.log('Tasks from localForage:', savedTasks ? 'Found' : 'Not found');
          
          // If not found in localForage, try localStorage
          if (!savedTasks) {
            console.log('Tasks not found in localForage, checking localStorage...');
            const localStorageTasks = localStorage.getItem(storageKey);
            console.log('Raw tasks from localStorage:', localStorageTasks ? 'Found' : 'Not found');
            
            if (localStorageTasks) {
              try {
                savedTasks = JSON.parse(localStorageTasks);
                console.log('Successfully parsed tasks from localStorage');
                
                // Migrate to localForage
                try {
                  await localforage.setItem(storageKey, savedTasks);
                  console.log('Successfully migrated tasks to localForage');
                } catch (migrateError) {
                  console.error('Failed to migrate tasks to localForage:', migrateError);
                }
              } catch (parseError) {
                console.error('Error parsing tasks from localStorage:', parseError);
              }
            } else {
              console.log('No tasks found in localStorage either');
            }
          }
          
          // Ensure we have a valid tasks object
          if (savedTasks && typeof savedTasks === 'object' && !Array.isArray(savedTasks)) {
            console.log('Successfully loaded tasks:', savedTasks);
            setTasks(savedTasks);
          } else {
            console.log('No valid tasks found or invalid format, initializing with empty tasks');
            
            // Create a proper initial tasks structure
            const today = new Date().toISOString().split('T')[0];
            const initialTasks = {
              [today]: [] // Today's date as key with empty array
            };
            
            console.log('Initializing with empty tasks for date:', today);
            setTasks(initialTasks);
            
            // Save the initial structure
            try {
              await localforage.setItem(storageKey, initialTasks);
              console.log('Successfully initialized empty tasks in storage');
            } catch (saveError) {
              console.error('Failed to save initial tasks:', saveError);
              
              // Try falling back to localStorage
              try {
                localStorage.setItem(storageKey, JSON.stringify(initialTasks));
                console.log('Successfully saved initial tasks to localStorage');
              } catch (localSaveError) {
                console.error('Failed to save to localStorage:', localSaveError);
              }
            }
          }
          
        } catch (error) {
          console.error('Error loading tasks:', error);
          
          // Initialize with empty tasks
          const today = new Date().toISOString().split('T')[0];
          const emptyTasks = { [today]: [] };
          setTasks(emptyTasks);
          
          // Try to save the empty tasks
          try {
            await localforage.setItem(storageKey, emptyTasks);
          } catch (saveError) {
            console.error('Failed to save empty tasks to localForage:', saveError);
            try {
              localStorage.setItem(storageKey, JSON.stringify(emptyTasks));
            } catch (localSaveError) {
              console.error('Failed to save empty tasks to localStorage:', localSaveError);
            }
          }
          
          // Show a user-friendly message
          setSnackbar({
            open: true,
            message: 'Started with a fresh task list',
            severity: 'info',
          });
        }
        
      } catch (error) {
        console.error('Failed to load tasks:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load tasks. Starting with an empty task list.',
          severity: 'warning'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadTasks();
  }, []);

  // Save tasks to storage whenever they change
  useEffect(() => {
    if (loading) return; // Skip if we're still loading
    
    const saveTasks = async () => {
      console.log('Saving tasks...');
      
      // Get current user with fallback to localStorage
      let user = null;
      try {
        // Try localForage first
        try {
          user = await localforage.getItem('currentUser');
          console.log('Retrieved user from localForage:', user);
        } catch (forageError) {
          console.warn('Error reading from localForage:', forageError);
        }
        
        // If no user in localForage, try localStorage
        if (!user?.id) {
          console.warn('No user found in localForage, checking localStorage...');
          try {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
              try {
                user = JSON.parse(storedUser);
                console.log('Retrieved user from localStorage:', user);
                
                // Try to migrate to localForage for future use
                if (user?.id) {
                  try {
                    await localforage.setItem('currentUser', user);
                    console.log('Migrated user to localForage');
                  } catch (migrateError) {
                    console.warn('Failed to migrate user to localForage:', migrateError);
                  }
                }
              } catch (parseError) {
                console.error('Error parsing stored user data:', parseError);
              }
            }
          } catch (localStorageError) {
            console.error('Error accessing localStorage:', localStorageError);
          }
        }
        
        if (!user?.id) {
          const errorMsg = 'No authenticated user found, cannot save tasks';
          console.error(errorMsg);
          setSnackbar({
            open: true,
            message: 'Please sign in to save tasks',
            severity: 'error'
          });
          navigate('/signin');
          return;
        }
        
        const storageKey = getStorageKey(user.id);
        console.log('Saving tasks with storage key:', storageKey);
        
        // Ensure tasks is a valid object
        if (!tasks || typeof tasks !== 'object') {
          console.warn('Invalid tasks data, skipping save:', tasks);
          return;
        }
        
        // Create a clean, serializable copy of tasks
        const tasksToSave = {};
        
        // Ensure tasks is properly formatted
        if (tasks && typeof tasks === 'object' && !Array.isArray(tasks)) {
          Object.keys(tasks).forEach(date => {
            if (Array.isArray(tasks[date])) {
              tasksToSave[date] = tasks[date].map(task => ({
                ...task,
                // Ensure required fields exist
                id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: task.title || 'Untitled Task',
                completed: task.completed || false,
                date: task.date || date,
                createdAt: task.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }));
            }
          });
        }
        
        try {
          Object.entries(tasks).forEach(([date, taskList]) => {
            if (Array.isArray(taskList)) {
              tasksToSave[date] = taskList.map(task => ({
                id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: String(task.title || 'Untitled Task').substring(0, 200), // Limit length
                description: String(task.description || '').substring(0, 1000), // Limit length
                type: ['task', 'meeting', 'reminder', 'event'].includes(task.type) ? task.type : 'task',
                completed: Boolean(task.completed),
                allDay: Boolean(task.allDay),
                date: date, // Always use the key as the source of truth for the date
                time: task.allDay ? null : (task.time || null),
                priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
                category: String(task.category || 'general').substring(0, 50),
                recurrence: ['none', 'daily', 'weekdays', 'weekly', 'monthly'].includes(task.recurrence) ? task.recurrence : 'none',
                createdAt: task.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }));
            }
          });
        } catch (processError) {
          console.error('Error processing tasks for storage:', processError);
          throw new Error('Failed to process tasks for saving');
        }
        
        // Save to both storage systems with error handling for each
        let saveSuccess = false;
        
        // Try localForage first
        try {
          await localforage.setItem(storageKey, tasksToSave);
          console.log('Successfully saved to localForage');
          saveSuccess = true;
        } catch (forageError) {
          console.error('Error saving to localForage:', forageError);
        }
        
        // Always try to save to localStorage as a fallback
        try {
          localStorage.setItem(storageKey, JSON.stringify(tasksToSave));
          console.log('Successfully saved to localStorage');
          saveSuccess = true;
        } catch (storageError) {
          console.error('Error saving to localStorage:', storageError);
        }
        
        if (!saveSuccess) {
          throw new Error('Failed to save to any storage system');
        }
        
      } catch (error) {
        console.error('Failed to save tasks:', error);
        setSnackbar({
          open: true,
          message: 'Failed to save tasks: ' + (error.message || 'Unknown error'),
          severity: 'error',
          autoHideDuration: 5000
        });
      }
    };
    
    // Add a small debounce to prevent too many saves in quick succession
    const saveTimeout = setTimeout(() => {
      saveTasks().catch(console.error);
    }, 300);
    
    return () => clearTimeout(saveTimeout);
  }, [tasks, loading]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddTask = async (taskData) => {
    console.log('handleAddTask called with:', taskData);
    
    try {
      if (!taskData) {
        throw new Error('No task data provided');
      }
      
      // Ensure we have a valid date
      const taskDate = taskData.date || selectedDate || new Date();
      if (!taskDate || isNaN(new Date(taskDate).getTime())) {
        throw new Error('Invalid date provided');
      }
      
      const dateKey = format(new Date(taskDate), 'yyyy-MM-dd');
      console.log('Using date key:', dateKey);
      
      // Create task with all required fields and defaults
      const taskWithId = {
        id: taskData.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: taskData.title?.trim() || 'Untitled Task',
        description: taskData.description?.trim() || '',
        type: taskData.type || 'task',
        completed: taskData.completed || false,
        allDay: taskData.allDay || false,
        date: dateKey,
        time: taskData.allDay ? null : (taskData.time || format(new Date(), 'HH:mm')),
        priority: taskData.priority || 'medium',
        category: taskData.category || 'general',
        recurrence: taskData.recurrence || 'none',
        createdAt: taskData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('Task to be added:', taskWithId);
      
      // Update state with the new task
      setTasks(prevTasks => {
        try {
          const existingTasks = prevTasks[dateKey] || [];
          
          // If task has an ID, it's an update, otherwise it's a new task
          const updatedTasks = taskData.id
            ? existingTasks.map(task => task.id === taskData.id ? taskWithId : task)
            : [...existingTasks, taskWithId];
          
          // Create a new state object with the updated tasks
          const newState = {
            ...prevTasks,
            [dateKey]: updatedTasks
          };
          
          console.log('Tasks after update:', newState);
          return newState;
        } catch (updateError) {
          console.error('Error updating tasks state:', updateError);
          showSnackbar('Error updating tasks: ' + updateError.message, 'error');
          return prevTasks;
        }
      });
      
      // Reset the form and close the dialog
      setOpenAddTask(false);
      setEditingTask(null);
      showSnackbar(taskData.id ? 'Task updated successfully' : 'Task added successfully');
      
    } catch (error) {
      console.error('Error in handleAddTask:', error);
      showSnackbar(`Failed to save task: ${error.message}`, 'error');
    }
  };

  const handleUpdateTask = (updatedTask) => {
    try {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      
      setTasks(prevTasks => {
        const updatedTasks = {
          ...prevTasks,
          [dateKey]: (prevTasks[dateKey] || []).map(task => 
            task.id === updatedTask.id 
              ? { ...updatedTask, updatedAt: new Date().toISOString() } 
              : task
          )
        };
        return updatedTasks;
      });
      
      showSnackbar('Task updated successfully');
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      showSnackbar('Failed to update task', 'error');
    }
  };

  const handleDeleteTask = (taskId) => {
    try {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      
      setTasks(prevTasks => {
        const updatedTasks = {
          ...prevTasks,
          [dateKey]: (prevTasks[dateKey] || []).filter(task => task.id !== taskId)
        };
        
        // Remove the date key if no tasks left
        if (updatedTasks[dateKey].length === 0) {
          delete updatedTasks[dateKey];
        }
        
        return updatedTasks;
      });
      
      showSnackbar('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      showSnackbar('Failed to delete task', 'error');
    }
  };

  const toggleTaskCompletion = (task) => {
    const updatedTask = { 
      ...task, 
      completed: !task.completed,
      updatedAt: new Date().toISOString() 
    };
    handleUpdateTask(updatedTask);
  };

  const handleViewChange = (event, newView) => {
    if (newView) {  // Changed from newView !== null to just newView
      setView(newView);
    }
  };

  const handlePrevious = () => {
    setSelectedDate(view === 'month' 
      ? addDays(selectedDate, -30) 
      : addDays(selectedDate, -7)
    );
  };

  const handleNext = () => {
    setSelectedDate(view === 'month'
      ? addDays(selectedDate, 30)
      : addDays(selectedDate, 7)
    );
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  const safeDate = selectedDate || new Date();
  const dateKey = format(safeDate, 'yyyy-MM-dd');
  // Ensure we always have an array, even if tasks[dateKey] is undefined
  const dateTasks = Array.isArray(tasks[dateKey]) ? tasks[dateKey] : [];
  console.log('Current date tasks:', { dateKey, dateTasks });

  // Get all tasks for the month to show in calendar
  const monthTasks = Object.entries(tasks).reduce((acc, [date, tasksForDate]) => {
    if (date.startsWith(format(safeDate, 'yyyy-MM'))) {
      acc[date] = tasksForDate;
    }
    return acc;
  }, {});

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto', minHeight: '100vh' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Calendar
          </Typography>
          <Box>
            <Tooltip title="View habits for selected date">
              <Button
                variant="outlined"
                startIcon={<CalendarViewDayIcon />}
                onClick={() => navigate('/dashboard', { state: { selectedDate: selectedDate.toISOString() } })}
                sx={{ mr: 2 }}
              >
                View Habits
              </Button>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddTask(true)}
              sx={{ mr: 2 }}
            >
              Add Task
            </Button>
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={handleViewChange}
              aria-label="calendar view"
              size="small"
              sx={{ mr: 2 }}
            >
              <ToggleButton 
                value="week" 
                aria-label="week view"
                selected={view === 'week'}
              >
                Week
              </ToggleButton>
              <ToggleButton 
                value="month" 
                aria-label="month view"
                selected={view === 'month'}
              >
                Month
              </ToggleButton>
            </ToggleButtonGroup>
            <Button onClick={handleToday} variant="outlined" size="small" sx={{ mr: 1 }}>
              Today
            </Button>
            <Button onClick={handlePrevious} size="small" sx={{ mr: 1 }}>
              &lt;
            </Button>
            <Button onClick={handleNext} size="small">
              &gt;
            </Button>
          </Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {view === 'month' 
              ? format(selectedDate, 'MMMM yyyy')
              : `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          <Paper elevation={3} sx={{ p: 2, minWidth: 350, borderRadius: 3, height: 'fit-content' }}>
            {view === 'month' ? (
              <DateCalendar
                value={safeDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                sx={{ 
                  width: '100%',
                  '& .MuiDayCalendar-header span': {
                    fontWeight: 'bold',
                    color: 'text.primary',
                  },
                  '& .MuiPickersDay-root': {
                    width: 36,
                    height: 36,
                    margin: '0 2px',
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                    '&.MuiPickersDay-today': {
                      border: '1px solid',
                      borderColor: 'primary.main',
                      backgroundColor: 'transparent',
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                      },
                    },
                  },
                  '& .has-tasks::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                  },
                }}
                slotProps={{
                  day: (ownerState) => {
                    const date = new Date(ownerState.day);
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const hasTasks = tasks[dateKey]?.length > 0;
                    const isToday = isSameDay(date, new Date());
                    
                    return {
                      className: `${hasTasks ? 'has-tasks' : ''} ${isToday ? 'MuiPickersDay-today' : ''}`,
                      children: format(date, 'd')
                    };
                  },
                }}
              />
            ) : (
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  {weekDays.map((day, index) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayTasks = tasks[dateKey] || [];
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentDay = isSameDay(day, new Date());
                    
                    return (
                      <Button
                        key={day.toString()}
                        onClick={() => setSelectedDate(day)}
                        variant={isSelected ? 'contained' : 'outlined'}
                        color={isCurrentDay ? 'primary' : 'inherit'}
                        sx={{
                          justifyContent: 'flex-start',
                          textTransform: 'none',
                          borderRadius: 2,
                          p: 1.5,
                          bgcolor: isSelected ? 'primary.main' : 'background.paper',
                          color: isSelected ? 'white' : 'text.primary',
                          '&:hover': {
                            bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                          },
                        }}
                      >
                        <Box sx={{ textAlign: 'left', width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1" fontWeight={isCurrentDay ? 'bold' : 'normal'}>
                              {format(day, 'EEEE, MMM d')}
                              {isCurrentDay && ' (Today)'}
                            </Typography>
                            {dayTasks.length > 0 && (
                              <Chip 
                                label={dayTasks.length} 
                                size="small"
                                sx={{ 
                                  bgcolor: isSelected ? 'white' : 'primary.main',
                                  color: isSelected ? 'primary.main' : 'white',
                                  fontWeight: 'bold',
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Button>
                    );
                  })}
                </Box>
              </Box>
            )}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Quick Filters
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label="Today" 
                  onClick={() => setSelectedDate(new Date())} 
                  variant={isSameDay(selectedDate, new Date()) ? 'filled' : 'outlined'}
                  color="primary"
                />
                <Chip 
                  label="Tomorrow" 
                  onClick={() => setSelectedDate(addDays(new Date(), 1))}
                  variant={isSameDay(selectedDate, addDays(new Date(), 1)) ? 'filled' : 'outlined'}
                />
                <Chip 
                  label="Next Week" 
                  onClick={() => setSelectedDate(addDays(new Date(), 7))}
                  variant={isSameDay(selectedDate, addDays(new Date(), 7)) ? 'filled' : 'outlined'}
                />
              </Box>
            </Box>
          </Paper>

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {dateTasks.length} {dateTasks.length === 1 ? 'task' : 'tasks'}
                </Typography>
              </Box>
              
              {dateTasks.length > 0 ? (
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                  {dateTasks.map((task) => (
                    <React.Fragment key={task.id}>
                      <ListItem 
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          bgcolor: task.completed ? 'action.hover' : 'background.paper',
                          opacity: task.completed ? 0.7 : 1,
                          textDecoration: task.completed ? 'line-through' : 'none',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <Checkbox
                          edge="start"
                          checked={task.completed}
                          tabIndex={-1}
                          disableRipple
                          onChange={() => toggleTaskCompletion(task)}
                        />
                        <ListItemText 
                          primary={
                            <Typography 
                              variant="subtitle1" 
                              sx={{
                                textDecoration: task.completed ? 'line-through' : 'none',
                                color: task.completed ? 'text.secondary' : 'text.primary',
                              }}
                            >
                              {task.title}
                            </Typography>
                          }
                          secondary={
                            <>
                              {task.description && (
                                <Typography 
                                  component="span"
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{
                                    textDecoration: task.completed ? 'line-through' : 'none',
                                    display: 'block',
                                    mb: 0.5
                                  }}
                                >
                                  {task.description}
                                </Typography>
                              )}
                              {task.time && (
                                <Chip 
                                  label={task.time} 
                                  size="small" 
                                  sx={{ mt: 0.5, mr: 1 }}
                                />
                              )}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            aria-label="edit" 
                            onClick={() => {
                              setEditingTask(task);
                              setOpenAddTask(true);
                            }}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            edge="end" 
                            aria-label="delete"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider component="li" variant="inset" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    p: 4, 
                    border: '2px dashed', 
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    No tasks for this day
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    onClick={() => setOpenAddTask(true)}
                    startIcon={<AddIcon />}
                  >
                    Add your first task
                  </Button>
                </Box>
              )}
            </Paper>
          </Box>

          <AddTaskDialog
            open={openAddTask}
            onClose={() => {
              setOpenAddTask(false);
              setEditingTask(null);
            }}
            onSave={(taskData) => {
              console.log('Saving task from dialog:', taskData);
              // Ensure we have the correct date format
              const taskToSave = {
                ...taskData,
                date: taskData.date || selectedDate
              };
              handleAddTask(taskToSave);
            }}
            selectedDate={selectedDate}
            task={editingTask}
          />

          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}

export default CalendarScreen;

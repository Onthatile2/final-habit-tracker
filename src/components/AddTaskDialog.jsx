import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
  FormControlLabel,
  Checkbox,
  Chip,
  Stack,
  useTheme,
  Typography
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isToday, isTomorrow, addDays, isSameDay } from 'date-fns';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TodayIcon from '@mui/icons-material/Today';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

const TASK_TYPES = [
  { value: 'task', label: 'Task', color: 'primary' },
  { value: 'meeting', label: 'Meeting', color: 'secondary' },
  { value: 'reminder', label: 'Reminder', color: 'warning' },
  { value: 'event', label: 'Event', color: 'success' },
];

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'On weekdays' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

function AddTaskDialog({ open, onClose, onSave, selectedDate, task }) {
  const theme = useTheme();
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [taskType, setTaskType] = useState(task?.type || 'task');
  const [dueDate, setDueDate] = useState(task?.date ? new Date(task.date) : selectedDate);
  const [time, setTime] = useState(task?.time || null);
  const [isAllDay, setIsAllDay] = useState(task?.allDay || false);
  const [recurrence, setRecurrence] = useState(task?.recurrence || 'none');
  const [errors, setErrors] = useState({});
  
  // Reset form when task prop changes (for edit mode)
  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setTaskType(task.type || 'task');
        setDueDate(task.date ? new Date(task.date) : selectedDate);
        setTime(task.time || null);
        setIsAllDay(task.allDay || false);
        setRecurrence(task.recurrence || 'none');
      } else {
        setTitle('');
        setDescription('');
        setTaskType('task');
        setDueDate(selectedDate);
        setTime(null);
        setIsAllDay(false);
        setRecurrence('none');
      }
      setErrors({});
    }
  }, [open, task, selectedDate]);

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!taskType) newErrors.taskType = 'Please select a task type';
    if (!isAllDay && !time) newErrors.time = 'Please select a time or mark as all-day';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleDateChange = (newDate) => {
    setDueDate(newDate);
  };
  
  const handleQuickDateSelect = (daysToAdd) => {
    const newDate = addDays(new Date(), daysToAdd);
    setDueDate(newDate);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      const taskData = {
        ...(task?.id && { id: task.id }), // Include ID if editing
        title: title.trim(),
        description: description.trim(),
        type: taskType,
        date: dueDate,
        time: isAllDay ? null : time,
        allDay: isAllDay,
        recurrence: recurrence === 'none' ? 'none' : recurrence,
        priority: 'medium', // Add default priority
        completed: task?.completed || false,
        createdAt: task?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('Saving task data:', taskData);
      
      try {
        // Call onSave and wait for it to complete
        await onSave(taskData);
        // Only close the dialog after successful save
        onClose();
      } catch (error) {
        console.error('Error saving task:', error);
        // The error will be handled by the parent component's error handling
      }
    }
  };

  const isEditMode = !!task?.id;
  const selectedTaskType = TASK_TYPES.find(type => type.value === taskType) || TASK_TYPES[0];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          [theme.breakpoints.down('sm')]: {
            margin: 1,
            width: '100%',
          },
        },
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: `1px solid ${theme.palette.divider}`,
        pb: 1.5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            bgcolor: `${selectedTaskType.color}.main`,
            mr: 1 
          }} />
          <Typography variant="h6" component="span">
            {isEditMode ? 'Edit Task' : 'Add New Task'}
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          size="small"
          aria-label="Close dialog"
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Task Title */}
            <TextField
              id="task-title"
              name="taskTitle"
              label="Task Title"
              fullWidth
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              size="medium"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
              inputProps={{
                'aria-label': 'Task title',
              }}
              autoFocus
            />
            
            {/* Task Description */}
            <TextField
              id="task-description"
              name="taskDescription"
              label="Description (Optional)"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              size="medium"
              sx={{
                mt: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
              inputProps={{
                'aria-label': 'Task description',
              }}
            />
            
            {/* Task Type */}
            <FormControl fullWidth margin="normal" error={!!errors.taskType}>
              <InputLabel id="task-type-label" htmlFor="task-type">Task Type</InputLabel>
              <Select
                labelId="task-type-label"
                id="task-type"
                name="taskType"
                value={taskType}
                label="Task Type"
                onChange={(e) => setTaskType(e.target.value)}
                sx={{
                  borderRadius: 2,
                }}
                inputProps={{
                  'aria-labelledby': 'task-type-label'
                }}
              >
                {TASK_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box 
                        sx={{ 
                          width: 10, 
                          height: 10, 
                          borderRadius: '50%', 
                          bgcolor: `${type.color}.main`
                        }}
                        aria-hidden="true"
                      />
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.taskType && (
                <FormHelperText>{errors.taskType}</FormHelperText>
              )}
            </FormControl>

            {/* Date & Time Selection */}
            <Box sx={{ mt: 1 }}>
              <Typography id="datetime-group-label" variant="subtitle2" color="text.secondary" gutterBottom>
                Date & Time
              </Typography>
              <div role="group" aria-labelledby="datetime-group-label" id="datetime-group">
              
              {/* Quick Date Selection */}
              <Stack 
                direction="row" 
                spacing={1} 
                sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
                role="group"
                aria-label="Quick date selection"
              >
                <Chip 
                  icon={<TodayIcon />} 
                  label="Today" 
                  onClick={() => handleQuickDateSelect(0)}
                  variant={isToday(dueDate) ? 'filled' : 'outlined'}
                  color={isToday(dueDate) ? 'primary' : 'default'}
                  size="small"
                  component="button"
                  type="button"
                  id="today-btn"
                  aria-label="Select today's date"
                  aria-pressed={isToday(dueDate)}
                />
                <Chip 
                  icon={<EventAvailableIcon />} 
                  label="Tomorrow" 
                  onClick={() => handleQuickDateSelect(1)}
                  variant={isTomorrow(dueDate) ? 'filled' : 'outlined'}
                  color={isTomorrow(dueDate) ? 'primary' : 'default'}
                  size="small"
                  component="button"
                  type="button"
                  id="tomorrow-btn"
                  aria-label="Select tomorrow's date"
                  aria-pressed={isTomorrow(dueDate)}
                />
                <Chip 
                  icon={<EventAvailableIcon />} 
                  label="Next Week" 
                  onClick={() => handleQuickDateSelect(7)}
                  variant={isSameDay(dueDate, addDays(new Date(), 7)) ? 'filled' : 'outlined'}
                  color={isSameDay(dueDate, addDays(new Date(), 7)) ? 'primary' : 'default'}
                  size="small"
                  component="button"
                  type="button"
                  aria-label="Select date one week from now"
                  aria-pressed={isSameDay(dueDate, addDays(new Date(), 7))}
                />
              </Stack>
              
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <DateTimePicker
                    label="Date"
                    value={dueDate}
                    onChange={handleDateChange}
                    slotProps={{
                      textField: (params) => ({
                        ...params,
                        id: "task-due-date",
                        name: "taskDueDate",
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        },
                        'aria-labelledby': 'date-time-label',
                        inputProps: {
                          'aria-label': 'Select task due date',
                        },
                      }),
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={isAllDay}
                          onChange={(e) => setIsAllDay(e.target.checked)}
                          color="primary"
                          inputProps={{
                            'aria-label': 'All day event',
                            'aria-checked': isAllDay
                          }}
                        />
                      }
                      label="All day"
                      sx={{ mr: 0, minWidth: 'fit-content' }}
                      componentsProps={{
                        typography: {
                          component: 'span'
                        }
                      }}
                      aria-label="All day event"
                    />
                    
                    {!isAllDay && (
                      <TimePicker
                        label="Time"
                        value={time || dueDate}
                        onChange={(newTime) => setTime(newTime)}
                        slotProps={{
                          textField: (params) => ({
                            ...params,
                            id: "task-time",
                            name: "taskTime",
                            sx: {
                              minWidth: 120,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              },
                            },
                            error: !!errors.time,
                            helperText: errors.time,
                            'aria-labelledby': 'time-label',
                            inputProps: {
                              'aria-label': 'Select task time',
                            },
                          })
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </LocalizationProvider>
              </div>
            </Box>
            
            {/* Recurrence */}
            <FormControl fullWidth margin="normal">
              <InputLabel id="recurrence-label">Recurrence</InputLabel>
              <Select
                labelId="recurrence-label"
                id="recurrence"
                name="recurrence"
                value={recurrence}
                label="Recurrence"
                onChange={(e) => setRecurrence(e.target.value)}
                sx={{
                  borderRadius: 2,
                }}
                inputProps={{
                  'id': 'recurrence-select',
                  'name': 'recurrence',
                  'aria-labelledby': 'recurrence-label',
                }}
              >
                {RECURRENCE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button 
            onClick={onClose} 
            color="inherit"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            size="large"
            sx={{ 
              borderRadius: 2, 
              px: 4,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
              },
            }}
          >
            {isEditMode ? 'Update Task' : 'Add Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default AddTaskDialog;

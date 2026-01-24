'use client';

import { useState, useEffect } from 'react';
import { RootState } from '@/lib/store';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { TaskData } from '@/lib/types';
import { useNotifications } from '@/lib/hooks/useNotifications';
import NotificationSettings from '@/components/NotificationSettings';
// 1. Title -
// 2. Descriptions -
// 3. Associated Friends[] -
// 4. Task frequency - days | week
// 5. Reminder - If week  - get (day && time)
//            If month - get date and time
//            If date  - get time.
// 6. Accomplish Value - count [unit]/ selcted frequency
// 7. Task Active timeline - 

interface TaskFormProps {
  mode: 'create' | 'edit';
  taskId: string;
};

let modelData: {
  title?: string;
  units?: string[];
  default_target?: Record<string, number>;
  type?: string;
  color?: string;
  icon?: string;
  measurable?: boolean;
} = {};

// Helper function to convert 12-hour format to 24-hour format for HTML inputs
const convertTo24Hour = (timeString: string): string => {
  if (!timeString) return '';
  
  // If already in 24-hour format (HH:MM), return as-is
  if (/^\d{1,2}:\d{2}$/.test(timeString)) {
    return timeString;
  }
  
  // Handle 12-hour format (e.g., "11:31 PM" or "11:31PM")
  const match = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let [, hours, minutes, period] = match;
    let hour24 = parseInt(hours);
    
    if (period.toUpperCase() === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  }
  
  // Return as-is if format not recognized
  return timeString;
};

// Helper function to convert 24-hour format to 12-hour format for display/storage
const convertTo12Hour = (timeString: string): string => {
  if (!timeString) return '';
  
  const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let [, hours, minutes] = match;
    let hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    
    if (hour === 0) {
      hour = 12;
    } else if (hour > 12) {
      hour -= 12;
    }
    
    return `${hour}:${minutes} ${period}`;
  }
  
  return timeString;
};

const TaskForm: React.FC<TaskFormProps> = ({ mode, taskId }) => {
  const session = useSelector((state: RootState) => state.session.session);
  const user = useSelector((state: RootState) => state.session.user);
  const tasks = useSelector((state: RootState) => state.tasks.taskmeta);
  const router = useRouter();
  const { scheduleTaskReminder, permission } = useNotifications();

  const [task, setTask] = useState<TaskData>({
    id: '',
    from_date: new Date().toISOString().split('T')[0],
    to_date: null,
    task_frequency: 'DAILY',
    reminder_day: '',
    reminder_time: '',
    prefered_start_time: null,
    prefered_end_time: null,
    tags: [],
    friends: [],
    description: '',
    unit: '',
    value: 0,
    task: ''
  });

  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationScheduled, setNotificationScheduled] = useState(false);

  const handleInputChange = ((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTag(e.target.value);
  });

  const handleEnterKeyInputSave = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  const loadDetails = async (id: string) => {
    setLoading(true);
    const response = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, { credentials: 'include' });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      console.error('Error fetching task:', payload?.error || 'Unknown error');
      setLoading(false);
      return;
    }

    const data = payload?.data;

    const selectedTask = tasks.find(task => task.id === data.task_id);  
    modelData = {
      title: selectedTask?.task ?? '',
      units: selectedTask?.units ?? [],
      default_target: selectedTask?.default_target ?? {},
      type: selectedTask?.type ?? '',
      color: selectedTask?.color ?? '',
      icon: selectedTask?.icon ?? '',
      measurable: selectedTask?.measurable ?? false,
    }
    setIsReminderEnabled(!!data.reminder_time);
    if (data) {
      // Extract metadata from tags if it exists (workaround for schema mismatch)
      let taskData = { ...data };
      
      if (data.tags && Array.isArray(data.tags)) {
        const metadataTag = data.tags.find((tag: string) => tag.startsWith('__metadata__:'));
        if (metadataTag) {
          try {
            const metadata = JSON.parse(metadataTag.replace('__metadata__:', ''));
            // Merge metadata back into taskData
            taskData = { ...taskData, ...metadata };
            // Remove the metadata tag from the tags array
            taskData.tags = data.tags.filter((tag: string) => !tag.startsWith('__metadata__:'));
          } catch (e) {
            console.warn('Failed to parse metadata from tags:', e);
          }
        }
      }
      
      // Time fields are now stored as TEXT - handle both formats
      // Convert 12-hour format to 24-hour for HTML time inputs if needed
      if (taskData.prefered_start_time && typeof taskData.prefered_start_time === 'string') {
        taskData.prefered_start_time = convertTo24Hour(taskData.prefered_start_time);
      }
      
      if (taskData.prefered_end_time && typeof taskData.prefered_end_time === 'string') {
        taskData.prefered_end_time = convertTo24Hour(taskData.prefered_end_time);
      }
      
      if (taskData.reminder_time && typeof taskData.reminder_time === 'string') {
        taskData.reminder_time = convertTo24Hour(taskData.reminder_time);
      }
      
      setTask(taskData);
    } else {
      console.warn('No task data found in this taskId.');
    }
    setLoading(false);
  }
  const setDetails = async (id: string ) => {
    const selectedTask = tasks.find(task => task.id === id);    
    setTask({
      id: '',
      task: '',
      from_date: new Date().toISOString().split('T')[0],
      to_date: null,
      task_frequency: 'DAILY',
      reminder_day: '',
      reminder_time: getTime(),
      prefered_start_time: null,
      prefered_end_time: null,
      tags: [],
      friends: [],
      description: '',
      unit: selectedTask?.units[0] ?? '',
      value: selectedTask?.default_target[selectedTask?.units[0]] ?? 0,
    });    
    modelData = {
      title: selectedTask?.task ?? '',
      units: selectedTask?.units ?? [],
      default_target: selectedTask?.default_target ?? {},
      type: selectedTask?.type ?? '',
      color: selectedTask?.color ?? '',
      icon: selectedTask?.icon ?? '',
      measurable: selectedTask?.measurable ?? false,
    }
  }
  useEffect(() => {    
    if (mode === 'create') {
      setDetails(taskId);
    } else if (mode === 'edit' && taskId) {
      loadDetails(taskId);
    }    
  }, [taskId, mode, modelData.title]); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!isReminderEnabled) {
      task.reminder_time = '';
      task.reminder_day = '';
    }
    delete task.task;
    if (mode === 'create') {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...task,
            task_id: taskId,
            // Convert times to 12-hour format for storage
            prefered_start_time: task.prefered_start_time ? convertTo12Hour(task.prefered_start_time) : '',
            prefered_end_time: task.prefered_end_time ? convertTo12Hour(task.prefered_end_time) : '',
            reminder_time: task.reminder_time ? convertTo12Hour(task.reminder_time) : '',
          }),
        });
        const data = await response.json().catch((error) => console.error(error));
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to create task');
        }
        
        // Schedule notifications and calendar events
        const createdTaskId = data?.data?.id;
        const taskWithId = { ...task, id: createdTaskId, task_id: taskId };
        
        try {
          const results = await scheduleTaskReminder(taskWithId);
          setNotificationScheduled(results.notification || results.calendar);
          
          if (results.notification) {
            console.log('✅ Notification scheduled successfully');
          }
          if (results.calendar) {
            console.log('📅 Calendar event created successfully');
          }
        } catch (error) {
          console.error('Failed to schedule reminders:', error);
        }
        if (createdTaskId) {
          router.push(`/?highlight=${createdTaskId}`);
        } else {
          router.push('/');
        }
        console.info('Task created successfully');
      } catch (error) {
        console.error('Error creating task:', error.message);
      }
    } else {
      try {
        const response = await fetch('/api/tasks', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...task,
            task_id: taskId,
            // Convert times to 12-hour format for storage
            prefered_start_time: task.prefered_start_time ? convertTo12Hour(task.prefered_start_time) : '',
            prefered_end_time: task.prefered_end_time ? convertTo12Hour(task.prefered_end_time) : '',
            reminder_time: task.reminder_time ? convertTo12Hour(task.reminder_time) : '',
          }),
        });
        const data = await response.json().catch((error) => console.error(error));
        const createdTaskId = data?.data?.id;
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to update task');
        }
        router.push(`/?highlight=${createdTaskId}`);
        console.info('Task updated successfully');
      } catch (error) {
        console.error('Error updating task:', error.message);
      }
    }
  };  

  const addTag = () => {
    if (newTag && !task.tags.includes(newTag)) {
      setTask(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      setNewTag('');
    }
  };

  const getTime = () => {
    const date = new Date();
    const hours = date.getHours();
    if (hours < 10) {
      return `0${hours}:00`;
    }
    return `${hours}:00`;
  };

  const deleteTask = async () => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to delete task');
      }
      router.push('/add-task');
    } catch (error) {
      console.error('Error deleting task:', (error as any)?.message || 'Unknown error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="lg:w-1/2 flex-1 lg:flex-none ">
      <div className="lg:rounded-lg shadow-lg p-8 flex flex-col h-full">
        <h1 className="font-bold mb-6 text-gray-900 dark:text-white mb-[40px]">
          Task - {modelData.title}
        </h1>

        <div className="flex flex-col gap-8 flex-1">
          {/* Task Frequency */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Task Frequency
            </label>
            <div className="flex gap-2"> 
              <select
                id="task_frequency"
                className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white basis-1/2"              
                value={task.task_frequency || 'DAILY'}
                onChange={e => setTask(prev => ({ ...prev, task_frequency: e.target.value as 'DAILY' | 'WEEKLY' }))}>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
              </select>
              {/* measurable value */}
              {modelData.measurable &&
                <>
                  <input
                    type="number"
                    id="value"
                    value={task.value}
                    step="any"
                    onChange={e => setTask(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    placeholder="Value"
                    min={0}
                    className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white basis-1/4"
                  />
                  <select
                    id="unit"
                    className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white basis-1/4"                
                    value={task.unit}
                    onChange={e => {
                      const newUnit = e.target.value;
                      setTask(prev => ({
                        ...prev,
                        unit: newUnit,
                        value: modelData.default_target?.[newUnit] || 0
                      } as TaskData));
                    }}>
                      {modelData.units.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                  </select>
                </>
              }
            </div>
          </div>
          {/* Date Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                From Date
              </label>
              <input
                type="date"
                value={task.from_date}
                onChange={e => setTask(prev => ({ ...prev, from_date: e.target.value }))}
                className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                To Date
              </label>
              <input
                type="date"
                value={task.to_date}
                onChange={e => setTask(prev => ({ ...prev, to_date: e.target.value }))}
                className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          {/* Prefered time */}
          <div className="w-full space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mr-[40px]">
              Prefered time
            </label>
            <div className="flex flex-row gap-4">
              <input
                type="time"
                value={task.prefered_start_time}
                onChange={e => setTask(prev => ({ ...prev, prefered_start_time: e.target.value }))}
                className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
              />
              <input
                type="time"
                value={task.prefered_end_time}
                onChange={e => setTask(prev => ({ ...prev, prefered_end_time: e.target.value }))}
                className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          {/* Reminder section */}
          <div className="space-y-2 flex mt-4">
            <input
              type="checkbox"
              checked={isReminderEnabled}
              onChange={e => setIsReminderEnabled(e.target.checked)}
              className="w-5 h-5"
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 ms-2" style={{ marginTop: '0px' }}>
              Enable Reminder
            </label>
          </div>
          {isReminderEnabled && (
            <div className="flex flex-col md:flex-row items-center gap-6">
              {task.task_frequency === 'WEEKLY' && (
                <div className="space-y-2 w-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Which day we need to remind you
                  </label>
                  <select
                  id="reminder_day"
                  className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"                value={task.reminder_day || ''}
                  onChange={e => setTask(prev => ({ ...prev, reminder_day: e.target.value as TaskData['reminder_day'] }))}>
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="FRIDAY">Friday</option>
                    <option value="SATURDAY">Saturday</option>
                    <option value="SUNDAY">Sunday</option>
                  </select>
                </div>
              )}
              <div className="space-y-2 w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mr-[40px]">
                Time
                </label>
                <input
                  type="time"
                  value={task.reminder_time} // Default time set to 08:00 if reminder_time is not set
                  onChange={e => setTask(prev => ({ ...prev, reminder_time: e.target.value }))}
                  className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          )}
          {/* Description */}
          <div className="space-y-2 flex items-center row">
            <textarea
              id="description"
              value={task.description}
              onChange={e => setTask(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Task description"
              rows={1}
              className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
            />
          </div>
          {/* Tags Section */}
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-full flex gap-2">
                <input
                type="text"
                value={newTag}
                onChange={handleInputChange}
                onKeyDown={handleEnterKeyInputSave}
                placeholder="Add tag"
                className="w-full input p-2 bg-inherit border border-t-0 border-l-0 border-r-0 rounded-none dark:border-gray-600 dark:text-white"
                />
                <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                Add
                </button>
              </div>
            </div>
          <div className="flex flex-wrap gap-2">
            {task.tags.map(tag => (
              <span 
                key={tag} 
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setTask(prev => ({
                    ...prev,
                    tags: prev.tags.filter(t => t !== tag)
                  }))}
                  className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Notification & Calendar Settings */}
        {(task.reminder_time || task.prefered_start_time || task.prefered_end_time) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                📱 Notifications & Calendar
              </h3>
              <button
                type="button"
                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showNotificationSettings ? 'Hide Settings' : 'Configure'}
              </button>
            </div>
            
            {showNotificationSettings && (
              <NotificationSettings 
                onPermissionGranted={() => setShowNotificationSettings(false)}
                showCalendarOptions={!!(task.prefered_start_time && task.prefered_end_time)}
              />
            )}
            
            {!showNotificationSettings && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  {task.reminder_time && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span>🔔</span>
                      <span>Reminder at {task.reminder_time}</span>
                      {permission !== 'granted' && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">(needs permission)</span>
                      )}
                    </div>
                  )}
                  {task.prefered_start_time && task.prefered_end_time && (
                    <div className="flex items-center space-x-2">
                      <span>📅</span>
                      <span>Calendar: {task.prefered_start_time} - {task.prefered_end_time}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {notificationScheduled && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="text-sm text-green-800 dark:text-green-200">
                  ✅ Reminders have been set up for this habit!
                </div>
              </div>
            )}
          </div>
        )}

          <div className="flex flex-row gap-4 mt-auto pb-4">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              {mode === 'create' ? 'Create Task' : 'Update Task'}
            </button>
            {mode === 'edit' && (
              <button
                type="button"
                className="w-full py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                onClick={deleteTask}
            >
                Delete Task
              </button>
            )}
          </div>
          
        </div>
      </div>
    </form>
  );
}

export default TaskForm;


import { useState, useEffect, useCallback } from 'react';
import { NotificationManager, CalendarManager, CalendarEvent, createDateTime } from '../notifications';

export interface UseNotificationsReturn {
  // Notification state
  isSupported: boolean;
  permission: 'granted' | 'denied' | 'default';
  isLoading: boolean;
  
  // Notification methods
  requestPermission: () => Promise<boolean>;
  scheduleReminder: (title: string, body: string, scheduledTime: Date, taskId?: string) => Promise<boolean>;
  showNotification: (title: string, body: string, taskId?: string) => Promise<boolean>;
  
  // Calendar methods
  addToCalendar: (event: CalendarEvent) => void;
  openCalendarApp: (event: CalendarEvent) => Promise<boolean>;
  
  // Utility methods
  scheduleTaskReminder: (task: any) => Promise<{ notification: boolean; calendar: boolean }>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [isLoading, setIsLoading] = useState(false);
  
  const notificationManager = NotificationManager.getInstance();
  const calendarManager = new CalendarManager();

  // Initialize on mount
  useEffect(() => {
    const supported = notificationManager.isNotificationSupported();
    setIsSupported(supported);
    
    if (supported) {
      const currentPermission = notificationManager.getNotificationPermission();
      setPermission(currentPermission.granted ? 'granted' : 
                   currentPermission.denied ? 'denied' : 'default');
      
      // Register service worker
      notificationManager.registerServiceWorker();
      
      // Check pending notifications
      notificationManager.checkPendingNotifications();
    }
  }, []);

  // Listen for service worker messages
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        const { type, taskId, date } = event.data;
        
        switch (type) {
          case 'MARK_TASK_COMPLETE':
            // Handle task completion from notification
            handleTaskCompletion(taskId, date);
            break;
          case 'NAVIGATE_TO_TASK':
            // Handle navigation from notification
            window.location.href = `/?task=${taskId}`;
            break;
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  const handleTaskCompletion = async (taskId: string, date: string) => {
    try {
      // Call your API to mark task as complete
      await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId, date, value: 1 }),
      });
      
      // Show success notification
      await showNotification('Task Completed!', 'Great job on completing your habit!');
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    setIsLoading(true);
    try {
      const result = await notificationManager.requestNotificationPermission();
      setPermission(result.granted ? 'granted' : 
                   result.denied ? 'denied' : 'default');
      return result.granted;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const scheduleReminder = useCallback(async (
    title: string,
    body: string,
    scheduledTime: Date,
    taskId?: string
  ): Promise<boolean> => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }
    
    return notificationManager.scheduleNotification(title, body, scheduledTime, taskId);
  }, [permission, requestPermission]);

  const showNotification = useCallback(async (
    title: string,
    body: string,
    taskId?: string
  ): Promise<boolean> => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }
    
    return notificationManager.showNotification(title, body, taskId);
  }, [permission, requestPermission]);

  const addToCalendar = useCallback((event: CalendarEvent): void => {
    calendarManager.createCalendarEvent(event);
  }, []);

  const openCalendarApp = useCallback(async (event: CalendarEvent): Promise<boolean> => {
    return calendarManager.openCalendarApp(event);
  }, []);

  const scheduleTaskReminder = useCallback(async (task: any): Promise<{ notification: boolean; calendar: boolean }> => {
    const results = { notification: false, calendar: false };
    
    try {
      // Parse task data
      const {
        description,
        prefered_start_time,
        prefered_end_time,
        reminder_time,
        from_date,
        task_frequency,
        value,
        unit
      } = task;

      const taskTitle = description || 'Habit Reminder';
      const today = new Date().toISOString().split('T')[0];
      const taskDate = from_date || today;

      // Schedule notification if reminder_time is set
      if (reminder_time) {
        const reminderDateTime = createDateTime(taskDate, reminder_time);
        let notificationBody = `Time for your ${task_frequency.toLowerCase()} habit: ${taskTitle}`;
        
        if (value && unit) {
          notificationBody += ` (${value} ${unit})`;
        }

        results.notification = await scheduleReminder(
          '🔔 Habit Reminder',
          notificationBody,
          reminderDateTime,
          task.id
        );
      }

      // Add to calendar if preferred times are set
      if (prefered_start_time && prefered_end_time) {
        const startDateTime = createDateTime(taskDate, prefered_start_time);
        const endDateTime = createDateTime(taskDate, prefered_end_time);
        
        const calendarEvent: CalendarEvent = {
          title: `📋 ${taskTitle}`,
          description: `${task_frequency} habit: ${taskTitle}${value && unit ? ` (${value} ${unit})` : ''}`,
          startTime: startDateTime,
          endTime: endDateTime,
          reminder: reminder_time ? 15 : undefined // 15 minutes before if reminder is set
        };

        try {
          // Try to open calendar app first (better UX on mobile)
          results.calendar = await openCalendarApp(calendarEvent);
        } catch {
          // Fallback to ICS download
          addToCalendar(calendarEvent);
          results.calendar = true;
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to schedule task reminder:', error);
      return results;
    }
  }, [scheduleReminder, addToCalendar, openCalendarApp]);

  return {
    isSupported,
    permission,
    isLoading,
    requestPermission,
    scheduleReminder,
    showNotification,
    addToCalendar,
    openCalendarApp,
    scheduleTaskReminder
  };
};

export default useNotifications;

// Notification and Calendar Integration System
export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export interface CalendarEvent {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  reminder?: number; // minutes before event
}

export class NotificationManager {
  private static instance: NotificationManager;
  private swRegistration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Check if notifications are supported
  isNotificationSupported(): boolean {
    // More comprehensive browser support check
    const hasNotification = typeof window !== 'undefined' && 'Notification' in window;
    const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
    
    console.log('Notification support check:', {
      hasWindow: typeof window !== 'undefined',
      hasNotification,
      hasServiceWorker,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      notificationPermission: hasNotification ? Notification.permission : 'unavailable'
    });
    
    // Basic notification support (service worker is optional)
    return hasNotification;
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!this.isNotificationSupported()) {
      return { granted: false, denied: true, default: false };
    }

    const permission = await Notification.requestPermission();
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }

  // Get current notification permission status
  getNotificationPermission(): NotificationPermission {
    if (!this.isNotificationSupported()) {
      return { granted: false, denied: true, default: false };
    }

    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }

  // Register service worker for background notifications
  async registerServiceWorker(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // Schedule a notification
  async scheduleNotification(
    title: string,
    body: string,
    scheduledTime: Date,
    taskId?: string
  ): Promise<boolean> {
    const permission = this.getNotificationPermission();
    if (!permission.granted) {
      console.warn('Notification permission not granted');
      return false;
    }

    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      // Show notification immediately if time has passed
      return this.showNotification(title, body, taskId);
    }

    // Schedule notification using setTimeout (for short delays) or service worker
    if (delay <= 24 * 60 * 60 * 1000) { // Less than 24 hours
      setTimeout(() => {
        this.showNotification(title, body, taskId);
      }, delay);
      return true;
    } else {
      // For longer delays, store in localStorage and check on app start
      const notifications = this.getStoredNotifications();
      notifications.push({
        id: Date.now().toString(),
        title,
        body,
        scheduledTime: scheduledTime.toISOString(),
        taskId
      });
      localStorage.setItem('scheduledNotifications', JSON.stringify(notifications));
      return true;
    }
  }

  // Show immediate notification
  async showNotification(title: string, body: string, taskId?: string): Promise<boolean> {
    const permission = this.getNotificationPermission();
    if (!permission.granted) {
      console.log('Notification permission not granted');
      return false;
    }

    try {
      if (this.swRegistration) {
        // Use service worker for better reliability
        const notificationOptions: any = {
          body,
          icon: '/icon-192x192.png',
          badge: '/icon-72x72.png',
          tag: taskId || 'habit-reminder',
          requireInteraction: true,
          data: { taskId }
        };
        
        // Add actions if supported
        if ('actions' in Notification.prototype) {
          notificationOptions.actions = [
            {
              action: 'mark-complete',
              title: 'Mark Complete'
            },
            {
              action: 'snooze',
              title: 'Snooze 10min'
            }
          ];
        }
        
        await this.swRegistration.showNotification(title, notificationOptions);
        console.log('Notification shown via service worker');
      } else {
        // Fallback to basic notification
        const notification = new Notification(title, {
          body,
          icon: '/icon-192x192.png',
          tag: taskId || 'habit-reminder'
        });
        
        // Add click handler for basic notifications
        notification.onclick = () => {
          window.focus();
          notification.close();
          if (taskId) {
            // Navigate to task or trigger completion
            window.location.href = `/?task=${taskId}`;
          }
        };
        
        console.log('Notification shown via basic API');
      }
      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      
      // Ultimate fallback - browser alert (for debugging)
      if (typeof window !== 'undefined' && window.confirm) {
        const showAlert = window.confirm(`${title}\n\n${body}\n\nClick OK to view task.`);
        if (showAlert && taskId) {
          window.location.href = `/?task=${taskId}`;
        }
        return true;
      }
      
      return false;
    }
  }

  // Get stored notifications
  private getStoredNotifications(): any[] {
    try {
      const stored = localStorage.getItem('scheduledNotifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Check and trigger pending notifications
  checkPendingNotifications(): void {
    const notifications = this.getStoredNotifications();
    const now = new Date();
    const remaining: any[] = [];

    notifications.forEach((notification: any) => {
      const scheduledTime = new Date(notification.scheduledTime);
      if (scheduledTime <= now) {
        // Trigger notification
        this.showNotification(notification.title, notification.body, notification.taskId);
      } else {
        // Keep for later
        remaining.push(notification);
      }
    });

    // Update stored notifications
    localStorage.setItem('scheduledNotifications', JSON.stringify(remaining));
  }
}

// Calendar Integration
export class CalendarManager {
  // Check if device calendar access is available
  isCalendarSupported(): boolean {
    // Check for various calendar APIs
    return !!(
      // @ts-ignore - Calendar API is experimental
      window.navigator.calendar ||
      // Check if we're in a mobile webview that might support calendar
      this.isMobileDevice()
    );
  }

  private isMobileDevice(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Create calendar event (downloads .ics file)
  createCalendarEvent(event: CalendarEvent): void {
    const icsContent = this.generateICSContent(event);
    this.downloadICSFile(icsContent, `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`);
  }

  // Generate ICS (iCalendar) content
  private generateICSContent(event: CalendarEvent): string {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startTime = formatDate(event.startTime);
    const endTime = formatDate(event.endTime);
    const now = formatDate(new Date());

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Habit Tracker//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@habit-tracker.app`,
      `DTSTAMP:${now}`,
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:${event.title}`,
    ];

    if (event.description) {
      icsContent.push(`DESCRIPTION:${event.description}`);
    }

    if (event.location) {
      icsContent.push(`LOCATION:${event.location}`);
    }

    if (event.reminder) {
      icsContent.push('BEGIN:VALARM');
      icsContent.push('ACTION:DISPLAY');
      icsContent.push(`DESCRIPTION:${event.title} reminder`);
      icsContent.push(`TRIGGER:-PT${event.reminder}M`);
      icsContent.push('END:VALARM');
    }

    icsContent.push('END:VEVENT');
    icsContent.push('END:VCALENDAR');

    return icsContent.join('\r\n');
  }

  // Download ICS file
  private downloadICSFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  // Create Google Calendar URL (opens in browser/app)
  createGoogleCalendarURL(event: CalendarEvent): string {
    const formatGoogleDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startTime = formatGoogleDate(event.startTime);
    const endTime = formatGoogleDate(event.endTime);

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startTime}/${endTime}`,
      details: event.description || '',
      location: event.location || ''
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  // Open calendar app (tries multiple methods)
  async openCalendarApp(event: CalendarEvent): Promise<boolean> {
    try {
      // Method 1: Try Google Calendar URL (works on most devices)
      const googleURL = this.createGoogleCalendarURL(event);
      
      if (this.isMobileDevice()) {
        // On mobile, try to open native calendar app
        window.location.href = googleURL;
        return true;
      } else {
        // On desktop, open in new tab
        window.open(googleURL, '_blank');
        return true;
      }
    } catch (error) {
      console.error('Failed to open calendar app:', error);
      // Fallback: download ICS file
      this.createCalendarEvent(event);
      return false;
    }
  }
}

// Utility functions
export const formatTime12Hour = (time24: string): string => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${hour12}:${minutes} ${period}`;
};

export const parseTime12Hour = (time12: string): string => {
  if (!time12) return '';
  
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12; // Return as-is if not 12-hour format
  
  let [, hours, minutes, period] = match;
  let hour24 = parseInt(hours);
  
  if (period.toUpperCase() === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
    hour24 = 0;
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes}`;
};

// Create combined date-time from date and time strings
export const createDateTime = (dateStr: string, timeStr: string): Date => {
  const time24 = parseTime12Hour(timeStr) || timeStr;
  return new Date(`${dateStr}T${time24}:00`);
};

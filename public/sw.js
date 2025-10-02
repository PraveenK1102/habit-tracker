// Service Worker for Habit Tracker
// Handles background notifications and PWA functionality

const CACHE_NAME = 'habit-tracker-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'Habit Reminder',
    body: 'Time for your scheduled habit!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'habit-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'mark-complete',
        title: 'Mark Complete',
        icon: '/icon-check.png'
      },
      {
        action: 'snooze',
        title: 'Snooze 10min',
        icon: '/icon-snooze.png'
      },
      {
        action: 'view',
        title: 'View Task',
        icon: '/icon-view.png'
      }
    ]
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  event.waitUntil(
    (async () => {
      const clientList = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });

      // Find existing client or open new one
      let client = clientList.find(c => c.url.includes(self.location.origin));
      
      if (!client) {
        client = await clients.openWindow('/');
      } else {
        await client.focus();
      }

      // Handle different actions
      switch (action) {
        case 'mark-complete':
          // Send message to client to mark task complete
          if (client && notificationData.taskId) {
            client.postMessage({
              type: 'MARK_TASK_COMPLETE',
              taskId: notificationData.taskId,
              date: new Date().toISOString().split('T')[0]
            });
          }
          break;

        case 'snooze':
          // Schedule another notification in 10 minutes
          setTimeout(() => {
            self.registration.showNotification(event.notification.title, {
              ...event.notification,
              body: event.notification.body + ' (Snoozed)',
              tag: event.notification.tag + '-snoozed'
            });
          }, 10 * 60 * 1000); // 10 minutes
          break;

        case 'view':
        default:
          // Navigate to task or home page
          if (client && notificationData.taskId) {
            client.postMessage({
              type: 'NAVIGATE_TO_TASK',
              taskId: notificationData.taskId
            });
          }
          break;
      }
    })()
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event);
  
  if (event.tag === 'background-sync-tasks') {
    event.waitUntil(
      // Sync pending task completions when back online
      syncPendingTasks()
    );
  }
});

// Sync pending tasks function
async function syncPendingTasks() {
  try {
    // Get pending tasks from IndexedDB or localStorage
    const pendingTasks = await getPendingTasks();
    
    for (const task of pendingTasks) {
      try {
        // Attempt to sync with server
        await fetch('/api/tasks/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(task)
        });
        
        // Remove from pending if successful
        await removePendingTask(task.id);
      } catch (error) {
        console.error('Failed to sync task:', task.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for pending tasks (simplified)
async function getPendingTasks() {
  // In a real implementation, use IndexedDB
  try {
    const pending = localStorage.getItem('pendingTasks');
    return pending ? JSON.parse(pending) : [];
  } catch {
    return [];
  }
}

async function removePendingTask(taskId) {
  try {
    const pending = await getPendingTasks();
    const filtered = pending.filter(task => task.id !== taskId);
    localStorage.setItem('pendingTasks', JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove pending task:', error);
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync:', event);
  
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkScheduledReminders());
  }
});

// Check for scheduled reminders
async function checkScheduledReminders() {
  try {
    // This would typically fetch from your backend
    const response = await fetch('/api/reminders/check');
    const reminders = await response.json();
    
    const now = new Date();
    
    for (const reminder of reminders) {
      const reminderTime = new Date(reminder.scheduledTime);
      
      if (reminderTime <= now && !reminder.sent) {
        // Show notification
        await self.registration.showNotification(reminder.title, {
          body: reminder.body,
          icon: '/icon-192x192.png',
          badge: '/icon-72x72.png',
          tag: `reminder-${reminder.id}`,
          data: { taskId: reminder.taskId, reminderId: reminder.id }
        });
        
        // Mark as sent
        await fetch(`/api/reminders/${reminder.id}/mark-sent`, {
          method: 'POST'
        });
      }
    }
  } catch (error) {
    console.error('Failed to check reminders:', error);
  }
}

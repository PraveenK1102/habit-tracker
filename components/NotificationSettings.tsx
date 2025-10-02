'use client';

import React, { useState } from 'react';
import { Bell, BellOff, Calendar, Smartphone, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';

interface NotificationSettingsProps {
  onPermissionGranted?: () => void;
  showCalendarOptions?: boolean;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onPermissionGranted,
  showCalendarOptions = true
}) => {
  const {
    isSupported,
    permission,
    isLoading,
    requestPermission,
    showNotification
  } = useNotifications();

  const [testNotificationSent, setTestNotificationSent] = useState(false);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      onPermissionGranted?.();
      // Show a test notification
      await showNotification(
        '🎉 Notifications Enabled!',
        'You\'ll now receive reminders for your habits.'
      );
      setTestNotificationSent(true);
    }
  };

  const handleTestNotification = async () => {
    const success = await showNotification(
      '🧪 Test Notification',
      'This is how your habit reminders will look!'
    );
    if (success) {
      setTestNotificationSent(true);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
            Notifications Not Supported
          </h3>
        </div>
        <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
          Your browser doesn't support push notifications. You can still use calendar integration to set reminders.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Notification Permission Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {permission === 'granted' ? (
              <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Push Notifications
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {permission === 'granted' 
                  ? 'Enabled - You\'ll receive habit reminders'
                  : permission === 'denied'
                  ? 'Blocked - Enable in browser settings'
                  : 'Get notified when it\'s time for your habits'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {permission === 'granted' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <button
                  onClick={handleTestNotification}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  Test
                </button>
              </>
            ) : permission === 'denied' ? (
              <span className="text-sm text-red-600 dark:text-red-400">
                Blocked
              </span>
            ) : (
              <button
                onClick={handleRequestPermission}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Requesting...' : 'Enable'}
              </button>
            )}
          </div>
        </div>

        {testNotificationSent && (
          <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-700 dark:text-green-300">
            ✅ Test notification sent! Check your notification area.
          </div>
        )}
      </div>

      {/* Calendar Integration Section */}
      {showCalendarOptions && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Calendar Integration
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add your habits to your device calendar
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Smartphone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Mobile Devices
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Opens native calendar app
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Desktop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Downloads .ics calendar file
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
          How it works:
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Set a <strong>reminder time</strong> to get push notifications</li>
          <li>• Set <strong>preferred times</strong> to add events to your calendar</li>
          <li>• Notifications work even when the app is closed</li>
          <li>• Calendar events sync with your device's default calendar</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationSettings;

/**
 * Notification System Component
 *
 * Implements REQ-BUD-009: System shall provide alerts for cash shortfalls,
 * unusual spending patterns, budget threshold violations, and savings opportunities.
 */

import React, { useState, useEffect, useCallback } from 'react';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export const NotificationType = {
  SUCCESS: 'success' as const,
  INFO: 'info' as const,
  WARNING: 'warning' as const,
  ERROR: 'error' as const,
};

export type NotificationCategory = 'budget' | 'goal' | 'portfolio' | 'tax' | 'system';

export const NotificationCategory = {
  BUDGET: 'budget' as const,
  GOAL: 'goal' as const,
  PORTFOLIO: 'portfolio' as const,
  TAX: 'tax' as const,
  SYSTEM: 'system' as const,
};

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationSystemProps {
  maxNotifications?: number;
  autoHideDuration?: number; // milliseconds
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  maxNotifications = 5,
  autoHideDuration = 5000,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        })));
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    }

    // Listen for new notifications
    window.addEventListener('notification', handleNewNotification as EventListener);

    return () => {
      window.removeEventListener('notification', handleNewNotification as EventListener);
    };
  }, []);

  // Update unread count
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Save to localStorage whenever notifications change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const handleNewNotification = useCallback((event: CustomEvent<Notification>) => {
    const notification = event.detail;

    setNotifications(prev => {
      const updated = [notification, ...prev];
      // Keep only max notifications
      return updated.slice(0, maxNotifications);
    });

    // Auto-hide non-priority notifications
    if (notification.priority === 'low' && autoHideDuration) {
      setTimeout(() => {
        dismissNotification(notification.id);
      }, autoHideDuration);
    }
  }, [maxNotifications, autoHideDuration]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return '✓';
      case NotificationType.INFO:
        return 'ℹ';
      case NotificationType.WARNING:
        return '⚠';
      case NotificationType.ERROR:
        return '✕';
    }
  };

  const getColorForType = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return 'bg-green-50 border-green-200 text-green-800';
      case NotificationType.INFO:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case NotificationType.WARNING:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case NotificationType.ERROR:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No notifications</p>
                <p className="text-sm mt-2">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 transition-colors ${
                    notification.read ? 'bg-white' : 'bg-blue-50'
                  } hover:bg-gray-50`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getColorForType(notification.type)}`}>
                      {getIconForType(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {notification.actionLabel && notification.actionUrl && (
                          <a
                            href={notification.actionUrl}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {notification.actionLabel} →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format timestamp
function formatTimestamp(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return timestamp.toLocaleDateString();
}

// Helper function to create and dispatch notification
export function showNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
  const fullNotification: Notification = {
    ...notification,
    id: `${Date.now()}-${Math.random()}`,
    timestamp: new Date(),
    read: false,
  };

  const event = new CustomEvent('notification', { detail: fullNotification });
  window.dispatchEvent(event);
}

// Convenience functions for different notification types
export const notify = {
  success: (title: string, message: string, category: NotificationCategory = NotificationCategory.SYSTEM) => {
    showNotification({
      type: NotificationType.SUCCESS,
      category,
      title,
      message,
      priority: 'low',
    });
  },

  info: (title: string, message: string, category: NotificationCategory = NotificationCategory.SYSTEM) => {
    showNotification({
      type: NotificationType.INFO,
      category,
      title,
      message,
      priority: 'medium',
    });
  },

  warning: (title: string, message: string, category: NotificationCategory = NotificationCategory.SYSTEM, actionLabel?: string, actionUrl?: string) => {
    showNotification({
      type: NotificationType.WARNING,
      category,
      title,
      message,
      priority: 'high',
      actionLabel,
      actionUrl,
    });
  },

  error: (title: string, message: string, category: NotificationCategory = NotificationCategory.SYSTEM) => {
    showNotification({
      type: NotificationType.ERROR,
      category,
      title,
      message,
      priority: 'high',
    });
  },

  // Budget-specific notifications
  budgetAlert: (message: string, actionLabel?: string, actionUrl?: string) => {
    showNotification({
      type: NotificationType.WARNING,
      category: NotificationCategory.BUDGET,
      title: 'Budget Alert',
      message,
      priority: 'high',
      actionLabel,
      actionUrl,
    });
  },

  cashShortfall: (amount: number, month: string) => {
    showNotification({
      type: NotificationType.ERROR,
      category: NotificationCategory.BUDGET,
      title: 'Projected Cash Shortfall',
      message: `You may have a shortfall of $${amount.toLocaleString()} in ${month}`,
      priority: 'high',
      actionLabel: 'Review Budget',
      actionUrl: '/budget',
    });
  },

  savingsOpportunity: (amount: number, category: string) => {
    showNotification({
      type: NotificationType.INFO,
      category: NotificationCategory.BUDGET,
      title: 'Savings Opportunity',
      message: `You could save $${amount.toLocaleString()}/month by optimizing ${category}`,
      priority: 'medium',
      actionLabel: 'View Details',
      actionUrl: '/budget/analysis',
    });
  },

  unusualSpending: (category: string, percentageChange: number) => {
    showNotification({
      type: NotificationType.WARNING,
      category: NotificationCategory.BUDGET,
      title: 'Unusual Spending Pattern',
      message: `Your ${category} spending is ${percentageChange}% higher than usual`,
      priority: 'high',
      actionLabel: 'Review Transactions',
      actionUrl: '/budget/transactions',
    });
  },
};

export default NotificationSystem;

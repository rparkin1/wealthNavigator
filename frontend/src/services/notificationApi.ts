/**
 * Notification API Service
 *
 * Handles communication with backend notification endpoints
 */

import { NotificationType, NotificationCategory, Notification } from '../components/common/NotificationSystem';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface NotificationPreferences {
  budget_alerts: boolean;
  goal_milestones: boolean;
  portfolio_alerts: boolean;
  tax_opportunities: boolean;
  system_notifications: boolean;
  email_notifications: boolean;
}

export interface CreateNotificationRequest {
  user_id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  action_label?: string;
  action_url?: string;
}

/**
 * Fetch notifications for a user
 */
export const fetchNotifications = async (
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
    category?: NotificationCategory;
  }
): Promise<Notification[]> => {
  try {
    const params = new URLSearchParams();
    if (options?.unreadOnly) params.append('unread_only', 'true');
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.category) params.append('category', options.category);

    const response = await fetch(
      `${API_BASE_URL}/api/v1/notifications/${userId}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform backend format to frontend format
    return data.notifications.map((n: any) => ({
      id: n.id,
      type: n.type as NotificationType,
      category: n.category as NotificationCategory,
      title: n.title,
      message: n.message,
      timestamp: new Date(n.created_at),
      read: n.read,
      actionLabel: n.action_label,
      actionUrl: n.action_url,
      priority: n.priority,
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/notifications/${notificationId}/read`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to mark notification as read: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (
  userId: string
): Promise<void> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/notifications/${userId}/read-all`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (
  notificationId: string
): Promise<void> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/notifications/${notificationId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete notification: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Create a new notification
 */
export const createNotification = async (
  request: CreateNotificationRequest
): Promise<Notification> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/notifications`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create notification: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      type: data.type as NotificationType,
      category: data.category as NotificationCategory,
      title: data.title,
      message: data.message,
      timestamp: new Date(data.created_at),
      read: false,
      actionLabel: data.action_label,
      actionUrl: data.action_url,
      priority: data.priority,
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async (
  userId: string
): Promise<NotificationPreferences> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/notifications/${userId}/preferences`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch notification preferences: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    // Return defaults on error
    return {
      budget_alerts: true,
      goal_milestones: true,
      portfolio_alerts: true,
      tax_opportunities: true,
      system_notifications: true,
      email_notifications: false,
    };
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/notifications/${userId}/preferences`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update notification preferences: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

/**
 * Poll for new notifications
 * Call this periodically (e.g., every 30 seconds) to check for new notifications
 */
export const pollNotifications = async (
  userId: string,
  lastFetchTimestamp?: number
): Promise<Notification[]> => {
  try {
    const params = new URLSearchParams();
    params.append('unread_only', 'true');
    if (lastFetchTimestamp) {
      params.append('since', lastFetchTimestamp.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/notifications/${userId}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to poll notifications: ${response.statusText}`);
    }

    const data = await response.json();

    return data.notifications.map((n: any) => ({
      id: n.id,
      type: n.type as NotificationType,
      category: n.category as NotificationCategory,
      title: n.title,
      message: n.message,
      timestamp: new Date(n.created_at),
      read: false,
      actionLabel: n.action_label,
      actionUrl: n.action_url,
      priority: n.priority,
    }));
  } catch (error) {
    console.error('Error polling notifications:', error);
    return [];
  }
};

export default {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  pollNotifications,
};

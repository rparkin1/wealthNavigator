# Notification API Documentation

## Overview

The Notification API provides endpoints for managing in-app notifications, user preferences, and real-time alerts for budget, goals, portfolio, and tax events.

**Base URL:** `/api/v1/notifications`

---

## Endpoints

### 1. Fetch User Notifications

**GET** `/api/v1/notifications/{user_id}`

Retrieve notifications for a specific user with optional filtering.

**Path Parameters:**
- `user_id` (string, required): User identifier

**Query Parameters:**
- `unread_only` (boolean, optional): Filter for unread notifications only (default: false)
- `limit` (integer, optional): Maximum number of notifications to return (default: 50, max: 100)
- `category` (string, optional): Filter by notification category (`budget`, `goal`, `portfolio`, `tax`, `system`)
- `since` (integer, optional): Unix timestamp to fetch notifications created after this time

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif-123",
      "user_id": "user-456",
      "type": "warning",
      "category": "budget",
      "title": "Budget Alert",
      "message": "You may have a shortfall of $500 in March",
      "priority": "high",
      "read": false,
      "action_label": "Review Budget",
      "action_url": "/budget",
      "created_at": "2025-01-08T10:30:00Z"
    }
  ],
  "total": 1,
  "unread_count": 1
}
```

**Status Codes:**
- `200 OK`: Successful retrieval
- `404 Not Found`: User not found

---

### 2. Create Notification

**POST** `/api/v1/notifications`

Create a new notification for a user.

**Request Body:**
```json
{
  "user_id": "user-456",
  "type": "info",
  "category": "goal",
  "title": "Goal Milestone Reached",
  "message": "You've reached 50% of your retirement goal!",
  "priority": "medium",
  "action_label": "View Goal",
  "action_url": "/goals/retirement-123"
}
```

**Response:**
```json
{
  "id": "notif-789",
  "user_id": "user-456",
  "type": "info",
  "category": "goal",
  "title": "Goal Milestone Reached",
  "message": "You've reached 50% of your retirement goal!",
  "priority": "medium",
  "read": false,
  "action_label": "View Goal",
  "action_url": "/goals/retirement-123",
  "created_at": "2025-01-08T10:35:00Z"
}
```

**Status Codes:**
- `201 Created`: Notification created successfully
- `400 Bad Request`: Invalid request body
- `404 Not Found`: User not found

---

### 3. Mark Notification as Read

**PUT** `/api/v1/notifications/{notification_id}/read`

Mark a specific notification as read.

**Path Parameters:**
- `notification_id` (string, required): Notification identifier

**Response:**
```json
{
  "id": "notif-123",
  "read": true,
  "read_at": "2025-01-08T10:40:00Z"
}
```

**Status Codes:**
- `200 OK`: Notification marked as read
- `404 Not Found`: Notification not found

---

### 4. Mark All Notifications as Read

**PUT** `/api/v1/notifications/{user_id}/read-all`

Mark all notifications for a user as read.

**Path Parameters:**
- `user_id` (string, required): User identifier

**Response:**
```json
{
  "user_id": "user-456",
  "marked_read": 15,
  "timestamp": "2025-01-08T10:45:00Z"
}
```

**Status Codes:**
- `200 OK`: All notifications marked as read
- `404 Not Found`: User not found

---

### 5. Delete Notification

**DELETE** `/api/v1/notifications/{notification_id}`

Delete a specific notification.

**Path Parameters:**
- `notification_id` (string, required): Notification identifier

**Response:**
```json
{
  "id": "notif-123",
  "deleted": true,
  "deleted_at": "2025-01-08T10:50:00Z"
}
```

**Status Codes:**
- `200 OK`: Notification deleted successfully
- `404 Not Found`: Notification not found

---

### 6. Get User Notification Preferences

**GET** `/api/v1/notifications/{user_id}/preferences`

Retrieve notification preferences for a user.

**Path Parameters:**
- `user_id` (string, required): User identifier

**Response:**
```json
{
  "user_id": "user-456",
  "budget_alerts": true,
  "goal_milestones": true,
  "portfolio_alerts": true,
  "tax_opportunities": true,
  "system_notifications": true,
  "email_notifications": false,
  "updated_at": "2025-01-08T10:55:00Z"
}
```

**Status Codes:**
- `200 OK`: Preferences retrieved successfully
- `404 Not Found`: User not found

---

### 7. Update User Notification Preferences

**PUT** `/api/v1/notifications/{user_id}/preferences`

Update notification preferences for a user.

**Path Parameters:**
- `user_id` (string, required): User identifier

**Request Body:**
```json
{
  "budget_alerts": true,
  "goal_milestones": true,
  "portfolio_alerts": false,
  "tax_opportunities": true,
  "system_notifications": true,
  "email_notifications": true
}
```

**Response:**
```json
{
  "user_id": "user-456",
  "budget_alerts": true,
  "goal_milestones": true,
  "portfolio_alerts": false,
  "tax_opportunities": true,
  "system_notifications": true,
  "email_notifications": true,
  "updated_at": "2025-01-08T11:00:00Z"
}
```

**Status Codes:**
- `200 OK`: Preferences updated successfully
- `400 Bad Request`: Invalid request body
- `404 Not Found`: User not found

---

## Notification Types

- `success`: Positive events (goal achieved, milestone reached)
- `info`: Informational messages (new feature, tip, reminder)
- `warning`: Warnings that require attention (budget threshold, low reserves)
- `error`: Critical issues (sync failed, calculation error)

## Notification Categories

- `budget`: Budget-related alerts (shortfalls, savings opportunities, unusual spending)
- `goal`: Goal progress and milestones (achievement, on-track, off-track)
- `portfolio`: Portfolio events (rebalancing, performance, holdings)
- `tax`: Tax optimization opportunities (harvesting, conversions, deductions)
- `system`: System notifications (updates, maintenance, errors)

## Priority Levels

- `low`: Informational, auto-hide after 5 seconds
- `medium`: Important, requires acknowledgment
- `high`: Critical, persistent until dismissed

---

## Usage Examples

### Frontend Integration

```typescript
import { fetchNotifications, markNotificationAsRead } from '../services/notificationApi';

// Fetch unread notifications
const notifications = await fetchNotifications('user-123', {
  unreadOnly: true,
  limit: 10,
});

// Mark notification as read
await markNotificationAsRead('notif-456');

// Poll for new notifications every 30 seconds
setInterval(async () => {
  const newNotifications = await pollNotifications('user-123', lastFetchTimestamp);
  if (newNotifications.length > 0) {
    // Display new notifications
  }
}, 30000);
```

### Budget Alert Trigger (Backend)

```python
from app.services.notification_service import NotificationService

async def check_budget_shortfall(user_id: str, projected_shortfall: float, month: str):
    if projected_shortfall > 0:
        await NotificationService.create_notification(
            user_id=user_id,
            type="error",
            category="budget",
            title="Projected Cash Shortfall",
            message=f"You may have a shortfall of ${projected_shortfall:,.0f} in {month}",
            priority="high",
            action_label="Review Budget",
            action_url="/budget"
        )
```

### Goal Milestone Trigger (Backend)

```python
from app.services.notification_service import NotificationService

async def check_goal_milestone(user_id: str, goal_id: str, percent_complete: float):
    if percent_complete in [0.25, 0.50, 0.75, 1.00]:
        milestone = int(percent_complete * 100)
        await NotificationService.create_notification(
            user_id=user_id,
            type="success",
            category="goal",
            title=f"Goal {milestone}% Complete!",
            message=f"Congratulations! You've reached {milestone}% of your goal.",
            priority="medium",
            action_label="View Goal",
            action_url=f"/goals/{goal_id}"
        )
```

---

## Error Responses

All endpoints follow a standard error format:

```json
{
  "error": "NotificationNotFound",
  "message": "The requested notification could not be found",
  "timestamp": "2025-01-08T11:05:00Z",
  "path": "/api/v1/notifications/notif-999"
}
```

**Common Error Codes:**
- `400 Bad Request`: Invalid input or malformed request
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Rate Limits

- **Fetch notifications**: 60 requests/minute per user
- **Create notification**: 30 requests/minute per user
- **Mark as read**: 120 requests/minute per user
- **Update preferences**: 10 requests/minute per user

---

## WebSocket Support (Future Enhancement)

For real-time notifications without polling:

```typescript
// Future implementation
const ws = new WebSocket('wss://api.wealthnavigator.ai/notifications');

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  // Display notification immediately
};
```

---

## Testing

**Sample cURL Commands:**

```bash
# Fetch notifications
curl -X GET "http://localhost:8000/api/v1/notifications/user-123?unread_only=true" \
  -H "Content-Type: application/json"

# Create notification
curl -X POST "http://localhost:8000/api/v1/notifications" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "type": "info",
    "category": "system",
    "title": "Test Notification",
    "message": "This is a test notification",
    "priority": "low"
  }'

# Mark as read
curl -X PUT "http://localhost:8000/api/v1/notifications/notif-123/read" \
  -H "Content-Type: application/json"
```

---

## Integration Checklist

- [ ] Backend: Implement notification endpoints
- [ ] Backend: Add notification triggers for budget, goals, portfolio, tax events
- [ ] Frontend: Integrate NotificationSystem component
- [ ] Frontend: Implement polling or WebSocket for real-time updates
- [ ] Frontend: Add notification preferences UI in Settings
- [ ] Testing: Unit tests for notification creation and retrieval
- [ ] Testing: E2E tests for notification flow
- [ ] Documentation: Update user guide with notification features

---

**Last Updated:** January 8, 2025
**API Version:** v1.0
**Status:** Implementation in progress

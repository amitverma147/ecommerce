const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://big-best-backend.vercel.app/api";

export const notificationService = {
  getUserNotifications: async (userId, limit = 20, unreadOnly = false) => {
    if (!userId) {
      return { success: false, error: "User ID required", notifications: [] };
    }

    try {
      const url = `${API_BASE_URL}/notifications/user/${userId}?limit=${limit}&unread_only=${unreadOnly}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}`,
          notifications: [],
        };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.warn("Network error in getUserNotifications:", error.message);
      return { success: false, error: error.message, notifications: [] };
    }
  },

  getUnreadCount: async (userId) => {
    if (!userId) {
      return { success: false, unread_count: 0, error: "User ID required" };
    }

    try {
      const url = `${API_BASE_URL}/notifications/unread-count/${userId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return {
          success: false,
          unread_count: 0,
          error: `HTTP ${response.status}`,
        };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.warn("Network error in getUnreadCount:", error.message);
      return { success: false, unread_count: 0, error: error.message };
    }
  },

  markAsRead: async (notificationId) => {
    if (!notificationId) {
      return { success: false, error: "Notification ID required" };
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/read/${notificationId}`,
        {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );
      
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }
      
      return await response.json();
    } catch (error) {
      console.warn("Network error marking notification as read:", error.message);
      return { success: false, error: error.message };
    }
  },

  markAllAsRead: async (userId) => {
    if (!userId) {
      return { success: false, error: "User ID required" };
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/read-all/${userId}`,
        {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );
      
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }
      
      return await response.json();
    } catch (error) {
      console.warn("Network error marking all notifications as read:", error.message);
      return { success: false, error: error.message };
    }
  },
};

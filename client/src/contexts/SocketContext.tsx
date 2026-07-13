import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.js';
import { useToast } from './ToastContext.js';
import api from '../services/api.js';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  title: string;
  message: string;
  type: 'application_status' | 'drive_published' | 'interview_scheduled' | 'offer_issued' | 'system';
  relatedId?: string;
  relatedModel?: string;
  isRead: boolean;
  createdAt: string;
}

interface SocketContextType {
  socket: Socket | null;
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast('All notifications marked as read', 'success');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, [toast]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast('Notification deleted', 'success');
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, [toast]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Fetch initial notifications
    fetchNotifications();

    // Establish Socket.io connection
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log(`Connected to Socket.io server: ${newSocket.id}`);
      newSocket.emit('join_room', user.id);
    });

    newSocket.on('notification:new', (notification: Notification) => {
      console.log('Received new notification:', notification);
      setNotifications((prev) => [notification, ...prev]);

      // Map notification types to toast style
      let toastType: 'success' | 'info' | 'error' = 'info';
      if (notification.type === 'offer_issued') {
        toastType = 'success';
      }
      
      toast(notification.title + ': ' + notification.message, toastType);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, fetchNotifications, toast]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

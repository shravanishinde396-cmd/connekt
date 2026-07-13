import { Response, NextFunction } from 'express';
import { Notification } from '../models/Notification.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

// Get notifications for logged-in user
export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

// Mark a notification as read
export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json(notification);
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// Delete notification
export const deleteNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const result = await Notification.deleteOne({ _id: id, recipient: req.user.id });

    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
};

import { Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { logActivity } from '../utils/logger.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

// Get all users
export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.find({}, '-passwordHash')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Update user role / company mapping
export const updateUserRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role, companyId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User account not found' });
      return;
    }

    const oldRole = user.role;
    user.role = role;
    if (companyId !== undefined) {
      user.companyId = companyId || undefined;
    }

    await user.save();

    // Log this critical action in audit trails
    if (req.user?.id) {
      await logActivity(
        req.user.id,
        'Role Update',
        `User ${user.name} (${user.email}) promoted from ${oldRole} to ${role}`,
        req,
        { targetUserId: user._id, oldRole, newRole: role }
      );
    }

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// Get audit activity logs
export const getActivityLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

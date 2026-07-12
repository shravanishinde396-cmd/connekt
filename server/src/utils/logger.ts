import { ActivityLog } from '../models/ActivityLog.js';
import { User } from '../models/User.js';

export const logActivity = async (
  userId: string,
  action: string,
  target: string,
  req?: any,
  metadata?: any
): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    await ActivityLog.create({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action,
      target,
      ipAddress: req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || 'local',
      userAgent: req?.headers['user-agent'] || 'unknown',
      metadata,
    });
  } catch (error) {
    console.error('Failed to log system audit activity:', error);
  }
};
export default logActivity;

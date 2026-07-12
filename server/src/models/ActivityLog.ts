import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userRole: string;
  action: string;
  target: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: Date;
}

const ActivityLogSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    action: { type: String, required: true },
    target: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

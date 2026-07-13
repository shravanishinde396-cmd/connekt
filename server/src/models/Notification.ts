import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'application_status' | 'drive_published' | 'interview_scheduled' | 'offer_issued' | 'system';
  relatedId?: mongoose.Types.ObjectId;
  relatedModel?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['application_status', 'drive_published', 'interview_scheduled', 'offer_issued', 'system'],
    required: true,
  },
  relatedId: { type: Schema.Types.ObjectId },
  relatedModel: { type: String },
  isRead: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

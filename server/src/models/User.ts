import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'placement_officer' | 'recruiter' | 'admin';
  isEmailVerified: boolean;
  avatarUrl?: string;
  refreshTokenHash?: string;
  companyId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'placement_officer', 'recruiter', 'admin'],
      required: true,
    },
    isEmailVerified: { type: Boolean, default: false },
    avatarUrl: { type: String },
    refreshTokenHash: { type: String },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

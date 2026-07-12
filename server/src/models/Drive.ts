import mongoose, { Schema, Document } from 'mongoose';

export interface IApplicant {
  studentId: mongoose.Types.ObjectId;
  resumeUrl: string;
  status: 'Applied' | 'Shortlisted' | 'Rejected' | 'Selected';
  appliedAt: Date;
  feedback?: string;
}

export interface IDrive extends Document {
  companyId: mongoose.Types.ObjectId;
  role: string;
  packageLPA: number;
  cgpaCutoff: number;
  backlogCutoff: number;
  allowedDepartments: string[];
  jobDescription: string;
  deadline: Date;
  status: 'Active' | 'Closed';
  applicants: IApplicant[];
  createdAt: Date;
  updatedAt: Date;
}

const ApplicantSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resumeUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ['Applied', 'Shortlisted', 'Rejected', 'Selected'],
    default: 'Applied',
  },
  appliedAt: { type: Date, default: Date.now },
  feedback: { type: String },
});

const DriveSchema: Schema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    role: { type: String, required: true },
    packageLPA: { type: Number, required: true },
    cgpaCutoff: { type: Number, required: true, default: 0 },
    backlogCutoff: { type: Number, required: true, default: 0 }, // Max allowed backlogs
    allowedDepartments: [{ type: String, required: true }],
    jobDescription: { type: String, required: true },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Closed'], default: 'Active' },
    applicants: [ApplicantSchema],
  },
  { timestamps: true }
);

export const Drive = mongoose.model<IDrive>('Drive', DriveSchema);

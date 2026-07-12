import mongoose, { Schema, Document } from 'mongoose';

export interface ICertification {
  name: string;
  organization: string;
  issueDate?: Date;
  expiryDate?: Date;
}

export interface IProject {
  title: string;
  description: string;
  technologiesUsed: string[];
  link?: string;
}

export interface IEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date;
  percentageOrCGPA: number;
}

export interface IExperience {
  company: string;
  role: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
}

export interface IResumeAnalysis {
  atsScore: number;
  summary: string;
  missingSkills: string[];
  grammarSuggestions: string[];
  keywordSuggestions: string[];
  strengthRating: number;
}

export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  department: string;
  batch: string;
  CGPA: number;
  backlogs: number;
  skills: string[];
  certifications: ICertification[];
  projects: IProject[];
  education: IEducation[];
  experience: IExperience[];
  resumeUrl?: string;
  profileCompletion: number;
  resumeAnalysis?: IResumeAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    department: { type: String, required: true },
    batch: { type: String, required: true },
    CGPA: { type: Number, required: true, min: 0, max: 10 },
    backlogs: { type: Number, required: true, min: 0, default: 0 },
    skills: [{ type: String, trim: true }],
    certifications: [
      {
        name: { type: String, required: true },
        organization: { type: String, required: true },
        issueDate: { type: Date },
        expiryDate: { type: Date },
      },
    ],
    projects: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        technologiesUsed: [{ type: String, trim: true }],
        link: { type: String },
      },
    ],
    education: [
      {
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        fieldOfStudy: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        percentageOrCGPA: { type: Number, required: true },
      },
    ],
    experience: [
      {
        company: { type: String, required: true },
        role: { type: String, required: true },
        description: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        isCurrent: { type: Boolean, default: false },
      },
    ],
    resumeUrl: { type: String },
    profileCompletion: { type: Number, default: 0, min: 0, max: 100 },
    resumeAnalysis: {
      atsScore: { type: Number },
      summary: { type: String },
      missingSkills: [{ type: String }],
      grammarSuggestions: [{ type: String }],
      keywordSuggestions: [{ type: String }],
      strengthRating: { type: Number },
    },
  },
  { timestamps: true }
);

export const StudentProfile = mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);

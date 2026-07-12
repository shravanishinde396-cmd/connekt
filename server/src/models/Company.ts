import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  website: string;
  industry: string;
  description: string;
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    website: { type: String, required: true },
    industry: { type: String, required: true },
    description: { type: String, required: true },
    logoUrl: { type: String },
  },
  { timestamps: true }
);

export const Company = mongoose.model<ICompany>('Company', CompanySchema);

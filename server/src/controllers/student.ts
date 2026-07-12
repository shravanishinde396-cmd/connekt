import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { StudentProfile } from '../models/StudentProfile.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Drive } from '../models/Drive.js';
import { uploadToCloudinaryOrLocal } from '../config/storage.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

// Calculate profile completion score dynamically
const calculateCompletion = (profile: any): number => {
  let score = 10; // 10% base for registration

  if (profile.department && profile.department !== 'TBD') score += 10;
  if (profile.batch && profile.batch !== '') score += 5;
  if (profile.CGPA && profile.CGPA > 0) score += 5;
  if (profile.skills && profile.skills.length > 0) score += 15;
  if (profile.certifications && profile.certifications.length > 0) score += 15;
  if (profile.projects && profile.projects.length > 0) score += 15;
  if (profile.education && profile.education.length > 0) score += 15;
  if (profile.experience && profile.experience.length > 0) score += 10;
  if (profile.resumeUrl) score += 10; // 10% for resume upload

  return Math.min(score, 100);
};

export const getStudentProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      // If profile doesn't exist for some reason, create one
      profile = new StudentProfile({
        userId: req.user.id,
        department: 'TBD',
        batch: new Date().getFullYear().toString(),
        CGPA: 0,
        backlogs: 0,
        profileCompletion: 10,
      });
      await profile.save();
    }

    const userDetails = await User.findById(req.user.id).select('name email role');

    res.json({
      profile,
      user: userDetails,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStudentProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = new StudentProfile({ userId: req.user.id });
    }

    const fieldsToUpdate = req.body;
    
    // Update fields dynamically
    Object.keys(fieldsToUpdate).forEach((key) => {
      (profile as any)[key] = fieldsToUpdate[key];
    });

    // Recalculate profile completion percentage
    profile.profileCompletion = calculateCompletion(profile);

    await profile.save();

    // Optionally update user name if passed
    if (req.body.name) {
      await User.findByIdAndUpdate(req.user.id, { name: req.body.name });
    }

    const userDetails = await User.findById(req.user.id).select('name email role');

    res.json({
      message: 'Profile updated successfully',
      profile,
      user: userDetails,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadResume = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'Please upload a PDF resume file.' });
      return;
    }

    let profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = new StudentProfile({ userId: req.user.id });
    }

    // Upload file using our utility (uploads to Cloudinary or falls back to local uploads folder)
    const fileUrl = await uploadToCloudinaryOrLocal(req.file.path);

    profile.resumeUrl = fileUrl;
    profile.profileCompletion = calculateCompletion(profile);
    await profile.save();

    res.json({
      message: 'Resume uploaded successfully',
      resumeUrl: fileUrl,
      profileCompletion: profile.profileCompletion,
    });
  } catch (error) {
    next(error);
  }
};

// Calculate skill-JD overlap match rate
const calculateMatchingScore = (studentSkills: string[], jobDescription: string): number => {
  if (!studentSkills || studentSkills.length === 0) return 30; // base score
  const descriptionLower = jobDescription.toLowerCase();
  
  let matches = 0;
  studentSkills.forEach((skill) => {
    if (descriptionLower.includes(skill.toLowerCase())) {
      matches++;
    }
  });

  const rawScore = (matches / Math.max(studentSkills.length, 3)) * 100;
  return Math.min(Math.round(rawScore + 40), 100); // 40 base points for interest alignment
};

export const getStudentDrives = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const studentProfile = await StudentProfile.findOne({ userId: req.user.id });
    if (!studentProfile) {
      res.status(404).json({ error: 'Student profile not found. Please create profile first.' });
      return;
    }

    const drives = await Drive.find().populate('companyId');

    const formattedDrives = drives.map((drive: any) => {
      // Check applied
      const hasApplied = drive.applicants.some((app: any) => app.studentId.toString() === req.user!.id);
      const studentApplication = drive.applicants.find((app: any) => app.studentId.toString() === req.user!.id);

      // Eligibility Checks
      let isEligible = true;
      const reasons: string[] = [];

      if (drive.status !== 'Active') {
        isEligible = false;
        reasons.push('Drive is closed');
      }

      if (new Date(drive.deadline) < new Date()) {
        isEligible = false;
        reasons.push('Application deadline has passed');
      }

      if (studentProfile.CGPA < drive.cgpaCutoff) {
        isEligible = false;
        reasons.push(`CGPA is below requirement (${drive.cgpaCutoff})`);
      }

      if (studentProfile.backlogs > drive.backlogCutoff) {
        isEligible = false;
        reasons.push(`Active backlogs exceed maximum allowed (${drive.backlogCutoff})`);
      }

      if (!drive.allowedDepartments.includes(studentProfile.department)) {
        isEligible = false;
        reasons.push(`Department ${studentProfile.department} is not permitted for this drive`);
      }

      // Calculate Skill Match Rate
      const matchingScore = calculateMatchingScore(studentProfile.skills, drive.jobDescription);

      return {
        _id: drive._id,
        role: drive.role,
        company: drive.companyId,
        packageLPA: drive.packageLPA,
        cgpaCutoff: drive.cgpaCutoff,
        backlogCutoff: drive.backlogCutoff,
        allowedDepartments: drive.allowedDepartments,
        jobDescription: drive.jobDescription,
        deadline: drive.deadline,
        status: drive.status,
        isEligible,
        ineligibilityReason: reasons.join(', '),
        hasApplied,
        applicationStatus: studentApplication ? studentApplication.status : null,
        matchingScore,
      };
    });

    res.json(formattedDrives);
  } catch (error) {
    next(error);
  }
};

export const applyToStudentDrive = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { driveId } = req.params;

    const studentProfile = await StudentProfile.findOne({ userId: req.user.id });
    if (!studentProfile) {
      res.status(404).json({ error: 'Student profile not found.' });
      return;
    }

    // Verify resume uploaded
    if (!studentProfile.resumeUrl) {
      res.status(400).json({ error: 'Please upload your PDF resume in profile settings before applying.' });
      return;
    }

    const drive = await Drive.findById(driveId);
    if (!drive) {
      res.status(404).json({ error: 'Hiring drive not found.' });
      return;
    }

    // Check if already applied
    const alreadyApplied = drive.applicants.some((app: any) => app.studentId.toString() === req.user!.id);
    if (alreadyApplied) {
      res.status(400).json({ error: 'You have already applied to this placement drive.' });
      return;
    }

    // Perform eligibility check
    if (drive.status !== 'Active') {
      res.status(400).json({ error: 'This hiring drive is closed.' });
      return;
    }

    if (new Date(drive.deadline) < new Date()) {
      res.status(400).json({ error: 'This drive has expired.' });
      return;
    }

    if (studentProfile.CGPA < drive.cgpaCutoff) {
      res.status(400).json({ error: `Eligibility Failed: Your CGPA (${studentProfile.CGPA}) is below the required CGPA (${drive.cgpaCutoff}).` });
      return;
    }

    if (studentProfile.backlogs > drive.backlogCutoff) {
      res.status(400).json({ error: `Eligibility Failed: Your active backlogs exceed maximum allowed (${drive.backlogCutoff}).` });
      return;
    }

    if (!drive.allowedDepartments.includes(studentProfile.department)) {
      res.status(400).json({ error: `Eligibility Failed: Your department (${studentProfile.department}) is not permitted.` });
      return;
    }

    // Push applicant details
    drive.applicants.push({
      studentId: new mongoose.Types.ObjectId(req.user.id),
      resumeUrl: studentProfile.resumeUrl,
      status: 'Applied',
      appliedAt: new Date(),
    });

    await drive.save();

    res.json({
      message: 'Successfully applied to drive!',
      applicationStatus: 'Applied',
    });
  } catch (error) {
    next(error);
  }
};

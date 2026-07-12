import { Response, NextFunction } from 'express';
import { Company } from '../models/Company.js';
import { Drive } from '../models/Drive.js';
import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

// Get associated recruiter company
export const getRecruiterCompany = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user || !user.companyId) {
      res.status(400).json({ error: 'No company association configured for this recruiter profile' });
      return;
    }

    const company = await Company.findById(user.companyId);
    if (!company) {
      res.status(444).json({ error: 'Associated company record not found' });
      return;
    }

    res.json(company);
  } catch (error) {
    next(error);
  }
};

// Update associated recruiter company
export const updateRecruiterCompany = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user || !user.companyId) {
      res.status(400).json({ error: 'No company association configured for this recruiter profile' });
      return;
    }

    const company = await Company.findByIdAndUpdate(user.companyId, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ message: 'Company profile updated successfully', company });
  } catch (error) {
    next(error);
  }
};

// Get recruiter drives
export const getRecruiterDrives = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user || !user.companyId) {
      res.status(400).json({ error: 'No company association configured for this recruiter profile' });
      return;
    }

    const drives = await Drive.find({ companyId: user.companyId }).sort({ createdAt: -1 });
    res.json(drives);
  } catch (error) {
    next(error);
  }
};

// Get applicants for a specific recruiter drive
export const getRecruiterDriveApplicants = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user || !user.companyId) {
      res.status(400).json({ error: 'No company association configured for this recruiter' });
      return;
    }

    const drive = await Drive.findById(req.params.driveId).populate('applicants.studentId', 'name email');
    if (!drive) {
      res.status(404).json({ error: 'Hiring drive not found' });
      return;
    }

    // Verify ownership
    if (drive.companyId.toString() !== user.companyId.toString()) {
      res.status(403).json({ error: 'Access denied: Drive belongs to another corporate partner' });
      return;
    }

    const studentUserIds = drive.applicants.map((a) => a.studentId._id || a.studentId);
    const profiles = await StudentProfile.find({ userId: { $in: studentUserIds } });

    const enrichedApplicants = drive.applicants.map((applicant: any) => {
      const studentUser = applicant.studentId;
      const studentProfile = profiles.find(
        (p) => p.userId.toString() === (studentUser?._id || studentUser).toString()
      );

      return {
        _id: applicant._id,
        appliedAt: applicant.appliedAt,
        status: applicant.status,
        resumeUrl: applicant.resumeUrl,
        feedback: applicant.feedback,
        student: {
          _id: studentUser?._id || studentUser,
          name: studentUser?.name || 'Anonymous Student',
          email: studentUser?.email || 'N/A',
          department: studentProfile?.department || 'TBD',
          CGPA: studentProfile?.CGPA || 0,
          backlogs: studentProfile?.backlogs || 0,
          skills: studentProfile?.skills || [],
        },
      };
    });

    res.json(enrichedApplicants);
  } catch (error) {
    next(error);
  }
};

// Update status of applicant in recruiter drive
export const updateRecruiterApplicantStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user || !user.companyId) {
      res.status(400).json({ error: 'No company association configured for this recruiter' });
      return;
    }

    const drive = await Drive.findById(req.params.driveId);
    if (!drive) {
      res.status(404).json({ error: 'Hiring drive not found' });
      return;
    }

    // Verify ownership
    if (drive.companyId.toString() !== user.companyId.toString()) {
      res.status(403).json({ error: 'Access denied: Drive belongs to another corporate partner' });
      return;
    }

    const applicant = (drive.applicants as any).id(req.params.applicantId);
    if (!applicant) {
      res.status(404).json({ error: 'Applicant record not found' });
      return;
    }

    const { status, feedback } = req.body;
    if (status) applicant.status = status;
    if (feedback !== undefined) applicant.feedback = feedback;

    await drive.save();
    res.json({ message: 'Applicant updated successfully', applicant });
  } catch (error) {
    next(error);
  }
};

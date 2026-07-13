import { Response, NextFunction } from 'express';
import { Company } from '../models/Company.js';
import { Drive } from '../models/Drive.js';
import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { createNotification, handleApplicantStatusChange, handleInterviewScheduling } from '../utils/notification.js';

// ==========================================
// COMPANY CRUD
// ==========================================

export const getCompanies = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    res.json(companies);
  } catch (error) {
    next(error);
  }
};

export const getCompanyById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const company = await Company.findById(req.params.companyId);
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json(company);
  } catch (error) {
    next(error);
  }
};

export const createCompany = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, website, industry, description, logoUrl } = req.body;

    const existing = await Company.findOne({ name });
    if (existing) {
      res.status(400).json({ error: 'A company with this name already exists' });
      return;
    }

    const company = new Company({ name, website, industry, description, logoUrl });
    await company.save();

    res.status(201).json({ message: 'Company created successfully', company });
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.companyId, req.body, {
      new: true,
      runValidators: true,
    });
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json({ message: 'Company updated successfully', company });
  } catch (error) {
    next(error);
  }
};

export const deleteCompany = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const hasDrives = await Drive.exists({ companyId: req.params.companyId });
    if (hasDrives) {
      res.status(400).json({ error: 'Cannot delete company with active or historical placement drives' });
      return;
    }

    const company = await Company.findByIdAndDelete(req.params.companyId);
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PLACEMENT DRIVE CRUD
// ==========================================

export const getOfficerDrives = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const drives = await Drive.find().populate('companyId').sort({ createdAt: -1 });
    res.json(drives);
  } catch (error) {
    next(error);
  }
};

export const getOfficerDriveById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const drive = await Drive.findById(req.params.driveId).populate('companyId');
    if (!drive) {
      res.status(404).json({ error: 'Placement drive not found' });
      return;
    }
    res.json(drive);
  } catch (error) {
    next(error);
  }
};

export const createOfficerDrive = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      companyId,
      role,
      packageLPA,
      cgpaCutoff,
      backlogCutoff,
      allowedDepartments,
      jobDescription,
      deadline,
      status,
    } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      res.status(404).json({ error: 'Selected company does not exist' });
      return;
    }

    const drive = new Drive({
      companyId,
      role,
      packageLPA,
      cgpaCutoff,
      backlogCutoff,
      allowedDepartments,
      jobDescription,
      deadline: new Date(deadline),
      status: status || 'Active',
      applicants: [],
    });
    await drive.save();

    // Query eligible students and notify them
    const queryCond: any = {
      CGPA: { $gte: cgpaCutoff },
      backlogs: { $lte: backlogCutoff },
    };
    if (allowedDepartments && allowedDepartments.length > 0) {
      queryCond.department = { $in: allowedDepartments };
    }
    const eligibleStudents = await StudentProfile.find(queryCond);

    const notificationPromises = eligibleStudents.map((student) => {
      return createNotification(
        student.userId.toString(),
        `New Drive Published: ${company.name}`,
        `A new placement drive has been published for ${role} role by ${company.name} offering ${packageLPA} LPA. Check eligibility and apply!`,
        'drive_published',
        req.user?.id,
        drive._id.toString(),
        'Drive',
        req.io
      );
    });
    Promise.all(notificationPromises).catch(err => console.error('Failed to dispatch bulk drive notifications:', err));

    res.status(201).json({ message: 'Placement drive created successfully', drive });
  } catch (error) {
    next(error);
  }
};

export const updateOfficerDrive = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payload = { ...req.body };
    if (payload.deadline) {
      payload.deadline = new Date(payload.deadline);
    }

    const drive = await Drive.findByIdAndUpdate(req.params.driveId, payload, {
      new: true,
      runValidators: true,
    }).populate('companyId');

    if (!drive) {
      res.status(404).json({ error: 'Placement drive not found' });
      return;
    }
    res.json({ message: 'Drive updated successfully', drive });
  } catch (error) {
    next(error);
  }
};

export const deleteOfficerDrive = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const drive = await Drive.findByIdAndDelete(req.params.driveId);
    if (!drive) {
      res.status(404).json({ error: 'Placement drive not found' });
      return;
    }
    res.json({ message: 'Placement drive deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// APPLICANT & PIPELINE ACTIONS
// ==========================================

export const getDriveApplicants = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const drive = await Drive.findById(req.params.driveId).populate('applicants.studentId', 'name email');
    if (!drive) {
      res.status(404).json({ error: 'Placement drive not found' });
      return;
    }

    // Populate student profiles manually to get academic details
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
        interviewDate: applicant.interviewDate,
        interviewTime: applicant.interviewTime,
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

export const updateApplicantStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { driveId, applicantId } = req.params;
    const { status, feedback, interviewDate, interviewTime } = req.body;

    const drive = await Drive.findById(driveId);
    if (!drive) {
      res.status(404).json({ error: 'Placement drive not found' });
      return;
    }

    const applicant = (drive.applicants as any).id(applicantId);
    if (!applicant) {
      res.status(404).json({ error: 'Applicant record not found' });
      return;
    }

    const oldStatus = applicant.status;

    let scheduleUpdated = false;
    if (interviewDate !== undefined && interviewDate !== applicant.interviewDate) {
      applicant.interviewDate = interviewDate;
      scheduleUpdated = true;
    }
    if (interviewTime !== undefined && interviewTime !== applicant.interviewTime) {
      applicant.interviewTime = interviewTime;
      scheduleUpdated = true;
    }

    if (status) applicant.status = status;
    if (feedback !== undefined) applicant.feedback = feedback;

    await drive.save();

    const senderId = req.user?.id || '';
    const io = req.io;

    if (status && status !== oldStatus) {
      handleApplicantStatusChange(drive, applicant, oldStatus, status, senderId, io);
    }

    if (scheduleUpdated && interviewDate && interviewTime) {
      handleInterviewScheduling(drive, applicant, interviewDate, interviewTime, senderId, io);
    }

    res.json({ message: 'Applicant status updated successfully', applicant });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ANALYTICS & AGGREGATIONS
// ==========================================

export const getOfficerAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Total Students
    const totalStudents = await User.countDocuments({ role: 'student' });

    // 2. Placed Students (anyone with 'Selected' status in at least one drive)
    const placedStudentIds = await Drive.distinct('applicants.studentId', {
      'applicants.status': 'Selected',
    });
    const placedStudents = placedStudentIds.length;

    // 3. Placement Percentage
    const placementRate = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0;

    // 4. General Counts
    const totalCompanies = await Company.countDocuments();
    const totalActiveDrives = await Drive.countDocuments({ status: 'Active' });

    // 5. Department wise placement rates calculated in MongoDB
    const aggregatedDepts = await StudentProfile.aggregate([
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          placed: {
            $sum: {
              $cond: [
                { $in: ['$userId', placedStudentIds] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const departments = [
      'Computer Science',
      'Information Technology',
      'Electronics & Communication',
      'Mechanical Engineering',
      'Electrical Engineering'
    ];
    
    const departmentBreakdown = departments.map((dept) => {
      const agg = aggregatedDepts.find((a) => a._id === dept);
      const total = agg ? agg.total : 0;
      const placed = agg ? agg.placed : 0;

      return {
        department: dept,
        total,
        placed,
        rate: total > 0 ? Math.round((placed / total) * 100) : 0,
      };
    });

    res.json({
      summary: {
        totalStudents,
        placedStudents,
        placementRate,
        totalCompanies,
        totalActiveDrives,
      },
      departmentBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

export const getSalaryStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const drivesCount = await Drive.countDocuments();
    if (drivesCount === 0) {
      res.json({
        averageCTC: 0,
        maxCTC: 0,
        minCTC: 0,
        distribution: [],
      });
      return;
    }

    // 1. Calculate min, max, average CTC packages using MongoDB aggregation
    const statsAgg = await Drive.aggregate([
      {
        $group: {
          _id: null,
          maxCTC: { $max: '$packageLPA' },
          minCTC: { $min: '$packageLPA' },
          averageCTC: { $avg: '$packageLPA' },
        }
      }
    ]);

    const stats = statsAgg[0] || { maxCTC: 0, minCTC: 0, averageCTC: 0 };
    const maxCTC = stats.maxCTC;
    const minCTC = stats.minCTC;
    const averageCTC = parseFloat(stats.averageCTC.toFixed(2));

    // 2. Compute distribution details with company join
    const distribution = await Drive.aggregate([
      {
        $lookup: {
          from: 'companies',
          localField: 'companyId',
          foreignField: '_id',
          as: 'company'
        }
      },
      {
        $unwind: {
          path: '$company',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          label: {
            $concat: [
              { $ifNull: ['$company.name', 'Unknown'] },
              ' - ',
              '$role'
            ]
          },
          package: '$packageLPA',
          applicants: { $size: { $ifNull: ['$applicants', []] } }
        }
      },
      {
        $sort: { package: -1 }
      }
    ]);

    res.json({
      averageCTC,
      maxCTC,
      minCTC,
      distribution,
    });
  } catch (error) {
    next(error);
  }
};

export const exportPlacedStudentsCSV = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const drives = await Drive.find({ 'applicants.status': 'Selected' })
      .populate('companyId', 'name')
      .populate('applicants.studentId', 'name email');

    const placedRows: any[] = [];
    const studentUserIds: any[] = [];

    drives.forEach((drive) => {
       drive.applicants.forEach((app) => {
         if (app.status === 'Selected') {
           const studentInfo = app.studentId as any;
           const companyInfo = drive.companyId as any;

           studentUserIds.push(studentInfo?._id || app.studentId);
           placedRows.push({
             studentId: studentInfo?._id || app.studentId,
             studentName: studentInfo?.name || 'Anonymous Student',
             studentEmail: studentInfo?.email || 'N/A',
             companyName: companyInfo?.name || 'N/A',
             role: drive.role,
             package: drive.packageLPA,
           });
         }
       });
     });

    const profiles = await StudentProfile.find({ userId: { $in: studentUserIds } });

    let csv = 'Candidate Name,Email,Academic Department,CGPA,Hired Employer,Job Role,CTC Package (LPA)\n';
    
    placedRows.forEach((row) => {
      const profile = profiles.find((p) => p.userId.toString() === row.studentId.toString());
      const department = profile?.department || 'TBD';
      const cgpa = profile?.CGPA || 'N/A';

      const cleanName = row.studentName.replace(/,/g, '');
      const cleanCompany = row.companyName.replace(/,/g, '');
      const cleanRole = row.role.replace(/,/g, '');

      csv += `"${cleanName}","${row.studentEmail}","${department}","${cgpa}","${cleanCompany}","${cleanRole}",${row.package}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=placepilot_placed_candidates.csv');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

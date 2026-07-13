import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { sendInterviewScheduledEmail, sendOfferIssuedEmail } from './email.js';

export const createNotification = async (
  recipientId: string,
  title: string,
  message: string,
  type: 'application_status' | 'drive_published' | 'interview_scheduled' | 'offer_issued' | 'system',
  senderId?: string,
  relatedId?: string,
  relatedModel?: string,
  io?: any
) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      title,
      message,
      type,
      relatedId,
      relatedModel,
    });

    if (io) {
      io.to(recipientId.toString()).emit('notification:new', notification);
      console.log(`Notification emitted via Socket.io to room ${recipientId}`);
    }

    return notification;
  } catch (error) {
    console.error('Failed to create/send notification:', error);
  }
};

export const handleApplicantStatusChange = async (
  drive: any,
  applicant: any,
  oldStatus: string,
  newStatus: string,
  senderId: string,
  io: any
) => {
  try {
    const student = await User.findById(applicant.studentId);
    if (!student) return;

    const company = await Company.findById(drive.companyId);
    const companyName = company ? company.name : 'Target Company';

    // 1. Check if status has changed
    if (newStatus && oldStatus !== newStatus) {
      let title = 'Application Status Update';
      let message = `Your application status for ${companyName} (${drive.role}) has been updated to ${newStatus}.`;
      let type: 'application_status' | 'offer_issued' | 'system' = 'application_status';

      if (newStatus === 'Shortlisted') {
        title = 'Congratulations! You are Shortlisted';
        message = `You have been shortlisted for the placement drive of ${companyName} for the role of ${drive.role}. Prepare for next rounds!`;
      } else if (newStatus === 'Selected') {
        title = 'Congratulations! Job Offer Received 🎉';
        message = `You have been selected by ${companyName} for the role of ${drive.role} with a package of ${drive.packageLPA} LPA!`;
        type = 'offer_issued';

        // Send offer email
        await sendOfferIssuedEmail(student.email, student.name, {
          companyName,
          package: drive.packageLPA
        });
      } else if (newStatus === 'Rejected') {
        title = 'Application Status Update';
        message = `We regret to inform you that your application for ${companyName} (${drive.role}) was not selected. Keep trying!`;
      }

      await createNotification(student._id.toString(), title, message, type, senderId, drive._id.toString(), 'Drive', io);
    }
  } catch (error) {
    console.error('Failed to handle applicant status change:', error);
  }
};

export const handleInterviewScheduling = async (
  drive: any,
  applicant: any,
  date: string,
  time: string,
  senderId: string,
  io: any
) => {
  try {
    const student = await User.findById(applicant.studentId);
    if (!student) return;

    const company = await Company.findById(drive.companyId);
    const companyName = company ? company.name : 'Target Company';

    const title = 'Interview Scheduled';
    const message = `Your interview with ${companyName} for the role of ${drive.role} is scheduled on ${date} at ${time}.`;

    await createNotification(student._id.toString(), title, message, 'interview_scheduled', senderId, drive._id.toString(), 'Drive', io);

    // Send interview email
    await sendInterviewScheduledEmail(student.email, student.name, {
      driveName: `${companyName} - ${drive.role}`,
      companyName,
      round: 'Technical Interview',
      date,
      time,
      mode: 'Online (Connekt Portal)'
    });
  } catch (error) {
    console.error('Failed to handle interview scheduling:', error);
  }
};

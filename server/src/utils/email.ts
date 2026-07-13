import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const isMockResend = !resendApiKey || resendApiKey === 're_123456789' || resendApiKey.startsWith('mock_');

const resend = isMockResend ? null : new Resend(resendApiKey);

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailPayload): Promise<boolean> => {
  try {
    if (isMockResend || !resend) {
      console.log('--- MOCK EMAIL SENT ---');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content:\n${html.replace(/<[^>]*>/g, ' ').substring(0, 300)}...`);
      console.log('------------------------');
      return true;
    }

    const { data, error } = await resend.emails.send({
      from: 'PlacePilot <onboarding@resend.dev>', // default resend testing domain
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend email error:', error);
      return false;
    }

    console.log(`Email successfully sent via Resend: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const sendVerificationEmail = async (email: string, name: string, token: string): Promise<boolean> => {
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/verify-email?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: #6366f1;">Welcome to PlacePilot, ${name}!</h2>
      <p>Thank you for registering on the PlacePilot AI-Powered Placement Management Platform.</p>
      <p>Please click the button below to verify your email address and activate your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link in your browser:</p>
      <p style="font-size: 12px; color: #6366f1; word-break: break-all;">${verifyUrl}</p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 11px; color: #999;">This email was sent automatically by PlacePilot. Please do not reply directly.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Verify Your Email - PlacePilot', html });
};

export const sendPasswordResetEmail = async (email: string, name: string, token: string): Promise<boolean> => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/reset-password?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: #6366f1;">Reset Your Password</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset the password for your PlacePilot account. If you did not make this request, please ignore this email.</p>
      <p>Click the button below to set a new password. This link is valid for 1 hour.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link in your browser:</p>
      <p style="font-size: 12px; color: #6366f1; word-break: break-all;">${resetUrl}</p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 11px; color: #999;">This email was sent automatically by PlacePilot. Please do not reply directly.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Reset Your Password - PlacePilot', html });
};

export const sendInterviewScheduledEmail = async (
  email: string,
  name: string,
  details: { driveName: string; companyName: string; round: string; date: string; time: string; mode: string; details?: string }
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: #6366f1; border-bottom: 2px solid #eaeaea; padding-bottom: 10px;">Interview Scheduled</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>An interview has been scheduled for your application to <strong>${details.companyName}</strong> for the drive: <strong>${details.driveName}</strong>.</p>
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #6366f1;">
        <p style="margin: 5px 0;"><strong>Round:</strong> ${details.round}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${details.date}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${details.time}</p>
        <p style="margin: 5px 0;"><strong>Mode:</strong> ${details.mode}</p>
        ${details.details ? `<p style="margin: 5px 0;"><strong>Details/Instructions:</strong> ${details.details}</p>` : ''}
      </div>
      <p>Please make sure to log in to the PlacePilot platform on time and be prepared. Good luck!</p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 11px; color: #999;">This is an automated notification from PlacePilot.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: `Interview Scheduled: ${details.companyName} (${details.round})`, html });
};

export const sendOfferIssuedEmail = async (
  email: string,
  name: string,
  details: { companyName: string; package: number; offerLetterUrl?: string }
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: #10b981; border-bottom: 2px solid #eaeaea; padding-bottom: 10px;">Congratulations! Offer Letter Issued 🎉</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>We are absolutely thrilled to inform you that you have been offered a position at <strong>${details.companyName}</strong>!</p>
      <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 5px 0; font-size: 16px;"><strong>CTC Package:</strong> ₹${details.package.toLocaleString()} LPA</p>
        ${details.offerLetterUrl ? `<p style="margin: 10px 0 0 0;"><a href="${details.offerLetterUrl}" style="background-color: #10b981; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">View Offer Letter</a></p>` : ''}
      </div>
      <p>Please log in to the PlacePilot portal to view, download, and accept the offer letter. Your hard work has paid off, and we wish you the absolute best in this new chapter!</p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 11px; color: #999;">This is an automated congratulatory email from PlacePilot.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: `Congratulations! Job Offer from ${details.companyName}`, html });
};

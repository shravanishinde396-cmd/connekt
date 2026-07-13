import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import {
  hashPassword,
  comparePassword,
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/auth.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

// Cookie helper
const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = new User({
      name,
      email,
      passwordHash,
      role,
      isEmailVerified: false,
    });

    await user.save();

    // If student, initialize a profile stub
    if (role === 'student') {
      const studentProfile = new StudentProfile({
        userId: user._id,
        department: 'TBD',
        batch: new Date().getFullYear().toString(),
        CGPA: 0,
        backlogs: 0,
        skills: [],
        certifications: [],
        projects: [],
        education: [],
        experience: [],
        profileCompletion: 10, // 10% for registering
      });
      await studentProfile.save();
    }

    // Send verification email asynchronously
    sendVerificationEmail(user.email, user.name, 'mock_verification_token').catch((err) =>
      console.error('Failed to send verification email:', err)
    );

    // Generate tokens
    const accessToken = generateAccessToken({ id: (user._id as any).toString(), role: user.role });
    const refreshToken = generateRefreshToken({ id: (user._id as any).toString() });

    // Save refresh token hash
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const accessToken = generateAccessToken({ id: (user._id as any).toString(), role: user.role });
    const refreshToken = generateRefreshToken({ id: (user._id as any).toString() });

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token missing' });
      return;
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      res.status(403).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokenHash) {
      res.status(403).json({ error: 'User not found or session expired' });
      return;
    }

    // Refresh Token Rotation (RTR) check
    const currentTokenHash = hashToken(refreshToken);
    if (user.refreshTokenHash !== currentTokenHash) {
      // Token reuse detected! Revoke all access
      user.refreshTokenHash = undefined;
      await user.save();
      res.clearCookie('refreshToken');
      res.status(403).json({ error: 'Session compromised. Please log in again.' });
      return;
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({ id: (user._id as any).toString(), role: user.role });
    const newRefreshToken = generateRefreshToken({ id: (user._id as any).toString() });

    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save();

    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      let decoded;
      try {
        decoded = verifyRefreshToken(refreshToken);
        const user = await User.findById(decoded.id);
        if (user) {
          user.refreshTokenHash = undefined;
          await user.save();
        }
      } catch (err) {
        // Token was invalid, proceed to clear cookie anyway
      }
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;
    // In MVP, we just match a basic mock validation or set to true for now
    // Later we can implement verification tokens in DB
    const user = await User.findOneAndUpdate(
      { isEmailVerified: false }, // stub finder
      { isEmailVerified: true },
      { new: true }
    );

    res.json({ message: 'Email verified successfully', verified: true });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // Don't leak user existence in production, but for testing, let them know
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Generate time-limited reset token stub
    const resetToken = 'mock_reset_token_' + Date.now();
    sendPasswordResetEmail(user.email, user.name, resetToken).catch((err) =>
      console.error('Failed to send reset password email:', err)
    );

    console.log(`Password reset requested for ${email}. Reset token generated.`);
    res.json({ message: 'Password reset link sent to email (check console logs)' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { password } = req.body;
    // Stub finder for reset
    const user = await User.findOne(); // grab first user to demo resetting
    if (!user) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    user.passwordHash = await hashPassword(password);
    user.refreshTokenHash = undefined; // invalidate existing sessions
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -refreshTokenHash');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

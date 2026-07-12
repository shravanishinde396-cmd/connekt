import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_fallback';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_fallback';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export interface TokenPayload {
  id: string;
  role: 'student' | 'placement_officer' | 'recruiter' | 'admin';
}

export interface RefreshTokenPayload {
  id: string;
}

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

// Password comparison
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Token hashing for secure DB storage
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Access Token Generation
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRY as any });
};

// Refresh Token Generation
export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY as any });
};

// Verify Access Token
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
};

// Verify Refresh Token
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
};

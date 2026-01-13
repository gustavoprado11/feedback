import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { findUserById } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'feedflow-secret-key';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = await findUserById(decoded.userId);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    subscriptionStatus: user.subscription_status,
    subscriptionEndDate: user.subscription_end_date,
    stripeCustomerId: user.stripe_customer_id,
  };
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const user = await findUserById(userId);
  if (!user) return false;

  // Check if subscription is active
  if (user.subscription_status === 'active') return true;

  // Check if subscription is trialing
  if (user.subscription_status === 'trialing') return true;

  // Allow past_due with warning (user can still access)
  if (user.subscription_status === 'past_due') return true;

  // Check if subscription has ended but grace period is still valid
  if (user.subscription_end_date) {
    const endDate = new Date(user.subscription_end_date);
    return endDate > new Date();
  }

  return false;
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

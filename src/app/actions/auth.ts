'use server';

import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-key-at-least-32-characters-long'
);

const AUTH_EMAIL = process.env.AUTH_EMAIL || 'admin@example.com';
const AUTH_PASSWORD_HASH = process.env.AUTH_PASSWORD 
  ? bcrypt.hashSync(process.env.AUTH_PASSWORD, 10)
  : bcrypt.hashSync('password', 10);

export interface LoginResult {
  success: boolean;
  error?: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    if (email !== AUTH_EMAIL) {
      return { success: false, error: 'Invalid credentials' };
    }

    const isValidPassword = bcrypt.compareSync(password, AUTH_PASSWORD_HASH);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid credentials' };
    }

    const token = await new SignJWT({ email, authenticated: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    (await cookies()).set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

export async function logout() {
  (await cookies()).delete('auth-token');
  redirect('/login');
}

export async function getSession() {
  const token = (await cookies()).get('auth-token');
  
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token.value, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}
import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from '@/lib/session';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = await signSession(userId);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

async function readSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  isSuperAdmin: boolean;
  permissions: Set<string>;
  staffId: string | null;
};

// Aynı istek içinde tekrar tekrar DB'ye gitmemek için React cache ile bellekte tutulur.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const userId = await readSessionUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
      staff: { select: { id: true } },
    },
  });

  if (!user || user.status !== 'ACTIVE') return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name,
    isSuperAdmin: user.role.name === 'Süper Yönetici',
    permissions: new Set(user.role.permissions.map((rp) => rp.permission.code)),
    staffId: user.staff?.id ?? null,
  };
});

export function hasPermission(user: CurrentUser, code: string) {
  return user.isSuperAdmin || user.permissions.has(code);
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requirePermission(code: string): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasPermission(user, code)) redirect('/yetkisiz');
  return user;
}

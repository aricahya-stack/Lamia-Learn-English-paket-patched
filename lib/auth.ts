import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
export type AppRole = "SUPER_ADMIN" | "TEACHER" | "STUDENT";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  avatarUrl?: string | null;
};

type SessionPayload = {
  userId: string;
  role: AppRole;
  exp: number;
};

export const SESSION_COOKIE_NAME = "lle_session";
const LEGACY_ROLE_COOKIE = "ek_role";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSecret() {
  return process.env.SESSION_SECRET || process.env.AUTH_SECRET || "lamia-learn-english-development-secret-change-me";
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(data: string) {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function createSessionToken(payload: SessionPayload) {
  const body = encode(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

function readSessionToken(token?: string): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature || !safeEqual(sign(body), signature)) return null;

  try {
    const payload = JSON.parse(decode(body)) as SessionPayload;
    if (!payload.userId || !payload.role || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return null;

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return null;

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as AppRole,
    avatarUrl: user.avatarUrl
  };
}

export async function setAuthSession(user: AuthUser) {
  const cookieStore = await cookies();
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const token = createSessionToken({ userId: user.id, role: user.role as AppRole, exp });

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE
  });
  cookieStore.delete(LEGACY_ROLE_COOKIE);
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(LEGACY_ROLE_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const payload = readSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
  });

  if (!user) return null;
  if (user.role !== payload.role) return null;
  return { ...user, role: user.role as AppRole };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: AppRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export function roleLabel(role: AppRole) {
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "TEACHER") return "Guru";
  return "Murid";
}

import { createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { z } from 'zod';
import { prisma } from './prisma.js';
const scrypt = promisify(nodeScrypt);
const credentials = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
});
export const signupInput = credentials.extend({
  acceptTerms: z.literal(true),
  plan: z.enum(['FREE', 'CREATOR', 'PRO', 'EXPERT', 'TEAM']).default('FREE'),
});
export const signinInput = credentials;
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Email or password is incorrect.');
    this.name = 'InvalidCredentialsError';
  }
}
export class EmailAlreadyUsedError extends Error {
  constructor() {
    super('Unable to create an account with those details.');
    this.name = 'EmailAlreadyUsedError';
  }
}
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString('hex')}`;
}
async function verifyPassword(password: string, encoded: string) {
  const [, salt, expectedHex] = encoded.split(':');
  if (!salt || !expectedHex) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
function token(userId: string, email: string) {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) throw new Error('AUTH_JWT_SECRET is required for account authentication.');
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
      ...(process.env.AUTH_JWT_ISSUER ? { iss: process.env.AUTH_JWT_ISSUER } : {}),
    }),
  ).toString('base64url');
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}
export async function signup(input: unknown) {
  const data = signupInput.parse(input);
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existing) throw new EmailAlreadyUsedError();
  const user = await prisma.user.create({
    data: { email: data.email, passwordHash: await hashPassword(data.password), plan: data.plan },
  });
  return {
    token: token(user.id, user.email),
    user: {
      id: user.id,
      email: user.email,
      plan: user.plan,
      onboardingCompleted: user.onboardingCompleted,
    },
  };
}
export async function signin(input: unknown) {
  const data = signinInput.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !(await verifyPassword(data.password, user.passwordHash)))
    throw new InvalidCredentialsError();
  return {
    token: token(user.id, user.email),
    user: {
      id: user.id,
      email: user.email,
      plan: user.plan,
      onboardingCompleted: user.onboardingCompleted,
    },
  };
}
export async function getAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, plan: true, onboardingCompleted: true },
  });
  if (!user) throw new InvalidCredentialsError();
  return user;
}
export async function completeOnboarding(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true },
    select: { id: true, email: true, plan: true, onboardingCompleted: true },
  });
}
export function authServiceErrorStatus(error: unknown) {
  if (error instanceof z.ZodError) return 400;
  if (error instanceof EmailAlreadyUsedError) return 409;
  if (error instanceof InvalidCredentialsError) return 401;
  return 500;
}

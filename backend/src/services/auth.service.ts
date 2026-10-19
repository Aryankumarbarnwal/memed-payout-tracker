import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { AppError } from '../utils/AppError';
import { Role } from '../types';

export interface TokenPayload {
  sub: string;
  role: Role;
}

function signToken(user: IUser): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');

  const payload: TokenPayload = { sub: user._id.toString(), role: user.role };
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
  return jwt.sign(payload, secret, { expiresIn });
}

function publicUser(user: IUser) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

export async function signup(input: { name: string; email: string; password: string; role: Role }) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) throw new AppError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
  });

  return { token: signToken(user), user: publicUser(user) };
}

export async function login(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email.toLowerCase() });
  // email galat ho ya password, same message: attacker ko pata na chale ki email exist karta hai
  const ok = user && (await bcrypt.compare(input.password, user.passwordHash));
  if (!user || !ok) throw new AppError(401, 'Invalid email or password');

  return { token: signToken(user), user: publicUser(user) };
}

export async function getUserById(id: string) {
  const user = await User.findById(id);
  if (!user) throw new AppError(404, 'User not found');
  return publicUser(user);
}
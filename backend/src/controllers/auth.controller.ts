import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import * as authService from '../services/auth.service';

const signupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(['brand', 'creator']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signup = asyncHandler(async (req, res) => {
  const data = signupSchema.parse(req.body);
  const result = await authService.signup(data);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data);
  res.json(result);
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user!.id);
  res.json({ user });
});
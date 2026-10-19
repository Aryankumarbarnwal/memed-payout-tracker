import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import * as submissionService from '../services/submission.service';

const createSchema = z.object({
  campaignId: z.string().min(1),
  postUrl: z.string().url().max(500),
});

const viewsSchema = z.object({
  views: z.number().int().min(0),
});

export const create = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const submission = await submissionService.createSubmission(req.user!.id, data);
  res.status(201).json({ submission });
});

export const listMine = asyncHandler(async (req, res) => {
  const result = await submissionService.listCreatorSubmissions(req.user!.id);
  res.json(result);
});

export const updateViews = asyncHandler(async (req, res) => {
  const { views } = viewsSchema.parse(req.body);
  const result = await submissionService.updateViews(req.params.id as string, views);
  res.json(result);
});
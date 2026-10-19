import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import * as campaignService from '../services/campaign.service';

const milestoneSchema = z.object({
  views: z.number().int().positive(),
  payout: z.number().int().positive(),
});

const createSchema = z
  .object({
    name: z.string().min(1).max(150),
    platform: z.enum(['instagram', 'youtube']),
    totalBudget: z.number().int().positive(),
    milestones: z.array(milestoneSchema).min(1).max(20),
  })
  .superRefine((data, ctx) => {
    const sorted = [...data.milestones].sort((a, b) => a.views - b.views);

    // thresholds unique hone chahiye
    if (new Set(sorted.map((m) => m.views)).size !== sorted.length) {
      ctx.addIssue({ code: 'custom', path: ['milestones'], message: 'View thresholds must be unique' });
    }

    // upar ke milestone ka payout zyada hona chahiye
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].payout <= sorted[i - 1].payout) {
        ctx.addIssue({
          code: 'custom',
          path: ['milestones'],
          message: 'Payout must increase with view threshold',
        });
        break;
      }
    }

    // sabse bada payout budget se zyada nahi hona chahiye
    const top = sorted[sorted.length - 1];
    if (top.payout > data.totalBudget) {
      ctx.addIssue({
        code: 'custom',
        path: ['totalBudget'],
        message: 'Highest milestone payout cannot exceed total budget',
      });
    }
  });

export const create = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const campaign = await campaignService.createCampaign(req.user!.id, data);
  res.status(201).json({ campaign });
});

export const listMine = asyncHandler(async (req, res) => {
  const campaigns = await campaignService.listBrandCampaigns(req.user!.id);
  res.json({ campaigns });
});

export const listLive = asyncHandler(async (_req, res) => {
  const campaigns = await campaignService.listLiveCampaigns();
  res.json({ campaigns });
});
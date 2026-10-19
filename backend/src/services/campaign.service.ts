import { Campaign, ICampaign } from '../models/Campaign';
import { Milestone, Platform } from '../types';

// API response shape. remaining yahin calculate hota hai (DB mein store nahi)
export function toCampaignDTO(c: ICampaign) {
  return {
    id: c._id,
    brandId: c.brandId,
    name: c.name,
    platform: c.platform,
    totalBudget: c.totalBudget,
    spent: c.spent,
    remaining: c.totalBudget - c.spent,
    milestones: c.milestones,
  };
}

export async function createCampaign(
  brandId: string,
  input: { name: string; platform: Platform; totalBudget: number; milestones: Milestone[] }
) {
  const campaign = await Campaign.create({ ...input, brandId });
  return toCampaignDTO(campaign.toObject());
}

export async function listBrandCampaigns(brandId: string) {
  const campaigns = await Campaign.find({ brandId }).sort({ createdAt: -1 }).lean<ICampaign[]>();
  return campaigns.map(toCampaignDTO);
}

// "Live" = budget abhi bacha hai (spent < totalBudget)
export async function listLiveCampaigns() {
  const campaigns = await Campaign.find({ $expr: { $gt: ['$totalBudget', '$spent'] } })
    .sort({ createdAt: -1 })
    .lean<ICampaign[]>();
  return campaigns.map(toCampaignDTO);
}
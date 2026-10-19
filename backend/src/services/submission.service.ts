import { Types } from 'mongoose';
import { Submission, ISubmission } from '../models/Submission';
import { Campaign, ICampaign } from '../models/Campaign';
import { AppError } from '../utils/AppError';
import { calculatePayout } from './payout.service';
import { Platform } from '../types';

const ALLOWED_HOSTS: Record<Platform, string[]> = {
  instagram: ['instagram.com', 'www.instagram.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'],
};

const MAX_RETRIES = 5;

export function toSubmissionDTO(s: ISubmission) {
  return {
    id: s._id,
    campaignId: s.campaignId,
    postUrl: s.postUrl,
    views: s.views,
    paidAmount: s.paidAmount,
    flagged: s.flagged,
  };
}

export async function createSubmission(
  creatorId: string,
  input: { campaignId: string; postUrl: string }
) {
  if (!Types.ObjectId.isValid(input.campaignId)) throw new AppError(400, 'Invalid campaign id');

  const campaign = await Campaign.findById(input.campaignId).lean<ICampaign>();
  if (!campaign) throw new AppError(404, 'Campaign not found');
  if (campaign.spent >= campaign.totalBudget) {
    throw new AppError(400, 'Campaign is no longer live');
  }

  // link campaign ke platform ka hona chahiye
  const host = new URL(input.postUrl).hostname.toLowerCase();
  if (!ALLOWED_HOSTS[campaign.platform].includes(host)) {
    throw new AppError(400, `Post link must be a ${campaign.platform} link`);
  }

  const submission = await Submission.create({
    campaignId: campaign._id,
    creatorId,
    postUrl: input.postUrl,
  });
  return toSubmissionDTO(submission.toObject());
}

export async function listCreatorSubmissions(creatorId: string) {
  const subs = await Submission.find({ creatorId }).sort({ createdAt: -1 }).lean<ISubmission[]>();

  const campaigns = await Campaign.find({ _id: { $in: subs.map((s) => s.campaignId) } })
    .select('name platform')
    .lean<Pick<ICampaign, '_id' | 'name' | 'platform'>[]>();
  const byId = new Map(campaigns.map((c) => [c._id.toString(), c]));

  const submissions = subs.map((s) => ({
    ...toSubmissionDTO(s),
    campaign: byId.get(s.campaignId.toString()) ?? null,
  }));
  const totalEarnings = subs.reduce((sum, s) => sum + s.paidAmount, 0);

  return { submissions, totalEarnings };
}

/**
 * Views update + payout. Concurrency-safe (transactions ke bina):
 *
 * 1. Delta nikalo (pure function calculatePayout).
 * 2. Campaign budget ATOMICALLY reserve karo (single DB operation, min(amount, remaining)).
 * 3. Submission ko "paidAmount == jo humne padha tha" condition ke saath update karo.
 *    Agar kisi aur request ne beech mein pay kar diya, to condition fail hoti hai,
 *    reserved budget wapas karo aur retry karo.
 */
export async function updateViews(id: string, views: number) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const sub = await Submission.findById(id).lean<ISubmission>();
    if (!sub) throw new AppError(404, 'Submission not found');
    if (views < sub.views) throw new AppError(400, 'Views cannot decrease');

    const campaign = await Campaign.findById(sub.campaignId).lean<ICampaign>();
    if (!campaign) throw new AppError(404, 'Campaign not found');

    const amount = calculatePayout(
      views,
      campaign.milestones,
      sub.paidAmount,
      campaign.totalBudget - campaign.spent
    );

    // koi payout nahi banta: sirf views save karo
    if (amount === 0) {
      const updated = await Submission.findByIdAndUpdate(
        id,
        { $max: { views }, $set: { lastViewsUpdateAt: new Date() } },
        { new: true }
      ).lean<ISubmission>();
      return { submission: toSubmissionDTO(updated!), paidNow: 0 };
    }

    // Step 2: atomic budget reserve. spent kabhi totalBudget se upar nahi jaata.
    const before = await Campaign.findOneAndUpdate(
      { _id: campaign._id },
      [
        {
          $set: {
            spent: {
              $add: ['$spent', { $min: [amount, { $subtract: ['$totalBudget', '$spent'] }] }],
            },
          },
        },
      ],
      { returnDocument: 'before' }
    ).lean<ICampaign>();
    if (!before) throw new AppError(404, 'Campaign not found');

    const reserved = Math.min(amount, Math.max(before.totalBudget - before.spent, 0));

    // Step 3: submission claim (optimistic lock on paidAmount)
    const updated = await Submission.findOneAndUpdate(
      { _id: id, paidAmount: sub.paidAmount },
      {
        $inc: { paidAmount: reserved },
        $max: { views },
        $set: { lastViewsUpdateAt: new Date() },
      },
      { new: true }
    ).lean<ISubmission>();

    if (!updated) {
      // race haar gaye: budget wapas karke dobara try
      if (reserved > 0) await Campaign.updateOne({ _id: campaign._id }, { $inc: { spent: -reserved } });
      continue;
    }

    return { submission: toSubmissionDTO(updated), paidNow: reserved };
  }

  throw new AppError(409, 'Too many concurrent updates, please retry');
}
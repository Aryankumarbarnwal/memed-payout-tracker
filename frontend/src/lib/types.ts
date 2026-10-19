export type Role = 'brand' | 'creator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Milestone {
  views: number;
  payout: number;
}

export interface Campaign {
  id: string;
  name: string;
  platform: 'instagram' | 'youtube';
  totalBudget: number;
  spent: number;
  remaining: number;
  milestones: Milestone[];
}

export interface Submission {
  id: string;
  campaignId: string;
  postUrl: string;
  views: number;
  paidAmount: number;
  flagged: boolean;
  campaign: { name: string; platform: string } | null;
}
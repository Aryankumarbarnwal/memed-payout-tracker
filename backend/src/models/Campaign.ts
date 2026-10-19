import {Schema, model, Types} from 'mongoose';
import { Milestone, Platform } from '../types';

export interface ICampaign {
    _id: Types.ObjectId;
    brandId: Types.ObjectId;
    name: string;
    platform: Platform;
    totalBudget: number;
    spent: number;
    milestones: Milestone[];
}

const milestoneSchema = new Schema<Milestone>({
    views: { type: Number, required: true, min: 1 },
    payout: {type: Number, required: true, min: 1},
},
    {_id: false}
);

const campaignSchema = new Schema<ICampaign>(
    {
        brandId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        name: { type: String, required: true, trim: true },
        platform: { type: String, enum: ['instagram', 'youtube'], required: true },
        totalBudget: { type: Number, required: true, min: 1 },
        spent: { type: Number, default: 0, min: 0 },
        milestones: {
            type: [milestoneSchema],
            validate: [
                {
                    validator: (m :Milestone[]) => m.length > 0,
                    message: 'At least one milestone is required'
                },
                {
                    validator: (m :Milestone[]) => new Set(m.map((x) => x.views)).size == m.length,
                    message: 'Milestone views must be unique',
                }
            ]
        }
    },
    { timestamps: true }
);

campaignSchema.pre('validate', async function () {
    this.milestones.sort((a, b) => a.views - b.views);
});

campaignSchema.virtual('remaining').get(function () {
    return this.totalBudget - this.spent;
});

campaignSchema.virtual('remaining').get(function () {
    return this.totalBudget - this.spent;
});

campaignSchema.set('toJSON', { virtuals: true });

export const Campaign = model<ICampaign>('Campaign', campaignSchema);
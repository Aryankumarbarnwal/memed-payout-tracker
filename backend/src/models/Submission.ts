import { Schema, model, Types } from 'mongoose';

export interface ISubmission {
  _id: Types.ObjectId;
  campaignId: Types.ObjectId;
  creatorId: Types.ObjectId;
  postUrl: string;
  views: number;
  paidAmount: number;
  flagged: boolean;
  lastViewsUpdateAt?: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    postUrl: { type: String, required: true, trim: true },
    views: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    flagged: { type: Boolean, default: false },
    lastViewsUpdateAt: { type: Date },
  },
  { timestamps: true }
);

// ek campaign mein same post link do baar submit nahi ho sakta
submissionSchema.index({ campaignId: 1, postUrl: 1 }, { unique: true });

export const Submission = model<ISubmission>('Submission', submissionSchema);
import {Milestone} from '../types';

export function highestMilestonePayout(views: number, milestones: Milestone[]): number {
    let best: Milestone | null = null;

    for(const m of milestones) {
        if(views >= m.views && (best === null || m.views > best.views)) {
            best = m;
        }
    }

    return best ? best.payout : 0;
}

export function calculatePayout(
    views: number, 
    milestones: Milestone[],
    alreadyPaid: number,
    remainingBudget: number
): number {
    const eligible = highestMilestonePayout(views, milestones);
    const delta = Math.max(eligible - alreadyPaid, 0);
    const cappedRemaining = Math.max(remainingBudget, 0);

    return Math.min(delta, cappedRemaining);
}
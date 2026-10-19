import { calculatePayout, highestMilestonePayout } from '../services/payout.service';
import {Milestone} from '../types/index'

const ladder: Milestone[] = [
  { views: 10_000, payout: 500 },
  { views: 50_000, payout: 2_000 },
  { views: 100_000, payout: 5_000 },
];

describe('highestMilestonePayout', () => {
  it('returns 0 below the first milestone', () => {
    expect(highestMilestonePayout(9_999, ladder)).toBe(0);
  });

  it('pays the milestone when views exactly equal the threshold', () => {
    expect(highestMilestonePayout(10_000, ladder)).toBe(500);
  });

  it('returns the highest milestone crossed, not the sum', () => {
    expect(highestMilestonePayout(75_000, ladder)).toBe(2_000);
  });

  it('works even if milestones are given unsorted', () => {
    const unsorted = [ladder[2], ladder[0], ladder[1]];
    expect(highestMilestonePayout(60_000, unsorted)).toBe(2_000);
  });

  it('returns the top payout when views are far beyond the last milestone', () => {
    expect(highestMilestonePayout(10_000_000, ladder)).toBe(5_000);
  });
});

describe('calculatePayout', () => {
  it('pays full eligible amount for a first-time milestone', () => {
    expect(calculatePayout(10_000, ladder, 0, 100_000)).toBe(500);
  });

  it('pays only the difference when a higher milestone is reached later', () => {
    expect(calculatePayout(50_000, ladder, 500, 100_000)).toBe(1_500);
  });

  it('pays highest milestone only (not both) when two are crossed in one update', () => {
    expect(calculatePayout(60_000, ladder, 0, 100_000)).toBe(2_000);
  });

  it('pays nothing on a repeated update (no double pay)', () => {
    expect(calculatePayout(50_000, ladder, 2_000, 100_000)).toBe(0);
  });

  it('pays nothing when views are below the first milestone', () => {
    expect(calculatePayout(500, ladder, 0, 100_000)).toBe(0);
  });
});

describe('budget cap', () => {
  it('pays a partial amount when budget runs out mid-payout', () => {
    expect(calculatePayout(50_000, ladder, 0, 1_200)).toBe(1_200);
  });

  it('pays nothing when the budget is exhausted', () => {
    expect(calculatePayout(100_000, ladder, 0, 0)).toBe(0);
  });

  it('never returns a negative payout for a negative remaining budget', () => {
    expect(calculatePayout(100_000, ladder, 0, -50)).toBe(0);
  });

  it('pays the full amount when remaining budget exactly equals the payout', () => {
    expect(calculatePayout(10_000, ladder, 0, 500)).toBe(500);
  });
});
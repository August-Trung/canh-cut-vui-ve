import { describe, it, expect } from 'vitest';
import { calculateCozyRating, getCoinDropMultiplier } from '../DecorationService';
import type { PlacedDecoration } from '@penguin/types';

describe('DecorationService', () => {
  it('calculates cozy rating by summing cozy points from catalog', () => {
    const decorations: PlacedDecoration[] = [
      { instanceId: '1', decorationId: 'bench_wood', plotId: 1, placedAt: 1000 }, // 10 pts
      { instanceId: '2', decorationId: 'pine_crystal', plotId: 2, placedAt: 1000 }, // 15 pts
    ];
    expect(calculateCozyRating(decorations)).toBe(25);
  });

  it('caps coin drop multiplier at +25%', () => {
    expect(getCoinDropMultiplier(0)).toBe(1.0);
    expect(getCoinDropMultiplier(50)).toBe(1.05); // 50 / 10 = +5% -> 1.05
    expect(getCoinDropMultiplier(250)).toBe(1.25); // +25%
    expect(getCoinDropMultiplier(500)).toBe(1.25); // capped at +25%
  });
});

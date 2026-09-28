import { describe, it, expect } from 'vitest';
import { validateBreedingEligibility, calculateBreedingDuration } from '../BreedingService';
import { OwnedPenguin, BreedingSlot } from '@penguin/types';

describe('BreedingService', () => {
  const pA: OwnedPenguin = {
    id: 'p-1',
    speciesId: 'snowy',
    nickname: 'Snowy Dad',
    level: 3,
    exp: 250,
    happiness: 90,
    hunger: 20,
    mood: 'happy',
    lastPetAt: 0,
    lastFedAt: 0,
    lastNeedsUpdateAt: 1000,
    generation: 1,
    traits: [],
    breedingCount: 0,
    lastBredAt: 0,
    createdAt: 1000,
  };

  const pB: OwnedPenguin = {
    id: 'p-2',
    speciesId: 'sleepy',
    nickname: 'Sleepy Mom',
    level: 3,
    exp: 250,
    happiness: 85,
    hunger: 30,
    mood: 'happy',
    lastPetAt: 0,
    lastFedAt: 0,
    lastNeedsUpdateAt: 1000,
    generation: 1,
    traits: [],
    breedingCount: 0,
    lastBredAt: 0,
    createdAt: 1000,
  };

  const emptySlot: BreedingSlot = {
    slotId: 1,
    state: 'EMPTY',
  };

  it('approves eligible parents with sufficient funds and empty slot', () => {
    const res = validateBreedingEligibility(pA, pB, 500, 5, emptySlot, 2000000);
    expect(res.eligible).toBe(true);
    expect(res.reason).toBeUndefined();
  });

  it('rejects breeding the same penguin with itself', () => {
    const res = validateBreedingEligibility(pA, pA, 500, 5, emptySlot, 2000000);
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe('SAME_PENGUIN');
  });

  it('rejects parents below Level 3', () => {
    const lowLvl: OwnedPenguin = { ...pB, level: 2 };
    const res = validateBreedingEligibility(pA, lowLvl, 500, 5, emptySlot, 2000000);
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe('LEVEL_TOO_LOW');
  });

  it('rejects parents currently on 30-minute cooldown', () => {
    // Cooldown is 1,800,000ms. If bred at t=1,000,000, at t=2,000,000 (diff 1,000,000 < 1,800,000), should reject.
    const coolingPenguin: OwnedPenguin = { ...pA, lastBredAt: 1000000 };
    const res = validateBreedingEligibility(coolingPenguin, pB, 500, 5, emptySlot, 2000000);
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe('ON_COOLDOWN');
  });

  it('allows parents with lastBredAt === 0 (never bred)', () => {
    const neverBredA: OwnedPenguin = { ...pA, lastBredAt: 0 };
    const neverBredB: OwnedPenguin = { ...pB, lastBredAt: 0 };
    const res = validateBreedingEligibility(neverBredA, neverBredB, 500, 5, emptySlot, 1000);
    expect(res.eligible).toBe(true);
  });

  it('allows parents when cooldown has expired (elapsed >= 30m)', () => {
    const readyPenguin: OwnedPenguin = { ...pA, lastBredAt: 1000000 };
    // At t=2,900,000 (diff 1,900,000 >= 1,800,000)
    const res = validateBreedingEligibility(readyPenguin, pB, 500, 5, emptySlot, 2900000);
    expect(res.eligible).toBe(true);
  });

  it('rejects starving parents (hunger >= 80)', () => {
    const starving: OwnedPenguin = { ...pA, hunger: 85 };
    const res = validateBreedingEligibility(starving, pB, 500, 5, emptySlot, 2000000);
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe('STARVING');
  });

  it('rejects insufficient coins or gems', () => {
    const resCoins = validateBreedingEligibility(pA, pB, 150, 5, emptySlot, 2000000);
    expect(resCoins.eligible).toBe(false);
    expect(resCoins.reason).toBe('INSUFFICIENT_FUNDS');

    const resGems = validateBreedingEligibility(pA, pB, 500, 0, emptySlot, 2000000);
    expect(resGems.eligible).toBe(false);
    expect(resGems.reason).toBe('INSUFFICIENT_FUNDS');
  });

  it('rejects when active breeding slot is occupied', () => {
    const occupiedSlot: BreedingSlot = { slotId: 1, state: 'BREEDING', startedAt: 1000 };
    const res = validateBreedingEligibility(pA, pB, 500, 5, occupiedSlot, 2000000);
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe('SLOT_OCCUPIED');
  });

  it('calculates breeding duration and applies non-stacking romantic bonus', () => {
    // Standard duration = 300s
    expect(calculateBreedingDuration(pA, pB, false)).toBe(300);
    expect(calculateBreedingDuration(pA, pB, true)).toBe(15);

    // One romantic parent -> 25% reduction (300 * 0.75 = 225)
    const pRomanticA: OwnedPenguin = { ...pA, traits: ['romantic'] };
    expect(calculateBreedingDuration(pRomanticA, pB, false)).toBe(225);

    // Two romantic parents -> non-stacking, still 225s!
    const pRomanticB: OwnedPenguin = { ...pB, traits: ['romantic'] };
    expect(calculateBreedingDuration(pRomanticA, pRomanticB, false)).toBe(225);
  });
});

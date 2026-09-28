import { describe, it, expect } from 'vitest';
import {
  simulatePenguinNeeds,
  derivePenguinMood,
  isFavoriteFood,
  calculateCareRewards,
} from '../NeedsService';
import type { OwnedPenguin } from '@penguin/types';

function createMockPenguin(overrides: Partial<OwnedPenguin> = {}): OwnedPenguin {
  return {
    id: 'p1',
    speciesId: 'snowy',
    nickname: 'Bé Tuyết',
    level: 1,
    exp: 0,
    happiness: 80,
    hunger: 20,
    mood: 'happy',
    lastPetAt: 0,
    lastFedAt: 0,
    lastNeedsUpdateAt: 1000000,
    generation: 1,
    createdAt: 1000000,
    ...overrides,
  };
}

describe('NeedsService', () => {
  describe('simulatePenguinNeeds', () => {
    it('increases hunger by 1 per 120s for normal species, clamped to 100', () => {
      const p = createMockPenguin({ speciesId: 'snowy', hunger: 20, happiness: 100, lastNeedsUpdateAt: 1000 });
      // 240 seconds = +2 hunger
      simulatePenguinNeeds(p, 1000 + 240 * 1000);
      expect(p.hunger).toBe(22);
      expect(p.lastNeedsUpdateAt).toBe(1000 + 240 * 1000);

      // Huge elapsed time clamps hunger to 100 and happiness to 0
      simulatePenguinNeeds(p, 1000 + 1000000 * 1000);
      expect(p.hunger).toBe(100);
      expect(p.happiness).toBe(0);
      expect(p.mood).toBe('hungry');
    });

    it('increases hunger by 1 per 96s for hungry species (1.25x accumulation)', () => {
      const p = createMockPenguin({ speciesId: 'hungry', hunger: 20, lastNeedsUpdateAt: 1000 });
      // 192 seconds = +2 hunger (192 / 96 = 2)
      simulatePenguinNeeds(p, 1000 + 192 * 1000);
      expect(p.hunger).toBe(22);
    });

    it('normal species starting at hunger 70 reaches 80 after 1200s, decaying 6 happiness before 80 and 1/90s thereafter', () => {
      const p = createMockPenguin({
        speciesId: 'snowy',
        hunger: 70,
        happiness: 80,
        lastNeedsUpdateAt: 1000,
      });

      // Exactly 1200s: reaches 80 hunger, 1200 / 180 = 6 points happiness decay
      simulatePenguinNeeds(p, 1000 + 1200 * 1000);
      expect(p.hunger).toBe(80);
      expect(p.happiness).toBe(74); // 80 - 6

      // Reset and simulate 1560s: 1200s before 80 + 360s after 80
      // Happiness decay: 6 + 360 / 90 = 6 + 4 = 10 points decay
      // Hunger: 80 + 360 / 120 = 80 + 3 = 83
      const p2 = createMockPenguin({
        speciesId: 'snowy',
        hunger: 70,
        happiness: 80,
        lastNeedsUpdateAt: 1000,
      });
      simulatePenguinNeeds(p2, 1000 + 1560 * 1000);
      expect(p2.hunger).toBe(83);
      expect(p2.happiness).toBe(70); // 80 - 10
    });

    it('hungry species starting at hunger 70 reaches 80 after 960s, decaying 5 happiness before 80 and 1/90s thereafter', () => {
      const p = createMockPenguin({
        speciesId: 'hungry',
        hunger: 70,
        happiness: 80,
        lastNeedsUpdateAt: 1000,
      });

      // Exactly 960s: reaches 80 hunger (10 * 96), 960 / 180 = 5 points decay
      simulatePenguinNeeds(p, 1000 + 960 * 1000);
      expect(p.hunger).toBe(80);
      expect(p.happiness).toBe(75); // 80 - 5

      // Reset and simulate 1320s: 960s before 80 + 360s after 80
      // Happiness decay: 5 + 360 / 90 = 5 + 4 = 9 points decay
      // Hunger: 80 + 360 / 96 = 80 + 3 = 83
      const p2 = createMockPenguin({
        speciesId: 'hungry',
        hunger: 70,
        happiness: 80,
        lastNeedsUpdateAt: 1000,
      });
      simulatePenguinNeeds(p2, 1000 + 1320 * 1000);
      expect(p2.hunger).toBe(83);
      expect(p2.happiness).toBe(71); // 80 - 9
    });

    it('when initial hunger is already >= 80, decays at 1/90s immediately', () => {
      const p = createMockPenguin({
        speciesId: 'snowy',
        hunger: 85,
        happiness: 50,
        lastNeedsUpdateAt: 1000,
      });
      // 180 seconds: 180 / 90 = 2 happiness decay; 180 / 120 = 1 hunger increase
      simulatePenguinNeeds(p, 1000 + 180 * 1000);
      expect(p.hunger).toBe(86);
      expect(p.happiness).toBe(48);
    });
  });

  describe('derivePenguinMood', () => {
    it('strictly follows mood priority order', () => {
      // 1. hungry takes absolute priority
      expect(derivePenguinMood(80, 100, false)).toBe('hungry');
      expect(derivePenguinMood(85, 10, true)).toBe('hungry');

      // 2. sad takes priority over happy/content/sleepy when hunger < 80
      expect(derivePenguinMood(79, 25, true)).toBe('sad');
      expect(derivePenguinMood(0, 10, false)).toBe('sad');

      // 3. sleepy when isSleeping
      expect(derivePenguinMood(30, 50, true)).toBe('sleepy');

      // 4. happy when happiness >= 80
      expect(derivePenguinMood(30, 80, false)).toBe('happy');
      expect(derivePenguinMood(30, 100, false)).toBe('happy');

      // 5. content otherwise
      expect(derivePenguinMood(30, 79, false)).toBe('content');
      expect(derivePenguinMood(79, 26, false)).toBe('content');
    });
  });

  describe('isFavoriteFood', () => {
    it('checks favorite food matching from species definition', () => {
      expect(isFavoriteFood('snowy', 'sardine')).toBe(true);
      expect(isFavoriteFood('snowy', 'fat_salmon')).toBe(false);
      expect(isFavoriteFood('hungry', 'fat_salmon')).toBe(true);
      expect(isFavoriteFood('sleepy', 'warm_milk')).toBe(true);
      expect(isFavoriteFood('shy', 'sweet_berries')).toBe(true);
      expect(isFavoriteFood('happy', 'ice_cream')).toBe(true);
    });
  });

  describe('calculateCareRewards', () => {
    it('petting awards +8 happiness, +3 penguin EXP, +2 player EXP, and strictly 0 coins', () => {
      const rewards = calculateCareRewards('snowy', undefined);
      expect(rewards.coins).toBe(0);
      expect(rewards.happinessBonus).toBe(8);
      expect(rewards.penguinExp).toBe(3);
      expect(rewards.playerExp).toBe(2);
    });

    it('feeding standard food awards standard effects and 2-5 coins', () => {
      const rewards = calculateCareRewards('snowy', 'krill');
      expect(rewards.coins).toBeGreaterThanOrEqual(2);
      expect(rewards.coins).toBeLessThanOrEqual(5);
      expect(rewards.playerExp).toBe(5);
      expect(rewards.penguinExp).toBe(5);
      expect(rewards.hungerReduction).toBe(30); // krill standard
    });

    it('feeding favorite food awards bonus EXP, extra coins, and 18 Penguin EXP for Hungry species', () => {
      // Normal species favorite food
      const snowyRewards = calculateCareRewards('snowy', 'sardine');
      expect(snowyRewards.playerExp).toBe(12);
      expect(snowyRewards.penguinExp).toBe(15);
      expect(snowyRewards.hungerReduction).toBe(38); // Math.round(25 * 1.5)
      expect(snowyRewards.happinessBonus).toBe(20); // 10 * 2.0
      expect(snowyRewards.coins).toBeGreaterThanOrEqual(10);

      // Hungry species eating fat_salmon
      const hungryRewards = calculateCareRewards('hungry', 'fat_salmon');
      expect(hungryRewards.playerExp).toBe(12);
      expect(hungryRewards.penguinExp).toBe(18); // 1.25x bonus on 15
      expect(hungryRewards.hungerReduction).toBe(83); // Math.round(55 * 1.5)
    });
  });
});

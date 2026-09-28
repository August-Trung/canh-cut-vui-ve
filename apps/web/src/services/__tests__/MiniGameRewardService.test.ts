import { describe, it, expect } from 'vitest';
import {
  calculateCatchFishReward,
  validateMiniGameSessionResult,
  canPlayMiniGame,
} from '../MiniGameRewardService';
import { MiniGameResult } from '@penguin/types';

describe('MiniGameRewardService', () => {
  describe('calculateCatchFishReward', () => {
    it('returns diamond tier rewards for score >= 180 with penguin EXP bounded [10, 35]', () => {
      // Score 200, Level 1
      const rewardLv1 = calculateCatchFishReward(200, 1);
      expect(rewardLv1.tier).toBe('diamond');
      expect(rewardLv1.coins).toBe(120); // 80 + 40 = 120
      expect(rewardLv1.playerExp).toBe(40);
      expect(rewardLv1.penguinExp).toBe(17); // 15 + 2 = 17 <= 35
      expect(rewardLv1.items).toHaveLength(2);

      // Score 200, Level 10 (Max level) -> penguin EXP strictly capped at 35
      const rewardLv10 = calculateCatchFishReward(200, 10);
      expect(rewardLv10.penguinExp).toBe(35); // 15 + 20 = 35 <= 35
      expect(rewardLv10.penguinExp).toBeLessThanOrEqual(35);
    });

    it('returns gold tier rewards for 110 <= score < 180', () => {
      const reward = calculateCatchFishReward(120, 3);
      expect(reward.tier).toBe('gold');
      expect(reward.coins).toBe(74); // 50 + 24
      expect(reward.playerExp).toBe(30);
      expect(reward.penguinExp).toBe(18); // 12 + 6
      expect(reward.items[0].itemId).toBe('krill');
    });

    it('returns silver tier rewards for 50 <= score < 110', () => {
      const reward = calculateCatchFishReward(70, 2);
      expect(reward.tier).toBe('silver');
      expect(reward.coins).toBe(44); // 30 + 14
      expect(reward.playerExp).toBe(20);
      expect(reward.penguinExp).toBe(12); // 10 + 2
      expect(reward.items[0].itemId).toBe('sardine');
    });

    it('returns bronze tier rewards for score < 50', () => {
      const reward = calculateCatchFishReward(30, 1);
      expect(reward.tier).toBe('bronze');
      expect(reward.coins).toBe(16); // 10 + 6
      expect(reward.playerExp).toBe(10);
      expect(reward.penguinExp).toBe(10);
      expect(reward.items[0].quantity).toBe(1);
    });

    it('applies angler trait bonus to score (+20%)', () => {
      // 100 without trait is silver (coins: 30 + 20 = 50)
      const withoutTrait = calculateCatchFishReward(100, 1, []);
      expect(withoutTrait.tier).toBe('silver');

      // 100 with angler trait -> 120 points -> gold tier!
      const withTrait = calculateCatchFishReward(100, 1, ['angler']);
      expect(withTrait.tier).toBe('gold');
    });

    it('clamps negative scores to 0 and extreme scores to 500 max cap', () => {
      const neg = calculateCatchFishReward(-50, 1);
      expect(neg.tier).toBe('bronze');
      expect(neg.coins).toBe(10);

      const extreme = calculateCatchFishReward(99999, 10);
      expect(extreme.tier).toBe('diamond');
      expect(extreme.coins).toBe(120); // capped
      expect(extreme.penguinExp).toBe(35); // capped
    });
  });

  describe('validateMiniGameSessionResult', () => {
    it('validates a correct session result', () => {
      const validResult: MiniGameResult = {
        sessionId: 'sess-abc',
        gameId: 'catch_fish',
        score: 150,
        accuracy: 95,
        catchesCount: 10,
        durationSec: 30,
        completedAt: 1000,
      };
      const res = validateMiniGameSessionResult(validResult, 30);
      expect(res.valid).toBe(true);
    });

    it('rejects results with duration discrepancies beyond tolerance (±2s)', () => {
      const invalidResult: MiniGameResult = {
        sessionId: 'sess-abc',
        gameId: 'catch_fish',
        score: 150,
        accuracy: 95,
        catchesCount: 10,
        durationSec: 10, // too short!
        completedAt: 1000,
      };
      const res = validateMiniGameSessionResult(invalidResult, 30);
      expect(res.valid).toBe(false);
      expect(res.reason).toBe('INVALID_DURATION');
    });

    it('rejects scores exceeding max score cap (500)', () => {
      const hackResult: MiniGameResult = {
        sessionId: 'sess-abc',
        gameId: 'catch_fish',
        score: 9999,
        accuracy: 100,
        catchesCount: 100,
        durationSec: 30,
        completedAt: 1000,
      };
      const res = validateMiniGameSessionResult(hackResult, 30);
      expect(res.valid).toBe(false);
      expect(res.reason).toBe('INVALID_SCORE');
    });
  });

  describe('canPlayMiniGame (Daily limits)', () => {
    it('allows 3 free plays without coin deduction', () => {
      const p1 = canPlayMiniGame('catch_fish', 0, 0);
      expect(p1.canPlay).toBe(true);
      expect(p1.isFree).toBe(true);
      expect(p1.cost).toBe(0);

      const p3 = canPlayMiniGame('catch_fish', 2, 0);
      expect(p3.canPlay).toBe(true);
      expect(p3.isFree).toBe(true);
    });

    it('charges 50 coins for extra plays 4, 5, 6 when coins are sufficient', () => {
      const p4 = canPlayMiniGame('catch_fish', 3, 100);
      expect(p4.canPlay).toBe(true);
      expect(p4.isFree).toBe(false);
      expect(p4.cost).toBe(50);
    });

    it('rejects extra play when coins < 50', () => {
      const p4 = canPlayMiniGame('catch_fish', 3, 20);
      expect(p4.canPlay).toBe(false);
      expect(p4.reason).toBe('INSUFFICIENT_FUNDS');
    });

    it('strictly enforces daily maximum cap of 6 plays', () => {
      const p7 = canPlayMiniGame('catch_fish', 6, 1000);
      expect(p7.canPlay).toBe(false);
      expect(p7.reason).toBe('DAILY_LIMIT_REACHED');
    });
  });
});

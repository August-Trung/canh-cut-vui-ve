import { describe, it, expect } from 'vitest';
import {
  getLocalDateString,
  getDeterministicDailyQuests,
  evaluateLoginStreak,
  LOGIN_STREAK_REWARDS,
} from '../QuestService';
import { QUEST_POOL } from '@penguin/game-data';

describe('QuestService', () => {
  describe('getLocalDateString', () => {
    it('formats a date as YYYY-MM-DD in local time', () => {
      const d = new Date(2026, 8, 28, 14, 30); // September 28, 2026
      expect(getLocalDateString(d)).toBe('2026-09-28');
    });
  });

  describe('getDeterministicDailyQuests (Array Reorder Immunity)', () => {
    it('selects exactly 3 active quests deterministically for a date', () => {
      const quests = getDeterministicDailyQuests('2026-09-28');
      expect(quests).toHaveLength(3);
      for (const q of quests) {
        expect(q.questId).toBeTruthy();
        expect(q.currentCount).toBe(0);
        expect(q.isCompleted).toBe(false);
        expect(q.isClaimed).toBe(false);
      }
    });

    it('produces the exact same quests regardless of input template array order', () => {
      const normalQuests = getDeterministicDailyQuests('2026-09-28', QUEST_POOL);

      // Reverse order of pool
      const reversedPool = [...QUEST_POOL].reverse();
      const fromReversed = getDeterministicDailyQuests('2026-09-28', reversedPool);

      expect(fromReversed.map((q) => q.questId)).toEqual(normalQuests.map((q) => q.questId));

      // Shuffled order of pool
      const shuffledPool = [QUEST_POOL[2], QUEST_POOL[4], QUEST_POOL[0], QUEST_POOL[3], QUEST_POOL[1]];
      const fromShuffled = getDeterministicDailyQuests('2026-09-28', shuffledPool);

      expect(fromShuffled.map((q) => q.questId)).toEqual(normalQuests.map((q) => q.questId));
    });
  });

  describe('evaluateLoginStreak', () => {
    it('disallows claim if already claimed today', () => {
      const result = evaluateLoginStreak(
        { lastClaimDate: '2026-09-28', currentStreak: 3 },
        '2026-09-28',
        '2026-09-27'
      );
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('ALREADY_CLAIMED');
    });

    it('advances streak by 1 if claimed yesterday', () => {
      const result = evaluateLoginStreak(
        { lastClaimDate: '2026-09-27', currentStreak: 3 },
        '2026-09-28',
        '2026-09-27'
      );
      expect(result.canClaim).toBe(true);
      expect(result.nextStreak).toBe(4);
    });

    it('loops back to Day 1 after Day 7', () => {
      const result = evaluateLoginStreak(
        { lastClaimDate: '2026-09-27', currentStreak: 7 },
        '2026-09-28',
        '2026-09-27'
      );
      expect(result.canClaim).toBe(true);
      expect(result.nextStreak).toBe(1);
    });

    it('resets streak to Day 1 if a calendar day was missed', () => {
      const result = evaluateLoginStreak(
        { lastClaimDate: '2026-09-25', currentStreak: 5 },
        '2026-09-28',
        '2026-09-27'
      );
      expect(result.canClaim).toBe(true);
      expect(result.nextStreak).toBe(1);
    });

    it('sets streak to Day 1 for fresh save (null lastClaimDate)', () => {
      const result = evaluateLoginStreak(
        { lastClaimDate: null, currentStreak: 1 },
        '2026-09-28',
        '2026-09-27'
      );
      expect(result.canClaim).toBe(true);
      expect(result.nextStreak).toBe(1);
    });
  });

  describe('LOGIN_STREAK_REWARDS', () => {
    it('has 7 days defined with Day 7 climax reward', () => {
      expect(LOGIN_STREAK_REWARDS).toHaveLength(7);
      expect(LOGIN_STREAK_REWARDS[0].coins).toBe(100);
      expect(LOGIN_STREAK_REWARDS[6].coins).toBe(1000);
      expect(LOGIN_STREAK_REWARDS[6].gems).toBe(10);
      expect(LOGIN_STREAK_REWARDS[6].items.find((i) => i.itemId === 'golden_egg')).toBeDefined();
    });
  });
});

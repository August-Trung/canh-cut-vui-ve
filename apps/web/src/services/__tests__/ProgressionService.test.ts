import { describe, it, expect } from 'vitest';
import {
  getPlayerLevelFromExp,
  getPenguinLevelFromExp,
  getMaxFlockCapacity,
  getNextFlockCapacityLevel,
  calculateLevelUpRewards,
  PLAYER_EXP_THRESHOLDS,
  PENGUIN_EXP_THRESHOLDS,
} from '../ProgressionService';

describe('ProgressionService', () => {
  describe('Player EXP & Level Calculations', () => {
    it('calculates player levels across thresholds correctly', () => {
      expect(getPlayerLevelFromExp(0).level).toBe(1);
      expect(getPlayerLevelFromExp(50).level).toBe(1);
      expect(getPlayerLevelFromExp(100).level).toBe(2);
      expect(getPlayerLevelFromExp(299).level).toBe(2);
      expect(getPlayerLevelFromExp(300).level).toBe(3);
      expect(getPlayerLevelFromExp(650).level).toBe(4);
      expect(getPlayerLevelFromExp(1200).level).toBe(5);
      expect(getPlayerLevelFromExp(2000).level).toBe(6);
      expect(getPlayerLevelFromExp(3100).level).toBe(7);
      expect(getPlayerLevelFromExp(4600).level).toBe(8);
      expect(getPlayerLevelFromExp(6600).level).toBe(9);
      expect(getPlayerLevelFromExp(9200).level).toBe(10);
      expect(getPlayerLevelFromExp(99999).level).toBe(10);
    });

    it('calculates progressPercent correctly for current level bracket', () => {
      // Level 1: 0 to 100
      const at50 = getPlayerLevelFromExp(50);
      expect(at50.level).toBe(1);
      expect(at50.currentLevelBaseExp).toBe(0);
      expect(at50.nextLevelExp).toBe(100);
      expect(at50.progressPercent).toBe(50);

      // Level 10 (Max): progressPercent is 100
      const atMax = getPlayerLevelFromExp(10000);
      expect(atMax.level).toBe(10);
      expect(atMax.progressPercent).toBe(100);
    });
  });

  describe('Penguin EXP & Level Calculations', () => {
    it('calculates penguin levels across thresholds correctly', () => {
      expect(getPenguinLevelFromExp(0).level).toBe(1);
      expect(getPenguinLevelFromExp(99).level).toBe(1);
      expect(getPenguinLevelFromExp(100).level).toBe(2);
      expect(getPenguinLevelFromExp(249).level).toBe(2);
      expect(getPenguinLevelFromExp(250).level).toBe(3);
      expect(getPenguinLevelFromExp(450).level).toBe(4);
      expect(getPenguinLevelFromExp(700).level).toBe(5);
      expect(getPenguinLevelFromExp(1000).level).toBe(6);
      expect(getPenguinLevelFromExp(1350).level).toBe(7);
      expect(getPenguinLevelFromExp(1750).level).toBe(8);
      expect(getPenguinLevelFromExp(2200).level).toBe(9);
      expect(getPenguinLevelFromExp(2700).level).toBe(10);
      expect(getPenguinLevelFromExp(5000).level).toBe(10);
    });
  });

  describe('Flock Capacity Gating', () => {
    it('scales flock capacity by player level', () => {
      expect(getMaxFlockCapacity(1)).toBe(2);
      expect(getMaxFlockCapacity(2)).toBe(3);
      expect(getMaxFlockCapacity(3)).toBe(3);
      expect(getMaxFlockCapacity(4)).toBe(3);
      expect(getMaxFlockCapacity(5)).toBe(4);
      expect(getMaxFlockCapacity(6)).toBe(4);
      expect(getMaxFlockCapacity(7)).toBe(4);
      expect(getMaxFlockCapacity(8)).toBe(5);
      expect(getMaxFlockCapacity(9)).toBe(5);
      expect(getMaxFlockCapacity(10)).toBe(5);
    });

    it('correctly calculates the next level that unlocks additional flock capacity', () => {
      expect(getNextFlockCapacityLevel(1)).toBe(2); // Lv 1 (cap 2) -> next is Lv 2 (cap 3)
      expect(getNextFlockCapacityLevel(2)).toBe(5); // Lv 2 (cap 3) -> next is Lv 5 (cap 4)
      expect(getNextFlockCapacityLevel(3)).toBe(5); // Lv 3 (cap 3) -> next is Lv 5 (cap 4)
      expect(getNextFlockCapacityLevel(4)).toBe(5); // Lv 4 (cap 3) -> next is Lv 5 (cap 4)
      expect(getNextFlockCapacityLevel(5)).toBe(8); // Lv 5 (cap 4) -> next is Lv 8 (cap 5)
      expect(getNextFlockCapacityLevel(6)).toBe(8); // Lv 6 (cap 4) -> next is Lv 8 (cap 5)
      expect(getNextFlockCapacityLevel(7)).toBe(8); // Lv 7 (cap 4) -> next is Lv 8 (cap 5)
      expect(getNextFlockCapacityLevel(8)).toBeNull(); // Lv 8 (cap 5) -> max capacity, null
      expect(getNextFlockCapacityLevel(10)).toBeNull();
    });
  });

  describe('calculateLevelUpRewards', () => {
    it('returns empty array when newLevel <= oldLevel', () => {
      expect(calculateLevelUpRewards(2, 2)).toEqual([]);
      expect(calculateLevelUpRewards(3, 2)).toEqual([]);
    });

    it('returns single level rewards when advancing 1 level', () => {
      const rewards = calculateLevelUpRewards(1, 2);
      expect(rewards).toHaveLength(1);
      expect(rewards[0]).toEqual({
        level: 2,
        coins: 100,
        gems: 0,
      });
    });

    it('returns cumulative sequential rewards for multi-level jumps', () => {
      const rewards = calculateLevelUpRewards(1, 4);
      expect(rewards).toHaveLength(3);
      expect(rewards[0]).toEqual({ level: 2, coins: 100, gems: 0 });
      expect(rewards[1]).toEqual({ level: 3, coins: 150, gems: 0 });
      expect(rewards[2]).toEqual({ level: 4, coins: 200, gems: 2 });
    });
  });
});

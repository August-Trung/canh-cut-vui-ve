import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '../stores/gameStore';
import { useQuestStore } from '../stores/questStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useBreedingStore } from '../stores/breedingStore';
import { calculateCatchFishReward } from '../services/MiniGameRewardService';
import type { MiniGameResult } from '@penguin/types';

describe('EconomySimulation: 30-Day Long-term Balance & Progression', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    setActivePinia(createPinia());
    const game = useGameStore();
    await game.initGame();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs a 30-day realistic player simulation without infinite currency loops, negative balances, or unchecked inflation', async () => {
    const gameStore = useGameStore();
    const questStore = useQuestStore();
    const invStore = useInventoryStore();
    const breedingStore = useBreedingStore();

    // Setup initial test state
    gameStore.currencies.coins = 500;
    gameStore.currencies.gems = 15;
    gameStore.player.level = 2; // Capacity 3
    gameStore.player.exp = 0;

    if (gameStore.ownedPenguins.length === 1) {
      gameStore.ownedPenguins[0].level = 3;
      gameStore.ownedPenguins[0].exp = 300;
      gameStore.ownedPenguins[0].experience = 300;
      gameStore.ownedPenguins[0].hunger = 20;

      gameStore.ownedPenguins.push({
        id: 'penguin_companion_2',
        speciesId: 'chinstrap',
        nickname: 'Pip',
        level: 3,
        exp: 300,
        experience: 300,
        hunger: 20,
        happiness: 85,
        mood: 'happy',
        lastPetAt: 0,
        lastFedAt: 0,
        lastNeedsUpdateAt: 0,
        traits: ['curious'],
        personality: 'adventurous',
        lastBredAt: 0,
      });
    }

    // Track progression metrics across the 30 days
    const coinHistory: number[] = [];
    const playerLevelHistory: number[] = [];
    let totalFishPlayed = 0;
    let totalBreedingSessions = 0;

    for (let day = 1; day <= 30; day++) {
      const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
      const dayStartTime = new Date(2026, 9, day, 8, 0, 0).getTime();
      vi.setSystemTime(dayStartTime);

      // 1. Daily Login
      const lastLogin = day === 1 ? '2026-09-30' : `2026-10-${String(day - 1).padStart(2, '0')}`;
      questStore.claimDailyLogin(dateStr, lastLogin);

      // 2. Initialize Daily Quests
      questStore.initQuests(dateStr);

      // 3. Daily Penguin Care: Pet each owned penguin
      for (const penguin of [...gameStore.ownedPenguins]) {
        // Pet with cooldown check
        gameStore.petPenguin(penguin.id);
      }

      // 4. Play Catch Fish Mini-game (Play 3 free sessions daily)
      for (let session = 0; session < 3; session++) {
        const startRes = gameStore.startMiniGameSession('catch_fish');
        expect(startRes.success).toBe(true);
        totalFishPlayed++;

        // Simulate a solid gameplay session
        const mockResult: MiniGameResult = {
          sessionId: startRes.sessionId!,
          gameId: 'catch_fish',
          companionPenguinId: gameStore.ownedPenguins[0]?.id,
          score: 120, // Gold tier
          catchesCount: 8,
          accuracy: 80,
          maxCombo: 5,
          durationSec: 30,
          hazardsHit: 0,
          specialFishCaught: 1,
        };

        const claimRes = gameStore.claimMiniGameReward(mockResult);
        expect(claimRes.success).toBe(true);
      }

      // Verify that after 3 free sessions, a 4th session costs 50 coins
      const fourthStart = gameStore.startMiniGameSession('catch_fish');
      if (gameStore.currencies.coins >= 50) {
        expect(fourthStart.success).toBe(true);
        totalFishPlayed++;
        const mockFourthResult: MiniGameResult = {
          sessionId: fourthStart.sessionId!,
          gameId: 'catch_fish',
          companionPenguinId: gameStore.ownedPenguins[0]?.id,
          score: 80, // Silver tier
          catchesCount: 6,
          accuracy: 75,
          maxCombo: 3,
          durationSec: 30,
          hazardsHit: 0,
          specialFishCaught: 0,
        };
        gameStore.claimMiniGameReward(mockFourthResult);
      }

      // 5. Breeding Loop: If we have at least 2 penguins with level >= 3, hunger < 80, and sufficient funds
      const maturePenguins = gameStore.ownedPenguins.filter((p) => p.level >= 3 && p.hunger < 80);
      if (
        maturePenguins.length >= 2 &&
        gameStore.currencies.coins >= 200 &&
        gameStore.currencies.gems >= 1 &&
        gameStore.breedingSlot.state === 'EMPTY'
      ) {
        breedingStore.selectedParentAId = maturePenguins[0].id;
        breedingStore.selectedParentBId = maturePenguins[1].id;

        const breedRes = breedingStore.startBreeding();
        if (breedRes.success) {
          totalBreedingSessions++;
          // Fast-forward 5 minutes to complete breeding
          vi.advanceTimersByTime(300_000);
          breedingStore.updateTimer();
          expect(breedingStore.breedingSlot.state).toBe('READY_TO_COLLECT');

          const collectRes = breedingStore.collectEgg();
          expect(collectRes.success).toBe(true);
          expect(breedingStore.breedingSlot.state).toBe('EMPTY');

          // Place breeding egg into incubator if a slot is empty
          const emptyIncubatorSlot = gameStore.incubatorSlots.find((s) => s.state === 'EMPTY');
          if (emptyIncubatorSlot) {
            gameStore.placeEggInIncubator(emptyIncubatorSlot.slotId, 'egg_breeding');
          }
        }
      }

      // 6. Complete and Claim Quests
      for (const quest of questStore.activeQuests) {
        if (!quest.isClaimed) {
          // Progress simulation
          quest.currentCount = quest.targetCount;
          quest.isCompleted = true;
          questStore.claimQuestReward(quest.questId);
        }
      }

      // Record daily metrics
      coinHistory.push(gameStore.currencies.coins);
      playerLevelHistory.push(gameStore.player.level);

      // Invariants check per day:
      // A. Currencies must never go negative
      expect(gameStore.currencies.coins).toBeGreaterThanOrEqual(0);
      expect(gameStore.currencies.gems).toBeGreaterThanOrEqual(0);

      // B. Penguin level must not exceed level cap (10)
      for (const p of gameStore.ownedPenguins) {
        expect(p.level).toBeLessThanOrEqual(10);
        expect(p.level).toBeGreaterThanOrEqual(1);
        expect(p.exp).toBeGreaterThanOrEqual(0);
      }

      // C. Inventory quantities must be positive integers
      for (const item of invStore.items) {
        expect(item.quantity).toBeGreaterThanOrEqual(1);
      }
    }

    // End of 30-Day Analysis
    expect(totalFishPlayed).toBeGreaterThanOrEqual(90); // At least 3 per day
    expect(playerLevelHistory[playerLevelHistory.length - 1]).toBeGreaterThanOrEqual(playerLevelHistory[0]);

    // Check that player didn't experience hyper-inflation or bankruptcy
    const finalCoins = gameStore.currencies.coins;
    expect(finalCoins).toBeGreaterThan(0);
    // Upper bound sanity check: Player shouldn't reach millions of coins from basic 30-day casual play
    expect(finalCoins).toBeLessThan(100_000);

    // Breeding sessions occurred without deadlocking
    expect(totalBreedingSessions).toBeGreaterThanOrEqual(1);

    // Daily play limits were enforced every day
    expect(gameStore.miniGameState.dailyPlaysCount['catch_fish']).toBeLessThanOrEqual(6);
  });

  it('strictly enforces daily caps and cooldowns against spam and exploit loops', async () => {
    const gameStore = useGameStore();
    gameStore.currencies.coins = 10000;
    const penguin = gameStore.ownedPenguins[0];

    // 1. Pet spam protection: 1st pet succeeds, immediately subsequent calls within 15s fail
    penguin.lastPetAt = 0;
    const firstPet = gameStore.petPenguin(penguin.id);
    expect(firstPet).toBe(true);
    const secondPet = gameStore.petPenguin(penguin.id);
    expect(secondPet).toBe(false);

    // 2. Mini-game daily cap hard gate: Exactly 6 plays permitted per day
    for (let i = 0; i < 6; i++) {
      const start = gameStore.startMiniGameSession('catch_fish');
      expect(start.success).toBe(true);
    }

    // 7th attempt MUST fail with DAILY_LIMIT_REACHED even with 10,000 coins
    const seventh = gameStore.startMiniGameSession('catch_fish');
    expect(seventh.success).toBe(false);
    expect(seventh.reason).toBe('DAILY_LIMIT_REACHED');

    // 3. New calendar day resets daily mini-game count
    vi.advanceTimersByTime(86400_000); // 24 hours later
    const nextDayFirst = gameStore.startMiniGameSession('catch_fish');
    expect(nextDayFirst.success).toBe(true);
    expect(nextDayFirst.isFree).toBe(true); // Free again!
  });
});

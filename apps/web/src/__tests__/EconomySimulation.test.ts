import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '../stores/gameStore';
import { useQuestStore } from '../stores/questStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useBreedingStore } from '../stores/breedingStore';

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

    // Seed food for care loop
    invStore.addItem({
      itemId: 'sardine',
      category: 'food',
      name: 'Small Sardine',
      description: 'Fresh fish for feeding',
      quantity: 100,
      stackable: true,
    });

    // Track progression metrics across the 30 days
    const coinHistory: number[] = [];
    const playerLevelHistory: number[] = [];
    let totalBreedingSessions = 0;
    let totalFeedings = 0;

    for (let day = 1; day <= 30; day++) {
      const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
      const dayStartTime = new Date(2026, 9, day, 8, 0, 0).getTime();
      vi.setSystemTime(dayStartTime);

      // 1. Daily Login
      const lastLogin = day === 1 ? '2026-09-30' : `2026-10-${String(day - 1).padStart(2, '0')}`;
      questStore.claimDailyLogin(dateStr, lastLogin);

      // 2. Initialize Daily Quests
      questStore.initQuests(dateStr);

      // 3. Daily Penguin Care: Pet & Feed each owned penguin
      for (const penguin of [...gameStore.ownedPenguins]) {
        gameStore.petPenguin(penguin.id);

        if (invStore.getItemCount('sardine') > 0) {
          gameStore.feedPenguin(penguin.id, 'sardine');
          totalFeedings++;
        }
      }

      // 4. Breeding Loop: If we have at least 2 penguins with level >= 3, hunger < 80, and sufficient funds
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

      // 5. Complete and Claim Quests
      for (const quest of questStore.activeQuests) {
        if (!quest.isClaimed) {
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
    expect(totalFeedings).toBeGreaterThanOrEqual(30);
    expect(playerLevelHistory[playerLevelHistory.length - 1]).toBeGreaterThanOrEqual(playerLevelHistory[0]);

    // Check that player didn't experience hyper-inflation or bankruptcy
    const finalCoins = gameStore.currencies.coins;
    expect(finalCoins).toBeGreaterThan(0);
    expect(finalCoins).toBeLessThan(100_000);

    // Breeding sessions occurred without deadlocking
    expect(totalBreedingSessions).toBeGreaterThanOrEqual(1);
  });

  it('strictly enforces cooldowns against spam and exploit loops', async () => {
    const gameStore = useGameStore();
    gameStore.currencies.coins = 10000;
    const penguin = gameStore.ownedPenguins[0];

    // Pet spam protection: 1st pet succeeds, immediately subsequent calls within 15s fail
    penguin.lastPetAt = 0;
    const firstPet = gameStore.petPenguin(penguin.id);
    expect(firstPet).toBe(true);
    const secondPet = gameStore.petPenguin(penguin.id);
    expect(secondPet).toBe(false);

    // After 16 seconds, pet succeeds again
    vi.advanceTimersByTime(16_000);
    const thirdPet = gameStore.petPenguin(penguin.id);
    expect(thirdPet).toBe(true);
  });
});

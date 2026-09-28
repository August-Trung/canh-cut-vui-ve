import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStore } from '../gameStore';
import { useInventoryStore } from '../inventoryStore';
import { useBreedingStore } from '../breedingStore';
import { gameBridge } from '../../game/bridge/GameBridge';
import type { OwnedPenguin } from '@penguin/types';

describe('useBreedingStore & Breeding Flow', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    const game = useGameStore();
    await game.initGame();
  });

  function createTestPenguin(overrides: Partial<OwnedPenguin>): OwnedPenguin {
    return {
      id: `p_${Math.random().toString(36).substring(2, 7)}`,
      speciesId: 'snowy',
      nickname: 'Test Penguin',
      level: 3,
      exp: 250,
      happiness: 80,
      hunger: 20,
      mood: 'happy',
      lastPetAt: 0,
      lastFedAt: 0,
      lastNeedsUpdateAt: 0,
      generation: 1,
      traits: [],
      breedingCount: 0,
      lastBredAt: 0,
      stats: { fishCaught: 0, totalPets: 0, totalFeedings: 0, gamesPlayed: 0 },
      ...overrides,
    };
  }

  describe('Parent Selection & Eligibility Validation', () => {
    it('rejects breeding when parents are not selected', () => {
      const breeding = useBreedingStore();
      const res = breeding.startBreeding();
      expect(res.success).toBe(false);
      expect(res.reason).toBe('Chưa chọn đủ 2 chim bố mẹ');
    });

    it('rejects breeding when both parents are the same penguin', () => {
      const game = useGameStore();
      const p1 = createTestPenguin({ id: 'p1', level: 3 });
      game.ownedPenguins = [p1];

      const breeding = useBreedingStore();
      breeding.selectParentA('p1');
      breeding.selectParentB('p1');

      const res = breeding.startBreeding();
      expect(res.success).toBe(false);
      expect(res.reason).toBe('SAME_PENGUIN');
    });

    it('rejects breeding if a parent level is below 3', () => {
      const game = useGameStore();
      const p1 = createTestPenguin({ id: 'p1', level: 2 });
      const p2 = createTestPenguin({ id: 'p2', level: 3 });
      game.ownedPenguins = [p1, p2];

      const breeding = useBreedingStore();
      const res = breeding.startBreeding('p1', 'p2');
      expect(res.success).toBe(false);
      expect(res.reason).toBe('LEVEL_TOO_LOW');
    });

    it('allows breeding if lastBredAt === 0 (never bred)', () => {
      const game = useGameStore();
      const p1 = createTestPenguin({ id: 'p1', level: 3, lastBredAt: 0 });
      const p2 = createTestPenguin({ id: 'p2', level: 3, lastBredAt: 0 });
      game.ownedPenguins = [p1, p2];
      game.currencies.coins = 500;
      game.currencies.gems = 10;

      const breeding = useBreedingStore();
      const res = breeding.startBreeding('p1', 'p2');
      expect(res.success).toBe(true);
    });

    it('rejects breeding if a parent is within 30 min cooldown', () => {
      const game = useGameStore();
      const now = Date.now();
      const p1 = createTestPenguin({ id: 'p1', level: 3, lastBredAt: now - 1000 * 60 * 10 }); // 10 min ago (< 30 min)
      const p2 = createTestPenguin({ id: 'p2', level: 3, lastBredAt: 0 });
      game.ownedPenguins = [p1, p2];
      game.currencies.coins = 500;
      game.currencies.gems = 10;

      const breeding = useBreedingStore();
      const res = breeding.startBreeding('p1', 'p2');
      expect(res.success).toBe(false);
      expect(res.reason).toBe('ON_COOLDOWN');
    });

    it('rejects breeding if parent is starving (hunger >= 80)', () => {
      const game = useGameStore();
      const p1 = createTestPenguin({ id: 'p1', level: 3, hunger: 85 });
      const p2 = createTestPenguin({ id: 'p2', level: 3, hunger: 20 });
      game.ownedPenguins = [p1, p2];
      game.currencies.coins = 500;
      game.currencies.gems = 10;

      const breeding = useBreedingStore();
      const res = breeding.startBreeding('p1', 'p2');
      expect(res.success).toBe(false);
      expect(res.reason).toBe('STARVING');
    });

    it('rejects breeding if insufficient coins (< 200) or gems (< 1)', () => {
      const game = useGameStore();
      const p1 = createTestPenguin({ id: 'p1', level: 3 });
      const p2 = createTestPenguin({ id: 'p2', level: 3 });
      game.ownedPenguins = [p1, p2];
      game.currencies.coins = 150; // Need 200
      game.currencies.gems = 10;

      const breeding = useBreedingStore();
      const res = breeding.startBreeding('p1', 'p2');
      expect(res.success).toBe(false);
      expect(res.reason).toBe('INSUFFICIENT_FUNDS');
    });
  });

  describe('startBreeding & State Persistence', () => {
    it('deducts currencies, sets cooldown at START, and persists GeneticsResult ONCE', () => {
      const game = useGameStore();
      const p1 = createTestPenguin({ id: 'p1', speciesId: 'snowy', level: 3, traits: ['speedy'] });
      const p2 = createTestPenguin({ id: 'p2', speciesId: 'sleepy', level: 4, traits: ['glutton'] });
      game.ownedPenguins = [p1, p2];
      game.currencies.coins = 500;
      game.currencies.gems = 10;

      const breeding = useBreedingStore();
      breeding.setDevMode(true); // 15s duration in dev mode

      const startTimeBefore = Date.now();
      const res = breeding.startBreeding('p1', 'p2');
      expect(res.success).toBe(true);

      // Verify currency deduction
      expect(game.currencies.coins).toBe(300); // 500 - 200
      expect(game.currencies.gems).toBe(9);    // 10 - 1

      // Verify cooldown begins at START
      expect(p1.lastBredAt).toBeGreaterThanOrEqual(startTimeBefore);
      expect(p2.lastBredAt).toBeGreaterThanOrEqual(startTimeBefore);
      expect(p1.breedingCount).toBe(1);
      expect(p2.breedingCount).toBe(1);

      // Verify breeding slot state and persisted genetics
      const slot = game.breedingSlot;
      expect(slot.state).toBe('BREEDING');
      expect(slot.parentAId).toBe('p1');
      expect(slot.parentBId).toBe('p2');
      expect(slot.durationSec).toBe(15);
      expect(slot.readyAt).toBeDefined();
      expect(slot.geneticsResult).toBeDefined();
      expect(slot.geneticsResult?.generation).toBe(2);
      expect(slot.geneticsResult?.parentAId).toBe('p1');
      expect(slot.geneticsResult?.parentBId).toBe('p2');
    });
  });

  describe('Egg Collection & Bridge Event', () => {
    it('collectEgg succeeds when ready, creates egg_breeding in inventory, and resets slot', () => {
      const game = useGameStore();
      const p1 = createTestPenguin({ id: 'p1', level: 3 });
      const p2 = createTestPenguin({ id: 'p2', level: 3 });
      game.ownedPenguins = [p1, p2];
      game.currencies.coins = 500;
      game.currencies.gems = 10;

      const breeding = useBreedingStore();
      breeding.setDevMode(true);
      breeding.startBreeding('p1', 'p2');

      // Before ready -> collect fails
      const failCollect = breeding.collectEgg();
      expect(failCollect.success).toBe(false);

      // Simulate time passed past readyAt
      game.breedingSlot.readyAt = Date.now() - 1000;
      expect(breeding.updateTimer()).toBe(true);
      expect(game.breedingSlot.state).toBe('READY_TO_COLLECT');

      // Spy on bridge event
      let breedEvent: { parentAId: string; parentBId: string; eggItemId: string } | null = null;
      gameBridge.on('action:breed', (data) => {
        breedEvent = data;
      });

      // Collect egg
      const collectRes = breeding.collectEgg();
      expect(collectRes.success).toBe(true);

      // Slot reset
      expect(game.breedingSlot.state).toBe('EMPTY');

      // Inventory check
      const invStore = useInventoryStore();
      const eggs = invStore.itemsByCategory('eggs');
      const breedingEgg = eggs.find((e) => e.itemId === 'egg_breeding');
      expect(breedingEgg).toBeDefined();
      expect(breedingEgg?.metadata?.geneticsResult).toBeDefined();

      // Bridge event check
      expect(breedEvent).toEqual({
        parentAId: 'p1',
        parentBId: 'p2',
        eggItemId: 'egg_breeding',
      });
    });
  });

  describe('Breeding Egg Incubation & Hatching Gating', () => {
    it('places egg_breeding into incubator, incubates, and safely gates hatching when flock is full', () => {
      const game = useGameStore();
      const invStore = useInventoryStore();

      // Seed egg_breeding in inventory with specific genetics
      const testGenetics = {
        speciesId: 'shy',
        generation: 2,
        parentAId: 'parent_1',
        parentBId: 'parent_2',
        traits: ['glutton', 'lucky'],
        isMutation: false,
      };

      invStore.addItem({
        itemId: 'egg_breeding',
        category: 'eggs',
        name: 'Trứng Lai Ghép',
        description: 'Trứng lai ghép',
        quantity: 1,
        stackable: false,
        metadata: { geneticsResult: testGenetics },
      });

      // Place egg into incubator slot 1
      const placed = game.placeEggInIncubator(1, 'egg_breeding');
      expect(placed).toBe(true);
      expect(game.incubatorSlots[0].state).toBe('INCUBATING');
      expect(game.incubatorSlots[0].eggTypeId).toBe('egg_breeding');
      expect(game.incubatorSlots[0].geneticsResult).toEqual(testGenetics);
      expect(game.incubatorSlots[0].pendingSpeciesId).toBe('shy');

      // Fast forward incubation to ready
      game.incubatorSlots[0].targetHatchTime = Date.now() - 1000;
      game.updateIncubatorTimers();
      expect(game.incubatorSlots[0].state).toBe('READY_TO_HATCH');

      // Fill flock to capacity: Player level 1 max capacity is 2
      const p1 = createTestPenguin({ id: 'p1' });
      const p2 = createTestPenguin({ id: 'p2' });
      game.ownedPenguins = [p1, p2];

      // GATING CASE: Flock is full -> prepareHatch fails and genetics are NOT rerolled or lost
      const prep = game.prepareHatch(1);
      expect(prep.success).toBe(false);
      expect(prep.reason).toBe('FLOCK_FULL');
      expect(game.incubatorSlots[0].geneticsResult).toEqual(testGenetics);

      // Attempt hatch fails safely returning null
      const hatchAttempt = game.hatchEgg(1);
      expect(hatchAttempt).toBeNull();
      expect(game.ownedPenguins.length).toBe(2);
      expect(game.incubatorSlots[0].state).toBe('READY_TO_HATCH');
      expect(game.incubatorSlots[0].geneticsResult).toEqual(testGenetics);

      // Player levels up to level 2 (Capacity increases from 2 to 3)
      game.player.level = 2;

      // Now hatch succeeds
      const newPenguin = game.hatchEgg(1, 'Baby Genetic');
      expect(newPenguin).toBeDefined();
      expect(newPenguin?.speciesId).toBe('shy');
      expect(newPenguin?.generation).toBe(2);
      expect(newPenguin?.traits).toEqual(['glutton', 'lucky']);
      expect(newPenguin?.parentAId).toBe('parent_1');
      expect(newPenguin?.parentBId).toBe('parent_2');
      expect(newPenguin?.nickname).toBe('Baby Genetic');

      expect(game.ownedPenguins.length).toBe(3);
      expect(game.incubatorSlots[0].state).toBe('EMPTY');
      expect(game.incubatorSlots[0].geneticsResult).toBeUndefined();
    });
  });
});

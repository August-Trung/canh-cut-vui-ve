import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStore } from '../gameStore';
import { useInventoryStore } from '../inventoryStore';
import { useCollectionStore } from '../collectionStore';
import { SPECIES_LIST } from '@penguin/game-data';
import { gameStorage } from '../../services/StorageService';

describe('Pinia Game Stores', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  describe('gameStore initialization', () => {
    it('initializes game with default save data', async () => {
      const game = useGameStore();
      await game.initGame();

      expect(game.currencies.coins).toBe(500);
      expect(game.currencies.fish).toBe(0);
      expect(game.currencies.gems).toBe(10);
      expect(game.ownedPenguins.length).toBe(1);
      expect(game.ownedPenguins[0].speciesId).toBe('snowy');
      expect(game.incubatorSlots.length).toBe(2);
      expect(game.incubatorSlots[0].state).toBe('EMPTY');
      expect(game.isLoaded).toBe(true);

      const inventory = useInventoryStore();
      expect(inventory.getItemCount('basic_egg')).toBe(1);
      expect(inventory.getItemCount('sardine')).toBe(50);

      const collection = useCollectionStore();
      expect(collection.discoveredCount).toBe(1);
      expect(collection.isDiscovered('snowy')).toBe(true);
    });

    it('does not write to storage if persistSave is called before store is loaded', async () => {
      const game = useGameStore();
      expect(game.isLoaded).toBe(false);

      // Attempt to persist while uninitialized
      await game.persistSave();

      // Check localStorage has not been populated
      expect(localStorage.getItem('penguin_island_save_v1')).toBeNull();
      const loaded = await gameStorage.load();
      expect(loaded).toBeNull();
    });
  });

  describe('feeding & petting interactions', () => {
    it('feeding a penguin consumes 1 Fish and increases happiness', async () => {
      const game = useGameStore();
      await game.initGame();
      const inventory = useInventoryStore();

      const penguin = game.ownedPenguins[0];
      penguin.happiness = 50;
      penguin.hunger = 60;

      const initialFish = inventory.getItemCount('sardine');
      expect(initialFish).toBe(50);

      const success = game.feedPenguin(penguin.id);
      expect(success).toBe(true);
      expect(inventory.getItemCount('sardine')).toBe(49);
      expect(game.currencies.fish).toBe(0);
      expect(penguin.happiness).toBe(70);
      expect(penguin.hunger).toBe(22);
      expect(penguin.mood).toBe('content');
    });

    it('clamps happiness to 100 and hunger to min 0 when feeding', async () => {
      const game = useGameStore();
      await game.initGame();

      const penguin = game.ownedPenguins[0];
      penguin.happiness = 95;
      penguin.hunger = 10;

      const success = game.feedPenguin(penguin.id);
      expect(success).toBe(true);
      expect(penguin.happiness).toBe(100);
      expect(penguin.hunger).toBe(0);
    });

    it('rejects feeding if player has 0 fish', async () => {
      const game = useGameStore();
      await game.initGame();
      const inventory = useInventoryStore();

      inventory.setItemCount('sardine', 0);
      const penguin = game.ownedPenguins[0];
      const initialHappiness = penguin.happiness;

      const success = game.feedPenguin(penguin.id);
      expect(success).toBe(false);
      expect(penguin.happiness).toBe(initialHappiness);
    });

    it('rejects feeding nonexistent penguin', async () => {
      const game = useGameStore();
      await game.initGame();

      const success = game.feedPenguin('nonexistent_id');
      expect(success).toBe(false);
    });

    it('petting a penguin increases happiness and sets mood to happy', async () => {
      const game = useGameStore();
      await game.initGame();

      const penguin = game.ownedPenguins[0];
      penguin.happiness = 80;
      penguin.mood = 'sleepy';

      const success = game.petPenguin(penguin.id);
      expect(success).toBe(true);
      expect(penguin.happiness).toBe(88);
      expect(penguin.mood).toBe('happy');
    });

    it('petting clamps happiness to 100', async () => {
      const game = useGameStore();
      await game.initGame();

      const penguin = game.ownedPenguins[0];
      penguin.happiness = 98;

      const success = game.petPenguin(penguin.id);
      expect(success).toBe(true);
      expect(penguin.happiness).toBe(100);
    });

    it('rejects petting nonexistent penguin', async () => {
      const game = useGameStore();
      await game.initGame();

      const success = game.petPenguin('nonexistent_id');
      expect(success).toBe(false);
    });
  });

  describe('incubator & hatching lifecycle', () => {
    it('incubates egg, transitions through states, and hatches new penguin', async () => {
      const game = useGameStore();
      await game.initGame();
      const inventory = useInventoryStore();
      const collection = useCollectionStore();

      // Verify egg is in inventory
      expect(inventory.getItemCount('basic_egg')).toBe(1);

      // Place basic_egg in slot 1
      const placed = game.placeEggInIncubator(1, 'basic_egg');
      expect(placed).toBe(true);
      expect(inventory.getItemCount('basic_egg')).toBe(0);

      const slot = game.incubatorSlots.find((s) => s.slotId === 1)!;
      expect(slot.state).toBe('INCUBATING');
      expect(slot.eggTypeId).toBe('basic_egg');
      expect(slot.startTime).toBeDefined();
      expect(slot.durationSec).toBe(10);
      expect(slot.readyAt).toBe(slot.startTime! + 10 * 1000);

      // Force timer elapsed to ready
      slot.state = 'READY_TO_HATCH';

      // Hatch
      const newPenguin = game.hatchEgg(1, 'Penguin Pal');
      expect(newPenguin).toBeDefined();
      expect(newPenguin?.nickname).toBe('Penguin Pal');
      expect(game.ownedPenguins.length).toBe(2);
      expect(slot.state).toBe('EMPTY');
      expect(slot.eggTypeId).toBeUndefined();
      expect(collection.isDiscovered(newPenguin!.speciesId)).toBe(true);
    });

    it('prevents placing egg if slot is not empty or egg is missing from inventory', async () => {
      const game = useGameStore();
      await game.initGame();

      // Slot 1: place basic_egg
      const firstPlace = game.placeEggInIncubator(1, 'basic_egg');
      expect(firstPlace).toBe(true);

      // Attempting to place another egg in slot 1 should fail (already incubating)
      const secondPlace = game.placeEggInIncubator(1, 'basic_egg');
      expect(secondPlace).toBe(false);

      // Attempting to place in slot 2 with 0 eggs should fail (egg was already consumed)
      const slot2Place = game.placeEggInIncubator(2, 'basic_egg');
      expect(slot2Place).toBe(false);

      // Invalid slot ID should fail
      const invalidSlotPlace = game.placeEggInIncubator(999, 'basic_egg');
      expect(invalidSlotPlace).toBe(false);
    });

    it('updateIncubatorTimers transitions incubating slots to READY_TO_HATCH when elapsed', async () => {
      const game = useGameStore();
      await game.initGame();

      const placed = game.placeEggInIncubator(1, 'basic_egg');
      expect(placed).toBe(true);

      const slot = game.incubatorSlots.find((s) => s.slotId === 1)!;
      expect(slot.state).toBe('INCUBATING');

      // Before readyAt, updateIncubatorTimers should not transition
      slot.readyAt = Date.now() + 50000;
      const notReady = game.updateIncubatorTimers();
      expect(notReady).toBe(false);
      expect(slot.state).toBe('INCUBATING');

      // After readyAt, updateIncubatorTimers should transition
      slot.readyAt = Date.now() - 1000;
      const ready = game.updateIncubatorTimers();
      expect(ready).toBe(true);
      expect(slot.state).toBe('READY_TO_HATCH');
    });

    it('rejects hatching if slot is not in READY_TO_HATCH state', async () => {
      const game = useGameStore();
      await game.initGame();

      // Slot 1 is EMPTY
      const hatchedEmpty = game.hatchEgg(1, 'Empty Slot');
      expect(hatchedEmpty).toBeNull();

      // Slot 1 is INCUBATING
      game.placeEggInIncubator(1, 'basic_egg');
      const hatchedIncubating = game.hatchEgg(1, 'Still Warm');
      expect(hatchedIncubating).toBeNull();
    });

    it('hatchEgg validates custom nickname and falls back when invalid or empty', async () => {
      const game = useGameStore();
      await game.initGame();

      // Setup slot 1 as ready
      const slot = game.incubatorSlots.find((s) => s.slotId === 1)!;
      slot.state = 'READY_TO_HATCH';
      slot.eggTypeId = 'basic_egg';

      // Hatch with empty string -> should fall back to default species name
      const hatchedEmpty = game.hatchEgg(1, '   ');
      expect(hatchedEmpty).toBeDefined();
      expect(hatchedEmpty?.nickname.length).toBeGreaterThan(0);
      expect(hatchedEmpty?.nickname).not.toBe('   ');

      // Setup slot 2 as ready with Vietnamese name (level up to 2 for capacity)
      game.player.level = 2;
      const slot2 = game.incubatorSlots.find((s) => s.slotId === 2)!;
      slot2.state = 'READY_TO_HATCH';
      slot2.eggTypeId = 'basic_egg';

      const hatchedVi = game.hatchEgg(2, 'Cánh Cụt Đáng Yêu');
      expect(hatchedVi).toBeDefined();
      expect(hatchedVi?.nickname).toBe('Cánh Cụt Đáng Yêu');
    });
  });

  describe('inventoryStore', () => {
    it('manages adding, consuming, and counting items', () => {
      const inventory = useInventoryStore();

      expect(inventory.getItemCount('fish')).toBe(0);

      inventory.addItem({
        itemId: 'fish',
        category: 'food',
        name: 'Fish',
        description: 'A tasty fish',
        quantity: 5,
        stackable: true,
      });
      expect(inventory.getItemCount('fish')).toBe(5);

      // Stack more
      inventory.addItem({
        itemId: 'fish',
        category: 'food',
        name: 'Fish',
        description: 'A tasty fish',
        quantity: 3,
        stackable: true,
      });
      expect(inventory.getItemCount('fish')).toBe(8);

      // Consume some
      const consumed = inventory.consumeItem('fish', 4);
      expect(consumed).toBe(true);
      expect(inventory.getItemCount('fish')).toBe(4);

      // Consume beyond available quantity
      const overConsumed = inventory.consumeItem('fish', 10);
      expect(overConsumed).toBe(false);
      expect(inventory.getItemCount('fish')).toBe(4);

      // Consume remaining exactly
      const consumedAll = inventory.consumeItem('fish', 4);
      expect(consumedAll).toBe(true);
      expect(inventory.getItemCount('fish')).toBe(0);

      // Consume non-existent item
      expect(inventory.consumeItem('unknown_item', 1)).toBe(false);
    });

    it('filters items by category', () => {
      const inventory = useInventoryStore();
      inventory.setItems([
        {
          itemId: 'egg1',
          category: 'eggs',
          name: 'Egg 1',
          description: '',
          quantity: 1,
          stackable: true,
        },
        {
          itemId: 'food1',
          category: 'food',
          name: 'Food 1',
          description: '',
          quantity: 10,
          stackable: true,
        },
      ]);

      expect(inventory.itemsByCategory('eggs').length).toBe(1);
      expect(inventory.itemsByCategory('food').length).toBe(1);
      expect(inventory.itemsByCategory('all').length).toBe(2);
    });
  });

  describe('collectionStore', () => {
    it('tracks discovery progress and total species count', () => {
      const collection = useCollectionStore();

      expect(collection.totalSpeciesCount).toBe(SPECIES_LIST.length);
      expect(collection.discoveredCount).toBe(0);
      expect(collection.isDiscovered('snowy')).toBe(false);

      collection.discoverSpecies('snowy');
      expect(collection.discoveredCount).toBe(1);
      expect(collection.isDiscovered('snowy')).toBe(true);

      const details = collection.discoveryDetails('snowy');
      expect(details?.speciesId).toBe('snowy');
      expect(details?.discoveredAt).toBeDefined();

      // Discovering again does not create duplicate
      collection.discoverSpecies('snowy');
      expect(collection.discoveredCount).toBe(1);
    });
  });

  describe('audio & reset save', () => {
    it('toggles audio muted state', () => {
      const game = useGameStore();
      expect(game.audioMuted).toBe(false);

      game.toggleAudio();
      expect(game.audioMuted).toBe(true);

      game.toggleAudio();
      expect(game.audioMuted).toBe(false);
    });

    it('resets save back to initial starter defaults', async () => {
      const game = useGameStore();
      await game.initGame();

      game.currencies.coins = 9999;
      await game.persistSave();

      await game.resetSave();
      expect(game.currencies.coins).toBe(500);
      expect(game.ownedPenguins.length).toBe(1);
    });
  });

  describe('Phase 2 Authoritative Systems', () => {
    it('petting enforces 15-second cooldown per penguin, grants strictly 0 coins, and rejects duplicate calls with zero rewards', async () => {
      const game = useGameStore();
      await game.initGame();
      const penguin = game.ownedPenguins[0];
      const initialCoins = game.currencies.coins;
      const initialExp = game.player.exp;

      // First pet succeeds
      const res1 = game.petPenguin(penguin.id);
      expect(res1).toBe(true);
      expect(game.currencies.coins).toBe(initialCoins); // 0 coins
      expect(game.player.exp).toBe(initialExp + 2); // +2 Player EXP
      expect(penguin.happiness).toBe(88); // 80 + 8
      expect(penguin.exp).toBe(3); // +3 Penguin EXP

      // Immediate second pet fails due to 15s cooldown
      const res2 = game.petPenguin(penguin.id);
      expect(res2).toBe(false);
      expect(game.player.exp).toBe(initialExp + 2); // No extra rewards
    });

    it('feeding consumes exact food item atomically without cooldown and updates lastFedAt', async () => {
      const game = useGameStore();
      await game.initGame();
      const invStore = useInventoryStore();
      const penguin = game.ownedPenguins[0];

      // Snowy favorite food is sardine
      const initialSardines = invStore.getItemCount('sardine');
      expect(initialSardines).toBeGreaterThan(0);

      const res1 = game.feedPenguin(penguin.id, 'sardine');
      expect(res1).toBe(true);
      expect(invStore.getItemCount('sardine')).toBe(initialSardines - 1);
      expect(penguin.lastFedAt).toBeGreaterThan(0);
      expect(game.player.exp).toBe(12); // +12 Player EXP for favorite food
      expect(penguin.exp).toBe(15); // +15 Penguin EXP

      // Second feed immediately without cooldown succeeds as long as food exists
      const res2 = game.feedPenguin(penguin.id, 'sardine');
      expect(res2).toBe(true);
      expect(invStore.getItemCount('sardine')).toBe(initialSardines - 2);
    });

    it('feeding hungry species favorite food awards +18 Penguin EXP', async () => {
      const game = useGameStore();
      await game.initGame();
      const invStore = useInventoryStore();

      // Add a hungry penguin and fat_salmon
      const hungryPenguin = {
        ...game.ownedPenguins[0],
        id: 'p_hungry',
        speciesId: 'hungry',
        exp: 0,
      };
      game.ownedPenguins.push(hungryPenguin);
      invStore.addItem({
        itemId: 'fat_salmon',
        category: 'food',
        name: 'Fat Salmon',
        description: 'Salmon',
        quantity: 2,
        stackable: true,
      });

      const res = game.feedPenguin('p_hungry', 'fat_salmon');
      expect(res).toBe(true);
      expect(hungryPenguin.exp).toBe(18); // +18 Penguin EXP for Hungry species
    });

    it('player cumulative EXP thresholds correctly calculate level up and grant rewards on actual transition', async () => {
      const game = useGameStore();
      await game.initGame();
      expect(game.player.level).toBe(1);
      const initialCoins = game.currencies.coins;

      // Add 50 EXP: stays at Level 1, no rewards
      const rewards1 = game.addPlayerExp(50);
      expect(rewards1).toHaveLength(0);
      expect(game.player.level).toBe(1);
      expect(game.currencies.coins).toBe(initialCoins);

      // Add 50 more EXP: reaches 100 EXP -> Level 2, +100 Coins
      const rewards2 = game.addPlayerExp(50);
      expect(rewards2).toHaveLength(1);
      expect(rewards2[0].level).toBe(2);
      expect(game.player.level).toBe(2);
      expect(game.currencies.coins).toBe(initialCoins + 100);

      // Add 550 EXP: jumps from 100 EXP (Lv 2) to 650 EXP (Lv 4)
      // Level 3 (+150c) + Level 4 (+200c, +2 gems)
      const rewards3 = game.addPlayerExp(550);
      expect(rewards3).toHaveLength(2);
      expect(rewards3[0].level).toBe(3);
      expect(rewards3[1].level).toBe(4);
      expect(game.player.level).toBe(4);
      expect(game.currencies.coins).toBe(initialCoins + 100 + 150 + 200);
      expect(game.currencies.gems).toBe(10 + 2);
    });

    it('loading an existing Level 2 save does not grant duplicate level-up rewards', async () => {
      const game = useGameStore();
      const saveV2 = {
        schemaVersion: 2,
        player: { level: 2, exp: 150, name: 'Chủ Đảo', avatar: 'snowy' },
        currencies: { coins: 300, gems: 5, fish: 0 },
        inventory: [],
        ownedPenguins: [{ id: 'p1', speciesId: 'snowy', lastNeedsUpdateAt: 1000 }],
        incubatorSlots: [{ slotId: 1, state: 'EMPTY', unlocked: true }],
        island: { decorations: [], unlockedPlacementExpIds: [] },
        dailyLogin: { lastClaimDate: null, currentStreak: 1 },
        questState: { assignedDate: '', quests: [] },
        timestamps: { createdAt: 1000, lastSavedAt: 1000, lastLoginAt: 1000 },
      };
      await gameStorage.save(saveV2 as any);

      await game.initGame();
      expect(game.player.level).toBe(2);
      expect(game.player.exp).toBe(150);
      expect(game.currencies.coins).toBe(300); // Not incremented!
      expect(game.currencies.gems).toBe(5); // Not incremented!
    });

    it('boot initialization with missing timestamp initializes lastNeedsUpdateAt without simulating historical decay', async () => {
      const game = useGameStore();
      const saveWithMissingTime = {
        schemaVersion: 2,
        player: { level: 1, exp: 0, name: 'Chủ Đảo', avatar: 'snowy' },
        currencies: { coins: 100, gems: 0, fish: 0 },
        inventory: [],
        ownedPenguins: [{
          id: 'p1',
          speciesId: 'snowy',
          nickname: 'Snowy',
          hunger: 20,
          happiness: 80,
          lastNeedsUpdateAt: 0, // Missing timestamp
        }],
        incubatorSlots: [],
        island: { decorations: [], unlockedPlacementExpIds: [] },
        dailyLogin: { lastClaimDate: null, currentStreak: 1 },
        questState: { assignedDate: '', quests: [] },
        timestamps: { createdAt: 0, lastSavedAt: 0, lastLoginAt: 0 },
      };
      await gameStorage.save(saveWithMissingTime as any);

      await game.initGame();
      const penguin = game.ownedPenguins[0];
      expect(penguin.lastNeedsUpdateAt).toBeGreaterThan(0);
      expect(penguin.hunger).toBe(20); // NOT decayed to 100!
      expect(penguin.happiness).toBe(80); // NOT decayed to 0!
    });

    it('flock capacity gates hatching when at maximum capacity without consuming egg or granting rewards', async () => {
      const { gameBridge } = await import('../../game/bridge/GameBridge');
      const bridgeSpy = vi.spyOn(gameBridge, 'emit');
      const game = useGameStore();
      await game.initGame();

      // At Lv 2, max capacity is 3. Set level = 2 and have 3 penguins (3/3)
      game.player.level = 2;
      game.ownedPenguins = [
        { ...game.ownedPenguins[0], id: 'p1', nickname: 'Penguin 1' },
        { ...game.ownedPenguins[0], id: 'p2', nickname: 'Penguin 2' },
        { ...game.ownedPenguins[0], id: 'p3', nickname: 'Penguin 3' },
      ];
      expect(game.ownedPenguins.length).toBe(3);

      // Set slot 1 to READY_TO_HATCH
      game.incubatorSlots[0] = {
        slotId: 1,
        state: 'READY_TO_HATCH',
        eggTypeId: 'basic_egg',
        unlocked: true,
      };

      // prepareHatch returns FLOCK_FULL reason
      const prep = game.prepareHatch(1);
      expect(prep.success).toBe(false);
      expect(prep.reason).toBe('FLOCK_FULL');

      // hatchEgg fails and returns null
      const result = game.hatchEgg(1, 'Cannot Hatch');
      expect(result).toBeNull();

      // State preserved: egg not consumed, slot still READY_TO_HATCH, eggTypeId intact
      expect(game.incubatorSlots[0].state).toBe('READY_TO_HATCH');
      expect(game.incubatorSlots[0].eggTypeId).toBe('basic_egg');
      expect(game.incubatorSlots[0].pendingSpeciesId).toBeUndefined(); // Cleared cleanly
      expect(game.ownedPenguins.length).toBe(3); // No new penguin

      // No events emitted
      expect(bridgeSpy).not.toHaveBeenCalledWith('action:hatch', expect.anything());
      expect(bridgeSpy).not.toHaveBeenCalledWith('penguin:spawn', expect.anything());

      // RETRY AFTER CAPACITY INCREASES:
      // Player levels up to Level 5 (Capacity increases to 4)
      game.player.level = 5;
      const retryPrep = game.prepareHatch(1);
      expect(retryPrep.success).toBe(true);
      expect(retryPrep.pendingSpeciesId).toBeDefined();

      const retryResult = game.hatchEgg(1, 'Bé Cánh Cụt');
      expect(retryResult).toBeDefined();
      expect(retryResult?.nickname).toBe('Bé Cánh Cụt');
      expect(game.ownedPenguins.length).toBe(4);
      expect(game.incubatorSlots[0].state).toBe('EMPTY');
      expect(game.incubatorSlots[0].eggTypeId).toBeUndefined();
      expect(game.incubatorSlots[0].pendingSpeciesId).toBeUndefined();

      // Events now emitted on successful hatch
      expect(bridgeSpy).toHaveBeenCalledWith('action:hatch', expect.objectContaining({ ownedId: retryResult?.id }));
      expect(bridgeSpy).toHaveBeenCalledWith('penguin:spawn', expect.objectContaining({ penguin: expect.anything() }));
    });

    it('authoritative hatch randomization scopes pendingSpeciesId and clears it on hatch or cancel', async () => {
      const game = useGameStore();
      await game.initGame();
      game.incubatorSlots[0] = {
        slotId: 1,
        state: 'READY_TO_HATCH',
        eggTypeId: 'basic_egg',
        unlocked: true,
      };

      // Prepare hatch rolls species
      const prep = game.prepareHatch(1);
      expect(prep.success).toBe(true);
      expect(game.incubatorSlots[0].pendingSpeciesId).toBeDefined();

      // Cancel hatch clears pendingSpeciesId
      game.cancelHatch(1);
      expect(game.incubatorSlots[0].pendingSpeciesId).toBeUndefined();

      // Prepare again and hatch
      game.prepareHatch(1);
      const pending = game.incubatorSlots[0].pendingSpeciesId;
      expect(pending).toBeDefined();

      const hatchRes = game.hatchEgg(1, 'Bé Mới');
      expect(hatchRes && ('success' in hatchRes ? hatchRes.success : true)).toBe(true);
      expect(game.incubatorSlots[0].state).toBe('EMPTY');
      expect(game.incubatorSlots[0].pendingSpeciesId).toBeUndefined(); // Cleared!
    });

    it('gameStore simulation timer lifecycle starts cleanly without duplicate intervals and stops on cleanup', async () => {
      const game = useGameStore();
      game.startNeedsSimulation();
      const firstId = game.needsSimulationIntervalId;
      expect(firstId).toBeDefined();

      // Calling start again does not duplicate
      game.startNeedsSimulation();
      expect(game.needsSimulationIntervalId).toBeDefined();

      game.stopNeedsSimulation();
      expect(game.needsSimulationIntervalId).toBeNull();
    });

    describe('Flock Capacity & Hatch Authoritative Invariants', () => {
      it('Case 1: 2/3 -> READY_TO_HATCH -> hatch -> success', async () => {
        const game = useGameStore();
        await game.initGame();
        // At Lv 2, max capacity is 3. Set level = 2 and have 2 penguins (2/3)
        game.player.level = 2;
        game.ownedPenguins = [
          { ...game.ownedPenguins[0], id: 'p1', nickname: 'Penguin 1' },
          { ...game.ownedPenguins[0], id: 'p2', nickname: 'Penguin 2' },
        ];
        expect(game.ownedPenguins.length).toBe(2);

        game.incubatorSlots[0] = {
          slotId: 1,
          state: 'READY_TO_HATCH',
          eggTypeId: 'basic_egg',
          unlocked: true,
        };

        const result = game.hatchEgg(1, 'Penguin 3');
        expect(result).toBeDefined();
        expect(result?.nickname).toBe('Penguin 3');
        expect(game.ownedPenguins.length).toBe(3);
        expect(game.incubatorSlots[0].state).toBe('EMPTY');
      });

      it('Case 2: 3/3 -> place egg -> incubate -> success (incubation allowed at full capacity)', async () => {
        const game = useGameStore();
        await game.initGame();
        const inv = useInventoryStore();
        inv.addItem({
          itemId: 'basic_egg',
          category: 'eggs',
          name: 'Basic Egg',
          description: '',
          quantity: 2,
          stackable: true,
        });

        // 3/3 penguins at Lv 2
        game.player.level = 2;
        game.ownedPenguins = [
          { ...game.ownedPenguins[0], id: 'p1', nickname: 'Penguin 1' },
          { ...game.ownedPenguins[0], id: 'p2', nickname: 'Penguin 2' },
          { ...game.ownedPenguins[0], id: 'p3', nickname: 'Penguin 3' },
        ];
        expect(game.ownedPenguins.length).toBe(3);

        game.incubatorSlots[0] = {
          slotId: 1,
          state: 'EMPTY',
          unlocked: true,
        };

        // Place egg must succeed even when flock is full
        const placed = game.placeEggInIncubator(1, 'basic_egg');
        expect(placed).toBe(true);
        expect(game.incubatorSlots[0].state).toBe('INCUBATING');
        expect(game.incubatorSlots[0].eggTypeId).toBe('basic_egg');
      });

      it('Case 5, 6, 7: 3/3 -> READY_TO_HATCH -> pendingSpeciesId undefined, eggTypeId preserved, hatch attempt fails safely', async () => {
        const game = useGameStore();
        await game.initGame();

        game.player.level = 2;
        game.ownedPenguins = [
          { ...game.ownedPenguins[0], id: 'p1', nickname: 'Penguin 1' },
          { ...game.ownedPenguins[0], id: 'p2', nickname: 'Penguin 2' },
          { ...game.ownedPenguins[0], id: 'p3', nickname: 'Penguin 3' },
        ];
        expect(game.ownedPenguins.length).toBe(3);

        game.incubatorSlots[0] = {
          slotId: 1,
          state: 'READY_TO_HATCH',
          eggTypeId: 'frozen_egg',
          unlocked: true,
          pendingSpeciesId: undefined,
        };

        // prepareHatch must fail with FLOCK_FULL and NOT set pendingSpeciesId (Case 5)
        const prep = game.prepareHatch(1);
        expect(prep.success).toBe(false);
        expect(prep.reason).toBe('FLOCK_FULL');
        expect(game.incubatorSlots[0].pendingSpeciesId).toBeUndefined();

        // eggTypeId remains preserved (Case 6)
        expect(game.incubatorSlots[0].eggTypeId).toBe('frozen_egg');

        // hatch attempt fails safely returning null (Case 7)
        const hatchRes = game.hatchEgg(1, 'Blocked');
        expect(hatchRes).toBeNull();
        expect(game.ownedPenguins.length).toBe(3);
        expect(game.incubatorSlots[0].state).toBe('READY_TO_HATCH');
        expect(game.incubatorSlots[0].eggTypeId).toBe('frozen_egg');
        expect(game.incubatorSlots[0].pendingSpeciesId).toBeUndefined();
      });

      it('Case 8: 3/3 -> READY_TO_HATCH -> increase capacity to 4 -> hatch succeeds', async () => {
        const game = useGameStore();
        await game.initGame();

        game.player.level = 2;
        game.ownedPenguins = [
          { ...game.ownedPenguins[0], id: 'p1', nickname: 'Penguin 1' },
          { ...game.ownedPenguins[0], id: 'p2', nickname: 'Penguin 2' },
          { ...game.ownedPenguins[0], id: 'p3', nickname: 'Penguin 3' },
        ];

        game.incubatorSlots[0] = {
          slotId: 1,
          state: 'READY_TO_HATCH',
          eggTypeId: 'basic_egg',
          unlocked: true,
        };

        // Level up to Level 5 (Capacity increases from 3 to 4)
        game.player.level = 5;

        const prep = game.prepareHatch(1);
        expect(prep.success).toBe(true);
        expect(prep.pendingSpeciesId).toBeDefined();

        const hatchRes = game.hatchEgg(1, 'Penguin 4');
        expect(hatchRes).toBeDefined();
        expect(game.ownedPenguins.length).toBe(4);
        expect(game.incubatorSlots[0].state).toBe('EMPTY');
      });

      it('Case 9: Successful hatch -> slot EMPTY, eggTypeId undefined, pendingSpeciesId undefined', async () => {
        const game = useGameStore();
        await game.initGame();

        game.incubatorSlots[0] = {
          slotId: 1,
          state: 'READY_TO_HATCH',
          eggTypeId: 'golden_egg',
          unlocked: true,
        };

        const result = game.hatchEgg(1, 'Golden Boy');
        expect(result).toBeDefined();

        expect(game.incubatorSlots[0].state).toBe('EMPTY');
        expect(game.incubatorSlots[0].eggTypeId).toBeUndefined();
        expect(game.incubatorSlots[0].pendingSpeciesId).toBeUndefined();
        expect(game.incubatorSlots[0].startTime).toBeUndefined();
        expect(game.incubatorSlots[0].readyAt).toBeUndefined();
      });

      it('Case 10: Successful hatch called on same slot a second time -> returns null and does not create 2nd penguin', async () => {
        const game = useGameStore();
        await game.initGame();

        game.incubatorSlots[0] = {
          slotId: 1,
          state: 'READY_TO_HATCH',
          eggTypeId: 'basic_egg',
          unlocked: true,
        };

        const initialFlockCount = game.ownedPenguins.length;

        // First hatch succeeds
        const firstHatch = game.hatchEgg(1, 'First Hatch');
        expect(firstHatch).toBeDefined();
        expect(game.ownedPenguins.length).toBe(initialFlockCount + 1);
        expect(game.incubatorSlots[0].state).toBe('EMPTY');

        // Second hatch call on the exact same slot must return null
        const secondHatch = game.hatchEgg(1, 'Duplicate Hatch');
        expect(secondHatch).toBeNull();
        expect(game.ownedPenguins.length).toBe(initialFlockCount + 1); // No 2nd penguin created
      });
    });
  });

  describe('Phase 3: Penguin Progression & Individual Identity', () => {
    it('initializes breedingSlot and miniGameState in store state', async () => {
      const game = useGameStore();
      await game.initGame();

      expect(game.breedingSlot).toBeDefined();
      expect(game.breedingSlot.state).toBe('EMPTY');
      expect(game.miniGameState).toBeDefined();
      expect(game.miniGameState.dailyPlaysCount).toEqual({});
    });

    it('addPenguinExp increases penguin exp, computes new level, and caps at 2700', async () => {
      const game = useGameStore();
      await game.initGame();
      const penguin = game.ownedPenguins[0];

      expect(penguin.level).toBe(1);
      expect(penguin.exp).toBe(0);

      // Add 100 exp -> level 2
      const res1 = game.addPenguinExp(penguin.id, 100);
      expect(res1.levelUp).toBe(true);
      expect(res1.oldLevel).toBe(1);
      expect(res1.newLevel).toBe(2);
      expect(penguin.level).toBe(2);
      expect(penguin.exp).toBe(100);
      expect(penguin.experience).toBe(100);

      // Add 50 exp -> still level 2
      const res2 = game.addPenguinExp(penguin.id, 50);
      expect(res2.levelUp).toBe(false);
      expect(res2.newLevel).toBe(2);
      expect(penguin.exp).toBe(150);

      // Add 5000 exp -> capped at 2700, level 10
      const res3 = game.addPenguinExp(penguin.id, 5000);
      expect(res3.levelUp).toBe(true);
      expect(res3.newLevel).toBe(10);
      expect(penguin.level).toBe(10);
      expect(penguin.exp).toBe(2700);
      expect(penguin.experience).toBe(2700);
    });

    it('emits effect:penguin_level_up event when a penguin levels up', async () => {
      const { gameBridge } = await import('../../game/bridge/GameBridge');
      const game = useGameStore();
      await game.initGame();
      const penguin = game.ownedPenguins[0];

      let emittedEvent: { penguinId: string; newLevel: number } | null = null;
      gameBridge.on('effect:penguin_level_up', (data) => {
        emittedEvent = data;
      });

      // Level up to 2
      game.addPenguinExp(penguin.id, 100);
      expect(emittedEvent).toEqual({
        penguinId: penguin.id,
        newLevel: 2,
      });

      // No level up when gaining 10 EXP
      emittedEvent = null;
      game.addPenguinExp(penguin.id, 10);
      expect(emittedEvent).toBeNull();
    });

    it('petPenguin calls addPenguinExp (+3 EXP) and increments stats.totalPets', async () => {
      const game = useGameStore();
      await game.initGame();
      const penguin = game.ownedPenguins[0];
      penguin.stats = { fishCaught: 0, totalPets: 0, totalFeedings: 0, gamesPlayed: 0 };

      const initialExp = penguin.exp;
      const success = game.petPenguin(penguin.id);

      expect(success).toBe(true);
      expect(penguin.exp).toBe(initialExp + 3);
      expect(penguin.stats.totalPets).toBe(1);
    });

    it('feedPenguin calls addPenguinExp (+5 EXP standard), increments totalFeedings, and applies glutton bonus', async () => {
      const game = useGameStore();
      await game.initGame();
      const penguin = game.ownedPenguins[0];
      // Set to species where sardine is NOT favorite (sleepy loves warm_milk)
      penguin.speciesId = 'sleepy';
      penguin.stats = { fishCaught: 0, totalPets: 0, totalFeedings: 0, gamesPlayed: 0 };
      penguin.hunger = 50;

      // Standard feeding (non-favorite food: +5 EXP)
      game.feedPenguin(penguin.id, 'sardine');
      expect(penguin.exp).toBe(5);
      expect(penguin.stats.totalFeedings).toBe(1);

      // Glutton trait penguin (+25% EXP: Math.round(5 * 1.25) = 6)
      penguin.traits = ['glutton'];
      penguin.hunger = 50;
      game.feedPenguin(penguin.id, 'sardine');
      expect(penguin.exp).toBe(5 + 6);
      expect(penguin.stats.totalFeedings).toBe(2);

      // Favorite food feeding on snowy (+15 EXP, and with glutton: Math.round(15 * 1.25) = 19)
      penguin.speciesId = 'snowy';
      penguin.hunger = 50;
      game.feedPenguin(penguin.id, 'sardine');
      expect(penguin.exp).toBe(11 + 19);
      expect(penguin.stats.totalFeedings).toBe(3);
    });
  });
});



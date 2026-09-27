import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStore } from '../gameStore';
import { useInventoryStore } from '../inventoryStore';
import { useCollectionStore } from '../collectionStore';
import { SPECIES_LIST } from '@penguin/game-data';

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
      expect(game.currencies.fish).toBe(50);
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
      expect(game.currencies.fish).toBe(49);
      expect(penguin.happiness).toBe(65);
      expect(penguin.hunger).toBe(35);
      expect(penguin.mood).toBe('happy');
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

    it('petting a penguin increases happiness and sets mood to excited', async () => {
      const game = useGameStore();
      await game.initGame();

      const penguin = game.ownedPenguins[0];
      penguin.happiness = 80;
      penguin.mood = 'sleepy';

      const success = game.petPenguin(penguin.id);
      expect(success).toBe(true);
      expect(penguin.happiness).toBe(85);
      expect(penguin.mood).toBe('excited');
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

      // Setup slot 2 as ready with Vietnamese name
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
});

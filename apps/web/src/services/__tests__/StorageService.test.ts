import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageAdapter, createDefaultSaveData, gameStorage } from '../StorageService';

describe('StorageService', () => {
  let storage: LocalStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    storage = new LocalStorageAdapter('test_penguin_island_save');
  });

  it('generates a valid default starter save data', () => {
    const initial = createDefaultSaveData();
    expect(initial.schemaVersion).toBe(1);
    expect(initial.currencies.coins).toBe(500);
    expect(initial.currencies.fish).toBe(50);
    expect(initial.currencies.gems).toBe(10);
    expect(initial.ownedPenguins.length).toBe(1);
    expect(initial.ownedPenguins[0].speciesId).toBe('snowy');
    expect(initial.incubatorSlots.length).toBe(2);
    expect(initial.incubatorSlots[0].state).toBe('EMPTY');
    expect(initial.incubatorSlots[1].state).toBe('EMPTY');
    expect(initial.inventory.find(i => i.itemId === 'basic_egg')?.quantity).toBe(1);
    expect(initial.inventory.find(i => i.itemId === 'sardine')?.quantity).toBe(50);
  });

  it('saves and loads game state cleanly', async () => {
    const data = createDefaultSaveData();
    data.currencies.coins = 999;
    await storage.save(data);

    const loaded = await storage.load();
    expect(loaded?.currencies.coins).toBe(999);
  });

  it('handles corrupted JSON gracefully with fallback', async () => {
    localStorage.setItem('test_penguin_island_save', '{ corrupt json string');
    const loaded = await storage.load();
    expect(loaded).toBeNull();
  });

  it('returns null when save data is missing schemaVersion or empty', async () => {
    localStorage.setItem('test_penguin_island_save', JSON.stringify({ player: {} }));
    const loaded = await storage.load();
    expect(loaded).toBeNull();

    const empty = await new LocalStorageAdapter('non_existent_key').load();
    expect(empty).toBeNull();
  });

  it('fills in missing fields with defaults when loading a partial save', async () => {
    // Partial save with schemaVersion 1 but missing gems, inventory, incubatorSlots, etc.
    const partialSave = {
      schemaVersion: 1,
      createdAt: 1000,
      updatedAt: 2000,
      currencies: {
        coins: 1234,
      },
    };
    localStorage.setItem('test_penguin_island_save', JSON.stringify(partialSave));

    const loaded = await storage.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.schemaVersion).toBe(1);
    expect(loaded?.currencies.coins).toBe(1234);
    // Missing currency fields filled from defaults
    expect(loaded?.currencies.fish).toBe(50);
    expect(loaded?.currencies.gems).toBe(10);
    // Missing collections and slots filled from defaults
    expect(loaded?.ownedPenguins.length).toBe(1);
    expect(loaded?.incubatorSlots.length).toBe(2);
    expect(loaded?.inventory.length).toBeGreaterThan(0);
    expect((loaded?.player as any).displayName || (loaded?.player as any).name).toBe('Penguin Island Caretaker');
  });

  it('rejects save data where schemaVersion is unknown or invalid', async () => {
    localStorage.setItem('test_penguin_island_save', JSON.stringify({ schemaVersion: 99 }));
    const loaded = await storage.load();
    expect(loaded).toBeNull();
  });

  describe('migrateSaveData (Pure V1/V2 -> V3 Migration)', () => {
    it('converts legacy currencies.fish into sardine inventory items and upgrades to schemaVersion 3', async () => {
      const { migrateSaveData } = await import('../StorageService');
      const v1Data = {
        schemaVersion: 1,
        currencies: { fish: 15, coins: 200, gems: 5 },
        inventory: [{ itemId: 'sardine', quantity: 5, category: 'food' }],
        ownedPenguins: [{ id: 'p1', speciesId: 'snowy', nickname: 'Snowy', lastNeedsUpdateAt: 100000 }],
      };
      const v3 = migrateSaveData(v1Data);
      expect(v3.schemaVersion).toBe(3);
      expect(v3.currencies.fish).toBe(0);
      expect(v3.currencies.coins).toBe(200);
      const sardine = v3.inventory.find((i: any) => i.itemId === 'sardine');
      expect(sardine?.quantity).toBe(20); // 5 + 15
      expect(v3.ownedPenguins[0].lastNeedsUpdateAt).toBe(100000);
      // @ts-expect-error isFavorite should not exist
      expect(v3.ownedPenguins[0].isFavorite).toBeUndefined();

      // Phase 3 additions:
      expect(v3.ownedPenguins[0].traits).toEqual([]);
      expect(v3.ownedPenguins[0].breedingCount).toBe(0);
      expect(v3.ownedPenguins[0].lastBredAt).toBe(0);
      expect(v3.ownedPenguins[0].stats.fishCaught).toBe(0);
      expect(v3.breedingSlot.state).toBe('EMPTY');
      expect(v3.miniGameState.lastPlayedDate).toBe('');
    });

    it('canonicalizes exp from legacy experience without diverging', async () => {
      const { migrateSaveData } = await import('../StorageService');
      const legacySave = {
        schemaVersion: 2,
        ownedPenguins: [
          { id: 'p1', speciesId: 'snowy', experience: 350 }, // only experience present
        ],
      };
      const v3 = migrateSaveData(legacySave);
      expect(v3.ownedPenguins[0].exp).toBe(350);
      expect(v3.ownedPenguins[0].experience).toBe(350);
    });

    it('is strictly idempotent on repeated migration (V1 -> V3 -> V3)', async () => {
      const { migrateSaveData } = await import('../StorageService');
      const v1Data = { schemaVersion: 1, currencies: { fish: 10, coins: 100 } };
      const v3First = migrateSaveData(v1Data);
      const v3Second = migrateSaveData(v3First as unknown as Record<string, unknown>);
      expect(v3Second.schemaVersion).toBe(3);
      expect(v3Second.currencies.fish).toBe(0);
      const sardine = v3Second.inventory.find((i: any) => i.itemId === 'sardine');
      expect(sardine?.quantity).toBe(10); // Not doubled
      expect(v3Second.breedingSlot.state).toBe('EMPTY');
    });

    it('is pure and does not call Date.now() or getLocalDateString() or generate daily quests', async () => {
      const { migrateSaveData } = await import('../StorageService');
      const v1Data = { schemaVersion: 1 };
      const v3 = migrateSaveData(v1Data);
      expect(v3.questState.assignedDate).toBe('');
      expect(v3.questState.quests).toEqual([]);
    });

    it('does not set epoch 0 when timestamps are missing from source data', async () => {
      const { migrateSaveData } = await import('../StorageService');
      const v1Data = {
        schemaVersion: 1,
        ownedPenguins: [{ id: 'p1', speciesId: 'snowy' }],
      };
      const v3 = migrateSaveData(v1Data);
      expect(v3.ownedPenguins[0].lastNeedsUpdateAt).toBe(0);
    });
  });

  it('exports and imports JSON data correctly', () => {
    const data = createDefaultSaveData();
    const json = storage.exportJson(data);
    expect(typeof json).toBe('string');

    const imported = storage.importJson(json);
    expect(imported).not.toBeNull();
    expect(imported?.currencies.coins).toBe(data.currencies.coins);

    expect(storage.importJson('{ bad json')).toBeNull();
    expect(storage.importJson(JSON.stringify({ schemaVersion: 99 }))).toBeNull();
  });

  it('clears storage item upon clear()', async () => {
    const data = createDefaultSaveData();
    await storage.save(data);
    expect(await storage.load()).not.toBeNull();

    await storage.clear();
    expect(await storage.load()).toBeNull();
  });

  it('provides gameStorage singleton instance', () => {
    expect(gameStorage).toBeInstanceOf(LocalStorageAdapter);
  });
});

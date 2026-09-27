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

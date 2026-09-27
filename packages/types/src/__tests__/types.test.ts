import { describe, it, expect } from 'vitest';
import * as Types from '../index';
import type {
  RarityTier,
  PenguinPersonality,
  PenguinMood,
  PenguinSpecies,
  OwnedPenguin,
  EggType,
  DropPoolEntry,
  IncubatorState,
  IncubatorSlot,
  ItemCategory,
  InventoryItem,
  Currencies,
  GameSaveData,
} from '../index';

describe('Shared Types', () => {
  it('should export the module', () => {
    expect(Types).toBeDefined();
  });
  it('should construct a valid PenguinSpecies and OwnedPenguin object', () => {
    const species: PenguinSpecies = {
      id: 'snowy',
      speciesNumber: '001',
      name: 'Snowy',
      rarity: 'common',
      personality: 'shy',
      trait: 'Chilly Feet',
      favoriteFood: 'Small Sardine',
      dislikedFood: 'Spicy Pepper',
      description: 'A quiet penguin who loves soft snow.',
      clue: 'Loves eating snacks near the igloo.',
      visualKey: 'penguin_snowy',
    };
    expect(species.id).toBe('snowy');
    expect(species.rarity).toBe('common');
    expect(species.personality).toBe('shy');

    const owned: OwnedPenguin = {
      id: 'uuid-1234',
      speciesId: 'snowy',
      nickname: 'Snowball',
      level: 1,
      experience: 0,
      happiness: 80,
      energy: 100,
      hunger: 30,
      mood: 'happy',
      acquiredAt: 1700000000000,
      generation: 1,
      parentAId: 'p-1',
      parentBId: 'p-2',
    };
    expect(owned.nickname).toBe('Snowball');
    expect(owned.mood).toBe('happy');
    expect(owned.parentAId).toBe('p-1');
  });

  it('should construct valid EggType and DropPoolEntry objects', () => {
    const dropEntry: DropPoolEntry = {
      speciesId: 'snowy',
      weight: 70,
    };
    expect(dropEntry.weight).toBe(70);

    const egg: EggType = {
      id: 'basic_egg',
      name: 'Common Egg',
      rarity: 'common',
      hatchDurationSec: 300,
      visualTheme: 'frost_white',
      minPlayerLevel: 1,
      dropPool: [dropEntry],
    };
    expect(egg.hatchDurationSec).toBe(300);
    expect(egg.dropPool).toHaveLength(1);
  });

  it('should construct valid IncubatorSlot and IncubatorState objects', () => {
    const state: IncubatorState = 'INCUBATING';
    const slot: IncubatorSlot = {
      slotId: 0,
      state,
      eggTypeId: 'basic_egg',
      startTime: 1700000000000,
      durationSec: 300,
      readyAt: 1700000300000,
    };
    expect(slot.slotId).toBe(0);
    expect(slot.state).toBe('INCUBATING');
  });

  it('should construct valid InventoryItem and Currencies objects', () => {
    const category: ItemCategory = 'food';
    const item: InventoryItem = {
      itemId: 'sardine',
      category,
      name: 'Small Sardine',
      description: 'A tiny fish penguins adore.',
      quantity: 5,
      stackable: true,
      metadata: { nutrition: 10 },
    };
    expect(item.itemId).toBe('sardine');
    expect(item.quantity).toBe(5);

    const wallet: Currencies = {
      coins: 1000,
      gems: 50,
      fish: 25,
    };
    expect(wallet.coins).toBe(1000);
    expect(wallet.gems).toBe(50);
    expect(wallet.fish).toBe(25);
  });

  it('should construct a valid GameSaveData schema object', () => {
    const save: GameSaveData = {
      schemaVersion: 1,
      createdAt: 1700000000000,
      updatedAt: 1700000500000,
      player: {
        id: 'player_001',
        displayName: 'IslandKeeper',
        level: 1,
        experience: 0,
        avatarId: 'avatar_default',
      },
      currencies: {
        coins: 100,
        gems: 10,
        fish: 5,
      },
      inventory: [],
      ownedPenguins: [],
      collectionBook: [
        {
          speciesId: 'snowy',
          discoveredAt: 1700000000000,
        },
      ],
      incubatorSlots: [
        {
          slotId: 0,
          state: 'EMPTY',
        },
      ],
      islandState: {
        islandId: 'island_main',
        theme: 'snowy_peak',
        decorationsPlaced: [
          {
            id: 'deco_001',
            itemId: 'igloo_small',
            x: 10,
            y: 20,
          },
        ],
      },
    };

    expect(save.schemaVersion).toBe(1);
    expect(save.player.displayName).toBe('IslandKeeper');
    expect(save.collectionBook).toHaveLength(1);
    expect(save.islandState.decorationsPlaced).toHaveLength(1);
  });

  it('should validate all RarityTier, PenguinPersonality, and PenguinMood literals', () => {
    const rarities: RarityTier[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    expect(rarities).toHaveLength(6);

    const personalities: PenguinPersonality[] = [
      'lazy',
      'hungry',
      'dramatic',
      'nerd',
      'rich',
      'romantic',
      'chaotic',
      'shy',
      'brave',
      'sleepy',
      'happy',
    ];
    expect(personalities).toHaveLength(11);

    const moods: PenguinMood[] = ['happy', 'sleepy', 'hungry', 'sad', 'excited', 'playful'];
    expect(moods).toHaveLength(6);
  });
});

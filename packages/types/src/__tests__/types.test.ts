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
      favoriteFoodId: 'sardine',
    };
    expect(species.id).toBe('snowy');
    expect(species.rarity).toBe('common');
    expect(species.personality).toBe('shy');

    const owned: OwnedPenguin = {
      id: 'uuid-1234',
      speciesId: 'snowy',
      nickname: 'Snowball',
      level: 1,
      exp: 0,
      experience: 0,
      happiness: 80,
      energy: 100,
      hunger: 30,
      mood: 'happy',
      lastPetAt: 0,
      lastFedAt: 0,
      lastNeedsUpdateAt: 1700000000000,
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

describe('Phase 2 Types', () => {
  it('constructs valid PlayerProfile, PlacedDecoration, and IslandState with unlockedPlacementExpIds', () => {
    const profile: Types.PlayerProfile = {
      level: 1,
      exp: 0,
      name: 'Người Nuôi Chim Cánh Cụt',
      avatar: 'snowy',
    };
    expect(profile.level).toBe(1);

    const island: Types.IslandState = {
      decorations: [],
      unlockedPlacementExpIds: ['bench_wood'],
    };
    expect(island.unlockedPlacementExpIds).toContain('bench_wood');
  });

  it('constructs OwnedPenguin with lastFedAt and without isFavorite', () => {
    const penguin: Types.OwnedPenguin = {
      id: 'p1',
      speciesId: 'snowy',
      nickname: 'Bông Tuyết',
      level: 1,
      exp: 0,
      happiness: 80,
      hunger: 20,
      mood: 'happy',
      lastPetAt: 0,
      lastFedAt: 0,
      lastNeedsUpdateAt: 1000,
      generation: 1,
      createdAt: 1000,
    };
    expect(penguin.lastFedAt).toBe(0);
    // @ts-expect-error isFavorite should not exist on OwnedPenguin
    expect(penguin.isFavorite).toBeUndefined();
  });

  it('constructs IncubatorSlot with pendingSpeciesId', () => {
    const slot: Types.IncubatorSlot = {
      slotId: 1,
      state: 'READY_TO_HATCH',
      eggTypeId: 'basic_egg',
      unlocked: true,
      pendingSpeciesId: 'snowy',
    };
    expect(slot.pendingSpeciesId).toBe('snowy');
  });

  it('constructs valid GameSaveDataV2 object', () => {
    const saveV2: Types.GameSaveDataV2 = {
      schemaVersion: 2,
      player: {
        level: 1,
        exp: 0,
        name: 'Chủ Đảo',
        avatar: 'avatar_default',
      },
      currencies: {
        coins: 100,
        gems: 0,
        fish: 0,
      },
      inventory: [],
      ownedPenguins: [],
      incubatorSlots: [],
      island: {
        decorations: [],
        unlockedPlacementExpIds: [],
      },
      dailyLogin: {
        lastClaimDate: null,
        currentStreak: 1,
      },
      questState: {
        assignedDate: '2026-09-28',
        quests: [],
      },
      timestamps: {
        createdAt: 1000,
        lastSavedAt: 1000,
        lastLoginAt: 1000,
      },
    };
    expect(saveV2.schemaVersion).toBe(2);
    expect(saveV2.currencies.fish).toBe(0);
  });
});

describe('Phase 3 Types', () => {
  it('constructs OwnedPenguin with canonical exp, traits, breedingCount, and stats', () => {
    const penguin: Types.OwnedPenguin = {
      id: 'p-phase3-1',
      speciesId: 'snowy',
      nickname: 'Snowy Jr',
      level: 3,
      exp: 260,
      happiness: 90,
      hunger: 10,
      mood: 'happy',
      lastPetAt: 0,
      lastFedAt: 0,
      lastNeedsUpdateAt: 1000,
      generation: 2,
      parentAId: 'parent-1',
      parentBId: 'parent-2',
      traits: ['glutton', 'lucky'],
      breedingCount: 0,
      lastBredAt: 0,
      stats: {
        fishCaught: 5,
        totalPets: 12,
        totalFeedings: 8,
        gamesPlayed: 3,
      },
      createdAt: 1000,
    };
    expect(penguin.exp).toBe(260);
    expect(penguin.traits).toEqual(['glutton', 'lucky']);
    expect(penguin.generation).toBe(2);
    expect(penguin.stats?.fishCaught).toBe(5);
  });

  it('constructs GeneticsResult and BreedingSlot', () => {
    const genetics: Types.GeneticsResult = {
      speciesId: 'snowy',
      traits: ['speedy'],
      generation: 2,
      parentAId: 'p-1',
      parentBId: 'p-2',
      mutatedSpecies: false,
      personality: 'shy',
    };
    expect(genetics.speciesId).toBe('snowy');

    const slot: Types.BreedingSlot = {
      slotId: 1,
      state: 'READY_TO_COLLECT',
      parentAId: 'p-1',
      parentBId: 'p-2',
      startedAt: 1000,
      durationSec: 300,
      targetCollectTime: 301000,
      geneticsResult: genetics,
    };
    expect(slot.state).toBe('READY_TO_COLLECT');
    expect(slot.geneticsResult?.traits).toContain('speedy');
  });

  it('constructs MiniGameResult, MiniGameReward, and GameSaveDataV3', () => {
    const result: Types.MiniGameResult = {
      sessionId: 'sess-123',
      gameId: 'catch_fish',
      companionPenguinId: 'p-1',
      score: 150,
      accuracy: 92,
      catchesCount: 12,
      durationSec: 30,
      completedAt: 1000,
    };
    expect(result.score).toBe(150);

    const reward: Types.MiniGameReward = {
      tier: 'diamond',
      coins: 100,
      playerExp: 40,
      penguinExp: 35,
      items: [{ itemId: 'fat_salmon', quantity: 1 }],
    };
    expect(reward.tier).toBe('diamond');

    const saveV3: Types.GameSaveDataV3 = {
      schemaVersion: 3,
      player: {
        level: 1,
        exp: 0,
        name: 'Chủ Đảo',
        avatar: 'avatar_default',
      },
      currencies: { coins: 100, gems: 0, fish: 0 },
      inventory: [],
      ownedPenguins: [],
      incubatorSlots: [],
      island: { decorations: [], unlockedPlacementExpIds: [] },
      dailyLogin: { lastClaimDate: null, currentStreak: 1 },
      questState: { assignedDate: '2026-09-28', quests: [] },
      timestamps: { createdAt: 1000, lastSavedAt: 1000, lastLoginAt: 1000 },
      breedingSlot: {
        slotId: 1,
        state: 'EMPTY',
      },
      miniGameState: {
        lastPlayedDate: '2026-09-28',
        dailyPlaysCount: { catch_fish: 1 },
      },
    };
    expect(saveV3.schemaVersion).toBe(3);
    expect(saveV3.breedingSlot.state).toBe('EMPTY');
  });
});


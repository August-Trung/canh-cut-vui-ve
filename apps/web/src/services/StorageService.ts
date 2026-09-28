import type {
  GameSaveData,
  GameSaveDataV2,
  GameSaveDataV3,
  OwnedPenguin,
  IncubatorSlot,
  InventoryItem,
  PlayerProfile,
  IslandState,
  DailyLoginState,
  QuestState,
  ActiveQuest,
  PlacedDecoration,
  PenguinMood,
  BreedingSlot,
  BreedingSlotState,
  GeneticsResult,
  MiniGameState,
} from '@penguin/types';
import { INITIAL_ITEMS } from '@penguin/game-data';

export interface IGameStorage {
  load(): Promise<GameSaveData | GameSaveDataV2 | GameSaveDataV3 | null>;
  save(data: GameSaveData | GameSaveDataV2 | GameSaveDataV3): Promise<void>;
  exportJson(data: GameSaveData | GameSaveDataV2 | GameSaveDataV3): string;
  importJson(json: string): GameSaveData | GameSaveDataV2 | GameSaveDataV3 | null;
  clear(): Promise<void>;
}

export function createDefaultSaveData(): GameSaveData {
  const starterPenguin: OwnedPenguin = {
    id: `penguin_${Date.now()}_starter`,
    speciesId: 'snowy',
    nickname: 'Snowy',
    level: 1,
    exp: 0,
    experience: 0,
    happiness: 80,
    energy: 100,
    hunger: 20,
    mood: 'happy',
    lastPetAt: 0,
    lastFedAt: 0,
    lastNeedsUpdateAt: Date.now(),
    acquiredAt: Date.now(),
    generation: 1,
  };

  const starterSlots: IncubatorSlot[] = [
    { slotId: 1, state: 'EMPTY' },
    { slotId: 2, state: 'EMPTY' },
  ];

  return {
    schemaVersion: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    player: {
      id: 'player_local_01',
      displayName: 'Penguin Island Caretaker',
      level: 1,
      experience: 0,
      avatarId: 'avatar_default',
    },
    currencies: {
      coins: 500, // Dev seed data
      fish: 50,
      gems: 10,
    },
    inventory: INITIAL_ITEMS.map((item) => ({ ...item })),
    ownedPenguins: [starterPenguin],
    collectionBook: [
      { speciesId: 'snowy', discoveredAt: Date.now() },
    ],
    incubatorSlots: starterSlots,
    islandState: {
      islandId: 'snow_island_01',
      theme: 'snow',
      decorationsPlaced: [],
    },
  };
}

export function createDefaultSaveDataV2(): GameSaveDataV2 {
  const now = Date.now();
  const starterPenguin: OwnedPenguin = {
    id: `penguin_${now}_starter`,
    speciesId: 'snowy',
    nickname: 'Snowy',
    level: 1,
    exp: 0,
    experience: 0,
    happiness: 80,
    energy: 100,
    hunger: 20,
    mood: 'happy',
    lastPetAt: 0,
    lastFedAt: 0,
    lastNeedsUpdateAt: 0,
    acquiredAt: now,
    generation: 1,
    createdAt: now,
  };

  return {
    schemaVersion: 2,
    player: {
      level: 1,
      exp: 0,
      name: 'Chủ Đảo Tập Sự',
      avatar: 'avatar_default',
    },
    currencies: {
      coins: 500,
      gems: 10,
      fish: 0,
    },
    inventory: INITIAL_ITEMS.map((item) => ({ ...item })),
    ownedPenguins: [starterPenguin],
    incubatorSlots: [
      { slotId: 1, state: 'EMPTY', unlocked: true, lastNurtureAt: 0, nurtureCount: 0 },
      { slotId: 2, state: 'EMPTY', unlocked: false, unlockCost: 500, lastNurtureAt: 0, nurtureCount: 0 },
    ],
    island: {
      decorations: [],
      unlockedPlacementExpIds: [],
    },
    dailyLogin: {
      lastClaimDate: null,
      currentStreak: 1,
    },
    questState: {
      assignedDate: '',
      quests: [],
    },
    timestamps: {
      createdAt: now,
      lastSavedAt: now,
      lastLoginAt: now,
    },
  };
}

export function createDefaultSaveDataV3(): GameSaveDataV3 {
  const now = Date.now();
  const starterPenguin: OwnedPenguin = {
    id: `penguin_${now}_starter`,
    speciesId: 'snowy',
    nickname: 'Snowy',
    level: 1,
    exp: 0,
    experience: 0,
    happiness: 80,
    energy: 100,
    hunger: 20,
    mood: 'happy',
    lastPetAt: 0,
    lastFedAt: 0,
    lastNeedsUpdateAt: 0,
    acquiredAt: now,
    generation: 1,
    createdAt: now,
    traits: [],
    breedingCount: 0,
    lastBredAt: 0,
    stats: {
      fishCaught: 0,
      totalPets: 0,
      totalFeedings: 0,
      gamesPlayed: 0,
    },
  };

  return {
    schemaVersion: 3,
    player: {
      level: 1,
      exp: 0,
      name: 'Chủ Đảo Tập Sự',
      avatar: 'avatar_default',
    },
    currencies: {
      coins: 500,
      gems: 10,
      fish: 0,
    },
    inventory: INITIAL_ITEMS.map((item) => ({ ...item })),
    ownedPenguins: [starterPenguin],
    incubatorSlots: [
      { slotId: 1, state: 'EMPTY', unlocked: true, lastNurtureAt: 0, nurtureCount: 0 },
      { slotId: 2, state: 'EMPTY', unlocked: false, unlockCost: 500, lastNurtureAt: 0, nurtureCount: 0 },
    ],
    island: {
      decorations: [],
      unlockedPlacementExpIds: [],
    },
    dailyLogin: {
      lastClaimDate: null,
      currentStreak: 1,
    },
    questState: {
      assignedDate: '',
      quests: [],
    },
    timestamps: {
      createdAt: now,
      lastSavedAt: now,
      lastLoginAt: now,
    },
    breedingSlot: {
      slotId: 1,
      state: 'EMPTY',
    },
    miniGameState: {
      lastPlayedDate: '',
      dailyPlaysCount: {},
    },
  };
}

export function migrateSaveData(data: Record<string, unknown>): GameSaveDataV3 {
  const rawCurrencies = (data.currencies as Record<string, unknown>) ?? {};
  const rawInventory = (data.inventory as InventoryItem[]) ?? [];

  const inventory = [...rawInventory];
  const legacyFishCount = Number(rawCurrencies.fish ?? 0);

  const sardineIndex = inventory.findIndex((item) => item.itemId === 'sardine');
  if (legacyFishCount > 0) {
    if (sardineIndex >= 0) {
      inventory[sardineIndex] = {
        ...inventory[sardineIndex],
        quantity: inventory[sardineIndex].quantity + legacyFishCount,
      };
    } else {
      inventory.push({
        itemId: 'sardine',
        category: 'food',
        name: 'Small Sardine',
        description: 'Cá mòi tươi ngon dùng để cho chim cánh cụt ăn.',
        quantity: legacyFishCount,
        stackable: true,
      });
    }
  }

  const currencies: GameSaveDataV3['currencies'] = {
    coins: Number(rawCurrencies.coins ?? 100),
    gems: Number(rawCurrencies.gems ?? 0),
    fish: 0,
  };

  const rawPenguins = (data.ownedPenguins as Record<string, unknown>[]) ?? [];
  const rawTimestamps = (data.timestamps as Record<string, unknown>) ?? (data.updatedAt ? { lastSavedAt: data.updatedAt, createdAt: data.createdAt } : {});
  const savedAt = Number(rawTimestamps.lastSavedAt ?? rawTimestamps.createdAt ?? 0);

  const ownedPenguins: OwnedPenguin[] = rawPenguins.map((p) => {
    const rawNeedsUpdate = Number(p.lastNeedsUpdateAt ?? 0);
    // Preserve valid positive historical timestamp; if missing/invalid, use savedAt if > 0, else 0
    const lastNeedsUpdateAt = rawNeedsUpdate > 0 ? rawNeedsUpdate : (savedAt > 0 ? savedAt : 0);
    // Canonical exp field:
    const expVal = Number(p.exp ?? p.experience ?? 0);
    const rawStats = (p.stats as Record<string, unknown>) ?? {};

    return {
      id: String(p.id),
      speciesId: String(p.speciesId),
      nickname: String(p.nickname ?? 'Cánh Cụt'),
      level: Number(p.level ?? 1),
      exp: expVal,
      experience: expVal, // Synced alias for migration compatibility
      happiness: Number(p.happiness ?? 80),
      energy: Number(p.energy ?? 100),
      hunger: Number(p.hunger ?? 20),
      mood: (p.mood as PenguinMood) ?? 'happy',
      lastPetAt: Number(p.lastPetAt ?? 0),
      lastFedAt: Number(p.lastFedAt ?? 0),
      lastNeedsUpdateAt,
      generation: Number(p.generation ?? 1),
      createdAt: Number(p.createdAt ?? savedAt),
      parentAId: p.parentAId ? String(p.parentAId) : undefined,
      parentBId: p.parentBId ? String(p.parentBId) : undefined,

      // Phase 3 additions:
      traits: Array.isArray(p.traits) ? [...(p.traits as string[])] : [],
      breedingCount: Number(p.breedingCount ?? 0),
      lastBredAt: Number(p.lastBredAt ?? 0),
      stats: {
        fishCaught: Number(rawStats.fishCaught ?? 0),
        totalPets: Number(rawStats.totalPets ?? 0),
        totalFeedings: Number(rawStats.totalFeedings ?? 0),
        gamesPlayed: Number(rawStats.gamesPlayed ?? 0),
      },
    };
  });

  const rawSlots = (data.incubatorSlots as Record<string, unknown>[]) ?? [];
  const incubatorSlots: IncubatorSlot[] = [
    {
      slotId: 1,
      state: (rawSlots[0]?.state as any) ?? 'EMPTY',
      eggTypeId: rawSlots[0]?.eggTypeId as string | undefined,
      targetHatchTime: (rawSlots[0]?.targetHatchTime ?? rawSlots[0]?.readyAt) as number | undefined,
      unlocked: true,
      lastNurtureAt: Number(rawSlots[0]?.lastNurtureAt ?? 0),
      nurtureCount: Number(rawSlots[0]?.nurtureCount ?? 0),
      pendingSpeciesId: rawSlots[0]?.pendingSpeciesId as string | undefined,
    },
    {
      slotId: 2,
      state: (rawSlots[1]?.state as any) ?? 'EMPTY',
      eggTypeId: rawSlots[1]?.eggTypeId as string | undefined,
      targetHatchTime: (rawSlots[1]?.targetHatchTime ?? rawSlots[1]?.readyAt) as number | undefined,
      unlocked: Boolean(rawSlots[1]?.unlocked ?? false),
      unlockCost: 500,
      lastNurtureAt: Number(rawSlots[1]?.lastNurtureAt ?? 0),
      nurtureCount: Number(rawSlots[1]?.nurtureCount ?? 0),
      pendingSpeciesId: rawSlots[1]?.pendingSpeciesId as string | undefined,
    },
  ];

  const rawIsland = (data.island as Record<string, unknown>) ?? (data.islandState as Record<string, unknown>) ?? {};
  const island: IslandState = {
    decorations: (rawIsland.decorations as PlacedDecoration[]) ?? [],
    unlockedPlacementExpIds: (rawIsland.unlockedPlacementExpIds as string[]) ?? [],
  };

  const rawDailyLogin = (data.dailyLogin as Record<string, unknown>) ?? {};
  const dailyLogin: DailyLoginState = {
    lastClaimDate: (rawDailyLogin.lastClaimDate as string | null) ?? null,
    currentStreak: Number(rawDailyLogin.currentStreak ?? 1),
  };

  const rawQuestState = (data.questState as Record<string, unknown>) ?? {};
  const questState: QuestState = {
    assignedDate: String(rawQuestState.assignedDate ?? ''),
    quests: (rawQuestState.quests as ActiveQuest[]) ?? [],
  };

  const rawPlayer = (data.player as Record<string, unknown>) ?? {};
  const player: PlayerProfile = {
    level: Number(rawPlayer.level ?? 1),
    exp: Number(rawPlayer.exp ?? rawPlayer.experience ?? 0),
    name: String(rawPlayer.name ?? rawPlayer.displayName ?? 'Chủ Đảo Tập Sự'),
    avatar: String(rawPlayer.avatar ?? rawPlayer.avatarId ?? 'avatar_default'),
  };

  // Phase 3 additions:
  const rawBreedingSlot = (data.breedingSlot as Record<string, unknown>) ?? {};
  const breedingSlot: BreedingSlot = {
    slotId: Number(rawBreedingSlot.slotId ?? 1),
    state: (rawBreedingSlot.state as BreedingSlotState) ?? 'EMPTY',
    parentAId: rawBreedingSlot.parentAId ? String(rawBreedingSlot.parentAId) : undefined,
    parentBId: rawBreedingSlot.parentBId ? String(rawBreedingSlot.parentBId) : undefined,
    startedAt: rawBreedingSlot.startedAt ? Number(rawBreedingSlot.startedAt) : undefined,
    durationSec: rawBreedingSlot.durationSec ? Number(rawBreedingSlot.durationSec) : undefined,
    targetCollectTime: rawBreedingSlot.targetCollectTime ? Number(rawBreedingSlot.targetCollectTime) : undefined,
    geneticsResult: (rawBreedingSlot.geneticsResult as GeneticsResult) ?? undefined,
  };

  const rawMiniGame = (data.miniGameState as Record<string, unknown>) ?? {};
  const miniGameState: MiniGameState = {
    lastPlayedDate: String(rawMiniGame.lastPlayedDate ?? ''),
    dailyPlaysCount: (rawMiniGame.dailyPlaysCount as Record<string, number>) ?? {},
  };

  return {
    schemaVersion: 3,
    player,
    currencies,
    inventory,
    ownedPenguins,
    incubatorSlots,
    island,
    dailyLogin,
    questState,
    timestamps: {
      createdAt: Number(rawTimestamps.createdAt ?? savedAt),
      lastSavedAt: Number(rawTimestamps.lastSavedAt ?? savedAt),
      lastLoginAt: Number(rawTimestamps.lastLoginAt ?? savedAt),
    },
    breedingSlot,
    miniGameState,
  };
}

function mergeWithDefaults(loaded: Partial<GameSaveData>): GameSaveData {
  const defaults = createDefaultSaveData();

  return {
    schemaVersion: 1,
    createdAt: loaded.createdAt ?? defaults.createdAt,
    updatedAt: loaded.updatedAt ?? defaults.updatedAt,
    player: {
      ...defaults.player,
      ...loaded.player,
    },
    currencies: {
      ...defaults.currencies,
      ...loaded.currencies,
    },
    inventory: Array.isArray(loaded.inventory) ? loaded.inventory : defaults.inventory,
    ownedPenguins: Array.isArray(loaded.ownedPenguins) ? loaded.ownedPenguins : defaults.ownedPenguins,
    collectionBook: Array.isArray(loaded.collectionBook) ? loaded.collectionBook : defaults.collectionBook,
    incubatorSlots: Array.isArray(loaded.incubatorSlots) ? loaded.incubatorSlots : defaults.incubatorSlots,
    islandState: {
      ...defaults.islandState,
      ...loaded.islandState,
      decorationsPlaced: Array.isArray(loaded.islandState?.decorationsPlaced)
        ? loaded.islandState.decorationsPlaced
        : defaults.islandState.decorationsPlaced,
    },
  };
}

export class LocalStorageAdapter implements IGameStorage {
  private key: string;

  constructor(key = 'penguin_island_save_v1') {
    this.key = key;
  }

  async load(): Promise<GameSaveData | GameSaveDataV2 | GameSaveDataV3 | null> {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }
      if (parsed.schemaVersion === 3) {
        return parsed as GameSaveDataV3;
      }
      if (parsed.schemaVersion === 2) {
        return parsed as GameSaveDataV2;
      }
      if (parsed.schemaVersion === 1) {
        return mergeWithDefaults(parsed as Partial<GameSaveData>);
      }
      return null;
    } catch {
      return null;
    }
  }

  async save(data: GameSaveData | GameSaveDataV2 | GameSaveDataV3): Promise<void> {
    if ('updatedAt' in data) {
      data.updatedAt = Date.now();
    } else if ('timestamps' in data && data.timestamps) {
      data.timestamps.lastSavedAt = Date.now();
    }
    localStorage.setItem(this.key, JSON.stringify(data));
  }

  exportJson(data: GameSaveData | GameSaveDataV2 | GameSaveDataV3): string {
    return JSON.stringify(data, null, 2);
  }

  importJson(json: string): GameSaveData | GameSaveDataV2 | GameSaveDataV3 | null {
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === 'object') {
        if (parsed.schemaVersion === 3) {
          return parsed as GameSaveDataV3;
        }
        if (parsed.schemaVersion === 2) {
          return parsed as GameSaveDataV2;
        }
        if (parsed.schemaVersion === 1) {
          return mergeWithDefaults(parsed as Partial<GameSaveData>);
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.key);
  }
}

export const gameStorage = new LocalStorageAdapter();

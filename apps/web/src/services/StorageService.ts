import { GameSaveData, OwnedPenguin, IncubatorSlot } from '@penguin/types';
import { INITIAL_ITEMS } from '@penguin/game-data';

export interface IGameStorage {
  load(): Promise<GameSaveData | null>;
  save(data: GameSaveData): Promise<void>;
  exportJson(data: GameSaveData): string;
  importJson(json: string): GameSaveData | null;
  clear(): Promise<void>;
}

export function createDefaultSaveData(): GameSaveData {
  const starterPenguin: OwnedPenguin = {
    id: `penguin_${Date.now()}_starter`,
    speciesId: 'snowy',
    nickname: 'Snowy',
    level: 1,
    experience: 0,
    happiness: 80,
    energy: 100,
    hunger: 20,
    mood: 'happy',
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

  async load(): Promise<GameSaveData | null> {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || parsed.schemaVersion !== 1) {
        return null;
      }
      return mergeWithDefaults(parsed as Partial<GameSaveData>);
    } catch {
      return null;
    }
  }

  async save(data: GameSaveData): Promise<void> {
    data.updatedAt = Date.now();
    localStorage.setItem(this.key, JSON.stringify(data));
  }

  exportJson(data: GameSaveData): string {
    return JSON.stringify(data, null, 2);
  }

  importJson(json: string): GameSaveData | null {
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === 'object' && parsed.schemaVersion === 1) {
        return mergeWithDefaults(parsed as Partial<GameSaveData>);
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

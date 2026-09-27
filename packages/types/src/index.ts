export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type PenguinPersonality =
  | 'lazy'
  | 'hungry'
  | 'dramatic'
  | 'nerd'
  | 'rich'
  | 'romantic'
  | 'chaotic'
  | 'shy'
  | 'brave'
  | 'sleepy'
  | 'happy';

export type PenguinMood =
  | 'happy'
  | 'sleepy'
  | 'hungry'
  | 'sad'
  | 'excited'
  | 'playful';

export interface PenguinSpecies {
  id: string;
  speciesNumber: string;
  name: string;
  rarity: RarityTier;
  personality: PenguinPersonality;
  trait: string;
  favoriteFood: string;
  dislikedFood: string;
  description: string;
  clue: string;
  visualKey: string;
}

export interface OwnedPenguin {
  id: string;
  speciesId: string;
  nickname: string;
  level: number;
  experience: number;
  happiness: number;
  energy: number;
  hunger: number;
  mood: PenguinMood;
  acquiredAt: number;
  generation: number;
  parentAId?: string;
  parentBId?: string;
}

export interface DropPoolEntry {
  speciesId: string;
  weight: number;
}

export interface EggType {
  id: string;
  name: string;
  rarity: RarityTier;
  hatchDurationSec: number;
  visualTheme: string;
  minPlayerLevel?: number;
  eventId?: string;
  guaranteedRare?: boolean;
  dropPool: DropPoolEntry[];
}

export type IncubatorState =
  | 'EMPTY'
  | 'EGG_PLACED'
  | 'INCUBATING'
  | 'READY_TO_HATCH'
  | 'HATCHING'
  | 'HATCHED';

export interface IncubatorSlot {
  slotId: number;
  state: IncubatorState;
  eggTypeId?: string;
  startTime?: number;
  durationSec?: number;
  readyAt?: number;
  hatchedPenguinId?: string;
}

export type ItemCategory = 'eggs' | 'food' | 'decorations' | 'cosmetics' | 'special';

export interface InventoryItem {
  itemId: string;
  category: ItemCategory;
  name: string;
  description: string;
  quantity: number;
  stackable: boolean;
  metadata?: Record<string, unknown>;
}

export interface Currencies {
  coins: number;
  gems: number;
  fish: number;
}

export interface GameSaveData {
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
  player: {
    id: string;
    displayName: string;
    level: number;
    experience: number;
    avatarId: string;
  };
  currencies: Currencies;
  inventory: InventoryItem[];
  ownedPenguins: OwnedPenguin[];
  collectionBook: {
    speciesId: string;
    discoveredAt: number;
  }[];
  incubatorSlots: IncubatorSlot[];
  islandState: {
    islandId: string;
    theme: string;
    decorationsPlaced: {
      id: string;
      itemId: string;
      x: number;
      y: number;
    }[];
  };
}

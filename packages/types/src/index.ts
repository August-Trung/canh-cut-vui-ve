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
  | 'content'
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
  favoriteFoodId: string;
}

export interface PenguinStats {
  fishCaught: number;
  totalPets: number;
  totalFeedings: number;
  gamesPlayed: number;
}

export interface OwnedPenguin {
  id: string;
  speciesId: string;
  nickname: string;
  level: number;
  exp: number; // Canonical cumulative EXP
  experience?: number; // Migration alias
  happiness: number;
  energy?: number;
  hunger: number;
  mood: PenguinMood;
  lastPetAt: number;
  lastFedAt: number;
  lastNeedsUpdateAt: number;
  acquiredAt?: number;
  generation: number;
  createdAt?: number;
  parentAId?: string;
  parentBId?: string;

  // Phase 3 additions:
  traits?: string[];
  breedingCount?: number;
  lastBredAt?: number;
  stats?: PenguinStats;
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

export type IncubatorSlotState = IncubatorState;

export interface IncubatorSlot {
  slotId: number;
  state: IncubatorState;
  eggTypeId?: string;
  startTime?: number;
  durationSec?: number;
  readyAt?: number;
  targetHatchTime?: number;
  hatchedPenguinId?: string;
  unlocked?: boolean;
  unlockCost?: number;
  lastNurtureAt?: number;
  nurtureCount?: number;
  pendingSpeciesId?: string;
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

// --- Phase 2 Entities & Progression ---

export interface PlayerProfile {
  level: number;
  exp: number;
  name: string;
  avatar: string;
}

export interface PlacedDecoration {
  instanceId: string;
  decorationId: string;
  plotId: number;
  placedAt: number;
}

export interface DecorationPlot {
  id: number;
  x: number;
  y: number;
  name: string;
  depthOffset: number;
}

export interface DecorationDefinition {
  id: string;
  name: string;
  description: string;
  cozyPoints: number;
  playerLevelRequired: number;
  priceCoins: number;
  priceGems?: number;
  visualKey: string;
}

export interface FoodItemDefinition {
  id: string;
  name: string;
  description: string;
  hungerReduction: number;
  happinessBonus: number;
  playerLevelRequired: number;
  coinPrice: number;
  icon: string;
}

export interface EggShopDefinition {
  id: string;
  name: string;
  description: string;
  incubationSeconds: number;
  playerLevelRequired: number;
  priceCoins: number;
  priceGems?: number;
  icon: string;
}

export interface IslandState {
  decorations: PlacedDecoration[];
  unlockedPlacementExpIds: string[];
}

export interface DailyLoginState {
  lastClaimDate: string | null;
  currentStreak: number;
}

export interface ActiveQuest {
  questId: string;
  currentCount: number;
  targetCount: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetType: 'pet' | 'feed' | 'hatch' | 'buy_shop' | 'place_decoration';
  targetCount: number;
  rewardCoins: number;
  rewardExp: number;
  rewardGems?: number;
}

export interface QuestState {
  assignedDate: string;
  quests: ActiveQuest[];
}

// --- Versioned Save Schemas ---

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

export interface GameSaveDataV2 {
  schemaVersion: 2;
  player: PlayerProfile;
  currencies: {
    coins: number;
    gems: number;
    fish: number;
  };
  inventory: InventoryItem[];
  ownedPenguins: OwnedPenguin[];
  incubatorSlots: IncubatorSlot[];
  island: IslandState;
  dailyLogin: DailyLoginState;
  questState: QuestState;
  timestamps: {
    createdAt: number;
    lastSavedAt: number;
    lastLoginAt: number;
  };
}

// --- Phase 3 Entities, Genetics, Breeding & Mini-Games ---

export type TraitEffectType = 'care' | 'minigame' | 'island' | 'breeding';

export interface PenguinTraitDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  effectType: TraitEffectType;
  rarity: 'common' | 'rare' | 'epic';
}

export interface GeneticsResult {
  speciesId: string;
  traits: string[];
  generation: number;
  parentAId: string;
  parentBId: string;
  mutatedSpecies: boolean;
  personality: PenguinPersonality;
}

export type BreedingSlotState = 'EMPTY' | 'BREEDING' | 'READY_TO_COLLECT';

export interface BreedingSlot {
  slotId: number;
  state: BreedingSlotState;
  parentAId?: string;
  parentBId?: string;
  startedAt?: number;
  durationSec?: number;
  targetCollectTime?: number;
  geneticsResult?: GeneticsResult;
}

export interface BreedingConfig {
  minParentLevel: number;
  costCoins: number;
  costGems: number;
  cooldownMs: number;
  durationSeconds: number;
  devDurationSeconds?: number;
}

export interface MiniGameConfig {
  id: string;
  title: string;
  description: string;
  durationSeconds: number;
  dailyFreePlays: number;
  maxExtraPlaysPerDay: number;
  extraPlayCostCoins: number;
  maxScoreCap: number;
}

export interface MiniGameResult {
  sessionId: string;
  gameId: string;
  companionPenguinId?: string;
  score: number;
  accuracy: number;
  catchesCount: number;
  durationSec: number;
  completedAt: number;
}

export interface MiniGameReward {
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  coins: number;
  playerExp: number;
  penguinExp: number;
  items: { itemId: string; quantity: number }[];
}

export interface MiniGameState {
  lastPlayedDate: string;
  dailyPlaysCount: Record<string, number>;
}

export interface GameSaveDataV3 extends Omit<GameSaveDataV2, 'schemaVersion'> {
  schemaVersion: 3;
  breedingSlot: BreedingSlot;
  miniGameState: MiniGameState;
}

# Technical Design Specification: Penguin Island — Phase 1 (Playable Foundation)

- **Date:** 2026-09-28
- **Status:** Finalized & Approved
- **Target Milestone:** Playable single-island foundation with autonomous penguins, egg incubation & hatching, creature collection book, inventory, local persistence, and nostalgic 2010s social-game aesthetic.

---

## 1. Overview & Core Philosophy

*Penguin Island* is an original casual social collection game inspired by the warm, relaxing, and slightly chaotic gameplay loop of 2010s web social games (such as Vietnamese social island games like *Cánh Cụt Vui Vẻ*), rebuilt with modern web standards (Vue 3, TypeScript, Vite, Pinia, Phaser 3).

### Key Constraints & Non-Goals for Phase 1
- **Strictly Phase 1:** No Phase 4 backend (NestJS/PostgreSQL/Redis) or live multi-tenant server will be installed yet.
- **Original IP Only:** 100% original names, artwork, dialogue, audio chimes, and systems. No copyrighted designs or external brand assets.
- **High-Res Stylized 2.5D Art:** Soft vector/painted shading with smooth curves and expressive eyes; distinctly avoid pixel art and sterile corporate dashboards.
- **Separation of Concerns:** Pure gameplay, autonomous entities, and per-frame effects live inside Phaser 3; HUD, inventory, collection encyclopedia, and modal dialogues live inside Vue 3.

---

## 2. Monorepo Architecture & Package Layout

A clean npm/pnpm workspace layout allowing Phase 4+ to drop in backend APIs seamlessly:

```
/
├── apps/
│   ├── web/                           # Vue 3 + Vite + TypeScript + Pinia + Phaser 3
│   │   ├── src/
│   │   │   ├── game/                  # Pure Phaser 3 game world
│   │   │   │   ├── scenes/            # BootScene, SnowIslandScene
│   │   │   │   ├── entities/          # PenguinEntity, EggEntity, IslandTerrain
│   │   │   │   ├── ai/                # Autonomous FSM (IDLE, WADDLE, SLIDE, SLEEP, TALK, REACT, EAT, PLAY, FISH, FOLLOW, CELEBRATE)
│   │   │   │   ├── bridge/            # Typed Event Bridge (GameBridge)
│   │   │   │   ├── effects/           # Particle emitters (snow, sparkles, hearts, water ripples)
│   │   │   │   └── textures/          # High-res procedural 2.5D canvas texture generators (Cached by visualKey)
│   │   │   ├── components/            # Vue 3 UI Layer
│   │   │   │   ├── hud/               # TopBar (Level, Currencies: Fish/Coins/Gems, Utility Buttons)
│   │   │   │   ├── dock/              # Wooden/Ice Shelf Rack & Simulated NPC Neighbor Strip
│   │   │   │   ├── modals/            # CollectionModal, InventoryModal, EggHatchModal, PenguinInspectModal, SettingsModal, ConfirmModal
│   │   │   │   └── common/            # Buttons, Badges, Tooltips
│   │   │   ├── stores/                # Pinia: gameStore, inventoryStore, collectionStore
│   │   │   ├── services/              # StorageService (IGameStorage), RandomService (IRandomService)
│   │   │   ├── types/                 # Frontend-specific UI types
│   │   │   ├── App.vue
│   │   │   └── main.ts
│   └── api/                           # Reserved for Phase 4 NestJS backend
├── packages/
│   ├── types/                         # Shared TypeScript interfaces (@penguin/types)
│   │   └── src/index.ts
│   ├── game-data/                     # Shared data-driven JSON (@penguin/game-data)
│   │   ├── species.json
│   │   ├── eggs.json
│   │   ├── items.json
│   │   └── index.ts
│   └── config/                        # Shared tsconfig, eslint configs
└── package.json
```

---

## 3. Data Models & Schemas (`@penguin/types`)

### 3.1 Penguin Species vs. Owned Penguin
A clear distinction separates base species definitions from player-owned instances:

```typescript
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

export interface PenguinSpecies {
  id: string; // e.g. 'snowy'
  speciesNumber: string; // e.g. '001'
  name: string; // e.g. 'Snowy'
  rarity: RarityTier;
  personality: PenguinPersonality;
  trait: string;
  favoriteFood: string;
  dislikedFood: string;
  description: string;
  clue: string; // Hint for collection book when undiscovered
  visualKey: string;
}

export type PenguinMood =
  | 'happy'
  | 'sleepy'
  | 'hungry'
  | 'sad'
  | 'excited'
  | 'playful';

export interface OwnedPenguin {
  id: string; // Unique instance UUID
  speciesId: string; // Refers to PenguinSpecies.id
  nickname: string; // Player custom or default name
  level: number;
  experience: number;
  happiness: number; // 0 - 100
  energy: number; // 0 - 100
  hunger: number; // 0 - 100
  mood: PenguinMood;
  acquiredAt: number; // Timestamp
  // Genetics & breeding readiness for Phase 3
  generation: number;
  parentAId?: string;
  parentBId?: string;
}
```

### 3.2 Egg Types & Drop Pool Rules
- **Drop Tables:** Data-driven and extensible.
- **Validation Rules:**
  - Weights are arbitrary positive numbers (do **not** require summing to 100; normalized via relative proportions: `weight / sum(weights)`).
  - Every drop pool must have at least one entry.
  - All weights must be strictly positive numbers (`weight > 0`).
  - All referenced species IDs must exist in the species database.

```typescript
export interface DropPoolEntry {
  speciesId: string;
  weight: number;
}

export interface EggType {
  id: string; // e.g. 'basic_egg'
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
```

### 3.3 Complete Starter Egg Flow
1. **Starter Save:** New player save starts with `Basic Egg x1` in inventory and 1 initial penguin on the island (*Snowy*).
2. **Placement:** Player opens Hatchery drawer and places the `Basic Egg` into Slot 1 (`EMPTY` → `EGG_PLACED` → `INCUBATING`).
3. **Incubation:** Slot timer counts down (Phase 1 default is 10s for snappy testing/starter experience).
4. **Readiness:** When elapsed, state transitions to `READY_TO_HATCH`.
5. **Hatching Sequence:** Player clicks slot or egg to begin hatching modal:
   - Egg wobble + crack animation.
   - Flash of light and celebration fanfare.
   - `OwnedPenguin` is created with a unique UUID.
   - Collection book entry for the species is marked as discovered.
   - Slot resets to `EMPTY`.
   - New penguin is spawned in Phaser onto the island ice.

### 3.4 Explicit Versioned GameSaveData Schema
```typescript
export interface GameSaveData {
  schemaVersion: number; // e.g. 1
  createdAt: number;
  updatedAt: number;
  player: {
    id: string;
    displayName: string;
    level: number;
    experience: number;
    avatarId: string;
  };
  currencies: {
    coins: number;
    gems: number;
    fish: number;
  };
  inventory: {
    itemId: string;
    category: 'eggs' | 'food' | 'decorations' | 'cosmetics' | 'special';
    quantity: number;
    metadata?: Record<string, unknown>;
  }[];
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
```
*Missing optional fields receive safe defaults. Unknown future fields are preserved or safely ignored.*

### 3.5 Nickname Validation Rules
- Trim leading/trailing whitespace.
- Maximum 20 Unicode characters.
- Normalize consecutive whitespace to a single space.
- Reject control characters (ASCII 0–31, 127).
- Reject HTML/script content (e.g. `<`, `>`, `&`, or tags).
- Allow normal Unicode letters (including Vietnamese accented characters `á, à, ỏ, ã, ạ, â, đ, ê, ô, ơ, ư`), numbers, spaces, and common safe punctuation (hyphens, underscores, apostrophes).
- Allow skipping nickname (defaults to species name).

---

## 4. Phaser 3 Game World & Entities

### 4.1 Snow Island Scene
- Centered 2.5D Snow Island with multi-layer snow banks, soft vector drop shadows, and central frozen ice pond.
- Ambient falling snowflakes (using Phaser particle emitter with capped particle count).
- Camera: drag pan, zoom (0.75x–1.5x), bounds clamping.

### 4.2 Autonomous Penguin AI State Machine
Each penguin is an instance of `PenguinEntity` with states:
- `IDLE`: Subtle breathing squash/stretch, head tilt, blinking.
- `WADDLE`: Waddles between wander waypoints on the snow with alternating tilt.
- `BELLY_SLIDE`: Slides smoothly across the central frozen ice pond.
- `SLEEP`: Sits down, eyes closed, `Zzz` bubbles float up.
- `TALK`: Cute original quips in temporary speech bubble.
- `EAT`: Plays eating animation, emits hearts, consumes 1 Fish, increases happiness.
- `PLAY`: Plays with an ice cube or playful hop.
- `FISH`: Stands near ice hole looking into water.
- `FOLLOW`: Waddles curiously behind another nearby penguin.
- `CELEBRATE`: Jumps and spins happily.
- `REACT`: Triggered on click (wiggles, jumps, updates mood).

### 4.3 Texture Caching
- Textures generated via high-DPI Canvas/Vector logic are **cached by `visualKey`** in Phaser's TextureManager (`scene.textures.exists(key)`).
- Never re-render identical canvas textures for multiple entities of the same species or egg type.

---

## 5. Architecture & GameBridge Lifecycle

### 5.1 Strict Separation of Concerns
- **Phaser must NEVER directly mutate Pinia state.**
- **Store & Services + GameBridge act as the authoritative boundary.**
- All UI actions flow through Pinia stores / Services, which emit events across `GameBridge` to notify Phaser.
- Phaser emits user interaction events (`PENGUIN_CLICKED`, `EGG_CLICKED`, `CANVAS_READY`) across `GameBridge` to notify Pinia stores.

### 5.2 GameBridge Lifecycle Management
```typescript
type GameBridgeEventMap = {
  'penguin:clicked': { ownedId: string };
  'egg:clicked': { slotId: number };
  'canvas:ready': void;
  'penguin:spawn': { penguin: OwnedPenguin };
  'penguin:action': { ownedId: string; action: 'pet' | 'feed' };
  'camera:focus': { x: number; y: number };
};

export class GameBridge {
  private listeners: Map<string, Set<(payload: any) => void>> = new Map();

  on<K extends keyof GameBridgeEventMap>(event: K, handler: (payload: GameBridgeEventMap[K]) => void): () => void;
  emit<K extends keyof GameBridgeEventMap>(event: K, payload: GameBridgeEventMap[K]): void;
  clear(): void;
}
```
- Supports typed payloads, explicit `unsubscribe` callbacks.
- Prevents duplicate listeners.
- Cleans up all scene/component listeners on `onUnmounted` or scene shutdown.

---

## 6. Vue 3 UI Layer & Nostalgic Visual Polish

### 6.1 Nostalgic HUD & Shelves
- **Top HUD:** Player Level, Fish counter, Coins counter, Gems counter (marked as dev seed data), audio mute toggle, save backup / reset menu.
- **Bottom Shelf Rack (2010s Social Island Vibe):**
  - Backpack / Inventory (Eggs, Fish, Props).
  - Collection Encyclopedia (Shows all 5 species, silhouettes with hints for locked ones).
  - Hatchery Nest (Manages egg incubation slots).
- **Simulated NPC Neighbor Strip:**
  - Horizontal friend bar showing simulated local NPC neighbors (e.g. *"Bác Gấu Tuyết"*, *"Hàng Xóm Cánh Cụt"*) with avatar and level badge. Explicitly noted as simulated local NPCs.
- **Modals:**
  - Hatching Celebration Modal (egg wobble, crack, reveal, validated nickname input).
  - Penguin Inspect Modal (mood status, pet button, feed button consuming 1 fish).
  - Confirmation Modal (required for destructive/reset actions).

---

## 7. Performance & Quality Assurance Targets

- **Desktop Target:** Solid 60 FPS in Chrome, Firefox, Edge, Safari.
- **Mobile Target:** Smooth 30–60 FPS on modern mobile and tablet devices.
- **No Frame Drops:** Vue/Phaser state synchronization runs asynchronously via event queues or debounced updates; zero per-frame DOM updates for game entities.
- **Unit Tests (Vitest):**
  - Drop table validation (positive weights, species existence, >= 1 entry, normalized roll distribution).
  - Versioned `GameSaveData` schema loader, safe default fallbacks, schema migration handling.
  - Nickname validator rules.
  - Inventory store fish consumption & zero-fish rejection.
  - Collection book discovery tracking.
  - GameBridge subscribe/unsubscribe cleanup.

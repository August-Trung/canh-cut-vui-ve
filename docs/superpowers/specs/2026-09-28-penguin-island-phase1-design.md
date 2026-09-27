# Technical Design Specification: Penguin Island — Phase 1 (Playable Foundation)

- **Date:** 2026-09-28
- **Status:** Approved for Implementation Planning
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
│   │   │   │   └── textures/          # High-res procedural 2.5D canvas texture generators
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
  nickname: string; // Player custom or default name (max 20 chars sanitized)
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

### 3.2 Egg Types & Hatchery Lifecycle
```typescript
export interface EggType {
  id: string; // e.g. 'basic_egg'
  name: string;
  rarity: RarityTier;
  hatchDurationSec: number;
  visualTheme: string;
  minPlayerLevel?: number;
  eventId?: string;
  guaranteedRare?: boolean;
  dropPool: {
    speciesId: string;
    weight: number;
  }[];
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

### 3.3 Inventory & Economy
```typescript
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
```

---

## 4. Phaser 3 Game World & Autonomous Penguin FSM

### 4.1 Snow Island Environment
- **Scene:** `SnowIslandScene` extending `Phaser.Scene`.
- **Layers:**
  1. Ambient Sky gradient with drifting soft snowflake particle emitter.
  2. Multi-tier snow banks with organic curves and soft vector drop-shadows.
  3. Center Frozen Ice Pond with water edge ripples, transparent glacial ice sheet, and slippery friction physics.
  4. Decorative winter props: Igloo, pine trees dusted in snow, snowman, and wooden signpost.
  5. Dynamic Entity Layer: Penguins, Incubator Nest, and floating speech bubbles.
- **Camera Controls:**
  - Panning: Smooth drag via pointer or touch.
  - Zoom: Smooth zoom between 0.75x and 1.5x via mouse scroll wheel or pinch.
  - Bounds Clamping: Soft elastic boundaries preventing panning off the island.

### 4.2 Autonomous Penguin AI State Machine
Each penguin is an instance of `PenguinEntity` governed by a lightweight deterministic state machine:
- **`IDLE`:** Subtle breathing squash/stretch, head tilt, blinking.
- **`WADDLE`:** Waddles between random wander waypoints on the snow with alternating tilt.
- **`BELLY_SLIDE`:** When crossing the frozen pond, drops onto its belly and slides rapidly across the ice with snow spray particles!
- **`SLEEP`:** Sits down, eyes closed, gentle snoring bubbles (`Zzz`) float upwards.
- **`TALK`:** Displays an original cute speech bubble (e.g. *"Trời hôm nay mát ghê!"*, *"Ai thấy con cá hồi của tui đâu hong?"*).
- **`EAT`:** Triggered when fed fish — heart particles burst, eating animation plays, and happiness increases.
- **`PLAY`:** Plays with a small ice cube or does a celebratory hop.
- **`FISH`:** Stands near the ice pond hole, looks down eagerly.
- **`FOLLOW`:** Waddles curiously behind another nearby penguin.
- **`CELEBRATE`:** Jump & spin celebration when a new egg hatches or level-up occurs.
- **`REACT`:** Triggered on click: wiggles, jumps, plays sound effect, emits hearts, and updates mood.

### 4.3 High-Res Stylized 2.5D Vector Graphics
Textures are generated in-memory via high-DPI Canvas/Vector generators upon boot:
- Round, plump penguin silhouettes with soft shaded highlights and drop shadows.
- Distinct color coats & accessories:
  - **Snowy:** Navy coat, snowy white belly, warm earmuffs.
  - **Sleepy:** Lavender-grey coat, sleepy eyes, nightcap with fluffy pom-pom.
  - **Shy:** Soft rose coat, blushing cheeks, warm knitted wool scarf.
  - **Happy:** Mint green coat, happy curved eyes, cute head sprout.
  - **Hungry:** Striped golden-orange belly, cheerful appetite bib.

---

## 5. Game Mechanics & Service Layer

### 5.1 Egg Incubation & Hatching Sequence
1. Player opens the **Hatchery** shelf and places an egg into an available incubator slot (`EMPTY` → `EGG_PLACED` → `INCUBATING`).
2. A timer counts down (Phase 1 uses a rapid test timer e.g. 10–30s or instant speed-up).
3. Once completed, state turns to `READY_TO_HATCH`.
4. Clicking the ready egg launches the full-screen Hatching celebration:
   - Egg rocks back and forth with suspenseful thumping sound.
   - Vector cracks spread across the shell.
   - Flash of light + star particles shoot outward.
   - The new `OwnedPenguin` emerges in a celebration pose.
   - Shows species details, rarity badge, personality quote, and an optional nickname input.
   - Input is sanitized (trimmed, max 20 chars, alphanumeric/vietnamese accented characters only, no HTML/script tags).
   - The new penguin is added to `ownedPenguins`, recorded in `collectionBook`, and spawned onto the island.

### 5.2 Abstractions: `IRandomService` and `IGameStorage`
- **`IRandomService`:**
  ```typescript
  export interface IRandomService {
    rollDrop(dropPool: { speciesId: string; weight: number }[]): string;
    randomRange(min: number, max: number): number;
  }
  ```
  *In Phase 1, `LocalRandomService` uses client pseudo-random generation. In Phase 4, the backend will become authoritative without altering UI/Phaser interfaces.*

- **`IGameStorage`:**
  ```typescript
  export interface IGameStorage {
    load(): Promise<GameSaveData | null>;
    save(data: GameSaveData): Promise<void>;
    exportJson(data: GameSaveData): string;
    importJson(json: string): GameSaveData | null;
    clear(): Promise<void>;
  }
  ```
  *Implemented as `LocalStorageAdapter` for Phase 1. Debounced autosaves ensure zero frame stutter.*

### 5.3 Feeding & Interaction Rules
- Feeding requires **1 Fish** from the inventory.
- If Fish count > 0: consumes 1 Fish, triggers `EAT` state in Phaser, emits heart particles, increases Happiness by +15 (clamped to 100), and sets mood to `happy`.
- If Fish count = 0: displays an in-game notification/toast: *"Hết cá rồi! Hãy câu thêm hoặc kiếm thêm cá nhé."*

---

## 6. Vue 3 UI Architecture & Visual Polish

### 6.1 Nostalgic HUD & Shelves
- **Top HUD:**
  - Player Level (e.g. Level 1 Island Caretaker).
  - Currencies with soft rounded bevels and clean vector icons: Fish (50), Coins (500), Gems (10) — marked as development seed data.
  - Utility buttons: Mute Audio, Save Backup, Reset Game (with explicit confirmation dialog).
- **Bottom Shelf Rack (2010s Social Island Aesthetic):**
  - **Backpack / Inventory:** Filtered by Eggs, Food, All.
  - **Creature Encyclopedia (Collection Book):** Shows all 5 species. Discovered entries show portrait, personality, and discovery date; undiscovered entries show silhouette with hints.
  - **Hatchery Nest:** Manages egg slots.
- **Simulated NPC Neighbor Strip:**
  - Nostalgic horizontal friend bar showing friendly local NPC penguins (e.g., *"Bác Gấu Tuyết"*, *"Hàng Xóm Cánh Cụt"*) with their level and visit buttons.
  - Explicitly labeled as simulated local neighborhood to preserve nostalgic charm without misleading the player.

### 6.2 Typed Event Bridge (`GameBridge`)
Bidirectional communication between Vue 3 and Phaser 3:
- **Phaser → Vue:**
  - `PENGUIN_SELECTED(ownedId: string)`
  - `EGG_SELECTED(slotId: number)`
  - `ISLAND_READY()`
- **Vue → Phaser:**
  - `SPAWN_PENGUIN(penguin: OwnedPenguin)`
  - `TRIGGER_PENGUIN_ACTION(ownedId: string, action: 'pet' | 'feed')`
  - `FOCUS_CAMERA(x: number, y: number)`

---

## 7. Testing & Quality Assurance Plan

1. **Unit Tests (Vitest):**
   - `@penguin/game-data` validation: ensure all drop tables sum correctly and referenced species exist.
   - `RandomService` drop pool distribution tests.
   - `inventoryStore`: feeding deducts 1 fish, rejects when 0 fish.
   - `collectionStore`: discovering a penguin unlocks silhouette and tracks discovered count.
   - Nickname validator: handles whitespace, length > 20, special characters, and XSS sanitization.
   - `StorageService`: serialize, deserialize, schema migration fallback.
2. **Runtime Verification:**
   - Verify 60 FPS rendering in Chrome and mobile responsive viewports (390px, 768px, 1440px).
   - Confirm complete player journey: open game → watch autonomous penguins waddle/slide/sleep → click penguin to pet & feed → place egg in incubator → hatch egg with animation & fanfare → set custom nickname → verify in Collection Book → verify state persisted across browser refresh.

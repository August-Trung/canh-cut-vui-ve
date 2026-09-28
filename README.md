# 🐧 Penguin Island (Đảo Cánh Cụt)

> *"A tiny island full of weird penguins."*

A browser-based casual social collection game inspired by the warm, relaxing, and nostalgic gameplay philosophy of 2010s web social island games (such as *Cánh Cụt Vui Vẻ*), built from the ground up as an original intellectual property using modern web standards.

---

## 🎯 Milestone 1: Phase 1 — Playable Foundation (Completed)

> *"A player can open the website, enter an island, see penguins walking around, interact with them, hatch an egg, obtain a new penguin, view the collection, and save the game."*

### Key Features Implemented in Phase 1:
1. **2.5D Snow Island Game World (Phaser 3):**
   - Floating winter island with multi-layered snow banks, soft vector drop shadows, and an organic central frozen ice pond.
   - Ambient snow particle emitter (strictly capped at 65 particles for smooth 60 FPS desktop and 30–60 FPS mobile performance).
   - Camera controls: smooth drag/pan, clamped zoom (0.75x to 1.5x) via scroll wheel and pinch gestures, and bounds clamping.
2. **Autonomous Penguin AI (Deterministic FSM with 11 States):**
   - `IDLE`: Gentle breathing bob, head turns, blinking.
   - `WADDLE`: Cute side-to-side rotation wobble moving towards wander waypoints.
   - `BELLY_SLIDE`: Drops onto belly and slides rapidly across the center ice pond!
   - `SLEEP`: Sits down, eyes closed, animated `Zzz` bubbles floating up.
   - `TALK`: Cute original quips in speech bubbles (10 nostalgic Vietnamese quips).
   - `EAT`: Heart burst, wiggles excitedly, consumes 1 Fish, increases happiness.
   - `PLAY`: Playful hops and spins.
   - `FISH`: Waddles to the fishing hole and peeks into the icy water.
   - `FOLLOW`: Waddles towards neighbor penguins.
   - `CELEBRATE`: Celebratory 360-degree jump and spin.
   - `REACT`: On player click — wiggles, jumps, plays sound effect, emits `penguin:clicked` over `GameBridge`.
3. **Data-Driven Species & Egg Hatching:**
   - **5 Species:** Snowy (001), Sleepy (002), Shy (003), Happy (004), Hungry (005).
   - **3 Eggs:** Basic Egg (Common), Frozen Egg (Uncommon), Golden Egg (Rare).
   - Drop tables validated with positive weights and normalized drop distributions.
   - Incubation lifecycle: `EMPTY` → `EGG_PLACED` → `INCUBATING` → `READY_TO_HATCH` → `HATCHED`.
   - Multi-stage hatching sequence: Wobble → Cracks appear → Light burst → Reveal of new `OwnedPenguin` with validated custom nickname.
4. **Creature Encyclopedia (Collection Book):**
   - Progress bar (e.g. *1 / 5 Đã Khám Phá*).
   - Discovered species show full illustration, personality, favorite food, and discovered date.
   - Locked species appear as silhouettes with a `?` and species clues.
5. **Inventory & Economy:**
   - Tabbed backpack: Eggs, Food (Sardines), and All.
   - Feeding strictly consumes 1 Fish and restores happiness. Displays feedback if out of fish.
   - Starter currencies: 500 Coins, 50 Fish, 10 Gems (marked as dev seed data).
6. **Local Persistence (`StorageService`):**
   - Versioned `GameSaveData` schema (version 1) with safe defaults and unknown field tolerance.
   - Auto-saves on changes with debounced writes to `localStorage`.
   - Export Save JSON, Import Save JSON, and Reset Save with mandatory confirmation modal per Antigravity Global Rules.
7. **High-Res Stylized 2.5D Procedural Vector Art:**
   - Sharp, scalable Canvas vector textures generated on boot and cached by `visualKey` in Phaser's TextureManager. No duplicate allocations.
8. **Web Audio API Sound Synthesis (`SoundService`):**
   - Synthesizes bubble pops, celebration fanfare, chirps, and eating sounds natively without external audio files. Respects browser autoplay policy and audio mute toggle.
9. **Decoupled Architecture (`GameBridge`):**
   - Typed bidirectional event bus connecting Phaser 3 and Pinia stores. Phaser never mutates Pinia state directly.

---

## 🏗️ Repository Architecture

```
/
├── apps/
│   ├── web/                           # Vue 3 + TypeScript + Vite + Phaser 3
│   │   ├── src/
│   │   │   ├── game/                  # Pure Phaser 3 game world
│   │   │   │   ├── scenes/            # BootScene, SnowIslandScene
│   │   │   │   ├── entities/          # PenguinEntity, SpeechBubble
│   │   │   │   ├── ai/                # PenguinFSM (11 states)
│   │   │   │   ├── bridge/            # Typed GameBridge
│   │   │   │   └── textures/          # High-Res 2.5D Canvas TextureGenerator
│   │   │   ├── components/            # Vue 3 UI Layer
│   │   │   │   ├── hud/               # TopBar, CurrencyBadge
│   │   │   │   ├── dock/              # ShelfRack, NeighborStrip
│   │   │   │   └── modals/            # HatchModal, CollectionModal, InventoryModal,
│   │   │   │                          # HatcheryModal, PenguinInspectModal, SettingsModal, ConfirmModal
│   │   │   ├── stores/                # Pinia: gameStore, inventoryStore, collectionStore
│   │   │   └── services/              # StorageService, RandomService, NicknameValidator, SoundService
│   └── api/                           # Reserved for Phase 4 NestJS backend
├── packages/
│   ├── types/                         # Shared TypeScript interfaces (@penguin/types)
│   ├── game-data/                     # Data-driven definitions & validator (@penguin/game-data)
│   └── config/                        # Shared configurations
└── package.json                       # Monorepo root config
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🌟 Milestone 2: Phase 2 — Core Game Loop & Island Life (Completed)

> *"A living, breathing island where players nurture their penguins, decorate anchor plots, complete deterministic daily quests, level up their caretaker rank, and enjoy a rich offline simulation loop."*

### Key Features Implemented in Phase 2:
1. **Player Caretaker Progression (Lv. 1–10):**
   - Cumulative EXP thresholds: 0 (Lv. 1) to 9,200 (Lv. 10).
   - Dynamic flock capacity: 2 penguins (Lv. 1), 3 (Lv. 2–4), 4 (Lv. 5–7), 5 (Lv. 8–10). Hatching beyond capacity is strictly prevented.
   - Milestone rewards on level-up: Coins, Gems, and unlocked store items.
   - Level-up celebration modal with synthesized fanfare.
2. **Penguin Care & Needs Simulation Loop:**
   - **Petting:** 15s cooldown per penguin, grants +8 Happiness, +3 Penguin EXP, +2 Player EXP, and **strictly 0 Coins**.
   - **Feeding:** Atomically consumes selected food from inventory without cooldown.
   - **Favorite Food System:** Feeding a species its favorite food grants +50% bonus Penguin EXP, +12 Player EXP, and generates tactile gold coin drops!
   - **Continuous & Offline Needs Simulation:** Piecewise decay algorithm where happiness decays faster when hunger >= 80 (every 90s vs 180s). Recalculates mood deterministically upon return. Missing timestamps are safely handled without accidental starvation.
3. **Island Life & 6 Anchor Plots:**
   - 6 visually balanced 2.5D anchor plots spread across snow banks and shoreline.
   - Interactive plot markers with hover effects; clicking a plot opens `DecorationModal`.
   - **Cozy Rating & Multiplier:** Placed decorations increase island Cozy points, granting up to a 1.25x coin drop multiplier.
   - **Anti-Exploit System:** Placing each unique decoration item grants +15 Player EXP exactly once per save file (`unlockedPlacementExpIds`). Removing and re-placing grants 0 EXP.
4. **General In-Game Shop (`ShopModal`):**
   - 3 categorized tabs: **Thức Ăn (Food)**, **Trứng (Eggs)**, and **Trang Trí (Decorations)**.
   - Atomic transactions: validates player level requirements, verifies coin/gem balances, deducts currency, and delivers inventory items in a single safe pass.
5. **Daily Login & Deterministic Quests (`QuestModal`):**
   - **7-Day Streak Calendar:** Progressive daily rewards with Day 7 milestone gift.
   - **Deterministic Daily Quests:** Generates 3 daily quests from date seed (`YYYY-MM-DD`).
   - **Decoupled Observer Architecture:** `questStore` strictly listens to GameBridge action events (`action:pet`, `action:feed`, `action:hatch`, `action:shop_purchase`, `action:decorate`) and is never directly imported by gameplay stores.
6. **Procedural Vector Art & Audio Expansion:**
   - 6 high-res vector decoration textures rendered to HTML5 canvas: Winter Wood Bench, Crystal Pine, Vintage Street Lamp, Mini Snow Castle, Igloo Ice Lantern, and Caretaker Trophy.
   - Synthesized Web Audio sound effects: Coin drop cascade, Level-up fanfare, and Shop buy chime.

---

## 🏗️ Repository Architecture

```
/
├── apps/
│   ├── web/                           # Vue 3 + TypeScript + Vite + Phaser 3
│   │   ├── src/
│   │   │   ├── game/                  # Pure Phaser 3 game world
│   │   │   │   ├── scenes/            # BootScene, SnowIslandScene (with 6 anchor plots)
│   │   │   │   ├── entities/          # PenguinEntity, SpeechBubble
│   │   │   │   ├── ai/                # PenguinFSM (11 states)
│   │   │   │   ├── bridge/            # Typed GameBridge
│   │   │   │   └── textures/          # High-Res 2.5D Canvas TextureGenerator (Species & Decors)
│   │   │   ├── components/            # Vue 3 UI Layer
│   │   │   │   ├── hud/               # TopBar (with EXP progress & tooltip), CurrencyBadge
│   │   │   │   ├── dock/              # ShelfRack (6 action buttons), NeighborStrip
│   │   │   │   └── modals/            # ShopModal, QuestModal, DecorationModal, LevelUpModal,
│   │   │   │                          # HatchModal, CollectionModal, InventoryModal,
│   │   │   │                          # HatcheryModal, PenguinInspectModal, SettingsModal, ConfirmModal
│   │   │   ├── stores/                # Pinia: gameStore, inventoryStore, collectionStore, shopStore, decorationStore, questStore
│   │   │   └── services/              # StorageService, ProgressionService, NeedsService, QuestService,
│   │   │                              # DecorationService, RandomService, NicknameValidator, SoundService
│   │   └── dist/                      # Production build bundle
│   └── api/                           # Reserved for Phase 4 NestJS backend
├── packages/
│   ├── types/                         # Shared TypeScript interfaces (@penguin/types)
│   ├── game-data/                     # Data-driven catalogs, drop pools & validator (@penguin/game-data)
│   └── config/                        # Shared configurations
└── package.json                       # Monorepo root config
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### Run Tests
```bash
npm test
```
Runs 311 Vitest tests across 37 test suites verifying:
- Drop table validation & deterministic random drop distribution
- Nickname sanitization & Vietnamese accents
- Idempotent V1 → V2 save migration & piecewise offline needs simulation
- Acyclic Pinia stores (`gameStore`, `inventoryStore`, `shopStore`, `decorationStore`, `questStore`)
- FSM state transitions & autonomous penguin behavior
- Procedural canvas texture generation & Phaser scene anchor plots
- Decoupled GameBridge action events & synthetic Web Audio effects
- Complete end-to-end player progression and island life loop

### Build Production Bundle
```bash
npm run build
```
Typechecks with `tsc --noEmit` and bundles via Vite with chunk splitting (`dist/assets/phaser-*.js` and `dist/assets/index-*.js`).

---

## 📜 Antigravity Code Quality Standards
- 100% strict TypeScript without `any` types.
- No redundant array length checks before loops (`items?.forEach(...)`).
- Safe optional chaining (`?.`) and nullish coalescing (`??`).
- No boolean comparisons directly with `true`/`false`.
- Mandatory confirmation modal before destructive actions (Reset Save).
- Proper accented Vietnamese UTF-8 encoding.


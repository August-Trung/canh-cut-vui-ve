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

### Run Tests
```bash
npm test
```
Runs 176 Vitest tests across 25 suites verifying drop table validation, nickname sanitizer, random drop distribution, versioned storage adapter, Pinia stores, FSM transitions, Phaser scenes, UI components, and complete player journey integration.

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

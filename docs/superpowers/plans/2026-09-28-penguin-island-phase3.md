# Penguin Island Phase 3: Gameplay, Progression, Mini-games & Breeding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deepen the casual social simulation loop with individual penguin progression, personality-driven AI & social flocking, a reusable mini-game framework with the "Catch Fish" ice-fishing game, a breeding core with deterministic genetic inheritance, and seamless hatchery integration preserving all flock capacity invariants.

**Architecture:** 
- Monorepo types and game catalogs define data-driven traits, breeding mutation pools, and mini-game configs.
- Pure leaf services (`GeneticsService`, `BreedingService`, `MiniGameRewardService`) isolate calculations with zero side-effects, explicit timestamps (no `Date.now()` default parameters), and injected `IRandomService`.
- Acyclic Pinia stores (`breedingStore`, extended `gameStore`) coordinate authoritative game state and emit typed events across `GameBridge`.
- Phaser 3 manages high-FPS entity interactions, the Catch Fish mini-game sub-scene (`CatchFishScene`), and particle effects.
- Vue 3 handles modern nostalgic modals (`BreedingModal`, `CatchFishModal`, and updated inspect views).

**Tech Stack:** TypeScript, Vue 3, Vite, Pinia, Phaser 3, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-28-penguin-island-phase3-design.md`

## Global Constraints

- Never break Phase 1 and Phase 2 invariants (Flock capacity: Lv 1: 2, Lv 2-4: 3, Lv 5-7: 4, Lv 8-10: 5).
- Full flock allows egg placement and incubation to READY_TO_HATCH, but strictly blocks hatch modal/reveal/species roll/egg consumption.
- Successful hatch creates exactly 1 penguin, clears slot, clears pendingSpeciesId, returns null on second call.
- Phaser never mutates Pinia state directly; communication is mediated via typed `GameBridge` events.
- Pure save migration (idempotent, deterministic, no `Date.now()`).
- `exp` is canonical; `experience` is synced for migration only and never independently mutated.
- All rewards are bounded and validated against anti-exploit rules.

---

## File Structure

```
packages/
├── types/src/index.ts                  # Extended OwnedPenguin (canonical exp), Breeding, Genetics, MiniGame schemas
└── game-data/src/
    ├── traits.ts                       # Data-driven traits catalog & non-stacking rules
    ├── breeding.ts                     # Breeding configs, costs, and mutation pools
    ├── minigames.ts                    # Mini-game definitions, score bounds, daily limits (3 free + 3 extra)
    └── index.ts

apps/web/src/
├── services/
    ├── GeneticsService.ts              # Pure genetics: 8-step trait inheritance & mutation pools
    ├── BreedingService.ts              # Pure breeding validation (explicit now) & timing logic
    ├── MiniGameRewardService.ts        # Authoritative scoring & anti-exploit replay protection
    └── StorageService.ts               # V3 save schema migration & exp canonicalization
├── stores/
    ├── breedingStore.ts                # Pinia store for Love Nest / breeding slot (Genetics generated on start)
    ├── gameStore.ts                    # Extended with mini-game rewards & penguin progression
    └── questStore.ts                   # Listens to 'action:breed' and 'action:minigame_complete'
├── game/
    ├── ai/PenguinFSM.ts                # Personality-weighted transitions with injected IRandomService
    ├── scenes/
    │   ├── SnowIslandScene.ts          # Social proximity, flock interactions, level-up effects
    │   └── CatchFishScene.ts           # 2.5D Catch Fish interactive mini-game sub-scene in Phaser
    └── bridge/GameBridge.ts            # Phase 3 event map additions
└── components/
    ├── modals/
    │   ├── BreedingModal.vue           # Parent selection, genetics preview, breeding timer
    │   └── CatchFishModal.vue          # Mini-game shell, companion selector, score HUD
    └── dock/ShelfRack.vue              # "Phối Giống" button with <GameIcon>
```

---

## Tasks

### Task 1: Shared Types & Game-Data Catalogs (`packages/types` & `packages/game-data`)

**Files:**
- Modify: `packages/types/src/index.ts`
- Create: `packages/game-data/src/traits.ts`
- Create: `packages/game-data/src/breeding.ts`
- Create: `packages/game-data/src/minigames.ts`
- Modify: `packages/game-data/src/index.ts`
- Test: `packages/types/src/__tests__/types.test.ts`
- Test: `packages/game-data/src/__tests__/validator.test.ts`

**Interfaces:**
- Produces: `PenguinTraitDefinition`, `GeneticsResult`, `BreedingSlot`, `MiniGameConfig`, `MiniGameResult`, `MiniGameReward`, `GameSaveDataV3`.

- [ ] **Step 1: Write failing tests for Phase 3 types, mutation pools, and data catalogs**
  - Verify `TRAITS_CATALOG` entries (`glutton`, `speedy`, `cozy_aura`, `lucky`, `angler`, `romantic`).
  - Verify `BREEDING_CONFIG` (minParentLevel: 3, costCoins: 200, costGems: 1, cooldownMs: 1800000).
  - Verify `GENETICS_MUTATION_POOLS` (sameSpeciesMutationPool, crossSpeciesMutationPool).
  - Verify `MINIGAME_CATCH_FISH_CONFIG` (durationSeconds: 30, dailyFreePlays: 3, maxExtraPlaysPerDay: 3, extraPlayCostCoins: 50).
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement Phase 3 interfaces in `packages/types` and catalogs in `packages/game-data`**
- [ ] **Step 4: Run tests to verify green**
- [ ] **Step 5: Commit**
```bash
git add packages/
git commit -m "feat(types): add Phase 3 traits, breeding mutation pools, and mini-game data definitions"
```

---

### Task 2: Pure Domain Services (`GeneticsService`, `BreedingService`, `MiniGameRewardService`)

**Files:**
- Create: `apps/web/src/services/GeneticsService.ts`
- Create: `apps/web/src/services/BreedingService.ts`
- Create: `apps/web/src/services/MiniGameRewardService.ts`
- Test: `apps/web/src/services/__tests__/GeneticsService.test.ts`
- Test: `apps/web/src/services/__tests__/BreedingService.test.ts`
- Test: `apps/web/src/services/__tests__/MiniGameRewardService.test.ts`

**Interfaces:**
- Consumes: `@penguin/types`, `@penguin/game-data`, `IRandomService`.
- Produces: `deriveOffspringGenetics`, `validateBreedingEligibility(..., now)`, `calculateCatchFishReward`, `validateMiniGameSession`.

- [ ] **Step 1: Write unit tests for `GeneticsService` with mocked deterministic RNG**
  - Verify 8-step deterministic trait inheritance order and max 2 traits limit.
  - Verify non-stacking of parent traits (e.g. romantic applies once).
  - Verify data-driven same-species and cross-species mutation pools.
  - Verify generation calculation: `child.generation = Math.max(parentA.generation, parentB.generation) + 1`.
- [ ] **Step 2: Implement `GeneticsService.ts`**
- [ ] **Step 3: Write unit tests and implement `BreedingService.ts`**
  - Verify pure signature requiring explicit `now: number` (no `Date.now()` default).
  - Verify eligibility checks (same-penguin, level < 3, 30-min cooldown, starving, funds).
- [ ] **Step 4: Write unit tests and implement `MiniGameRewardService.ts`**
  - Verify score capping, reward tier mapping, anti-exploit replay protection, and daily play limit (3 free + 3 extra = max 6).
- [ ] **Step 5: Run tests to verify all green and commit**
```bash
git add apps/web/src/services/
git commit -m "feat(services): implement pure GeneticsService, BreedingService, and MiniGameRewardService"
```

---

### Task 3: Save Schema V3 Migration & Persistence (`StorageService`)

**Files:**
- Modify: `apps/web/src/services/StorageService.ts`
- Test: `apps/web/src/services/__tests__/StorageService.test.ts`

**Interfaces:**
- Consumes: `GameSaveDataV2`, `GameSaveDataV3`.
- Produces: `migrateSaveData(data): GameSaveDataV3`.

- [ ] **Step 1: Write tests for migrating V1 and V2 saves to V3**
  - Verify canonical `exp` field: `p.exp = Number(p.exp ?? p.experience ?? 0)`.
  - Verify missing traits default to `[]`.
  - Verify missing generation defaults to `1`.
  - Verify missing breedingCount and lastBredAt default to `0`.
  - Verify breedingSlot initialized to empty.
  - Verify miniGameState initialized with zero plays.
  - Verify idempotence when migrating a V3 save.
- [ ] **Step 2: Update `StorageService.ts` to implement V3 migration**
- [ ] **Step 3: Run tests to verify green**
- [ ] **Step 4: Commit**
```bash
git add apps/web/src/services/StorageService.ts apps/web/src/services/__tests__/StorageService.test.ts
git commit -m "feat(storage): implement pure idempotent V2 to V3 save migration with canonical exp"
```

---

### Task 4: Penguin Progression & Individual Identity in `gameStore`

**Files:**
- Modify: `apps/web/src/stores/gameStore.ts`
- Modify: `apps/web/src/services/ProgressionService.ts`
- Test: `apps/web/src/stores/__tests__/gameStore.test.ts`
- Test: `apps/web/src/services/__tests__/ProgressionService.test.ts`

**Interfaces:**
- Produces: `addPenguinExp`, `checkPenguinLevelUp`, `effect:penguin_level_up` event.

- [ ] **Step 1: Write tests for individual penguin leveling**
  - EXP threshold transitions for `OwnedPenguin` using canonical `exp`.
  - Maximum level capped at 10.
  - Event `effect:penguin_level_up` emitted on level transition.
  - Feeding coin drop scaling with penguin level.
- [ ] **Step 2: Implement penguin progression methods in `gameStore.ts`**
- [ ] **Step 3: Run tests to verify green and commit**
```bash
git add apps/web/src/stores/gameStore.ts apps/web/src/stores/__tests__/gameStore.test.ts
git commit -m "feat(progression): implement individual penguin EXP leveling and level-up events"
```

---

### Task 5: Advanced AI & Social Flocking (`PenguinFSM` & `SnowIslandScene`)

**Files:**
- Modify: `apps/web/src/game/ai/PenguinFSM.ts`
- Modify: `apps/web/src/game/entities/PenguinEntity.ts`
- Modify: `apps/web/src/game/scenes/SnowIslandScene.ts`
- Test: `apps/web/src/game/ai/__tests__/PenguinFSM.test.ts`
- Test: `apps/web/src/game/scenes/__tests__/SnowIslandScene.test.ts`

**Interfaces:**
- Consumes: `IRandomService`, `PenguinPersonality`, `OwnedPenguin`.
- Produces: Injected RNG FSM, personality-weighted autonomous picks, social proximity flocking.

- [ ] **Step 1: Write tests for `PenguinFSM` with injected deterministic `IRandomService`**
  - Personality bias checks (`lazy` sleeps more, `hungry` fishes more, `chaotic` slides more).
  - Vitals override checks (`hunger >= 80` forces seeking/begging).
- [ ] **Step 2: Update `PenguinFSM.ts` and `PenguinEntity.ts`**
- [ ] **Step 3: Implement social proximity evaluation in `SnowIslandScene.ts` (TALK / FOLLOW interaction)**
- [ ] **Step 4: Run tests to verify green and commit**
```bash
git add apps/web/src/game/
git commit -m "feat(ai): enhance PenguinFSM with personality weighting and social proximity flocking"
```

---

### Task 6: Breeding Core Store & Hatchery Integration (`breedingStore` & `gameStore`)

**Files:**
- Create: `apps/web/src/stores/breedingStore.ts`
- Modify: `apps/web/src/stores/gameStore.ts`
- Test: `apps/web/src/stores/__tests__/breedingStore.test.ts`
- Test: `apps/web/src/stores/__tests__/gameStore.test.ts`

**Interfaces:**
- Consumes: `BreedingService`, `GeneticsService`, `useGameStore`, `useInventoryStore`.
- Produces: `startBreeding`, `collectBreedingEgg`, breeding egg placement into incubator.

- [ ] **Step 1: Write tests for `breedingStore`**
  - Validate parent eligibility (level, cooldown, starving, funds).
  - Cooldown begins immediately upon breeding **START** (`lastBredAt = now`).
  - GeneticsResult generated **ONCE on START** and persisted in `BreedingSlot`.
  - Complete breeding timer $\to$ collect egg creates `egg_breeding` with persisted genetics metadata in inventory.
- [ ] **Step 2: Write tests for Breeding Egg incubation & hatching in `gameStore`**
  - Place `egg_breeding` into incubator slot.
  - Incubates to `READY_TO_HATCH`.
  - **Full flock capacity blocks hatching safely** without consuming egg or rerolling genetics.
  - Increased capacity allows successful hatch creating penguin with exact persisted genetics.
- [ ] **Step 3: Implement `breedingStore.ts` and update `gameStore.ts`**
- [ ] **Step 4: Run tests to verify green and commit**
```bash
git add apps/web/src/stores/
git commit -m "feat(breeding): implement breedingStore with start-time cooldown and hatchery integration"
```

---

### Task 7: Mini-Game Framework & Catch Fish Implementation (`CatchFishScene` & `gameStore`)

**Files:**
- Create: `apps/web/src/game/scenes/CatchFishScene.ts`
- Modify: `apps/web/src/game/bridge/GameBridge.ts`
- Modify: `apps/web/src/stores/gameStore.ts`
- Test: `apps/web/src/game/scenes/__tests__/CatchFishScene.test.ts`
- Test: `apps/web/src/stores/__tests__/gameStore.test.ts`

**Interfaces:**
- Produces: `CatchFishScene` Phaser sub-scene lifecycle (`start`, `catch`, `finish`, `cleanup`), `claimMiniGameReward` store action.

- [ ] **Step 1: Write unit tests for `CatchFishScene` lifecycle and score events**
- [ ] **Step 2: Implement `CatchFishScene.ts` in Phaser with target fish types, timing windows, and combo multipliers**
- [ ] **Step 3: Implement daily limit checking (3 free + 3 extra at 50 coins = max 6) and `claimMiniGameReward` in `gameStore.ts`**
- [ ] **Step 4: Run tests to verify green and commit**
```bash
git add apps/web/src/game/ apps/web/src/stores/gameStore.ts
git commit -m "feat(minigame): implement CatchFishScene sub-scene and atomic daily limit reward flow"
```

---

### Task 8: UI Layer: Modals & Dock Navigation (`BreedingModal`, `CatchFishModal`, `ShelfRack`)

**Files:**
- Create: `apps/web/src/components/modals/BreedingModal.vue`
- Create: `apps/web/src/components/modals/CatchFishModal.vue`
- Modify: `apps/web/src/components/dock/ShelfRack.vue`
- Modify: `apps/web/src/components/modals/PenguinInspectModal.vue`
- Modify: `apps/web/src/App.vue`
- Test: `apps/web/src/components/modals/__tests__/BreedingModal.test.ts`
- Test: `apps/web/src/components/modals/__tests__/CatchFishModal.test.ts`

**Interfaces:**
- Produces: Interactive Vue modals for breeding and fishing, dock button "Phối Giống" with `<GameIcon>`.

- [ ] **Step 1: Write component tests for `BreedingModal.vue` and `CatchFishModal.vue`**
- [ ] **Step 2: Implement `BreedingModal.vue` with parent pickers, genetics preview, and timer**
- [ ] **Step 3: Implement `CatchFishModal.vue` with companion selector, lightweight HUD, and reward summary**
- [ ] **Step 4: Update `ShelfRack.vue` with "Phối Giống" button and `App.vue` to integrate new modals**
- [ ] **Step 5: Run tests to verify green and commit**
```bash
git add apps/web/src/components/ apps/web/src/App.vue
git commit -m "feat(ui): implement BreedingModal, CatchFishModal, and ShelfRack Phối Giống button"
```

---

### Task 9: Economy Simulation, Full Verification & Production Build

**Files:**
- Create: `apps/web/src/__tests__/EconomySimulation.test.ts`
- All tests and modified files.

- [ ] **Step 1: Write and run `EconomySimulation.test.ts` verifying no infinite reward loops across 30 days of care, mini-games, and breeding**
- [ ] **Step 2: Run full Vitest suite (`npx vitest run`)**
- [ ] **Step 3: Run TypeScript check and production build (`npm run build`)**
- [ ] **Step 4: Verify all Phase 1/2 regression invariants (Flock capacity, Hatchery rules)**
- [ ] **Step 5: Commit and finalize Phase 3**
```bash
git commit -m "feat(core): complete Phase 3 progression, breeding, Catch Fish mini-game, and economy validation"
```

---

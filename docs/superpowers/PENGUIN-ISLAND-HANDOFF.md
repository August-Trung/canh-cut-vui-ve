# Penguin Island — Engineering Session Handoff

- **Date:** 2026-09-28
- **Repository:** `e:\August Game\Canh Cut Vui Ve`
- **Current Git Branch:** `master`
- **Target Audience:** Fresh Antigravity coding session resuming work on *Penguin Island*.

---

## 1. Architecture & Tech Stack

*Penguin Island* is an original browser-based casual social-island game inspired by 2010s casual social-network pet collection games. It is built as a TypeScript monorepo with strict architectural boundaries:

```
┌────────────────────────────────────────────────────────────────────────┐
│                               APPS / WEB                               │
│                                                                        │
│  ┌──────────────────────────────┐      ┌────────────────────────────┐  │
│  │    Vue 3 UI Layer            │      │  Pinia State Stores        │  │
│  │    (HUD, Shelves, Modals)    │◄────►│  (game, shop, decoration,  │  │
│  │                              │      │   inventory, quest)        │  │
│  └──────────────┬───────────────┘      └─────────────┬──────────────┘  │
│                 │                                    │                 │
│                 │         ┌──────────────────┐       │                 │
│                 └────────►│ GameBridge Bus   │◄──────┘                 │
│                           │ (Typed Events)   │                         │
│                           └────────┬─────────┘                         │
│                                    │                                   │
│  ┌──────────────────────────────┐  │   ┌────────────────────────────┐  │
│  │   Phaser 3 Engine            │  │   │  Dedicated Pure Services   │  │
│  │   (2.5D Snow Island,         │◄─┘   │  (Progression, Needs,      │  │
│  │    Penguins, Plots, VFX)     │      │   Quest, Decoration, Hatch)│  │
│  └──────────────────────────────┘      └────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SHARED MONOREPO PACKAGES                        │
│   - packages/types: Shared TypeScript schemas, models, and save data    │
│   - packages/game-data: Species, eggs, food, decorations, quests       │
└────────────────────────────────────────────────────────────────────────┘
```

- **Monorepo Workspaces:**
  - `apps/web`: Vue 3, Vite, Phaser 3, Pinia, Web Audio API.
  - `packages/types`: Canonical interfaces (`OwnedPenguin`, `PlayerProfile`, `GameSaveDataV2`, etc.).
  - `packages/game-data`: Data catalogs and runtime drop-table validators.
- **Rendering & Decoupling:** Phaser 3 manages canvas rendering, physics, sprite animations, and particles. Vue 3 manages UI/HUD overlays and modals. Phaser and Pinia **never** import or mutate each other directly; all communication flows across the typed `GameBridge` event bus.
- **Acyclic Store Architecture:**
  - `gameStore` and `inventoryStore` are foundational stores.
  - `shopStore` and `decorationStore` consume foundational stores.
  - `questStore` observes gameplay events (`action:pet`, `action:feed`, `action:hatch`, `action:shop_purchase`, `action:decorate`) over `GameBridge` and does not create circular imports.
  - Domain calculations (piecewise decay, mood derivation, EXP thresholds, cozy rating, date hashing) live in **pure leaf services** (`ProgressionService`, `NeedsService`, `QuestService`, `DecorationService`, `HatchService`).

---

## 2. Phase 1 Implementation Status (Complete & Verified)

Phase 1 established the playable foundation, visual aesthetics, and engine architecture.

- **Phase 1 Technical Design Spec:** [`docs/superpowers/specs/2026-09-28-penguin-island-phase1-design.md`](file:///e:/August%20Game/Canh%20Cut%20Vui%20Ve/docs/superpowers/specs/2026-09-28-penguin-island-phase1-design.md)
- **Phase 1 Implementation Plan:** [`docs/superpowers/plans/2026-09-28-penguin-island-phase1.md`](file:///e:/August%20Game/Canh%20Cut%20Vui%20Ve/docs/superpowers/plans/2026-09-28-penguin-island-phase1.md)
- **Implementation Status:**
  - **100% Complete:** All 11 Phase 1 tasks implemented and verified.
  - **Merged to `master`:** Fast-forward merged and committed cleanly.
  - **Test Suite:** 196 passing unit and integration tests across 25 suites (`npm test`).
  - **Production Build:** Passes cleanly with Phaser chunk splitting (`npm run build`).
  - **Visual & Interaction Polish:** Responsive viewport scaling, corrected z-layering (penguins stand above lake water), dynamic nest prop synchronization with `incubatorSlots[0]`, modal event leakage isolation (`@pointerdown.stop`, etc.), and precise nest click hitboxes.

---

## 3. Phase 2 Status & Approved Specifications

Phase 2 builds the core game loop: player and penguin leveling (Lv. 1–10), comprehensive care mechanics, authoritative economy, Island Shop, 6 anchor plot decorations, daily calendar streak, daily quests, and pure idempotent save migration.

- **Phase 2 Technical Design Spec:** [`docs/superpowers/specs/2026-09-28-penguin-island-phase2-design.md`](file:///e:/August%20Game/Canh%20Cut%20Vui%20Ve/docs/superpowers/specs/2026-09-28-penguin-island-phase2-design.md)
- **Phase 2 Implementation Plan:** [`docs/superpowers/plans/2026-09-28-penguin-island-phase2.md`](file:///e:/August%20Game/Canh%20Cut%20Vui%20Ve/docs/superpowers/plans/2026-09-28-penguin-island-phase2.md)
- **Phase 2 Approval Status:**
  - **Fully Approved:** Reviewed and refined across multiple feedback iterations.
  - **No Open Contradictions:** All math, rules, types, and tasks are strictly aligned.
  - **Implementation Status:** Planning is finalized; **code implementation has not yet started**.

---

## 4. Key Approved Phase 2 Rules & Corrections

1. **Hungry Species Hunger Rate:**
   - Normal rate = $+1$ hunger per 120s.
   - Hungry species accumulation rate is $1.25\times$ = $+1$ hunger per **96 seconds** ($120 / 1.25 = 96\text{s}$).
   - A Hungry penguin starting at `hunger: 70` reaches `hunger: 80` after $(80 - 70) \times 96 = 960$ seconds.
2. **Piecewise Offline Needs Simulation:**
   - Normal species starting at `hunger: 70` reaches 80 after $(80 - 70) \times 120 = 1,200$ seconds.
   - Before 80: happiness decays at 1 point / 180s ($\lfloor 1200 / 180 \rfloor = 6$ points).
   - After 80: remaining elapsed time decays at 1 point / 90s.
   - Hunger is strictly clamped to `[0, 100]`; happiness is clamped to `[0, 100]`.
3. **Authoritative Level-Up Rewards:**
   - Rewards (Coins, Gems, Unlocks) are granted **exclusively when `addPlayerExp(amount)` causes an actual level transition** (`oldLevel < newLevel`).
   - Loading, migration, recalculating level, or boot-time simulation must **never** grant level-up rewards.
   - Multi-level jumps grant rewards for all crossed levels sequentially.
4. **Authoritative Hatch Randomization & Scoped Pending Species:**
   - `hatchEgg(slotId: number, nickname: string)` takes **strictly `slotId` and `nickname`**. The caller cannot pass `speciesId`.
   - Species is determined authoritatively by egg drop pool and `RandomService` behind `HatchService`.
   - `pendingSpeciesId` is set only on `prepareHatch(slotId)` for celebration reveal and is cleared on successful hatch, cancel, slot replacement, or failure. Never leaks across eggs.
5. **Synchronous Shop Atomicity:**
   - Pre-validates item existence, `player.level >= item.playerLevelRequired`, valid quantity, and coin/gem balances before any state mutation.
   - Currency deduction and inventory addition occur as one synchronous logical mutation.
   - Emits `'action:shop_purchase'` only on success. Failed purchases produce zero changes and zero events.
6. **Favorite Field Removal:**
   - `isFavorite` is removed from `OwnedPenguin` (favorite food is derived from `PenguinSpecies.favoriteFoodId`). `lastFedAt` is retained as informational/future-facing.
   - Phase 2 has no feeding cooldown.
7. **Deterministic Daily Quests (Array Reorder Immunity):**
   - 3 active quests are chosen by sorting templates based on `hashString(`${dateStr}:${template.id}`)` descending. Reordering `QUEST_POOL` in code will never change selected quests for any date.
   - `quest_hatch` increments strictly on successful egg hatch creating an `OwnedPenguin`.
8. **Decoupled Store Dependencies:**
   - `questStore` observes action events (`action:pet`, `action:feed`, `action:hatch`, `action:shop_purchase`, `action:decorate`) over `GameBridge`.
   - `gameStore`, `shopStore`, and `decorationStore` never depend on `questStore`.
9. **Simulation Timer Lifecycle:**
   - `gameStore` provides `startNeedsSimulation()` and `stopNeedsSimulation()`. Duplicate intervals are guarded against; cleanup occurs on unmount.
10. **Pure Migration & Safe Missing-Timestamp Handling:**
    - `migrateSaveData()` is a pure normalization function. It does not call `Date.now()` or `getLocalDateString()`, and does not generate daily quests.
    - Missing historical timestamps do not default to epoch 0; boot-time initialization sets them to `bootTime` without simulating historical decay.
11. **Explicit Petting Rewards:**
    - Petting awards `+8 Happiness`, `+3 Penguin EXP`, `+2 Player EXP`, and strictly **0 Coins**.
12. **Flock Capacity Gating:**
    - Lv 1: max 2, Lv 2–4: max 3, Lv 5–7: max 4, Lv 8–10: max 5. Full flock prevents hatching without consuming egg or granting rewards.
13. **Decoration Placement EXP Anti-Exploit:**
    - +15 Player EXP is awarded at most once per decoration type for the lifetime of the save, tracked in `IslandState.unlockedPlacementExpIds`.

---

## 5. Current Git Working Tree State

- **Branch:** `master`
- **Working Tree:** Clean (zero unstaged or untracked changes).
- **Recent Commit History:**
  - `3715a33 docs(spec,plan): apply implementation corrections for migration purity, timestamps, store event decoupling, shop atomicity, simulation lifecycle, and hatch pending-state`
  - `4b04d14 docs(spec,plan): apply 10 corrections for hungry rate, piecewise decay, level-up transition guard, authoritative hatching, and atomic shop`
  - `a227a67 docs(spec,plan): apply final corrections for offline decay, local date, pet rewards, and EXP anti-exploit`
  - `f4bce77 fix(interaction): prevent modal close event leaking into Phaser and align incubator nest hitbox`
- **Test Baseline:** 196 tests passing across 25 suites (`npx vitest run`).

---

## 6. Next Immediate Action for Resuming Session

The next session should begin executing **Phase 2, Task 1** according to the approved plan:

1. **Review Task 1 in the plan:** [`docs/superpowers/plans/2026-09-28-penguin-island-phase2.md#task-1-shared-types--game-data-definitions-packagestypes--packagesgame-data`](file:///e:/August%20Game/Canh%20Cut%20Vui%20Ve/docs/superpowers/plans/2026-09-28-penguin-island-phase2.md)
2. **Execute Task 1 TDD steps:**
   - Write failing tests in `packages/types/src/__tests__/types.test.ts` and `packages/game-data/src/__tests__/validator.test.ts`.
   - Update `packages/types/src/index.ts` with Phase 2 interfaces (`PlayerProfile`, `PlacedDecoration`, `DecorationDefinition`, `FoodItemDefinition`, `EggShopDefinition`, `DailyLoginState`, `ActiveQuest`, `QuestTemplate`, `QuestState`, `GameSaveDataV2`, `OwnedPenguin` with `lastFedAt` and without `isFavorite`).
   - Update catalogs in `packages/game-data/src/` (`species.ts`, `items.ts`, `eggs.ts`, `decorations.ts`, `quests.ts`, `index.ts`).
   - Run tests (`npx vitest run packages/`) and verify green.
   - Commit: `git commit -m "feat(types): add Phase 2 shared interfaces and game-data catalogs"`.
3. **Proceed sequentially through Tasks 2 to 12.**
4. **Follow Subagent-Driven Development:** For each task, implement via TDD (RED $\to$ GREEN), self-review diff, run tests, and commit.

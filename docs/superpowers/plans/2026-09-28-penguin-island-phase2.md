# Penguin Island (Phase 2 — Core Game Loop & Island Life) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Phase 2 core game loop of *Penguin Island*: player and penguin leveling (Lv. 1–10), comprehensive care mechanics (offline & online hunger/happiness decay with deterministic mood priority), care economy (petting/favorite-food rewards, coin drops with Cozy bonus), Island Shop (*Cửa Hàng*), decoration placement on 6 anchor plots, deterministic calendar-day login rewards, daily quests, multi-slot incubation with speed-up limits and flock capacity gating, and idempotent save migration.

**Architecture:** Monorepo workspace (`apps/web`, `packages/types`, `packages/game-data`). Phaser 3 renders the 2.5D Snow Island, entities, anchor plot decorations, and particle effects; Vue 3 powers the HUD, Shelf Rack, Shop, Quests, Decoration, and Inspect modals. Decoupled via typed `GameBridge` events and Pinia stores (`gameStore`, `shopStore`, `decorationStore`, `questStore`, `inventoryStore`). Authoritative logic (cooldowns, inventory checks, level-up rewards, needs decay) lives strictly in Pinia and Services.

**Tech Stack:** Vue 3, Vite, TypeScript, Pinia, Phaser 3, Vitest, Web Audio API, npm workspaces.

**Spec:** `docs/superpowers/specs/2026-09-28-penguin-island-phase2-design.md`

## Global Constraints
- **Strict Boundary:** Phaser must never directly mutate Pinia state; Store/Service + GameBridge is the boundary.
- **Original IP:** 100% original artwork, names, quips, and designs. Zero copyrighted assets.
- **High-Res Stylized 2.5D Graphics:** Soft vector/painted shading; no pixel art, no corporate UI styling.
- **Deterministic Mood Priority:** 1. `hungry` (hunger >= 80), 2. `sad` (happiness <= 25), 3. `sleepy` (FSM SLEEP only), 4. `happy` (happiness >= 80), 5. `content` (otherwise).
- **Flock Capacity Gating:** Lv 1: max 2, Lv 2–4: max 3, Lv 5–7: max 4, Lv 8–10: max 5. Full flock prevents hatching without consuming egg or granting rewards.
- **Authoritative Care & Anti-Exploit:** Pet cooldown (15s per penguin), feeding inventory deduction, and level-up rewards are atomic in Pinia. Double clicks cannot duplicate rewards.
- **Derived Cozy Rating:** Cozy Rating is dynamically computed from placed decorations; never persisted as a raw number.
- **Idempotent Migration:** `schemaVersion >= 2` is canonical V2 data (`currencies.fish = 0`). Migration converts legacy fish currency to sardines once and is strictly idempotent (`V1 -> V2 -> V2`).
- **Modal Input Isolation:** All modal components must use `@pointerdown.stop`, `@pointerup.stop`, `@mousedown.stop`, `@mouseup.stop`, and `@click.stop` to prevent event leaking to Phaser.
- **Target Performance:** Solid 60 FPS on desktop, smooth 30–60 FPS on supported mobile devices. No per-frame Vue/DOM updates for gameplay entities.

---

### Task 1: Shared Types & Game Data Definitions (`packages/types` & `packages/game-data`)

**Files:**
- Modify: `packages/types/src/index.ts`
- Modify: `packages/game-data/src/species.ts`
- Modify: `packages/game-data/src/items.ts`
- Modify: `packages/game-data/src/eggs.ts`
- Create: `packages/game-data/src/decorations.ts`
- Create: `packages/game-data/src/quests.ts`
- Modify: `packages/game-data/src/index.ts`
- Test: `packages/types/src/__tests__/types.test.ts`
- Test: `packages/game-data/src/__tests__/validator.test.ts`

**Interfaces:**
- Produces: `PlayerProfile`, `PlacedDecoration`, `DecorationPlot`, `DecorationDefinition`, `FoodItemDefinition`, `EggShopDefinition`, `DailyLoginState`, `ActiveQuest`, `QuestTemplate`, `QuestState`, `GameSaveDataV2`, `DECORATION_PLOTS`, `DECORATION_CATALOG`, `FOOD_CATALOG`, `EGG_CATALOG`, `QUEST_POOL`.

- [ ] **Step 1: Write failing tests for Phase 2 types and catalogs**

```typescript
// packages/types/src/__tests__/types.test.ts
import { describe, it, expect } from 'vitest';
import type { PlayerProfile, PlacedDecoration, GameSaveDataV2 } from '../index';

describe('Phase 2 Types', () => {
  it('constructs valid PlayerProfile, PlacedDecoration, and GameSaveDataV2', () => {
    const profile: PlayerProfile = {
      level: 1,
      exp: 0,
      name: 'Người Nuôi Chim Cánh Cụt',
      avatar: 'snowy',
    };
    expect(profile.level).toBe(1);

    const decor: PlacedDecoration = {
      instanceId: 'dec-1',
      decorationId: 'bench_wood',
      plotId: 1,
      placedAt: 1700000000000,
    };
    expect(decor.plotId).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run packages/types/src/__tests__/types.test.ts` (Fails: types do not exist).

- [ ] **Step 3: Update `packages/types/src/index.ts` with Phase 2 interfaces**

Add `PlayerProfile`, `PlacedDecoration`, `DecorationPlot`, `DecorationDefinition`, `FoodItemDefinition`, `EggShopDefinition`, `DailyLoginState`, `ActiveQuest`, `QuestTemplate`, `QuestState`, and canonical `GameSaveDataV2`. Add `favoriteFoodId: string` to `PenguinSpecies`. Add `lastNeedsUpdateAt: number`, `lastPetAt: number`, `lastFedAt: number`, `isFavorite?: boolean` to `OwnedPenguin`. Add `lastNurtureAt?: number`, `nurtureCount?: number`, `unlocked: boolean`, `unlockCost?: number` to `IncubatorSlot`. Simplify `IslandState` to `{ decorations: PlacedDecoration[] }`.

- [ ] **Step 4: Update `packages/game-data` catalogs**

1. `species.ts`: add `favoriteFoodId` to each species (`snowy: 'sardine'`, `sleepy: 'warm_milk'`, `shy: 'sweet_berries'`, `happy: 'ice_cream'`, `hungry: 'fat_salmon'`).
2. `items.ts`: export `FOOD_CATALOG` with all 7 foods (`sardine`, `krill`, `warm_milk`, `sweet_berries`, `squid`, `fat_salmon`, `ice_cream`).
3. `eggs.ts`: export `EGG_CATALOG` with `basic_egg` (150c, Lv1), `frozen_egg` (450c, Lv4), `golden_egg` (1200c / 10 gems, Lv7).
4. `decorations.ts`: export `DECORATION_PLOTS` (6 anchor plots) and `DECORATION_CATALOG` (including Lv10 `master_caretaker_trophy`).
5. `quests.ts`: export `QUEST_POOL` with 5 quest templates.
6. `index.ts`: re-export all new catalogs and definitions.

- [ ] **Step 5: Run tests and typecheck to verify success**

Run: `npx vitest run packages/` and verify clean pass.
Commit: `git commit -m "feat(types): add Phase 2 shared interfaces and game-data catalogs"`

---

### Task 2: Core Progression Algorithms & Needs Simulation (`apps/web/src/services/ProgressionService.ts`)

**Files:**
- Create: `apps/web/src/services/ProgressionService.ts`
- Test: `apps/web/src/services/__tests__/ProgressionService.test.ts`

**Interfaces:**
- Produces: `getPlayerLevelFromExp()`, `getPenguinLevelFromExp()`, `getMaxFlockCapacity()`, `simulatePenguinNeeds()`, `derivePenguinMood()`, `calculateCozyRating()`, `getCoinDropMultiplier()`, `getDeterministicDailyQuests()`, `isFavoriteFood()`, `calculateCareRewards()`.

- [ ] **Step 1: Write comprehensive failing tests for all algorithms**

Cover:
1. `getPlayerLevelFromExp`: cumulative thresholds 0, 100, 300, 650, 1200, 2000, 3100, 4600, 6600, 9200.
2. `getPenguinLevelFromExp`: cumulative thresholds 0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700.
3. `getMaxFlockCapacity`: Lv1 -> 2, Lv2–4 -> 3, Lv5–7 -> 4, Lv8–10 -> 5.
4. `simulatePenguinNeeds`:
   - Normal species: +1 hunger per 120s.
   - Hungry species: +1 hunger per 90s.
   - Happiness: -1 per 180s; -1 per 90s if hunger >= 80.
   - Clamped to [0, 100].
5. `derivePenguinMood`:
   - hunger >= 80 -> `hungry`.
   - happiness <= 25 -> `sad`.
   - sleeping -> `sleepy`.
   - happiness >= 80 -> `happy`.
   - otherwise -> `content`.
6. `calculateCozyRating` and `getCoinDropMultiplier`: +1% per 10 cozy points, max +25%.
7. `getDeterministicDailyQuests`: returns exactly 3 quests from pool of 5; date hashing is deterministic on reload.
8. `calculateCareRewards`: Hungry species gets 18 Penguin EXP for favorite food; player EXP is 12.

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run apps/web/src/services/__tests__/ProgressionService.test.ts` (Fails: file not found).

- [ ] **Step 3: Implement `apps/web/src/services/ProgressionService.ts`**

Implement pure TypeScript functions according to exact specifications with zero external framework dependencies.

- [ ] **Step 4: Run tests to verify green**

Run: `npx vitest run apps/web/src/services/__tests__/ProgressionService.test.ts`.
Commit: `git commit -m "feat(service): implement Phase 2 progression and needs simulation algorithms"`

---

### Task 3: Storage Service & Idempotent V1 -> V2 Migration (`apps/web/src/services/StorageService.ts`)

**Files:**
- Modify: `apps/web/src/services/StorageService.ts`
- Modify: `apps/web/src/services/__tests__/StorageService.test.ts`

**Interfaces:**
- Consumes: `GameSaveDataV2`, `migrateSaveData()` from `StorageService.ts`.
- Produces: Upgraded save migration supporting canonical V2 with fish-to-sardine conversion and idempotence.

- [ ] **Step 1: Write failing tests for V1 -> V2 migration and idempotence**

```typescript
it('converts legacy currencies.fish into sardine inventory items and sets currencies.fish = 0', () => {
  const v1Data = {
    schemaVersion: 1,
    currencies: { fish: 15, coins: 200, gems: 5 },
    inventory: [{ itemId: 'sardine', quantity: 5, category: 'food' }],
    ownedPenguins: [{ id: 'p1', speciesId: 'snowy', nickname: 'Snowy' }],
  };
  const v2 = migrateSaveData(v1Data);
  expect(v2.schemaVersion).toBe(2);
  expect(v2.currencies.fish).toBe(0);
  expect(v2.currencies.coins).toBe(200);
  const sardine = v2.inventory.find(i => i.itemId === 'sardine');
  expect(sardine?.quantity).toBe(20); // 5 + 15
});

it('is strictly idempotent on repeated migration (V1 -> V2 -> V2)', () => {
  const v1Data = { schemaVersion: 1, currencies: { fish: 10, coins: 100 } };
  const v2First = migrateSaveData(v1Data);
  const v2Second = migrateSaveData(v2First);
  expect(v2Second.currencies.fish).toBe(0);
  const sardine = v2Second.inventory.find(i => i.itemId === 'sardine');
  expect(sardine?.quantity).toBe(10); // Not doubled
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run apps/web/src/services/__tests__/StorageService.test.ts`.

- [ ] **Step 3: Update `StorageService.ts` with V1 -> V2 migration algorithm**

Implement canonical V2 migration handling:
- `if (version >= 2) return data;`
- Legacy fish currency conversion into `sardine` item quantity.
- Safe defaults for `dailyLogin`, `questState`, `island.decorations`.
- Penguin defaults for `level`, `exp`, `lastNeedsUpdateAt`, `lastPetAt`, `lastFedAt`.
- Simulation of offline needs decay on load via `simulatePenguinNeeds()`.

- [ ] **Step 4: Run tests to verify green**

Run: `npx vitest run apps/web/src/services/__tests__/StorageService.test.ts`.
Commit: `git commit -m "feat(storage): implement idempotent V1 to V2 save migration with offline simulation"`

---

### Task 4: Authoritative Care, Economy & Progression State (`apps/web/src/stores/gameStore.ts`)

**Files:**
- Modify: `apps/web/src/stores/gameStore.ts`
- Modify: `apps/web/src/stores/__tests__/gameStore.test.ts`

**Interfaces:**
- Consumes: `ProgressionService`, `StorageService`.
- Produces: `petPenguin()`, `feedPenguin()`, `addPlayerExp()`, `hatchEgg()` with flock capacity checks, `nurtureEgg()`.

- [ ] **Step 1: Write failing tests for store actions and anti-exploit rules**

1. Petting:
   - Succeeds and grants +2 Player EXP, +8 happiness, coins.
   - Second call within 15s fails with `{ success: false, reason: 'COOLDOWN' }` and 0 rewards.
2. Feeding:
   - Fails if `invStore.getItemCount(foodId) < 1` with `{ success: false, reason: 'NO_FOOD' }`.
   - Succeeds when food is available; consumes 1 food item; grants favorite food bonus (+18 Penguin EXP for Hungry + fat_salmon).
3. Level-up:
   - Crossing EXP threshold automatically grants level-up Coins & Gems inside `addPlayerExp`.
4. Flock capacity:
   - Lv1 max 2 penguins: if `ownedPenguins.length === 2`, `hatchEgg()` fails with `{ success: false, reason: 'FLOCK_FULL' }`, egg remains `READY_TO_HATCH`.
5. Nurture speed-up:
   - Deducts 30s, capped at max 10 speed-ups per egg, floor at 1s remaining, 30s cooldown per slot.

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run apps/web/src/stores/__tests__/gameStore.test.ts`.

- [ ] **Step 3: Implement authoritative methods in `gameStore.ts`**

Update `gameStore.ts` to manage:
- `player: PlayerProfile`.
- Authoritative `petPenguin(ownedId)` with 15s cooldown check.
- Authoritative `feedPenguin(ownedId, foodId)` with inventory deduction and favorite food matching.
- Authoritative `addPlayerExp(amount)` with automatic level-up reward grant.
- Authoritative `hatchEgg(slotId, nickname, speciesId)` with `getMaxFlockCapacity()` check.
- Authoritative `nurtureEgg(slotId)` with 30s cooldown and 10 speed-up cap.
- Periodic interval timer (every 10s) simulating real-time needs.

- [ ] **Step 4: Run tests to verify green**

Run: `npx vitest run apps/web/src/stores/__tests__/gameStore.test.ts`.
Commit: `git commit -m "feat(store): implement authoritative care, progression, and flock capacity checks in gameStore"`

---

### Task 5: Shop & Inventory State (`apps/web/src/stores/shopStore.ts` & `inventoryStore.ts`)

**Files:**
- Create: `apps/web/src/stores/shopStore.ts`
- Modify: `apps/web/src/stores/inventoryStore.ts`
- Test: `apps/web/src/stores/__tests__/shopStore.test.ts`
- Test: `apps/web/src/stores/__tests__/inventoryStore.test.ts`

**Interfaces:**
- Produces: `useShopStore()`, `buyFood()`, `buyEgg()`, `buyDecoration()`, `availableFoods`, `availableEggs`, `availableDecorations`.

- [ ] **Step 1: Write failing tests for shop purchases**

1. Player level requirement check (cannot buy Krill at Lv1, succeeds at Lv2).
2. Coin deduction check (fails if insufficient coins).
3. Gem deduction check for Golden Egg and premium decorations.
4. Item successfully added to inventory upon purchase.

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run apps/web/src/stores/__tests__/shopStore.test.ts`.

- [ ] **Step 3: Implement `apps/web/src/stores/shopStore.ts`**

Implement `useShopStore` with Pinia:
- Reads `FOOD_CATALOG`, `EGG_CATALOG`, `DECORATION_CATALOG`.
- Computes items unlocked by `gameStore.player.level`.
- `buyFood(foodId, quantity)`
- `buyEgg(eggId)`
- `buyDecoration(decorationId)`
- Emits purchase audio/effects and triggers quest notification.

- [ ] **Step 4: Run tests to verify green**

Run: `npx vitest run apps/web/src/stores/__tests__/shopStore.test.ts`.
Commit: `git commit -m "feat(shop): implement shopStore for food, eggs, and decorations with level requirements"`

---

### Task 6: Island Decoration & Anchor Plots State (`apps/web/src/stores/decorationStore.ts`)

**Files:**
- Create: `apps/web/src/stores/decorationStore.ts`
- Test: `apps/web/src/stores/__tests__/decorationStore.test.ts`

**Interfaces:**
- Produces: `useDecorationStore()`, `placeDecoration()`, `removeDecoration()`, `replaceDecoration()`, `cozyRating`, `coinDropMultiplier`.

- [ ] **Step 1: Write failing tests for 6 anchor plot decoration management**

1. Place item on empty Plot 1 (deducts from inventory, adds to `placedDecorations`).
2. Reject placing on occupied plot without replace.
3. Remove item from Plot 1 (clears plot, returns item to inventory).
4. Replace item on Plot 1 (returns old item, places new item).
5. `cozyRating` dynamically calculated from placed items.
6. Emits `decorations:sync` on GameBridge.

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run apps/web/src/stores/__tests__/decorationStore.test.ts`.

- [ ] **Step 3: Implement `apps/web/src/stores/decorationStore.ts`**

Implement `useDecorationStore` managing `island.decorations`:
- Validates plot ID (1..6).
- Places, removes, replaces items via `inventoryStore`.
- Computes `cozyRating` and `coinDropMultiplier`.
- Emits `decorations:sync` on GameBridge.

- [ ] **Step 4: Run tests to verify green**

Run: `npx vitest run apps/web/src/stores/__tests__/decorationStore.test.ts`.
Commit: `git commit -m "feat(decorations): implement decorationStore for 6 island anchor plots and cozy rating"`

---

### Task 7: Daily Login & Quest State (`apps/web/src/stores/questStore.ts`)

**Files:**
- Create: `apps/web/src/stores/questStore.ts`
- Test: `apps/web/src/stores/__tests__/questStore.test.ts`

**Interfaces:**
- Produces: `useQuestStore()`, `claimDailyLogin()`, `recordAction()`, `claimQuestReward()`, `activeQuests`, `loginState`.

- [ ] **Step 1: Write failing tests for daily login streak and quests**

1. Daily login: claim Day 1 on fresh save.
2. Same-day second claim is rejected.
3. Consecutive calendar day claim advances streak to Day 2.
4. Missed calendar day resets streak to Day 1.
5. Claim on Day 7 loops back to Day 1 next day.
6. Action tracking updates quest count (`onPet`, `onFeed`, `onHatch`, `onShop`, `onDecorate`).
7. Claiming completed quest awards Coins, Player EXP, Gems.

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run apps/web/src/stores/__tests__/questStore.test.ts`.

- [ ] **Step 3: Implement `apps/web/src/stores/questStore.ts`**

Implement `useQuestStore`:
- Calendar date checking using local date string `YYYY-MM-DD`.
- 7-day reward calendar claims.
- 3 deterministic active daily quests using `getDeterministicDailyQuests()`.
- Action recording hooks and manual reward claim.

- [ ] **Step 4: Run tests to verify green**

Run: `npx vitest run apps/web/src/stores/__tests__/questStore.test.ts`.
Commit: `git commit -m "feat(quests): implement questStore for daily login calendar and deterministic daily quests"`

---

### Task 8: Typed GameBridge & Sound Effects Expansion (`apps/web/src/game/bridge` & `services/SoundService.ts`)

**Files:**
- Modify: `apps/web/src/game/bridge/GameBridge.ts`
- Modify: `apps/web/src/services/SoundService.ts`
- Test: `apps/web/src/game/bridge/__tests__/GameBridge.test.ts`
- Test: `apps/web/src/services/__tests__/SoundService.test.ts`

**Interfaces:**
- Produces: `'decorations:sync'`, `'plot:clicked'`, `'effect:coin_drop'`, `'effect:level_up'` in `GameBridgeEventMap`, `playCoinDrop()`, `playLevelUp()`, `playBuySuccess()`.

- [ ] **Step 1: Write failing tests for new GameBridge events and sound chimes**

Test event emission and handler invocation for Phase 2 events in `GameBridge.test.ts`. Test audio synthesis methods in `SoundService.test.ts`.

- [ ] **Step 2: Update `GameBridge.ts` and `SoundService.ts`**

Add typed event signatures to `GameBridgeEventMap`. Add Web Audio synthesized chimes for coin drop, level up celebration fanfare, and purchase ding.

- [ ] **Step 3: Run tests to verify green**

Run: `npx vitest run apps/web/src/game/bridge/ apps/web/src/services/__tests__/SoundService.test.ts`.
Commit: `git commit -m "feat(bridge): add Phase 2 GameBridge events and audio synthesis chimes"`

---

### Task 9: Procedural Decoration Textures & 2.5D Anchor Plot Rendering in Phaser (`apps/web/src/game`)

**Files:**
- Modify: `apps/web/src/game/textures/TextureGenerator.ts`
- Modify: `apps/web/src/game/scenes/SnowIslandScene.ts`
- Test: `apps/web/src/game/textures/__tests__/TextureGenerator.test.ts`
- Test: `apps/web/src/game/scenes/__tests__/SnowIslandScene.test.ts`

**Interfaces:**
- Produces: Cached textures `dec_bench_wood`, `dec_pine_crystal`, `dec_lamp_street`, `dec_castle_snow`, `dec_lantern_igloo`, `dec_trophy_master`. Interactive anchor plots rendering placed decorations with depth sorting. Floating coin drop particle effect on `effect:coin_drop`.

- [ ] **Step 1: Write failing tests for decoration texture generation and plot rendering**

1. Verify texture generator creates textures for all 6 decorations.
2. Verify `SnowIslandScene` renders 6 anchor plot containers at predefined coordinates.
3. Verify `decorations:sync` creates decoration sprites at the correct plot with depth sorting.
4. Verify clicking an anchor plot emits `plot:clicked { plotId }`.

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run apps/web/src/game/scenes/__tests__/SnowIslandScene.test.ts`.

- [ ] **Step 3: Implement procedural textures & plot rendering**

1. In `TextureGenerator.ts`: create 2.5D vector canvas generators for the 6 decorations with soft vector shading and snow dusting.
2. In `SnowIslandScene.ts`:
   - Initialize 6 interactive anchor plot pads using `DECORATION_PLOTS`.
   - On plot click, emit `plot:clicked { plotId }`.
   - On `decorations:sync`: clear old decoration sprites and render active decorations on plots with correct depth sorting (`plot.depthOffset`).
   - On `effect:coin_drop`: spawn floating bounce coin icon with $+Amount$ popup text, auto-destroying after 800ms.

- [ ] **Step 4: Run tests to verify green**

Run: `npx vitest run apps/web/src/game/scenes/__tests__/SnowIslandScene.test.ts`.
Commit: `git commit -m "feat(phaser): render 2.5D anchor plot decorations, depth sorting, and coin drop effects"`

---

### Task 10: Shop, Quest, Decoration, and Level-Up Modals (`apps/web/src/components/modals`)

**Files:**
- Create: `apps/web/src/components/modals/ShopModal.vue`
- Create: `apps/web/src/components/modals/QuestModal.vue`
- Create: `apps/web/src/components/modals/DecorationModal.vue`
- Create: `apps/web/src/components/modals/LevelUpModal.vue`
- Modify: `apps/web/src/components/modals/HatcheryModal.vue`
- Modify: `apps/web/src/components/modals/PenguinInspectModal.vue`
- Test: `apps/web/src/components/modals/__tests__/ShopModal.test.ts`
- Test: `apps/web/src/components/modals/__tests__/QuestModal.test.ts`
- Test: `apps/web/src/components/modals/__tests__/DecorationModal.test.ts`

**Interfaces:**
- Produces: Vue 3 modal components with full pointer/click event isolation, tabbed UI, and store bindings.

- [ ] **Step 1: Write failing tests for new modals**

Test:
- `ShopModal`: tab switching, level requirement locks, purchase action calling `shopStore`.
- `QuestModal`: 7-day login claim button state, quest progress display, claim reward action.
- `DecorationModal`: plot selection, place/remove/replace actions calling `decorationStore`.
- `PenguinInspectModal`: favorite star toggle, food inventory selector with favorite food indicator.
- `HatcheryModal`: nurture speed-up button with 30s cooldown and 10 uses counter; Slot 2 unlock button.

- [ ] **Step 2: Implement modal components**

Follow strict Phase 1 event isolation rules:
- `@pointerdown.stop`, `@pointerup.stop`, `@mousedown.stop`, `@mouseup.stop`, `@click.stop` on backdrops, dialogs, and buttons.
- `ShopModal.vue`: 3 tabs (`Thức Ăn`, `Trứng`, `Trang Trí`), level badge indicators, purchase buttons.
- `QuestModal.vue`: 7-day streak calendar + 3 daily quests.
- `DecorationModal.vue`: 6 plots visual selector + inventory placement drawer.
- `LevelUpModal.vue`: presentation-only celebration popup.
- Update `HatcheryModal.vue` and `PenguinInspectModal.vue`.

- [ ] **Step 3: Run tests to verify green**

Run: `npx vitest run apps/web/src/components/modals/__tests__/`.
Commit: `git commit -m "feat(ui): implement ShopModal, QuestModal, DecorationModal, and updated inspect controls"`

---

### Task 11: HUD, Shelf Rack & App Integration (`TopBar.vue`, `ShelfRack.vue`, `App.vue`)

**Files:**
- Modify: `apps/web/src/components/hud/TopBar.vue`
- Modify: `apps/web/src/components/dock/ShelfRack.vue`
- Modify: `apps/web/src/App.vue`
- Test: `apps/web/src/components/__tests__/TopBar.test.ts`
- Test: `apps/web/src/components/__tests__/ShelfRack.test.ts`
- Test: `apps/web/src/__tests__/App.test.ts`

**Interfaces:**
- Produces: Integrated Phase 2 game shell with level progression bar, Shop button, Quests button, plot click modal opening, and automatic LevelUpModal presentation.

- [ ] **Step 1: Write failing tests for HUD & App integration**

1. `TopBar`: shows Player Level badge (Lv. 1–10) and interactive EXP progress tooltip; shows Coins and Gems.
2. `ShelfRack`: renders Cửa Hàng (Shop) and Nhiệm Vụ (Quests) buttons.
3. `App.vue`: clicking Shop or Quests opens respective modals; clicking an anchor plot in Phaser opens `DecorationModal` for that plot ID.
4. `App.vue`: level-up event triggers `LevelUpModal`.

- [ ] **Step 2: Update `TopBar.vue`, `ShelfRack.vue`, and `App.vue`**

1. In `TopBar.vue`: bind player level and EXP progress bar; format Coins and Gems with pill badges.
2. In `ShelfRack.vue`: add wooden buttons for Shop (🛍️ Cửa Hàng) and Quests (📜 Nhiệm Vụ).
3. In `App.vue`: wire modal states (`activeModal: 'shop' | 'quest' | 'decoration' | 'levelup'`), listen for `plot:clicked` on GameBridge, and bind level-up presentation.

- [ ] **Step 3: Run tests to verify green**

Run: `npx vitest run apps/web/src/components/__tests__/ apps/web/src/__tests__/App.test.ts`.
Commit: `git commit -m "feat(ui): integrate Phase 2 progression HUD, ShelfRack shop/quest buttons, and modal routing"`

---

### Task 12: End-to-End Integration, Complete Test Suite & Build Verification

**Files:**
- Modify: `apps/web/src/__tests__/integration.test.ts`
- Modify: `README.md`

**Interfaces:**
- Produces: Comprehensive automated integration test covering the entire Phase 2 game loop and updated documentation.

- [ ] **Step 1: Write full end-to-end integration test**

Verify the complete player journey in `apps/web/src/__tests__/integration.test.ts`:
1. Starter island with Snowy (Level 1, max capacity 2).
2. Pet Snowy -> grants Player EXP, happiness, drops coins.
3. Feed Snowy with Small Sardine (favorite food) -> hunger drops, happiness boosts, bonus Penguin EXP + coins.
4. Purchase Krill & Wooden Bench in Shop -> coins deducted, inventory updated.
5. Place Wooden Bench on Plot 1 -> Cozy rating increases, coin multiplier applies.
6. Incubate Basic Egg -> Nurture speed-up decreases timer by 30s.
7. Hatch egg -> checks flock capacity (now 2 penguins). Attempting to hatch a 3rd egg at Lv1 is blocked by flock capacity.
8. Player earns EXP -> Level up to Level 2 -> capacity expands to 3, rewards granted.
9. Claim Day 1 login reward -> Coins and sardines added.
10. Claim completed Daily Quest -> EXP and Coins added.
11. Save to localStorage -> reload with simulated elapsed time -> verifies offline hunger/happiness decay and mood updates.

- [ ] **Step 2: Run full Vitest test suite**

Run: `npx vitest run` (All suites must pass 100%).

- [ ] **Step 3: Run TypeScript typecheck & production build**

Run: `npm run build` (`tsc --noEmit && vite build`).
Verify zero type errors and clean bundle output.

- [ ] **Step 4: Update README.md with Phase 2 systems & controls**

Document Player Progression, Penguin Care loop, Shop, Quests, 6 Anchor Plots, and Cozy Rating.

- [ ] **Step 5: Final commit**

Commit: `git commit -m "feat(core): complete Phase 2 core game loop, island life, and end-to-end integration"`

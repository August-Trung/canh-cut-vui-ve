# Technical Design Specification: Penguin Island — Phase 2 (Core Game Loop & Island Life)

- **Date:** 2026-09-28
- **Status:** Finalized & Approved for Implementation Planning
- **Target Milestone:** Deeply engaging, self-sustaining casual social-island loop: player & penguin leveling, comprehensive care mechanics (offline & online piecewise hunger/happiness decay with deterministic mood priority), reward economy (care rewards, shop sinks), daily login rewards with deterministic streak evaluation, daily quests with deterministic date hashing, multi-slot incubation with speed-up limits and flock capacity gating, and interactive island decoration placement on 6 anchor plots with placement EXP anti-exploit tracking.

---

## 1. Executive Summary & Core Philosophy

In Phase 1, *Penguin Island* established its playable visual and architectural foundation: an autonomous 2.5D Snow Island rendered in Phaser 3, a clean Vue 3 application HUD and modal layer, typed `GameBridge` decoupling, vector texture caching, local save persistence, and an initial incubation/hatching sequence for 5 original species.

Phase 2 transforms this foundation into a **self-sustaining, intrinsically rewarding casual game loop**. The player is no longer just observing a single penguin and hatching once: they actively nurture a growing flock, earn Coins and Player EXP through caring for their penguins, spend their earnings in a charming Island Shop to buy specialized food, new eggs, and decorations, decorate their island to increase its "Cozy Rating" (*Độ Ấm Cúng*), and fulfill daily missions.

```
       ┌────────────────────────────────────────────────────────┐
       │                 THE PHASE 2 CORE LOOP                  │
       └────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                   ┌──────────────────────────────┐
                   │    CARE FOR PENGUINS         │
                   │  - Petting (Hearts + EXP)    │
                   │  - Feeding (Food -> Vitals)  │
                   └──────────────┬───────────────┘
                                  │ (Generates Coins & EXP)
                                  ▼
                   ┌──────────────────────────────┐
                   │   PROGRESSION & REWARDS      │
                   │  - Player Level Up (Unlocks) │
                   │  - Penguin Level Up (Traits) │
                   │  - Quests & Daily Rewards    │
                   └──────────────┬───────────────┘
                                  │ (Spends Coins & Gems)
                                  ▼
                   ┌──────────────────────────────┐
                   │        ISLAND SHOP           │
                   │  - Buy Varied Food / Treats  │
                   │  - Buy Frozen & Golden Eggs  │
                   │  - Buy Island Decorations    │
                   └──────────────┬───────────────┘
                                  │
         ┌────────────────────────┴───────────────────────┐
         ▼                                                ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  INCUBATION & FLOCK GROWTH   │        │     ISLAND DECORATION        │
│  - Multi-slot Incubator      │        │  - 6 Fixed Anchor Plots      │
│  - Nurture Speed-Up          │        │  - Boost Island Cozy Multi   │
│  - Flock Capacity Checks     │        │  - One-time Placement EXP    │
└──────────────────────────────┘        └──────────────────────────────┘
```

### Key Principles for Phase 2:
1. **Original IP & Nostalgic Spirit:** 100% original artwork, mechanics, and Vietnamese localization (`Đảo Tuyết`, `Cửa Hàng`, `Nhiệm Vụ`, `Điểm Danh`). Nostalgic warmth inspired by 2010s casual social web games without copying copyrighted assets, names, or code.
2. **Smallest Coherent Scope:** Avoid scope creep. Strictly focus on local, single-player progression and care mechanics.
3. **Preserve Phase 1 Architecture & Data:** Zero regressions in existing Phase 1 functionality. Phaser remains strictly responsible for rendering and entity physics/animation; Pinia and Services remain the authoritative state boundary; Vue handles all UI dialogs and shops.
4. **No Backend Dependency Yet:** All Phase 2 features run client-side with versioned `localStorage` persistence and automatic, idempotent schema migrations.

---

## 2. Goals and Non-Goals

### 2.1 Goals
- **Player Progression (Lv. 1–10):** Player gains EXP from caring, hatching, and quest completion. Level-up rewards are granted automatically and authoritatively inside the Pinia store when crossing thresholds, unlocking shop items, island flock capacity, and slot 2 incubator.
- **Penguin Progression (Lv. 1–10) & Needs Loop:** Hunger and happiness decay both online and offline via deterministic piecewise simulation; penguins transition moods deterministically (`hungry`, `sad`, `sleepy`, `happy`, `content`) with corresponding speech bubble quips and animation changes.
- **Feeding & Petting Rewards (Authoritative & Anti-Exploit):** Feeding favorite foods yields bonus Penguin EXP and Coins; petting yields affection hearts and Player EXP with a per-penguin cooldown; atomic store updates prevent duplicate-click exploits. Petting grants strictly **0 Coins**.
- **Flock Expansion & Capacity Enforcement:** Island flock capacity strictly enforced (Lv 1: max 2, Lv 2–4: max 3, Lv 5–7: max 4, Lv 8–10: max 5). Hatching checks capacity before consuming the egg; if full, the egg remains `READY_TO_HATCH` and no penguin or rewards are created.
- **Shop System (*Cửa Hàng*):** A nostalgic wooden/snow-dusted boutique selling Food, Eggs, and Decorations for Coins and Gems.
- **Island Decoration Placement on 6 Anchor Plots:** Players can place, remove, or replace purchased decorations on 6 predefined island plots, rendering 2.5D visual props with depth sorting and providing a dynamically derived Cozy Bonus multiplier. Placement EXP (+15 EXP) is awarded at most once per decoration type for the lifetime of the save.
- **Daily Rewards (*Điểm Danh*) & Quests (*Nhiệm Vụ*):** Deterministic calendar-day 7-day progressive login streak and deterministic date-seeded 3 daily quests from a pool of 5 templates using local calendar dates (`getLocalDateString()`). Hatch quest requires successful hatching.
- **Pure Schema Migration (`schemaVersion: 1 -> 2`):** Pure, idempotent migration function decoupled from boot-time gameplay simulation, converting legacy fish currency to sardines once and setting `currencies.fish = 0`.

### 2.2 Non-Goals (Strictly Deferred to Later Phases)
- **Multiplayer & Peer-to-Peer Island Visits:** Island neighbor visits remain simulated NPC neighbors (deferred to Phase 3/4).
- **Backend API & Cloud Database:** No NestJS / PostgreSQL / Redis setup in Phase 2.
- **Breeding Genetics & DNA Mixing:** Cross-breeding penguins is out of scope for Phase 2.
- **Competitive Leaderboards / PvP Minigames:** Out of scope for Phase 2.
- **External Audio Asset Loading:** Continue utilizing procedural Web Audio API synthesis for all sound effects and chimes.
- **Freeform Island Placement:** Decorations are strictly placed on the 6 predefined anchor plots (no freeform grid/coordinate dragging).

---

## 3. Player Progression & Flock Capacity Model

### 3.1 Cumulative EXP Thresholds, Flock Capacity & Unlocks (Lv. 1–10)
Player Level represents the player's experience as an Island Caretaker. Cumulative EXP thresholds are defined in data:

| Level | Cumulative EXP | Max Flock Capacity | Key Unlocks & Rewards (Granted Automatically in Store) |
|:---:|:---:|:---:|:---|
| **1** | 0 | **2 penguins** | Starter Island, Slot 1 Incubator, Small Sardine in Shop |
| **2** | 100 | **3 penguins** | Flock Capacity +1, Krill unlocked in Shop, +100 Coins |
| **3** | 300 | **3 penguins** | Slot 2 Incubator unlocked for purchase (500 Coins), Warm Milk & Sweet Berries in Shop, Wooden Bench decoration, +150 Coins |
| **4** | 650 | **3 penguins** | Frozen Egg unlocked in Shop, Squid food unlocked, +200 Coins, +2 Gems |
| **5** | 1,200 | **4 penguins** | Flock Capacity +1, Fat Salmon unlocked in Shop, Crystal Pine decoration, +300 Coins, +3 Gems |
| **6** | 2,000 | **4 penguins** | Ice Cream treat unlocked in Shop, Street Lamp decoration, +400 Coins, +5 Gems |
| **7** | 3,100 | **4 penguins** | Golden Egg unlocked in Shop, +500 Coins, +5 Gems |
| **8** | 4,600 | **5 penguins** | Flock Capacity +1, Mini Snow Castle decoration, +600 Coins, +8 Gems |
| **9** | 6,600 | **5 penguins** | Cozy Igloo Lantern decoration, +800 Coins, +10 Gems |
| **10** | 9,200 | **5 penguins** | Master Caretaker Trophy decoration, +1,500 Coins, +20 Gems |

### 3.2 Flock Capacity Rules
```typescript
export function getMaxFlockCapacity(playerLevel: number): number {
  if (playerLevel >= 8) return 5;
  if (playerLevel >= 5) return 4;
  if (playerLevel >= 2) return 3;
  return 2;
}
```
**Hatching Gate:** When a player attempts to complete hatching in `HatchModal.vue` / `gameStore.hatchEgg(slotId, ...)`:
- If `gameStore.ownedPenguins.length >= getMaxFlockCapacity(gameStore.player.level)`:
  - The hatching action aborts with `{ success: false, reason: 'FLOCK_FULL' }`.
  - The incubator slot remains `READY_TO_HATCH`.
  - The egg item is NOT consumed, no `OwnedPenguin` is created, and no EXP or rewards are granted.
  - A friendly notification informs the player: *"Đảo đã đạt giới hạn chim cánh cụt (tối đa {max} chú)! Hãy tăng Cấp độ Người Chơi để mở rộng đảo."*

### 3.3 Authoritative Level-Up Rewards
When `gameStore.addPlayerExp(amount)` causes cumulative EXP to cross one or more level thresholds:
- The level-up rewards (Coins, Gems, unlocked items) are granted **immediately and authoritatively** within the store action.
- `LevelUpModal.vue` is **presentation-only**. It listens for the level-up state to display the celebratory fanfare and summary of rewards already granted. It never executes grant or claim logic, ensuring zero duplication if closed or reopened.

### 3.4 Player EXP Sources
- **Petting Penguin:** +2 Player EXP (Cooldown: 15s per penguin; **0 Coins**)
- **Feeding Penguin (Standard Food):** +5 Player EXP
- **Feeding Penguin (Favorite Food):** +12 Player EXP
- **Hatching Basic Egg:** +25 Player EXP
- **Hatching Frozen Egg:** +50 Player EXP
- **Hatching Golden Egg:** +120 Player EXP
- **Completing Daily Quest:** +25 to +60 Player EXP
- **Placing New Decoration on Plot (First time per decoration type):** +15 Player EXP

---

## 4. Penguin Progression & Care Model

### 4.1 Penguin Vitals & Online/Offline Decay
Each `OwnedPenguin` maintains two core vitals (0 to 100) and a last-update timestamp:
1. **Hunger (*Đói Bụng*):** 0 = Full/Stuffed, 100 = Starving.
   - Normal Species: increases by **1 point every 120 seconds** (2 minutes).
   - Hungry Species (`speciesId === 'hungry'`): increases by **1 point every 90 seconds** (25% faster accumulation).
2. **Happiness (*Vui Vẻ*):** 0 = Miserable, 100 = Ecstatic.
   - Decreases by **1 point every 180 seconds** (3 minutes).
   - If `hunger >= 80`, decreases by **1 point every 90 seconds** (doubled decay rate when starving).
   - Clamped strictly to `[0, 100]`.
3. **Persisted Timestamp:** `lastNeedsUpdateAt: number` (Unix timestamp in ms).

### 4.2 Piecewise Needs Simulation Algorithm (Handling `hunger >= 80` Crossing)
When simulating needs offline or on periodic tick, elapsed time may cross the `hunger = 80` threshold. A piecewise calculation ensures that the 180s happiness rate applies before hunger reaches 80 and the 90s rate applies only after hunger reaches 80:

```typescript
export function simulatePenguinNeeds(
  penguin: OwnedPenguin,
  currentTime: number = Date.now()
): void {
  const elapsedSeconds = Math.max(0, Math.floor((currentTime - penguin.lastNeedsUpdateAt) / 1000));
  if (elapsedSeconds <= 0) return;

  const hungerInterval = penguin.speciesId === 'hungry' ? 90 : 120;
  const initialHunger = penguin.hunger;
  let happinessDecrease = 0;

  if (initialHunger >= 80) {
    // Hunger was already >= 80 for the entire elapsed period
    const hungerIncrease = Math.floor(elapsedSeconds / hungerInterval);
    penguin.hunger = Math.min(100, initialHunger + hungerIncrease);
    happinessDecrease = Math.floor(elapsedSeconds / 90);
  } else {
    // Hunger started below 80: calculate time required to reach 80
    const pointsTo80 = 80 - initialHunger;
    const secondsTo80 = pointsTo80 * hungerInterval;

    if (elapsedSeconds <= secondsTo80) {
      // Entire period elapsed before hunger reached 80
      const hungerIncrease = Math.floor(elapsedSeconds / hungerInterval);
      penguin.hunger = initialHunger + hungerIncrease;
      happinessDecrease = Math.floor(elapsedSeconds / 180);
    } else {
      // Piecewise: time before reaching 80 + time after reaching 80
      const secondsAfter80 = elapsedSeconds - secondsTo80;
      const hungerIncreaseAfter80 = Math.floor(secondsAfter80 / hungerInterval);
      penguin.hunger = Math.min(100, 80 + hungerIncreaseAfter80);

      const decayBefore80 = Math.floor(secondsTo80 / 180);
      const decayAfter80 = Math.floor(secondsAfter80 / 90);
      happinessDecrease = decayBefore80 + decayAfter80;
    }
  }

  penguin.happiness = Math.max(0, Math.min(100, penguin.happiness - happinessDecrease));

  // Recalculate mood deterministically
  penguin.mood = derivePenguinMood(penguin.hunger, penguin.happiness);

  // Advance timestamp
  penguin.lastNeedsUpdateAt = currentTime;
}
```

### 4.3 Deterministic Mood Priority Rules
To prevent ambiguity and oscillation, penguin mood is derived in strict priority order:

1. **`hungry`:** `hunger >= 80` (Crying for food takes absolute priority over other moods).
2. **`sad`:** `happiness <= 25` (Unhappy/neglected state).
3. **`sleepy`:** Set **only** when explicitly entered via the autonomous FSM `SLEEP` state; not derived from vitals alone.
4. **`happy`:** `happiness >= 80` (Joyful state; high celebration frequency).
5. **`content`:** Default baseline (when hunger < 80, happiness between 26 and 79, and not sleeping).

```typescript
export function derivePenguinMood(
  hunger: number,
  happiness: number,
  isSleeping: boolean = false
): PenguinMood {
  if (hunger >= 80) return 'hungry';
  if (happiness <= 25) return 'sad';
  if (isSleeping) return 'sleepy';
  if (happiness >= 80) return 'happy';
  return 'content';
}
```

### 4.4 Cumulative Penguin EXP & Level Thresholds (Lv. 1–10)
```typescript
export const PENGUIN_EXP_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  450,   // Level 4
  700,   // Level 5
  1000,  // Level 6
  1350,  // Level 7
  1750,  // Level 8
  2200,  // Level 9
  2700,  // Level 10 (Max)
];

export function getPenguinLevelFromExp(cumulativeExp: number): {
  level: number;
  currentLevelBaseExp: number;
  nextLevelExp: number;
  progressPercent: number;
} {
  let level = 1;
  for (let i = PENGUIN_EXP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (cumulativeExp >= PENGUIN_EXP_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  level = Math.min(10, Math.max(1, level));
  const currentLevelBaseExp = PENGUIN_EXP_THRESHOLDS[level - 1];
  const nextLevelExp = level < 10 ? PENGUIN_EXP_THRESHOLDS[level] : currentLevelBaseExp;
  const range = nextLevelExp - currentLevelBaseExp;
  const progressPercent = range > 0
    ? Math.min(100, Math.max(0, Math.floor(((cumulativeExp - currentLevelBaseExp) / range) * 100)))
    : 100;

  return { level, currentLevelBaseExp, nextLevelExp, progressPercent };
}
```

---

## 5. Food Catalog & Favorite Food Matching

### 5.1 Preservation of Phase 1 Favorite Foods
Phase 1 species definitions in `packages/game-data/src/species.ts` are strictly preserved:

| Species ID | Species Name | Favorite Food ID | Favorite Food Name | Disliked Food |
|:---|:---|:---|:---|:---|
| `snowy` | Snowy | `sardine` | Small Sardine | Spicy Pepper |
| `sleepy` | Sleepy | `warm_milk` | Warm Milk | Alarm Clocks |
| `shy` | Shy | `sweet_berries` | Sweet Berries | Loud Megaphones |
| `happy` | Happy | `ice_cream` | Ice Cream | Bitter Herbs |
| `hungry` | Hungry | `fat_salmon` | Fat Salmon | Empty Plates |

### 5.2 Shared Extensible Food Catalog (`packages/game-data/src/items.ts`)
Food is modeled strictly as **inventory items** (`category: 'food'`). The catalog contains:

```typescript
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

export const FOOD_CATALOG: Record<string, FoodItemDefinition> = {
  sardine: {
    id: 'sardine',
    name: 'Cá Mòi Nhỏ (Small Sardine)',
    description: 'Cá mòi tươi rói bơi trong làn nước lạnh. Món ăn khoái khẩu của Snowy.',
    hungerReduction: 25,
    happinessBonus: 10,
    playerLevelRequired: 1,
    coinPrice: 15,
    icon: '🐟',
  },
  krill: {
    id: 'krill',
    name: 'Tép Biển Giòn (Krill)',
    description: 'Tép biển tươi giòn, giàu dinh dưỡng cho chim cánh cụt con.',
    hungerReduction: 30,
    happinessBonus: 12,
    playerLevelRequired: 2,
    coinPrice: 25,
    icon: '🦐',
  },
  warm_milk: {
    id: 'warm_milk',
    name: 'Sữa Nóng Ấm Áp (Warm Milk)',
    description: 'Ly sữa béo ngậy giúp chìm vào giấc ngủ êm đềm. Món yêu thích của Sleepy.',
    hungerReduction: 30,
    happinessBonus: 18,
    playerLevelRequired: 3,
    coinPrice: 35,
    icon: '🥛',
  },
  sweet_berries: {
    id: 'sweet_berries',
    name: 'Quả Mọng Tuyết (Sweet Berries)',
    description: 'Những quả mọng đỏ hái từ bụi tuyết. Món yêu thích của Shy.',
    hungerReduction: 35,
    happinessBonus: 22,
    playerLevelRequired: 3,
    coinPrice: 40,
    icon: '🍓',
  },
  squid: {
    id: 'squid',
    name: 'Mực Ống Tươi (Squid)',
    description: 'Mực ống giòn ngọt được câu từ hố băng sâu.',
    hungerReduction: 45,
    happinessBonus: 20,
    playerLevelRequired: 4,
    coinPrice: 55,
    icon: '🦑',
  },
  fat_salmon: {
    id: 'fat_salmon',
    name: 'Cá Hồi Béo Mầm (Fat Salmon)',
    description: 'Miếng cá hồi căng bóng béo ngậy. Món khoái khẩu số một của Hungry.',
    hungerReduction: 55,
    happinessBonus: 30,
    playerLevelRequired: 5,
    coinPrice: 80,
    icon: '🍣',
  },
  ice_cream: {
    id: 'ice_cream',
    name: 'Kem Tuyết Ngọt Lịm (Ice Cream)',
    description: 'Que kem tuyết mát lạnh đem lại niềm vui bất tận. Món yêu thích của Happy.',
    hungerReduction: 20,
    happinessBonus: 45,
    playerLevelRequired: 6,
    coinPrice: 90,
    icon: '🍦',
  },
};
```

### 5.3 Favorite Food Bonus Calculation & Hungry Species Modifier
Favorite food matching is data-driven by comparing the chosen `foodId` with `species.favoriteFoodId`:

```typescript
export function isFavoriteFood(speciesId: string, foodId: string): boolean {
  const species = SPECIES_MAP.get(speciesId);
  return species?.favoriteFoodId === foodId;
}
```

- **Standard Food Effects:**
  - Hunger: `-food.hungerReduction`
  - Happiness: `+food.happinessBonus`
  - Penguin EXP: `+5`
  - Player EXP: `+5`
  - Coin Drop: `2–5 Coins`
- **Favorite Food Effects (Match!):**
  - Hunger: `-(food.hungerReduction * 1.5)`
  - Happiness: `+(food.happinessBonus * 2.0)`
  - Player EXP: `+12` (Fixed for all species; does not stack modifier)
  - Penguin EXP:
    - Normal Species: `+15` Penguin EXP
    - Hungry Species eating `fat_salmon`: `Math.floor(15 * 1.25) = 18` Penguin EXP (+25% Hungry species bonus applied strictly to Penguin EXP)
  - Coin Drop: `10–20 Coins` (scaled by Cozy Multiplier and Penguin Level)
  - Character animates celebration jump with heart burst.

---

## 6. Economy, Currencies & Care Anti-Exploit Rules

### 6.1 Unified Economy Model
- **Coins (*Tiền Vàng*):** Soft currency (`currencies.coins`). Primary currency for purchasing food, eggs, and decorations.
- **Gems (*Kim Cương*):** Premium milestone currency (`currencies.gems`). Earned via Level Up, Collection discovery, and 7-day login streaks.
- **Food, Eggs, Decorations:** Concrete **inventory items** (`inventory: InventoryItem[]`).
- **Phase 1 Currency Conversion:** The ambiguous `currencies.fish` is formally retired. During save migration:
  `inventory['sardine'].quantity += currencies.fish; currencies.fish = 0;`

### 6.2 Authoritative Care Action Pipeline
All care actions and rewards are strictly executed and validated inside Pinia store actions (`gameStore.petPenguin` and `gameStore.feedPenguin`), guaranteeing atomic mutation and eliminating UI duplication:

```
[UI Button Click] ──> [gameStore Action]
                             │
            ┌────────────────┴────────────────┐
     [Validate Cooldown / Inventory]          │ (Failed: Insufficient food / on cooldown)
            │                                 ▼
            │ (Pass)              [Return { success: false }]
            ▼
 1. Deduct Inventory (if feed)
 2. Update lastPetAt / lastFedAt
 3. Mutate hunger / happiness / EXP
 4. Grant Coins (Feeding only; Petting grants 0 Coins)
 5. Add EXP to player & penguin state
 6. Emit GameBridge Events (particles, sound)
 7. Trigger debounced save
```

### 6.3 Explicit Care Rewards
- **Petting (*Vuốt Ve*):**
  - Cooldown: 15 seconds per individual penguin (persisted via `OwnedPenguin.lastPetAt`).
  - Rewards: `+8 Happiness`, `+3 Penguin EXP`, `+2 Player EXP`.
  - **Coins:** Strictly **0 Coins**.
  - Duplicate calls within 15s return `{ success: false, reason: 'COOLDOWN' }` with 0 rewards.
- **Feeding (*Cho Ăn*):**
  - Requires inventory stock (`invStore.getItemCount(foodId) >= 1`).
  - Standard Food: `2–5 Coins` drop, `-food.hungerReduction`, `+food.happinessBonus`, `+5 Penguin EXP`, `+5 Player EXP`.
  - Favorite Food: `10–20 Coins` drop (scaled by Cozy Multiplier and Penguin Level), `-(food.hungerReduction * 1.5)`, `+(food.happinessBonus * 2.0)`, `+12 Player EXP`, `+15 Penguin EXP` (or `+18 Penguin EXP` for Hungry species eating Fat Salmon).

---

## 7. Decoration Placement System (6 Predefined Anchor Plots)

### 7.1 The 6 Island Anchor Plots
To preserve visual harmony, prevent z-ordering artifacts with walking penguins, and keep pathfinding boundaries clear, decorations are strictly placed on **6 predefined anchor plots**:

```typescript
export interface DecorationPlot {
  id: number;
  x: number;
  y: number;
  name: string;
  depthOffset: number;
}

export const DECORATION_PLOTS: DecorationPlot[] = [
  { id: 1, x: -180, y: -90, name: 'Sườn Tuyết Tây Bắc', depthOffset: -90 },
  { id: 2, x: -210, y: 10,  name: 'Bờ Hồ Tây',         depthOffset: 10 },
  { id: 3, x: 120,  y: -80, name: 'Gần Tổ Ấp Đông Bắc', depthOffset: -80 },
  { id: 4, x: -60,  y: 95,  name: 'Bờ Hồ Nam',          depthOffset: 95 },
  { id: 5, x: 180,  y: 35,  name: 'Rừng Thông Đông Nam', depthOffset: 35 },
  { id: 6, x: 70,   y: 105, name: 'Bãi Tuyết Nam',      depthOffset: 105 },
];
```

### 7.2 Plot Rules & Placement EXP Anti-Exploit
- Each plot can hold **at most one** decoration (`plotId: 1..6`).
- **Placement Flow:** In `DecorationModal.vue`, player clicks an empty plot -> selects decoration from inventory -> item moves from inventory to `island.decorations`.
- **Remove / Replace Flow:** Player clicks an occupied plot -> chooses "Thu Hồi" (returns to inventory) or "Thay Thế" (swaps with another item in inventory).
- **Placement EXP Anti-Exploit:**
  - Placing a decoration awards `+15 Player EXP`, but **at most once per decoration type for the lifetime of the save**.
  - `IslandState` tracks `unlockedPlacementExpIds: string[]`.
  - When placing a decoration of type `decorationId`:
    - If `!island.unlockedPlacementExpIds.includes(decorationId)`: award `+15 Player EXP` and append `decorationId` to `island.unlockedPlacementExpIds`.
    - If already present in `unlockedPlacementExpIds`: award **0 EXP**.
  - Removing and re-placing or swapping decorations never awards EXP again.

### 7.3 Dynamically Derived Cozy Rating (*Độ Ấm Cúng*)
Cozy Rating is **never** persisted as a raw number. It is computed dynamically from currently placed decorations:

```typescript
export function calculateCozyRating(decorations: PlacedDecoration[]): number {
  return decorations.reduce((sum, d) => {
    const item = DECORATION_CATALOG[d.decorationId];
    return sum + (item?.cozyPoints ?? 0);
  }, 0);
}

export function getCoinDropMultiplier(cozyRating: number): number {
  // +1% per 10 Cozy Points, capped at +25%
  const bonusPercent = Math.min(25, Math.floor(cozyRating / 10));
  return 1 + bonusPercent / 100;
}
```

### 7.4 Decoration Catalog (`packages/game-data/src/decorations.ts`)
```typescript
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

export const DECORATION_CATALOG: Record<string, DecorationDefinition> = {
  bench_wood: {
    id: 'bench_wood',
    name: 'Ghế Gỗ Mùa Đông',
    description: 'Chiếc ghế gỗ phủ tuyết ấm cúng để ngắm hồ băng.',
    cozyPoints: 10,
    playerLevelRequired: 3,
    priceCoins: 150,
    visualKey: 'dec_bench_wood',
  },
  pine_crystal: {
    id: 'pine_crystal',
    name: 'Thông Pha Lê Tuyết',
    description: 'Cây thông phủ băng lấp lánh phản chiếu ánh mặt trời.',
    cozyPoints: 15,
    playerLevelRequired: 5,
    priceCoins: 300,
    visualKey: 'dec_pine_crystal',
  },
  lamp_street: {
    id: 'lamp_street',
    name: 'Đèn Đường Cổ Điển',
    description: 'Cột đèn ấm áp tỏa ánh vàng dịu dàng giữa trời tuyết.',
    cozyPoints: 20,
    playerLevelRequired: 6,
    priceCoins: 450,
    visualKey: 'dec_lamp_street',
  },
  castle_snow: {
    id: 'castle_snow',
    name: 'Lâu Đài Tuyết Mini',
    description: 'Tòa lâu đài băng thu nhỏ do chính các chú cánh cụt đắp nên.',
    cozyPoints: 35,
    playerLevelRequired: 8,
    priceCoins: 750,
    visualKey: 'dec_castle_snow',
  },
  lantern_igloo: {
    id: 'lantern_igloo',
    name: 'Đèn Băng Lều Tuyết',
    description: 'Đèn lồng chạm khắc từ khối băng tinh khiết.',
    cozyPoints: 25,
    playerLevelRequired: 9,
    priceCoins: 600,
    priceGems: 10,
    visualKey: 'dec_lantern_igloo',
  },
  master_caretaker_trophy: {
    id: 'master_caretaker_trophy',
    name: 'Cúp Người Nuôi Đại Tài',
    description: 'Chiếc cúp vàng vinh danh người chăm sóc đảo tuyết xuất sắc nhất.',
    cozyPoints: 50,
    playerLevelRequired: 10,
    priceCoins: 1500,
    priceGems: 20,
    visualKey: 'dec_trophy_master',
  },
};
```

---

## 8. Deterministic Daily Login & Quest System

### 8.1 Local Calendar Date Helper
To prevent UTC date desynchronization, all calendar date logic uses a standard local date string:

```typescript
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

### 8.2 7-Day Login Streak Model & Evaluation Rules
```typescript
export interface DailyLoginState {
  lastClaimDate: string | null; // e.g. '2026-09-28' via getLocalDateString()
  currentStreak: number;        // 1 to 7
}
```

1. `today = getLocalDateString(new Date())`
2. `yesterday = getLocalDateString(new Date(Date.now() - 86400000))`
3. **Same Day Check:** If `lastClaimDate === today`, the reward for today has already been claimed. Claim button is disabled.
4. **Consecutive Day Check:** If `lastClaimDate === yesterday`:
   - If `currentStreak >= 7`, the streak loops back to **Day 1**.
   - Otherwise, `currentStreak = currentStreak + 1`.
   - Grant reward for `currentStreak`.
   - Set `lastClaimDate = today`.
5. **Missed Day Check:** If `lastClaimDate < yesterday` or `lastClaimDate === null`:
   - Streak resets to **Day 1**.
   - Grant reward for Day 1.
   - Set `lastClaimDate = today`, `currentStreak = 1`.

### 8.3 7-Day Calendar Rewards
- **Ngày 1:** 100 Coins + 5 Sardines
- **Ngày 2:** 150 Coins + 1 Basic Egg
- **Ngày 3:** 200 Coins + 3 Krill
- **Ngày 4:** 250 Coins + 2 Gems
- **Ngày 5:** 300 Coins + 1 Frozen Egg
- **Ngày 6:** 400 Coins + 5 Gems + 2 Squid
- **Ngày 7:** 1,000 Coins + 10 Gems + 1 Golden Egg

### 8.4 Deterministic Daily Quests (*Nhiệm Vụ Hàng Ngày*)
The game maintains a pool of 5 quest templates. Exactly 3 active quests are assigned per calendar date using a deterministic hash of the `YYYY-MM-DD` date string, ensuring page reloads never alter the selected quests:

```typescript
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

export const QUEST_POOL: QuestTemplate[] = [
  {
    id: 'quest_pet',
    title: 'Vuốt Ve Yêu Thương',
    description: 'Vuốt ve các chú chim cánh cụt 5 lần.',
    icon: '💖',
    targetType: 'pet',
    targetCount: 5,
    rewardCoins: 50,
    rewardExp: 25,
  },
  {
    id: 'quest_feed',
    title: 'Bữa Ăn Ngon Miệng',
    description: 'Cho chim cánh cụt ăn thức ăn ngon 3 lần.',
    icon: '🐟',
    targetType: 'feed',
    targetCount: 3,
    rewardCoins: 60,
    rewardExp: 30,
  },
  {
    id: 'quest_hatch',
    title: 'Ấp Nở Mầm Sống',
    description: 'Ấp nở thành công 1 chú chim cánh cụt mới.',
    icon: '🥚',
    targetType: 'hatch',
    targetCount: 1,
    rewardCoins: 100,
    rewardExp: 50,
    rewardGems: 1,
  },
  {
    id: 'quest_buy_shop',
    title: 'Khách Quen Cửa Hàng',
    description: 'Mua bất kỳ 1 vật phẩm nào từ Cửa Hàng Đảo.',
    icon: '🛍️',
    targetType: 'buy_shop',
    targetCount: 1,
    rewardCoins: 70,
    rewardExp: 35,
  },
  {
    id: 'quest_place_decoration',
    title: 'Làm Đẹp Đảo Tuyết',
    description: 'Đặt 1 vật trang trí lên bục đất trên đảo.',
    icon: '🪑',
    targetType: 'place_decoration',
    targetCount: 1,
    rewardCoins: 80,
    rewardExp: 40,
  },
];

export function getDeterministicDailyQuests(dateStr: string): ActiveQuest[] {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  const indices = [0, 1, 2, 3, 4];
  const selected: QuestTemplate[] = [];
  let currentSeed = positiveHash;

  for (let i = 0; i < 3; i++) {
    const pickIndex = currentSeed % indices.length;
    const templateIndex = indices.splice(pickIndex, 1)[0];
    selected.push(QUEST_POOL[templateIndex]);
    currentSeed = Math.floor(currentSeed / 7) + 11;
  }

  return selected.map((tpl) => ({
    questId: tpl.id,
    currentCount: 0,
    targetCount: tpl.targetCount,
    isCompleted: false,
    isClaimed: false,
  }));
}
```

*Note on Hatch Quest:* `quest_hatch` increments **strictly upon successful egg hatch** in `gameStore.hatchEgg()` when an `OwnedPenguin` is created. Placing an egg into the incubator does not complete this quest. If hatching is blocked by flock capacity, progress does not increment.

---

## 9. Multi-Slot Incubation, Egg Catalog & Balanced Timers

### 9.1 Data-Driven Egg Catalog (`packages/game-data/src/eggs.ts`)
Eggs are modeled as inventory items with category `'eggs'`. The Shop sells all three types:

```typescript
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

export const EGG_CATALOG: Record<string, EggShopDefinition> = {
  basic_egg: {
    id: 'basic_egg',
    name: 'Trứng Cơ Bản (Basic Egg)',
    description: 'Quả trứng đốm ấm áp nở ra các loài chim cánh cụt phổ biến.',
    incubationSeconds: 180, // 3 minutes
    playerLevelRequired: 1,
    priceCoins: 150,
    icon: '🥚',
  },
  frozen_egg: {
    id: 'frozen_egg',
    name: 'Trứng Băng Giá (Frozen Egg)',
    description: 'Quả trứng đóng băng lấp lánh kết tinh từ bão tuyết phương Bắc.',
    incubationSeconds: 900, // 15 minutes
    playerLevelRequired: 4,
    priceCoins: 450,
    icon: '🧊',
  },
  golden_egg: {
    id: 'golden_egg',
    name: 'Trứng Hoàng Kim (Golden Egg)',
    description: 'Quả trứng vàng quý giá tỏa hào quang rực rỡ.',
    incubationSeconds: 3600, // 60 minutes
    playerLevelRequired: 7,
    priceCoins: 1200,
    priceGems: 10,
    icon: '✨',
  },
};
```

### 9.2 Incubator Speed-Up ("Nurture" Mechanic)
Players can nurture eggs while the game is active:
- **Cooldown:** Exactly 30 seconds per active slot (`now - slot.lastNurtureAt >= 30000`).
- **Maximum Uses:** At most **10 speed-ups per egg lifetime** (`slot.nurtureCount < 10`).
- **Time Deduction:** Deducts 30 seconds from `targetHatchTime`.
- **Minimum Duration Floor:** Cannot reduce remaining incubation time below 1 second:
  `slot.targetHatchTime = Math.max(now + 1000, slot.targetHatchTime - 30000)`.
- **Scope:** Available only while the game is open (not applicable offline).

### 9.3 Slot Unlocks & In-World Visual Sync
- **Slot 1:** Unlocked by default. In-world nest in `SnowIslandScene` stays dynamically synchronized with Slot 1 state (Empty vs. Egg sprite vs. Wobble).
- **Slot 2:** Locked initially; unlocks at Player Level 3 for 500 Coins. Managed inside `HatcheryModal.vue`.

---

## 10. Data Models & Schemas

### 10.1 Extended `@penguin/types`

```typescript
// --- Player Profile ---
export interface PlayerProfile {
  level: number;
  exp: number;
  name: string;
  avatar: string;
}

// --- Extended OwnedPenguin ---
export interface OwnedPenguin {
  id: string;
  speciesId: string;
  nickname: string;
  level: number;
  exp: number;
  happiness: number;          // 0 - 100
  hunger: number;             // 0 - 100 (0 = full, 100 = starving)
  mood: PenguinMood;
  lastPetAt: number;          // Unix timestamp (ms)
  lastFedAt: number;          // Unix timestamp (ms)
  lastNeedsUpdateAt: number;  // Unix timestamp (ms) for offline simulation
  generation: number;
  createdAt: number;
  isFavorite?: boolean;
}

// --- Extended IncubatorSlot ---
export interface IncubatorSlot {
  slotId: number;             // 1 or 2
  state: IncubatorSlotState;
  eggTypeId?: string;
  targetHatchTime?: number;
  unlocked: boolean;
  unlockCost?: number;
  lastNurtureAt?: number;
  nurtureCount?: number;
}

// --- Island Decorations ---
export interface PlacedDecoration {
  instanceId: string;
  decorationId: string;       // references DECORATION_CATALOG
  plotId: number;             // 1 to 6
  placedAt: number;
}

export interface IslandState {
  decorations: PlacedDecoration[];
  unlockedPlacementExpIds: string[]; // decoration IDs that have already awarded placement EXP
}

// --- Daily Login & Quests ---
export interface DailyLoginState {
  lastClaimDate: string | null; // 'YYYY-MM-DD' via getLocalDateString()
  currentStreak: number;        // 1 to 7
}

export interface ActiveQuest {
  questId: string;
  currentCount: number;
  targetCount: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface QuestState {
  assignedDate: string;         // 'YYYY-MM-DD' via getLocalDateString()
  quests: ActiveQuest[];
}
```

### 10.2 Canonical `GameSaveDataV2` Schema
```typescript
export interface GameSaveDataV2 {
  schemaVersion: 2;
  player: PlayerProfile;
  currencies: {
    coins: number;
    gems: number;
    fish: 0; // Canonical V2 always sets fish to 0
  };
  inventory: InventoryItem[];
  ownedPenguins: OwnedPenguin[];
  collectionBook: CollectionEntry[];
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
```

---

## 11. Pure Save/Load Migration Strategy & Decoupled Simulation

### 11.1 Pure `migrateSaveData()` Function
In `apps/web/src/services/StorageService.ts`, `migrateSaveData()` is a **pure normalization function**. It does not perform simulation and does not depend on `Date.now()` for gameplay decay:

```typescript
export function migrateSaveData(data: Record<string, unknown>): GameSaveDataV2 {
  const version = Number(data.schemaVersion ?? 1);

  // Idempotency: canonical V2 data returned as-is
  if (version >= 2) {
    return data as unknown as GameSaveDataV2;
  }

  // --- Pure Migration: V1 -> V2 ---
  const rawCurrencies = (data.currencies as Record<string, unknown>) ?? {};
  const rawInventory = (data.inventory as InventoryItem[]) ?? [];
  const legacyFishCount = Number(rawCurrencies.fish ?? 0);

  // 1. Convert legacy fish currency into 'sardine' inventory items (once only)
  const inventory: InventoryItem[] = [...rawInventory];
  const sardineIndex = inventory.findIndex((item) => item.itemId === 'sardine');
  if (legacyFishCount > 0) {
    if (sardineIndex >= 0) {
      inventory[sardineIndex] = {
        ...inventory[sardineIndex],
        quantity: inventory[sardineIndex].quantity + legacyFishCount,
      };
    } else {
      inventory.push({
        itemId: 'sardine',
        category: 'food',
        name: 'Small Sardine',
        description: 'Cá mòi tươi ngon dùng để cho chim cánh cụt ăn.',
        quantity: legacyFishCount,
        stackable: true,
      });
    }
  }

  // 2. Canonical V2 currencies with fish = 0
  const currencies: GameSaveDataV2['currencies'] = {
    coins: Number(rawCurrencies.coins ?? 100),
    gems: Number(rawCurrencies.gems ?? 0),
    fish: 0,
  };

  // 3. Upgrade owned penguins with level, exp, and needs timestamps
  const rawPenguins = (data.ownedPenguins as Record<string, unknown>[]) ?? [];
  const rawTimestamps = (data.timestamps as Record<string, unknown>) ?? {};
  const baseTimestamp = Number(rawTimestamps.lastSavedAt ?? rawTimestamps.createdAt ?? 0);

  const ownedPenguins: OwnedPenguin[] = rawPenguins.map((p) => ({
    id: String(p.id),
    speciesId: String(p.speciesId),
    nickname: String(p.nickname ?? 'Cánh Cụt'),
    level: Number(p.level ?? 1),
    exp: Number(p.exp ?? 0),
    happiness: Number(p.happiness ?? 80),
    hunger: Number(p.hunger ?? 20),
    mood: (p.mood as PenguinMood) ?? 'happy',
    lastPetAt: Number(p.lastPetAt ?? 0),
    lastFedAt: Number(p.lastFedAt ?? 0),
    lastNeedsUpdateAt: Number(p.lastNeedsUpdateAt ?? baseTimestamp),
    generation: Number(p.generation ?? 1),
    createdAt: Number(p.createdAt ?? baseTimestamp),
    isFavorite: Boolean(p.isFavorite ?? false),
  }));

  // 4. Upgrade incubator slots with nurture tracking and slot 2 lock
  const rawSlots = (data.incubatorSlots as Record<string, unknown>[]) ?? [];
  const incubatorSlots: IncubatorSlot[] = [
    {
      slotId: 1,
      state: (rawSlots[0]?.state as any) ?? 'EMPTY',
      eggTypeId: rawSlots[0]?.eggTypeId as string | undefined,
      targetHatchTime: rawSlots[0]?.targetHatchTime as number | undefined,
      unlocked: true,
      lastNurtureAt: 0,
      nurtureCount: 0,
    },
    {
      slotId: 2,
      state: (rawSlots[1]?.state as any) ?? 'EMPTY',
      eggTypeId: rawSlots[1]?.eggTypeId as string | undefined,
      targetHatchTime: rawSlots[1]?.targetHatchTime as number | undefined,
      unlocked: Boolean(rawSlots[1]?.unlocked ?? false),
      unlockCost: 500,
      lastNurtureAt: 0,
      nurtureCount: 0,
    },
  ];

  // 5. Clean IslandState: remove tier / unlockedProps; preserve placed decorations & placement EXP ids
  const rawIsland = (data.island as Record<string, unknown>) ?? {};
  const island: IslandState = {
    decorations: (rawIsland.decorations as PlacedDecoration[]) ?? [],
    unlockedPlacementExpIds: (rawIsland.unlockedPlacementExpIds as string[]) ?? [],
  };

  // 6. Default DailyLoginState and QuestState
  const dailyLogin: DailyLoginState = {
    lastClaimDate: null,
    currentStreak: 1,
  };

  const todayStr = getLocalDateString();
  const questState: QuestState = {
    assignedDate: todayStr,
    quests: getDeterministicDailyQuests(todayStr),
  };

  return {
    schemaVersion: 2,
    player: (data.player as PlayerProfile) ?? {
      level: 1,
      exp: 0,
      name: 'Người Nuôi Chim Cánh Cụt',
      avatar: 'snowy',
    },
    currencies,
    inventory,
    ownedPenguins,
    collectionBook: (data.collectionBook as CollectionEntry[]) ?? [],
    incubatorSlots,
    island,
    dailyLogin,
    questState,
    timestamps: {
      createdAt: Number(rawTimestamps.createdAt ?? baseTimestamp),
      lastSavedAt: Number(rawTimestamps.lastSavedAt ?? baseTimestamp),
      lastLoginAt: Number(rawTimestamps.lastLoginAt ?? baseTimestamp),
    },
  };
}
```

### 11.2 Boot-Time Simulation Lifecycle in `loadGame()`
When `gameStore.initGame()` or `StorageService.loadSaveData()` runs on game boot:
1. `const rawData = storage.getItem(STORAGE_KEY);`
2. `const dataV2 = migrateSaveData(rawData);` (Pure migration)
3. For each penguin in `dataV2.ownedPenguins`:
   `simulatePenguinNeeds(penguin, Date.now());` (Simulation using migrated `lastNeedsUpdateAt`)
4. Populate Pinia stores with simulated state.
5. Persist the updated state to storage.

---

## 12. GameBridge Event Bus Contracts

Phase 2 updates `GameBridgeEventMap` in `apps/web/src/game/bridge/GameBridge.ts`:

```typescript
export type GameBridgeEventMap = {
  // --- Phase 1 Events (Preserved) ---
  'penguin:clicked': { ownedId: string };
  'egg:clicked': { slotId: number };
  'canvas:ready': void;
  'penguin:spawn': { penguin: OwnedPenguin };
  'penguin:action': { ownedId: string; action: 'pet' | 'feed' };
  'camera:focus': { x: number; y: number };
  'world:sync': { penguins: OwnedPenguin[]; nestSlot?: IncubatorSlot | null };
  'nest:sync': { slot: IncubatorSlot | null };
  'ui:modal': { open: boolean };

  // --- Phase 2 Events ---
  'decorations:sync': { decorations: PlacedDecoration[] };
  'plot:clicked': { plotId: number };
  'effect:coin_drop': { x: number; y: number; amount: number };
  'effect:level_up': { ownedId?: string; x: number; y: number };
};
```

---

## 13. UI Architecture & New Components

### 13.1 ShelfRack Updates (`ShelfRack.vue`)
The bottom shelf rack adds two prominent, nostalgic wooden/ice buttons:
- **Cửa Hàng (*Shop*):** Opens `ShopModal.vue`.
- **Nhiệm Vụ (*Quests & Daily*):** Opens `QuestModal.vue`.

### 13.2 TopBar Updates (`TopBar.vue`)
- Displays Player Level badge (e.g. `Lv. 2`) with interactive tooltip showing progress (`180 / 300 EXP (60%)`).
- Currencies display shows **Coins** and **Gems**. Fish counter is replaced with quick link to Food Inventory.

### 13.3 Modals Architecture
1. **`ShopModal.vue`:**
   - Tabs: `Thức Ăn` (Foods with Level locks), `Trứng` (Basic, Frozen, Golden), `Trang Trí` (Decorations with Cozy ratings).
   - Purchase confirmation dialog with instant inventory update.
2. **`QuestModal.vue`:**
   - 7-Day Login Calendar with clear claimed/claimable/locked state.
   - 3 Daily Quests with progress bars and "Nhận Thưởng" buttons.
3. **`DecorationModal.vue`:**
   - Visual plot selector (Plots 1 to 6).
   - Shows current placed item, Cozy rating breakdown, and inventory placement drawer.
4. **`LevelUpModal.vue`:**
   - Presentation-only celebration modal triggered when player levels up, showing rewards already granted by the store.

---

## 14. Testing & Verification Strategy

The Phase 2 implementation must include comprehensive automated tests covering all required scenarios:

1. **`test('V1 -> V2 migration preserves existing currencies, inventory, and penguins without loss')`**
2. **`test('V1 -> V2 migration converts legacy currencies.fish into sardine inventory items and sets currencies.fish = 0')`**
3. **`test('V1 -> V2 migration is idempotent when run repeatedly (V1 -> V2 -> V2 preserves currencies.fish = 0 without re-converting)')`**
4. **`test('offline hunger decay increases hunger by 1 point per 120s (90s for hungry species) based on lastNeedsUpdateAt')`**
5. **`test('offline happiness decay uses piecewise simulation when crossing hunger=80 threshold (180s rate before 80, 90s rate after 80, clamped to 0)')`**
6. **`test('mood priority derives hungry when hunger >= 80, sad when happiness <= 25, happy when happiness >= 80')`**
7. **`test('petting enforces 15-second cooldown per penguin, grants 0 coins, and rejects duplicate calls with zero rewards')`**
8. **`test('feeding verifies inventory existence and consumes exact food item atomically')`**
9. **`test('favorite food bonus grants 1.5x hunger, 2.0x happiness, bonus EXP, extra coins, and 18 Penguin EXP for Hungry species')`**
10. **`test('penguin cumulative EXP thresholds correctly calculate level up from 1 to 10')`**
11. **`test('player cumulative EXP thresholds correctly calculate level up from 1 to 10 and grant rewards automatically')`**
12. **`test('Cozy Rating recalculates dynamically from placed decorations and caps coin bonus at +25%')`**
13. **`test('decoration plots enforce maximum 1 decoration per plot and support replace/remove')`**
14. **`test('decoration placement EXP (+15 EXP) is granted once per decoration type and cannot be farmed by remove/replace')`**
15. **`test('daily login rejects same-day second claim and grants reward once per calendar day using getLocalDateString()')`**
16. **`test('daily login resets streak to Day 1 when one or more calendar days are missed, loops after Day 7')`**
17. **`test('daily hatch quest increments only upon successful egg hatch creating an OwnedPenguin')`**
18. **`test('flock capacity gates hatching when at maximum capacity without consuming egg or granting rewards')`**
19. **`test('incubator speed-up respects 30s cooldown, max 10 speed-ups per egg, and 1s minimum floor')`**

---

## 15. Performance Target

- **Desktop:** Target smooth 60 FPS.
- **Mobile:** Target smooth 30–60 FPS on supported mobile devices.
- **Rendering Isolation:** Zero per-frame Vue/DOM updates for moving entities; Phaser manages canvas entities while Vue remains strictly event-driven.
- **Particle Budget:** Ambient snow capped at 50; transient coin/heart particles capped at 8 particles per burst with automatic 800ms lifecycle.

---

## 16. Acceptance Criteria & Phase 2 Playable Milestone

Phase 2 will be accepted as complete when:
1. **Flock Progression & Capacity:** Feeding and petting Snowy or new penguins properly updates hunger, happiness, and EXP. Reaching 100 EXP advances the penguin to Level 2. Flock capacity gates hatching when at maximum.
2. **Piecewise Offline Simulation:** Changing system time or mocking `lastNeedsUpdateAt` demonstrates accurate piecewise offline hunger and happiness decay on reload (crossing `hunger = 80` applies 180s rate before 80 and 90s rate after 80).
3. **Island Shop & Economy:** Player can earn Coins from caring, buy Krill, Eggs, or a Wooden Bench in the Shop, and observe correct balance deductions. Petting awards 0 Coins.
4. **Anchor Plot Decoration & EXP Anti-Exploit:** Player can place the Wooden Bench on Plot 1, receive 15 EXP once, verify its 2.5D visual appearance on the island canvas, and observe the dynamically derived Cozy Rating bonus. Removing and re-placing does not farm EXP.
5. **Daily Quests & Streak:** Player can claim Day 1 login reward and complete the deterministic daily quests. Hatch quest completes only on successful hatch.
6. **Incubation Speed-Up:** Player can nurture an incubating egg up to 10 times with 30s cooldown, reducing timer down to a minimum of 1s.
7. **Pure Flawless Migration:** Pure `migrateSaveData()` converts fish currency to sardines, sets fish to 0, and upgrades the save to V2 idempotently without console errors, followed by boot-time simulation.
8. **Automated Verification:** 100% passing Vitest suite (including all 19 required test cases) and clean `npm run build`.

# Technical Design Specification: Penguin Island — Phase 2 (Core Game Loop & Island Life)

- **Date:** 2026-09-28
- **Status:** Proposed for User Review
- **Target Milestone:** Deeply engaging, self-sustaining casual social-island loop: player & penguin leveling, comprehensive care mechanics (hunger/happiness decay & mood effects), reward economy (care rewards, shop sinks), daily login rewards, quest system, multi-slot incubation, and interactive island decoration placement.

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
                   │  - Feeding (Fish -> Fullness)│
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
│  - Multi-slot Incubator      │        │  - Place Cozy Island Props   │
│  - Hatch Rare Species        │        │  - Boost Island Cozy Multi   │
│  - Expand Island Capacity    │        │  - Visual In-World Placement │
└──────────────────────────────┘        └──────────────────────────────┘
```

### Key Principles for Phase 2:
1. **Original IP & Nostalgic Spirit:** 100% original artwork, mechanics, and Vietnamese localization (`Đảo Tuyết`, `Cửa Hàng`, `Nhiệm Vụ`, `Điểm Danh`). Nostalgic warmth inspired by 2010s casual social web games without copying copyrighted assets, names, or code.
2. **Smallest Coherent Scope:** Avoid scope creep. Strictly focus on local, single-player progression and care mechanics.
3. **Preserve Phase 1 Architecture:** Zero regressions in existing Phase 1 functionality. Phaser remains strictly responsible for rendering and entity physics/animation; Pinia and Services remain the authoritative state boundary; Vue handles all UI dialogs and shops.
4. **No Backend Dependency Yet:** All Phase 2 features run client-side with versioned `localStorage` persistence and automatic schema migrations.

---

## 2. Goals and Non-Goals

### 2.1 Goals
- **Player Progression (Lv. 1–10):** Player gains EXP from caring, hatching, and quest completion, unlocking shop items, island capacity, and slot 2 incubator.
- **Penguin Progression (Lv. 1–10) & Needs Loop:** Hunger and happiness naturally decay over time; penguins change moods (`happy`, `content`, `hungry`, `sleepy`, `sad`) with corresponding speech bubble quips and animation changes.
- **Feeding & Petting Rewards:** Feeding favorite foods yields bonus Penguin EXP and Coins; petting yields affection hearts and Player EXP with a gentle cooldown.
- **Flock Expansion & Management:** Island supports up to 5 concurrent penguins (based on Player Level); inspect modal lets players switch focus, view detailed stats, and favorite their top companions.
- **Shop System (*Cửa Hàng*):** A nostalgic wooden/snow-dusted boutique selling Food, Eggs, and Decorations for Coins and Gems.
- **Island Decoration Placement:** Players can place purchased decorations on designated island anchor pads or free placement points, rendering 2.5D visual props with depth sorting and providing passive Cozy Bonus multiplier.
- **Daily Rewards (*Điểm Danh*) & Quests (*Nhiệm Vụ*):** 7-day progressive login calendar and rotating daily quests to guide player sessions.
- **Schema Migration (`schemaVersion: 1 -> 2`):** Seamless, backwards-compatible upgrade of existing saves.

### 2.2 Non-Goals (Strictly Deferred to Later Phases)
- **Multiplayer & Peer-to-Peer Island Visits:** Island neighbor visits remain simulated NPC neighbors (deferred to Phase 3/4).
- **Backend API & Cloud Database:** No NestJS / PostgreSQL / Redis setup in Phase 2.
- **Breeding Genetics & DNA Mixing:** Cross-breeding penguins is out of scope for Phase 2.
- **Competitive Leaderboards / PvP Minigames:** Out of scope for Phase 2.
- **External Audio Asset Loading:** Continue utilizing procedural Web Audio API synthesis for all sound effects and chimes.

---

## 3. Player Progression Model

### 3.1 Level Curve & Thresholds
Player Level represents the player's experience as an Island Caretaker. Level scales from 1 to 10 in Phase 2:

| Level | EXP Required (Current -> Next) | Cumulative EXP | Key Unlocks & Rewards |
|:---:|:---:|:---:|:---|
| **1** | 100 | 0 | Starter Island (Max 2 penguins), Slot 1 Incubator, Basic Food in Shop |
| **2** | 200 | 100 | Island Capacity +1 (Max 3 penguins), Krill unlocked in Shop, +100 Coins |
| **3** | 350 | 300 | Slot 2 Incubator unlocked for purchase (500 Coins), Wooden Bench decoration, +150 Coins |
| **4** | 550 | 650 | Frozen Egg unlocked in Shop, Squid food unlocked, +200 Coins, +2 Gems |
| **5** | 800 | 1,200 | Island Capacity +1 (Max 4 penguins), Crystal Pine decoration, +300 Coins, +3 Gems |
| **6** | 1,100 | 2,000 | Ice Cream treat unlocked, Street Lamp decoration, +400 Coins, +5 Gems |
| **7** | 1,500 | 3,100 | Golden Egg unlocked in Shop, +500 Coins, +5 Gems |
| **8** | 2,000 | 4,600 | Island Capacity +1 (Max 5 penguins), Mini Snow Castle decoration, +600 Coins, +8 Gems |
| **9** | 2,600 | 6,600 | Cozy Igloo Lantern decoration, +800 Coins, +10 Gems |
| **10** | Max | 9,200 | Master Caretaker Trophy decoration, +1,500 Coins, +20 Gems |

### 3.2 EXP Sources
- **Petting Penguin:** +2 Player EXP (Cooldown: 15s per penguin)
- **Feeding Penguin (Standard Food):** +5 Player EXP
- **Feeding Penguin (Favorite Food):** +12 Player EXP
- **Hatching Basic Egg:** +25 Player EXP
- **Hatching Frozen Egg:** +50 Player EXP
- **Hatching Golden Egg:** +120 Player EXP
- **Completing Daily Quest:** +25 to +60 Player EXP
- **Placing New Decoration:** +15 Player EXP

---

## 4. Penguin Progression & Care Model

### 4.1 Penguin Vitals & Real-Time Decay
Each `OwnedPenguin` maintains two core vitals (0 to 100):
1. **Hunger (*Đói Bụng*):** 0 = Full/Stuffed, 100 = Starving.
   - Decays toward starving at rate of **1 point every 2 minutes** (approx 3.3 hours to reach 100 from 0).
   - If `hunger >= 70`, mood automatically degrades to `'hungry'`.
2. **Happiness (*Vui Vẻ*):** 0 = Miserable, 100 = Ecstatic.
   - Naturally decays toward 50 at rate of **1 point every 3 minutes**.
   - If `hunger > 80`, happiness decays twice as fast.
   - If `happiness >= 80`, mood becomes `'happy'`. If `happiness <= 25`, mood becomes `'sad'`.

### 4.2 Care Actions & Cooldowns
- **Petting (*Vuốt Ve*):**
  - Cooldown: 15 seconds per individual penguin (persisted in session memory).
  - Effects: `+8 Happiness`, `+3 Penguin EXP`, `+2 Player EXP`.
  - Spawns floating heart particles (`particle_heart`) over the penguin.
  - Generates small affection Coin drop (`1-3 Coins`) when `happiness > 60`.
- **Feeding (*Cho Ăn*):**
  - Requires selecting a food item from player inventory (Sardine, Krill, Squid, Ice Cream).
  - Standard Food: `-25 Hunger`, `+10 Happiness`, `+5 Penguin EXP`, `+5 Player EXP`.
  - Favorite Food Match (e.g. Snowy + Sardine, Hungry + Krill):
    - `-40 Hunger`, `+25 Happiness`, `+15 Penguin EXP`, `+12 Player EXP`.
    - Produces a celebration hop and Coin drop (`8-15 Coins`).
  - Disliked Food: `-15 Hunger`, `+2 Happiness`, `+2 Penguin EXP`, speech bubble shows funny protest.

### 4.3 Penguin Experience & Leveling (Lv. 1–10)
Penguins grow in maturity and affection as they spend time with the player:
- **Penguin Level:** 1 to 10.
- **EXP Required:** `100 * level`.
- **Level Up Benefits:**
  - Unlocks special celebratory quips and visual sparkles (`particle_sparkle`).
  - Coin drop yield from care actions permanently increases by `+10% per level`.
  - Increases minimum happiness floor (Level 5+ penguins never drop below 20 happiness).

### 4.4 Species Personalities & Autonomous Behavior Modulation
Phase 1 established 5 species personalities. Phase 2 binds these directly to autonomous FSM probabilities:
- **Snowy (`brave` / `playful`):** 2x probability to transition from `IDLE` to `BELLY_SLIDE` on the ice pond; loves doing celebration hops.
- **Sleepy (`sleepy`):** 3x probability to transition to `SLEEP`; sleep duration is 50% longer (snoozes comfortably with animated "Zzz").
- **Shy (`shy`):** Prefers wandering near outer snow banks; reacts with a bashful blush when clicked; stays closer to pine trees.
- **Happy (`happy`):** Maintains high happiness for 50% longer; frequently hums cute musical notes in speech bubbles.
- **Hungry (`hungry`):** Hunger accumulates 25% faster; displays adorable food cravings in speech bubbles; grants 25% extra EXP when fed favorite foods.

---

## 5. Economy & Reward Rules

### 5.1 Currency Taxonomy
- **Fish (*Cá Mòi - Sardine & Marine life*):** Primary consumable resource used for basic feeding and nurturing. Earned from daily rewards, quest completions, and occasional penguin foraging.
- **Coins (*Tiền Vàng*):** Primary soft currency. Earned through active care (petting/feeding drops), quest rewards, and daily login. Spent in the Shop for food, basic eggs, and decorations.
- **Gems (*Kim Cương*):** Premium/milestone currency. Earned through leveling up, unlocking new collection species, and 7-day login streaks. Spent on rare eggs (Golden Egg) and premium festive decorations.

### 5.2 Currency Sinks & Sources Table

| Currency | Primary Sources | Primary Sinks |
|:---|:---|:---|
| **Fish** | Daily Login (+5 to +15), Quest completions (+3 to +8), Free starter pack | Feeding penguins to keep hunger low |
| **Coins** | Penguin care drops (1–15 coins), Daily quests (30–100 coins), Login calendar (50–300 coins) | Buying food in Shop (10–60c), Buying Basic Egg (150c), Buying Decorations (80–500c), Unlocking Slot 2 (500c) |
| **Gems** | Player Level Up (+2 to +20), New Species Discovered (+5 gems), 7-Day streak (+5 gems) | Buying Golden Eggs (10 gems), Exclusive Crystal Decorations (15–25 gems) |

---

## 6. Mission & Daily Reward System

### 6.1 7-Day Daily Login Calendar (*Điểm Danh 7 Ngày*)
Players are rewarded each consecutive day they launch the game (evaluated against local midnight timestamp):

- **Ngày 1:** 100 Coins + 5 Sardines
- **Ngày 2:** 150 Coins + 1 Basic Egg
- **Ngày 3:** 200 Coins + 3 Krill
- **Ngày 4:** 250 Coins + 2 Gems
- **Ngày 5:** 300 Coins + 1 Frozen Egg
- **Ngày 6:** 400 Coins + 5 Gems + 2 Squid
- **Ngày 7:** 1,000 Coins + 10 Gems + 1 Golden Egg

*Note:* If a day is missed, streak resets to Day 1, or can be continued if within 48h.

### 6.2 Daily Quests (*Nhiệm Vụ Hàng Ngày*)
Each day, 3 random quests are chosen from a curated data-driven quest pool:

```typescript
export interface QuestDefinition {
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
```

#### Example Phase 2 Quests:
1. **"Chăm Sóc Yêu Thương" (Loving Care):** Pet your penguins 5 times. (Reward: 50 Coins, 25 EXP)
2. **"Bữa Tiệc Hải Sản" (Seafood Feast):** Feed penguins 3 times. (Reward: 60 Coins, 30 EXP)
3. **"Nở Mầm Sống Mới" (New Life Hatches):** Successfully hatch 1 egg. (Reward: 120 Coins, 50 EXP, 1 Gem)
4. **"Nhà Thiết Kế Đảo" (Island Decorator):** Place 1 decoration on the island. (Reward: 80 Coins, 40 EXP)
5. **"Khách Quen Cửa Hàng" (Shop Regular):** Purchase any 2 items from the Shop. (Reward: 70 Coins, 35 EXP)

---

## 7. Egg & Incubation Progression

### 7.1 Meaningful Incubation Timers
In Phase 1, incubation timers were short mock durations (10–30 seconds) for functional verification. In Phase 2, timers are balanced for casual idle pacing:
- **Basic Egg (*Trứng Cơ Bản*):** 3 minutes (180s).
- **Frozen Egg (*Trứng Băng Giá*):** 15 minutes (900s).
- **Golden Egg (*Trứng Hoàng Kim*):** 60 minutes (3,600s).

*Speed-Up Mechanic:* Players can gently tap the incubator nest or use a "Nurture" action (once every 30s) to deduct 30 seconds from the timer, rewarding active play without trivializing the idle wait.

### 7.2 Multi-Slot Incubator Management
- **Slot 1:** Unlocked by default.
- **Slot 2:** Unlocked at Player Level 3 with a 500 Coin fee.
- The in-world nest visual remains synchronized with **Slot 1**, while the Hatchery Modal displays both Slot 1 and Slot 2 with full countdown meters, status badges, and speed-up controls.

---

## 8. Island Decoration System

### 8.1 Concept & Cozy Rating (*Độ Ấm Cúng*)
Decorating the island brings personality and life to the snowy landscape. Every placed decoration contributes **Cozy Points** (*Điểm Ấm Cúng*):
- Total Cozy Rating provides a passive bonus: `+1% Coin drops per 10 Cozy Points` (capped at +25%).

### 8.2 Decoration Anchors on the 2.5D Island
To ensure visual harmony, proper depth sorting with penguins, and clean obstacle bounds for autonomous pathfinding, decorations can be placed at **6 designated decoration plots** across the island:

```
                  [Plot 1: Upper-Left Snow Cliff]
                                ·
 [Plot 2: West Bank]   [Center Frozen Lake]   [Plot 3: East Bank (Near Nest)]
                                ·
                  [Plot 4: South Snowbank Edge]
   [Plot 5: Far West Pine Grove]      [Plot 6: Southeast Snowbank]
```

### 8.3 Decoration Catalog (`packages/game-data/src/decorations.json`)
All decorations are rendered procedurally or via modular vector graphics:
1. **Wooden Bench (*Ghế Gỗ Mùa Đông*):** Cozy bench with snow dusting. (Cozy: +10)
2. **Crystal Pine (*Thông Pha Lê*):** Glistening miniature pine tree adorned with ice crystals. (Cozy: +15)
3. **Street Lamp (*Đèn Đường Cổ Điển*):** Victorian-style warm yellow lantern illuminating the snow. (Cozy: +20)
4. **Mini Snow Castle (*Lâu Đài Tuyết Nhỏ*):** Whimsical miniature ice fortress. (Cozy: +35)
5. **Igloo Lantern (*Đèn Lều Băng*):** Warm glowing decorative ice lantern. (Cozy: +25)

---

## 9. Island Shop Structure (*Cửa Hàng Đảo Tuyết*)

### 9.1 Modal Design & Aesthetics
A new modal component `ShopModal.vue` accessible from the bottom Shelf Rack (*Kệ Gỗ*). Designed with a warm wooden-and-frost aesthetic, featuring 3 category tabs:
1. **Thức Ăn (Food):**
   - *Cá Mòi (Sardine):* 10 Coins (Hunger -25, Happiness +10)
   - *Tép Biển (Krill):* 25 Coins (Hunger -35, Happiness +15, unlocks at Lv. 2)
   - *Mực Tươi (Squid):* 60 Coins (Hunger -50, Happiness +25, unlocks at Lv. 4)
   - *Kem Tuyết (Snow Ice Cream):* 100 Coins (Happiness +45, treats hunger, unlocks at Lv. 6)
2. **Trứng Cánh Cụt (Eggs):**
   - *Trứng Cơ Bản (Basic Egg):* 150 Coins (Unlocks at Lv. 1)
   - *Trứng Băng Giá (Frozen Egg):* 450 Coins (Unlocks at Lv. 4)
   - *Trứng Hoàng Kim (Golden Egg):* 10 Gems (Unlocks at Lv. 7)
3. **Trang Trí (Decorations):**
   - Displays all unlocked decorations with their Coin/Gem cost and Cozy Rating.

---

## 10. Data Models & Schemas

### 10.1 Extensions to `@penguin/types`

```typescript
// --- Player Progression ---
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
  happiness: number;     // 0 - 100
  hunger: number;        // 0 - 100 (0 = full, 100 = starving)
  mood: PenguinMood;
  lastPetAt: number;     // Unix timestamp (ms)
  lastFedAt: number;     // Unix timestamp (ms)
  generation: number;
  createdAt: number;
  isFavorite?: boolean;
}

// --- Island Decorations ---
export interface PlacedDecoration {
  instanceId: string;
  decorationId: string;  // references decoration catalog ID
  plotId: number;        // Anchor plot 1 - 6
  placedAt: number;
}

export interface IslandState {
  tier: number;
  cozyRating: number;
  decorations: PlacedDecoration[];
  unlockedProps: string[];
}

// --- Daily Rewards & Quests ---
export interface DailyLoginState {
  lastClaimTimestamp: number;
  currentStreak: number;       // 1 - 7
  claimedToday: boolean;
}

export interface ActiveQuest {
  questId: string;
  currentCount: number;
  targetCount: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface QuestState {
  assignedDate: string;        // 'YYYY-MM-DD'
  quests: ActiveQuest[];
}
```

### 10.2 Versioned `GameSaveData` (Schema Version 2)

```typescript
export interface GameSaveDataV2 {
  schemaVersion: 2;
  player: PlayerProfile;
  currencies: Currencies;
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

## 11. Save/Load Migration Strategy (`schemaVersion: 1 -> 2`)

In `apps/web/src/services/StorageService.ts`, update `migrateSaveData()` to seamlessly upgrade existing V1 saves:

```typescript
export function migrateSaveData(data: Record<string, unknown>): GameSaveDataV2 {
  const version = Number(data.schemaVersion ?? 1);

  if (version === 1) {
    // Migrate V1 -> V2:
    // 1. Fill in missing penguin properties (level = 1, exp = 0, lastPetAt, lastFedAt)
    const penguins = ((data.ownedPenguins as OwnedPenguin[]) ?? []).map((p) => ({
      ...p,
      level: p.level ?? 1,
      exp: p.exp ?? 0,
      lastPetAt: p.lastPetAt ?? Date.now(),
      lastFedAt: p.lastFedAt ?? Date.now(),
      isFavorite: p.isFavorite ?? false,
    }));

    // 2. Build default DailyLoginState
    const dailyLogin: DailyLoginState = {
      lastClaimTimestamp: 0,
      currentStreak: 1,
      claimedToday: false,
    };

    // 3. Build default QuestState
    const questState: QuestState = {
      assignedDate: new Date().toISOString().slice(0, 10),
      quests: generateDailyQuests(),
    };

    // 4. Ensure island cozy rating and decorations
    const existingIsland = (data.island as Record<string, unknown>) ?? {};
    const island: IslandState = {
      tier: Number(existingIsland.tier ?? 1),
      cozyRating: 0,
      decorations: (existingIsland.decorations as PlacedDecoration[]) ?? [],
      unlockedProps: (existingIsland.unlockedProps as string[]) ?? [],
    };

    return {
      schemaVersion: 2,
      player: (data.player as PlayerProfile) ?? { level: 1, exp: 0, name: 'Người Nuôi Chim Cánh Cụt', avatar: 'snowy' },
      currencies: (data.currencies as Currencies) ?? { fish: 5, coins: 100, gems: 0 },
      inventory: (data.inventory as InventoryItem[]) ?? [],
      ownedPenguins: penguins,
      collectionBook: (data.collectionBook as CollectionEntry[]) ?? [],
      incubatorSlots: (data.incubatorSlots as IncubatorSlot[]) ?? [],
      island,
      dailyLogin,
      questState,
      timestamps: (data.timestamps as GameSaveDataV2['timestamps']) ?? {
        createdAt: Date.now(),
        lastSavedAt: Date.now(),
        lastLoginAt: Date.now(),
      },
    };
  }

  return data as unknown as GameSaveDataV2;
}
```

---

## 12. GameBridge Event Bus Contracts

Phase 2 introduces the following additions to `GameBridgeEventMap` in `apps/web/src/game/bridge/GameBridge.ts`:

```typescript
export type GameBridgeEventMap = {
  // Existing Phase 1 events
  'penguin:clicked': { ownedId: string };
  'egg:clicked': { slotId: number };
  'canvas:ready': void;
  'penguin:spawn': { penguin: OwnedPenguin };
  'penguin:action': { ownedId: string; action: 'pet' | 'feed' };
  'camera:focus': { x: number; y: number };
  'world:sync': { penguins: OwnedPenguin[]; nestSlot?: IncubatorSlot | null };
  'nest:sync': { slot: IncubatorSlot | null };
  'ui:modal': { open: boolean };

  // New Phase 2 events
  'decorations:sync': { decorations: PlacedDecoration[] };
  'decoration:clicked': { plotId: number; decorationId?: string };
  'effect:coin_drop': { x: number; y: number; amount: number };
  'effect:level_up': { ownedId?: string; x: number; y: number };
};
```

---

## 13. Architectural Responsibilities & Separation of Concerns

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASER 3 RESPONSIBILITIES                       │
│  - Render 2.5D Snow Island ground, central pond, and ambient particles │
│  - Manage PenguinEntity instances, 11-state FSM, and animations        │
│  - Render placed Decoration objects on the 6 anchor plots with depth   │
│  - Animate floating Coin Drops (+10c), Hearts, and Level-Up bursts     │
│  - Emits: penguin:clicked, egg:clicked, decoration:clicked             │
│  - NEVER directly imports or mutates Pinia state                       │
└──────────────────────────────────▲─────────────────────────────────────┘
                                   │  GameBridge Events
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         PINIA STORES & SERVICES                        │
│  - gameStore: Player level, EXP, penguin needs decay, care actions     │
│  - inventoryStore: Items, foods, eggs, decorations stock               │
│  - questStore: Daily login streak, daily quest progress & claims       │
│  - shopStore: Purchases, currency validation, level prerequisites      │
│  - decorationStore: Decoration placement & Cozy Rating calculation     │
│  - StorageService: Versioned persistence with schema 1->2 migration    │
│  - SoundService: Procedural Web Audio API sound synthesis              │
└──────────────────────────────────▲─────────────────────────────────────┘
                                   │  Vue Reactive State
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         VUE 3 UI RESPONSIBILITIES                      │
│  - TopBar: Level progress bar, EXP tooltip, Currencies display         │
│  - ShelfRack: Added buttons for Shop (Cửa Hàng) & Quests (Nhiệm Vụ)    │
│  - Modals Layer:                                                       │
│    • ShopModal.vue: 3 tabs (Food, Eggs, Decorations)                   │
│    • QuestModal.vue: Daily quests and 7-day login calendar             │
│    • DecorationModal.vue: Tap plot to place/remove decoration          │
│    • PenguinInspectModal.vue: Enhanced with EXP bar & favorite star    │
│    • LevelUpModal.vue: Cheerful celebration popup on player level up   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 14. Testing & Verification Strategy

1. **Unit Tests (Vitest):**
   - `StorageService.test.ts`: Verify V1 -> V2 schema migration roundtrip with missing fields.
   - `gameStore.test.ts`: Test hunger/happiness decay algorithm, EXP calculations, player level-up triggers, and care cooldown enforcement.
   - `questStore.test.ts`: Test quest progress increments on corresponding actions (`feed`, `pet`, `hatch`) and reward claiming.
   - `shopStore.test.ts`: Test currency deduction, level requirement gating, and inventory addition.
   - `SnowIslandScene.test.ts`: Test `decorations:sync` event rendering, depth sorting of placed props, and coin drop animations.
2. **Integration Tests (`apps/web/src/__tests__/integration.test.ts`):**
   - Full gameplay cycle: Starter island -> Pet/Feed Snowy -> Earn Coins/EXP -> Level Up to Lv. 2 -> Purchase Krill & Basic Egg in Shop -> Place Egg in Incubator -> Complete Daily Quest -> Claim Rewards.
3. **Typecheck & Production Build:**
   - Zero TypeScript `any` types.
   - `npx vue-tsc --noEmit && npm run build` must compile cleanly with code-split vendor chunks.

---

## 15. Performance Considerations & Particle Limits

- **Ambient Snow:** Capped at 50 particles.
- **Coin Drop & Care Particles:** Temporary bursts of 5–8 particles max per action, automatically killed after 800ms.
- **Texture Generation:** All decoration sprites (Bench, Lamp, Pine, Castle) procedurally rendered once into Canvas textures on boot and cached by key (`dec_bench`, `dec_lamp`, etc.).
- **Mobile Target:** Smooth 60 FPS on desktop, stable 30–60 FPS on mobile browsers.

---

## 16. Acceptance Criteria & Phase 2 Playable Milestone

The Phase 2 milestone will be considered complete when:

1. **Player Progression is Active:** Player earns EXP from care actions; leveling up from Level 1 to Level 2 plays a fanfare, updates the Top HUD level badge, and unlocks new shop items.
2. **Penguin Care Matters:** Feeding and petting alter hunger and happiness bars with real-time feedback; feeding favorite foods awards bonus coins and EXP.
3. **Interactive Shop is Functional:** Player can open `ShopModal`, browse Food, Eggs, and Decorations, and purchase items using Coins or Gems.
4. **Decorations Appear in World:** Placing a decoration in `DecorationModal` immediately spawns the corresponding 2.5D prop on the island at the chosen anchor plot with correct depth sorting.
5. **Quests & Daily Login Work:** Player can claim their daily login reward and track progress on 3 daily quests.
6. **Persistence & Migration:** Existing Phase 1 browser save data loads without errors, upgrading cleanly to Schema V2.
7. **100% Green Test Suite & Clean Build:** All Vitest suites pass and production build succeeds.

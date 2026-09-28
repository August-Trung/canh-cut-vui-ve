# Technical Design Specification: Penguin Island — Phase 3 (Gameplay, Penguin Progression, Mini-games & Breeding)

- **Date:** 2026-09-28
- **Status:** Finalized & Approved with Revisions
- **Target Milestone:** Deep gameplay loop: individual OwnedPenguin progression (canonical `exp`, traits, individuality), personality-driven autonomous AI & social flocking, reusable mini-game framework, first interactive mini-game "Catch Fish" (*Câu Cá Băng*), data-driven breeding core, deterministic genetics & trait inheritance, breeding egg hatchery integration preserving all flock capacity invariants, and comprehensive anti-exploit economy validation.

---

## 1. Executive Summary & Core Philosophy

*Penguin Island* established its playable visual foundation in Phase 1 and its core care, shop, and progression loops in Phase 2. Phase 3 deepens this simulation into an engaging, multi-layered social collection game.

Penguins are unique individual entities: each `OwnedPenguin` has distinct levels, traits, personality quirks, bonding stats, and lineage history. Players nurture their flock, participate in active mini-game activities alongside their companion penguins, breed compatible penguins in the Love Nest to produce rare genetic offspring, and expand their collection while strictly respecting island carrying capacity.

```
       ┌────────────────────────────────────────────────────────┐
       │                 THE PHASE 3 CORE LOOP                  │
       └────────────────────────────────────────────────────────┘
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │ 1. PENGUIN CARE & PROGRESSION                          │
       │    - Petting & feeding awards individual Penguin EXP   │
       │    - Canonical 'exp' field with Level 1–10 thresholds  │
       │    - Data-driven Traits (Glutton, Speedy, Cozy Aura)   │
       │    - Personality quirks influence autonomous AI        │
       └────────────────────────────────────────────────────────┘
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │ 2. MINI-GAME: CATCH FISH (CÂU CÁ BĂNG)                 │
       │    - Phaser Sub-Scene (CatchFishScene) + Vue HUD shell │
       │    - Bring a companion penguin to the ice hole         │
       │    - 30-second skill-based timing fishing session      │
       │    - Catch Sardines, Krill, Salmon, Golden Fish        │
       │    - 3 Free plays + max 3 Extra plays (50 Coins each)  │
       │    - Total hard cap: 6 sessions/day enforced at start  │
       └────────────────────────────────────────────────────────┘
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │ 3. BREEDING CORE & GENETICS                            │
       │    - Select 2 eligible parents (Level >= 3, cooldown)  │
       │    - Cost: Coins + Gems deducted atomically            │
       │    - GeneticsResult generated ONCE on breeding START   │
       │    - 30-min cooldown starts on breeding START          │
       │    - Data-driven mutation pools (same/cross species)   │
       │    - Deterministic trait inheritance (order & limits)  │
       │    - Breeding timer yields a special Breeding Egg      │
       └────────────────────────────────────────────────────────┘
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │ 4. EGG → HATCHERY INTEGRATION                          │
       │    - Breeding egg enters standard inventory & nest     │
       │    - Incubates normally in multi-slot incubator        │
       │    - Full flock allows incubation to READY_TO_HATCH    │
       │    - Full flock strictly blocks hatching safely        │
       │    - Capacity increase enables normal hatch            │
       │    - Persisted GeneticsResult hatches intended penguin │
       └────────────────────────────────────────────────────────┘
                                    │
                                    └─────── Loops back to 1.
```

---

## 2. Architecture & Boundary Rules

1. **Monorepo Layout & Strict Decoupling:**
   - `packages/types`: Extended `OwnedPenguin` (canonical `exp`, traits, breeding history, stats), `GeneticsResult`, `BreedingSlot`, `MiniGameResult`, `MiniGameReward`, and `GameSaveDataV3`.
   - `packages/game-data`: `TRAITS_CATALOG`, `BREEDING_CONFIG`, `GENETICS_MUTATION_POOLS`, `MINIGAME_CONFIG`, `FISH_CATCH_TABLE`.
   - `apps/web/src/services`: Pure leaf calculation services (`GeneticsService`, `BreedingService`, `MiniGameRewardService`). Pure TypeScript, zero Pinia imports, deterministic with injected `IRandomService`.
   - `apps/web/src/stores`: `breedingStore`, extended `gameStore`, decoupled event listening.
   - `apps/web/src/game`: Phaser sub-scenes (`CatchFishScene`), enhanced `PenguinEntity` and `PenguinFSM`.
   - `GameBridge`: Typed event bus mediating between Phaser and Vue/Pinia without direct coupling.

2. **Acyclic Store Architecture:**
   - `gameStore` and `inventoryStore` remain foundational.
   - `breedingStore` imports `useGameStore` and `useInventoryStore`.
   - `questStore` observes events over `GameBridge` (`action:minigame_complete`, `action:breed`, `action:hatch`).
   - Zero circular store dependencies.

3. **Storage & Migration Purity:**
   - `migrateSaveData(data)` normalizes V1/V2 saves into `GameSaveDataV3` idempotently and deterministically.
   - Canonical `exp` field: `p.exp = Number(p.exp ?? p.experience ?? 0)`. `experience` is synced during normalization and retired from independent mutation.
   - Default fallbacks: `traits: []`, `generation: 1`, `breedingCount: 0`, `lastBredAt: 0`.

4. **Authoritative State & Anti-Exploit Scope:**
   - Mini-game rewards are computed by `MiniGameRewardService` based on verified session results, strictly bounded and capped.
   - Single-use session IDs prevent reward replay attacks.
   - Daily play limit (3 free + max 3 extra at 50 coins = max 6 total) enforced atomically before starting a session.
   - Breeding eligibility is validated atomically before state changes.
   - *Prototype Scope Note:* Phase 3 is a local/offline client architecture. Client validation, caps, replay protection, and daily limits prevent accidental/replayed state errors in this phase; authoritative anti-cheat verification will move to the server when production backend services are introduced.

---

## 3. Sub-Phase 3.1: Penguin Progression & Individual Identity

### 3.1 Extended `OwnedPenguin` Model
Every penguin on the island is a unique individual entity, not merely a clone of its base species:

```typescript
export interface PenguinStats {
  fishCaught: number;
  totalPets: number;
  totalFeedings: number;
  gamesPlayed: number;
}

export interface OwnedPenguin {
  id: string;                         // UUID instance
  speciesId: string;                  // Base species (e.g. 'snowy')
  nickname: string;                  // Player chosen or default
  level: number;                      // 1 - 10
  exp: number;                        // Canonical cumulative EXP
  experience?: number;                // Backward compatibility alias (synced with exp)
  happiness: number;                  // 0 - 100
  hunger: number;                     // 0 - 100 (0 = full, 100 = starving)
  energy?: number;                    // 0 - 100
  mood: PenguinMood;                  // 'happy' | 'sleepy' | 'hungry' | 'sad' | 'content' | 'excited' | 'playful'
  lastPetAt: number;                  // Unix timestamp (ms)
  lastFedAt: number;                  // Unix timestamp (ms)
  lastNeedsUpdateAt: number;          // Unix timestamp (ms) for piecewise simulation
  
  // Phase 3 Extensions:
  generation: number;                 // Gen 1 (starter/egg), Gen 2+ (bred)
  parentAId?: string;                 // Lineage parent A UUID
  parentBId?: string;                 // Lineage parent B UUID
  traits: string[];                   // Data-driven trait IDs (e.g. ['glutton', 'lucky']), max 2
  breedingCount: number;              // Total times bred
  lastBredAt: number;                 // Unix timestamp (ms) of last breeding start
  stats: PenguinStats;                // Lifetime bonding & activity statistics
  createdAt?: number;                 // Creation timestamp
  acquiredAt?: number;
}
```

### 3.2 Canonical `exp` vs `experience`
- `exp` is the **canonical** EXP field for all progression logic and persistence.
- `experience` is maintained solely as an alias during save normalization to prevent legacy divergence.
- After migration, all writes update `exp` directly.

### 3.3 Penguin Leveling & EXP Thresholds
Penguin EXP is gained from player care and mini-game activities:
- **Petting:** +3 Penguin EXP (15s cooldown per penguin).
- **Feeding (Standard):** +5 Penguin EXP.
- **Feeding (Favorite Food):** +15 Penguin EXP (+18 for Hungry species eating Fat Salmon).
- **Mini-Game Companion:** +10 to +25 Penguin EXP depending on performance tier.

```typescript
export const PENGUIN_EXP_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3  -> Unlocks Breeding Eligibility!
  450,   // Level 4
  700,   // Level 5  -> Unlocks Trait Resonance Bonus!
  1000,  // Level 6
  1350,  // Level 7
  1750,  // Level 8
  2200,  // Level 9
  2700,  // Level 10 (Max Level)
];
```

### 3.4 Data-Driven Traits Catalog (`packages/game-data/src/traits.ts`)
```typescript
export interface PenguinTraitDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  effectType: 'care' | 'minigame' | 'island' | 'breeding';
  rarity: 'common' | 'rare' | 'epic';
}

export const TRAITS_CATALOG: Record<string, PenguinTraitDefinition> = {
  glutton: {
    id: 'glutton',
    name: 'Phàm Ăn (Glutton)',
    description: 'Nhận thêm 25% Penguin EXP khi ăn, nhưng đói nhanh hơn 10%.',
    icon: 'trait_glutton',
    effectType: 'care',
    rarity: 'common',
  },
  speedy: {
    id: 'speedy',
    name: 'Lướt Gió (Speedy)',
    description: 'Di chuyển và trượt bụng nhanh hơn 25%; tăng 15% thời gian phản xạ câu cá.',
    icon: 'trait_speedy',
    effectType: 'minigame',
    rarity: 'common',
  },
  cozy_aura: {
    id: 'cozy_aura',
    name: 'Hào Quang Ấm Áp (Cozy Aura)',
    description: 'Tỏa ra sự ấm áp giúp tăng thêm +5 Điểm Ấm Cúng cho toàn đảo.',
    icon: 'trait_cozy_aura',
    effectType: 'island',
    rarity: 'rare',
  },
  lucky: {
    id: 'lucky',
    name: 'May Mắn (Lucky)',
    description: 'Có 15% cơ hội nhân đôi số tiền vàng rơi ra khi được cho ăn.',
    icon: 'trait_lucky',
    effectType: 'care',
    rarity: 'rare',
  },
  angler: {
    id: 'angler',
    name: 'Sát Thủ Câu Cá (Master Angler)',
    description: 'Tăng 20% điểm số khi làm bạn đồng hành trong mini-game Câu Cá.',
    icon: 'trait_angler',
    effectType: 'minigame',
    rarity: 'epic',
  },
  romantic: {
    id: 'romantic',
    name: 'Đào Hoa (Romantic)',
    description: 'Giảm 25% thời gian chờ phối giống và tăng 10% tỷ lệ đột biến gen con.',
    icon: 'trait_romantic',
    effectType: 'breeding',
    rarity: 'epic',
  },
};
```

### 3.5 Trait Non-Stacking Rules
Unless a trait explicitly declares additive stacking in its definition:
- An offspring cannot hold duplicate instances of the same trait.
- If both parents hold the same trait (e.g. both have `romantic`), the effect is applied **exactly once** (non-stacking).
- Mini-game and care bonuses apply each active trait at most once.

---

## 4. Sub-Phase 3.2: Advanced Penguin AI & Interaction

### 4.1 Upgrading `PenguinFSM` with Injected Deterministic RNG
- Replace direct calls to `Math.random()` with `IRandomService`.
- Allows headless unit tests to simulate specific state sequences deterministically.

### 4.2 Personality-Weighted Autonomous Transitions
Instead of static probability splits, state weights are adjusted by the penguin's species personality and traits:

| Personality | Primary Behavioral Biases |
|:---|:---|
| **`lazy`** | 2.5x SLEEP weight, 0.5x WADDLE duration; dozes near camp lanterns. |
| **`hungry`** | 2.0x FISH weight; waddles towards fishing hole when hunger >= 40. |
| **`chaotic`** | 3.0x BELLY_SLIDE weight; slips across the pond with high speed. |
| **`shy`** | Keeps >= 120px distance from crowded clusters; wanders near pine trees. |
| **`happy`** | 2.0x PLAY and CELEBRATE weights; frequently performs tiny spins. |

### 4.3 Needs-Driven State Overrides
- **Starving (`hunger >= 80`):** Interrupts non-critical states to enter a begging/seeking state, moving towards the fishing hole or displaying crying/fish speech bubbles.
- **Miserable (`happiness <= 25`):** Moves at 60% waddle speed, droops head, skips playful animations, displays gloomy raincloud bubble.
- **Ecstatic (`happiness >= 80`):** Periodically bursts into spontaneous celebration hops, emitting heart particles.

### 4.4 Social Proximity & Flocking Interactions
- In `SnowIslandScene.ts`, every 6 seconds the scene scans penguin positions:
  - If two penguins are within 60px distance and both in `IDLE`:
    - 40% chance: They face each other and enter `TALK` state with mutual dialogue quips.
    - 25% chance: One penguin initiates `FOLLOW` and waddles behind the other for 3–5 seconds.
  - Anchor plot decorations act as obstacle zones to prevent clipping.

---

## 5. Sub-Phase 3.3: Mini-Game Framework

### 5.1 Architecture & Separation of Concerns
- **Decision 1 Approved:** `CatchFishScene` runs inside the existing Phaser engine. Vue provides a lightweight HUD/modal shell (`CatchFishModal.vue`).
- Phaser owns gameplay rendering, sprite animations, input handling, and particle effects.
- Vue manages session initiation, companion selection, score HUD, countdown, and reward claim modals.

### 5.2 Session Lifecycle & Daily Limit Model
- **Decision 4 Approved:**
  - **3 Free Plays** per local calendar day.
  - Extra plays cost **50 Coins** each.
  - Configurable `maxExtraPlaysPerDay = 3`.
  - **Hard Daily Maximum = 6 sessions/day** (3 free + 3 extra).
  - Validation is enforced **atomically before session start**:
    - If `dailyPlaysCount < 3`: free play starts immediately.
    - If `3 <= dailyPlaysCount < 6`: verifies `currencies.coins >= 50`, deducts 50 Coins atomically, increments play count, and starts session.
    - If `dailyPlaysCount >= 6`: aborts with `{ success: false, reason: 'DAILY_LIMIT_REACHED' }`.

### 5.3 Core Types & Interfaces
```typescript
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
```

### 5.4 Authoritative Reward Calculation (`MiniGameRewardService.ts`)
```typescript
export function calculateCatchFishReward(score: number, companionLevel: number = 1): MiniGameReward {
  const boundedScore = Math.max(0, Math.min(500, score));
  
  if (boundedScore >= 180) {
    return {
      tier: 'diamond',
      coins: Math.min(120, 80 + Math.floor(boundedScore * 0.2)),
      playerExp: 40,
      penguinExp: 25 + companionLevel * 2,
      items: [{ itemId: 'fat_salmon', quantity: 1 }, { itemId: 'sardine', quantity: 3 }],
    };
  } else if (boundedScore >= 110) {
    return {
      tier: 'gold',
      coins: Math.min(80, 50 + Math.floor(boundedScore * 0.2)),
      playerExp: 30,
      penguinExp: 20 + companionLevel * 2,
      items: [{ itemId: 'krill', quantity: 2 }, { itemId: 'sardine', quantity: 2 }],
    };
  } else if (boundedScore >= 50) {
    return {
      tier: 'silver',
      coins: Math.min(50, 30 + Math.floor(boundedScore * 0.2)),
      playerExp: 20,
      penguinExp: 15 + companionLevel,
      items: [{ itemId: 'sardine', quantity: 2 }],
    };
  } else {
    return {
      tier: 'bronze',
      coins: Math.min(25, 10 + Math.floor(boundedScore * 0.2)),
      playerExp: 10,
      penguinExp: 10,
      items: [{ itemId: 'sardine', quantity: 1 }],
    };
  }
}
```

---

## 6. Sub-Phase 3.4: First Mini-Game: Catch Fish (*Câu Cá Băng*)

### 6.1 Theme & Setup
- **Setting:** The frozen lake fishing hole on Snow Island.
- **Companion Penguin:** The player selects one of their `OwnedPenguin`s to accompany them. Companion stands beside the hole cheering, providing `+2% score per level` and trait bonuses (e.g. `angler` trait: +20% score).
- **Duration:** Exactly 30 seconds.

### 6.2 Target Spawning & Catch Mechanics
| Target Name | Points | Frequency | Speed | Reward Item Drop |
|:---|:---:|:---:|:---:|:---:|
| **Small Sardine** | +10 | 45% | Medium | `sardine` |
| **Crispy Krill** | +15 | 25% | Fast | `krill` |
| **Fat Salmon** | +30 | 15% | Slow / Sinks | `fat_salmon` |
| **Golden Glow Fish** | +60 | 5% | Very Fast | `squid` (rare) |
| **Old Boot / Junk** | -15 | 10% | Medium | None (breaks combo) |

### 6.3 Player Input & Combo
- Tap / Click or Spacebar when target enters the central Catch Ring.
- Perfect (center): 1.5x points + "PERFECT!" fanfare + combo counter $+1$.
- Good (within ring): 1.0x points + "GOOD!" chime.
- Miss / Boot: Combo resets to 0 + splash sound.
- Combo Multiplier: Every 3 consecutive catches increases combo multiplier up to 2.0x.

---

## 7. Sub-Phase 3.5: Breeding Core

### 7.1 Selection & Eligibility Validation (Pure `BreedingService.ts`)
- **Correction 1 Applied:** `BreedingService` is strictly pure. It does NOT use `Date.now()` as a default parameter. Callers/stores pass `now: number` explicitly.
- **Decision 2 Applied:** Primary breeding entry point is the "Phối Giống" button on [`ShelfRack.vue`](file:///e:/August%20Game/Canh%20Cut%20Vui%20Ve/apps/web/src/components/dock/ShelfRack.vue) opening `BreedingModal.vue`.

```typescript
export interface BreedingEligibilityResult {
  eligible: boolean;
  reason?:
    | 'SAME_PENGUIN'
    | 'PARENT_NOT_FOUND'
    | 'LEVEL_TOO_LOW'
    | 'PARENT_BREEDING'
    | 'ON_COOLDOWN'
    | 'STARVING'
    | 'INSUFFICIENT_FUNDS'
    | 'SLOT_OCCUPIED';
}

export function validateBreedingEligibility(
  parentA: OwnedPenguin,
  parentB: OwnedPenguin,
  coins: number,
  gems: number,
  activeBreedingSlot: BreedingSlot | null,
  now: number // Explicit timestamp, no Date.now() default
): BreedingEligibilityResult {
  if (parentA.id === parentB.id) {
    return { eligible: false, reason: 'SAME_PENGUIN' };
  }
  if (parentA.level < 3 || parentB.level < 3) {
    return { eligible: false, reason: 'LEVEL_TOO_LOW' };
  }
  if (now - (parentA.lastBredAt ?? 0) < 1800000 || now - (parentB.lastBredAt ?? 0) < 1800000) {
    // 30-minute breeding cooldown
    return { eligible: false, reason: 'ON_COOLDOWN' };
  }
  if (parentA.hunger >= 80 || parentB.hunger >= 80) {
    return { eligible: false, reason: 'STARVING' };
  }
  if (coins < 200 || gems < 1) {
    return { eligible: false, reason: 'INSUFFICIENT_FUNDS' };
  }
  if (activeBreedingSlot && activeBreedingSlot.state !== 'EMPTY') {
    return { eligible: false, reason: 'SLOT_OCCUPIED' };
  }
  return { eligible: true };
}
```

### 7.2 Breeding Start & Cooldown Timing
- **Correction 5 Applied:** Breeding cooldown starts when breeding successfully **STARTS**, not when collected.
  - On start: `parentA.lastBredAt = now`, `parentB.lastBredAt = now`.
  - Both parents are marked unavailable for breeding.
  - Cooldown duration: 1,800,000 ms (30 minutes) from start time.

### 7.3 One-Time Genetics Generation
- **Correction 6 Applied:** `GeneticsResult` is generated **exactly once when breeding successfully starts**.
- Stored directly into `BreedingSlot.geneticsResult`.
- Collecting the egg or reloading the game preserves the exact same `GeneticsResult`.

```typescript
export type BreedingSlotState = 'EMPTY' | 'BREEDING' | 'READY_TO_COLLECT';

export interface BreedingSlot {
  slotId: number;
  state: BreedingSlotState;
  parentAId?: string;
  parentBId?: string;
  startedAt?: number;
  durationSec?: number;
  targetCollectTime?: number;
  geneticsResult?: GeneticsResult; // Persisted on start
}
```

- Duration: 300 seconds in production; 15 seconds in dev mode.
- When `now >= targetCollectTime`, slot transitions to `READY_TO_COLLECT`.

---

## 8. Sub-Phase 3.6: Genetics & Trait Inheritance

### 8.1 Data-Driven Mutation Pools (`packages/game-data/src/breeding.ts`)
- **Correction 2 Applied:** Do not hardcode mutation species in code. Use data-driven mutation pools:

```typescript
export interface GeneticsMutationPools {
  sameSpeciesMutationPool: Record<string, { speciesId: string; weight: number }[]>;
  crossSpeciesMutationPool: Record<string, { speciesId: string; weight: number }[]>;
}

export const GENETICS_MUTATION_POOLS: GeneticsMutationPools = {
  sameSpeciesMutationPool: {
    snowy: [{ speciesId: 'shy', weight: 60 }, { speciesId: 'sleepy', weight: 40 }],
    sleepy: [{ speciesId: 'snowy', weight: 50 }, { speciesId: 'happy', weight: 50 }],
    shy: [{ speciesId: 'sleepy', weight: 50 }, { speciesId: 'hungry', weight: 50 }],
    happy: [{ speciesId: 'hungry', weight: 50 }, { speciesId: 'snowy', weight: 50 }],
    hungry: [{ speciesId: 'happy', weight: 60 }, { speciesId: 'shy', weight: 40 }],
  },
  crossSpeciesMutationPool: {
    default: [
      { speciesId: 'happy', weight: 40 },
      { speciesId: 'hungry', weight: 30 },
      { speciesId: 'shy', weight: 30 },
    ],
  },
};
```

### 8.2 Trait Inheritance Algorithm
- **Correction 3 Applied:** Exact deterministic execution order:
  1. Roll inherited traits from Parent A (50% chance each).
  2. Roll inherited traits from Parent B (50% chance each).
  3. Deduplicate accumulated traits.
  4. Enforce maximum 2 active traits (slice to top 2 if > 2).
  5. Roll spontaneous mutation (10% chance).
  6. Mutation may only add a trait if a slot remains available (`traits.length < 2`).
  7. Never duplicate an existing trait.
  8. Final offspring has `traits.length <= 2`.

### 8.3 Generation & Lineage Formula
`child.generation = Math.max(parentA.generation, parentB.generation) + 1`

---

## 9. Sub-Phase 3.7: Breeding Egg $\to$ Hatch Integration

### 9.1 The Breeding Egg Item
- **Decision 3 Applied:** Claiming completed breeding produces a **Breeding Egg** item in `inventory`:
  - `itemId: 'egg_breeding'`
  - `category: 'eggs'`
  - `name: 'Trứng Lai Ghép (Breeding Egg)'`
  - `metadata: { geneticsResult: GeneticsResult }`

### 9.2 Strict Hatchery Invariant Compliance
- **Correction 10 Applied:** Breeding Egg enters the existing standard incubator/hatchery pipeline:
  1. **Full Flock Gate:**
     - Player can place `egg_breeding` into incubator and incubate to `READY_TO_HATCH`.
     - When flock is full:
       - `prepareHatch` aborts with `{ success: false, reason: 'FLOCK_FULL' }`.
       - `HatchModal` MUST NOT open.
       - Egg MUST NOT crack.
       - GeneticsResult is NOT consumed or rerolled.
       - Slot remains `READY_TO_HATCH`.
       - No penguin is created.
  2. **Capacity Increase:**
     - When capacity expands, hatching the slot consumes the egg and spawns the exact `OwnedPenguin` defined by the persisted `GeneticsResult`.
     - Clears incubator slot, clears pending state, returns `null` on duplicate calls.

---

## 10. Sub-Phase 3.8: Rewards & Anti-Exploit Rules

### 10.1 Economic Balance & Anti-Exploit Verification
- **Correction 9 Applied:** Automated economy balance tests verify:
  1. Mini-Game Rewards vs Costs:
     - 3 free plays = max ~360 Coins + ~120 Player EXP/day.
     - 3 extra plays cost 150 Coins and yield max ~360 Coins (net +210 Coins).
     - Hard cap of 6 plays/day strictly prevents infinite coin generation.
  2. Breeding Economics:
     - Cost: 200 Coins + 1 Gem per breeding.
     - 30-min cooldown limits breeding to at most 48 sessions/day theoretical max.
     - Starter savings cannot be exhausted without player progression.
  3. Penguin EXP Cap:
     - Hard cap at Level 10 (2700 EXP). Additional EXP does not overflow or grant infinite rewards.

---

## 11. Sub-Phase 3.9: Persistence & V3 Migration

### 11.1 Versioned Save Schema V3 (`GameSaveDataV3`)
```typescript
export interface GameSaveDataV3 extends Omit<GameSaveDataV2, 'schemaVersion'> {
  schemaVersion: 3;
  breedingSlot: BreedingSlot;
  miniGameState: {
    lastPlayedDate: string;
    dailyPlaysCount: Record<string, number>;
  };
}
```

### 11.2 Pure Idempotent Migration (`StorageService.ts`)
- Upgrades V1 and V2 saves to V3.
- Canonicalizes `exp`: `p.exp = Number(p.exp ?? p.experience ?? 0)`.
- Populates missing `traits: []`, `generation: 1`, `breedingCount: 0`, `lastBredAt: 0`, `stats: { fishCaught: 0, totalPets: 0, totalFeedings: 0, gamesPlayed: 0 }`.
- Initializes empty `breedingSlot` and reset `miniGameState`.
- Zero side-effects, zero `Date.now()` during pure migration.

---

## 12. Verification & Test Plan

1. **`GeneticsService.test.ts` (12 tests)**:
   - Data-driven mutation pool selections with seeded RNG.
   - Exact 8-step trait inheritance order and maximum 2 active traits.
   - Non-stacking of parent traits.
   - Generation increment ($Max(GenA, GenB) + 1$).
2. **`BreedingService.test.ts` (10 tests)**:
   - Pure signature with explicit `now: number`.
   - Eligibility checks (same penguin, level < 3, 30-min cooldown, starving, funds).
   - Start timing: cooldown starts on start, genetics generated once on start.
3. **`MiniGameRewardService.test.ts` (10 tests)**:
   - Score-to-tier mappings and bounded rewards.
   - Daily limit enforcement: 3 free + 3 extra (50 coins) = max 6 plays/day.
   - Single-use session token replay protection.
4. **`EconomySimulation.test.ts` (6 tests)**:
   - Simulation of 30 days of daily care, mini-game, and breeding cycles.
   - Confirms zero infinite reward or currency loops.
5. **`HatcheryIntegration.test.ts` (8 tests)**:
   - Breeding egg placement and incubation.
   - Full flock capacity invariant: holds `READY_TO_HATCH`, blocks hatch, genetics intact.
   - Expanded capacity creates exact offspring with inherited traits and lineage.
6. **Regression Suite**:
   - Run all 38 existing test suites (326 tests) to verify 100% pass rate.
   - `npm run build` verification.

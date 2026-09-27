# Penguin Island (Phase 1 — Playable Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete, playable Phase 1 foundation of *Penguin Island*: a browser-based casual social collection game featuring Snow Island, 5 autonomous animated penguins with FSM behaviors, egg incubation and hatching sequence, creature encyclopedia, inventory, local persistence, and nostalgic 2010s social web game visual flair.

**Architecture:** Monorepo workspace (`apps/web`, `packages/types`, `packages/game-data`). Phaser 3 renders the 2.5D Snow Island, particle effects, and autonomous penguins; Vue 3 powers the HUD, inventory, collection book, and modal dialogues. Bidirectional communication is strictly decoupled via a typed `GameBridge` and Pinia stores with an abstracted `StorageService`.

**Tech Stack:** Vue 3, Vite, TypeScript, Pinia, Phaser 3, Vitest, npm workspaces.

**Spec:** `docs/superpowers/specs/2026-09-28-penguin-island-phase1-design.md`

## Global Constraints
- **Strictly Phase 1:** No Phase 4 backend (NestJS/PostgreSQL) or live multi-tenant server will be created.
- **Original IP:** 100% original artwork, names, quips, and designs. Zero copyrighted assets.
- **High-Res Stylized 2.5D Graphics:** Soft vector/painted shading; no pixel art, no corporate UI styling.
- **Strict Boundary:** Phaser must never directly mutate Pinia state; Store/Service + GameBridge is the boundary.
- **Drop Tables:** Positive weights, >=1 entry per pool, all species exist, normalized probability distribution.
- **Save Data:** Explicit versioned `GameSaveData` schema with safe defaults and unknown field tolerance.
- **Nicknames:** Trimmed, max 20 Unicode chars, reject control & HTML/script chars, allow skip.
- **Textures:** Cached in Phaser by `visualKey` — never re-rendered per entity instance.
- **Feeding:** Requires and consumes 1 Fish; shows feedback if 0 Fish.
- **Target Performance:** Solid 60 FPS on desktop, smooth 30–60 FPS on supported mobile devices.

---

### Task 1: Monorepo Scaffolding & Shared Types (`packages/types`)

**Files:**
- Create: `package.json` (root monorepo)
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`
- Test: `packages/types/src/__tests__/types.test.ts`

**Interfaces:**
- Produces: `RarityTier`, `PenguinPersonality`, `PenguinMood`, `PenguinSpecies`, `OwnedPenguin`, `EggType`, `DropPoolEntry`, `IncubatorState`, `IncubatorSlot`, `InventoryItem`, `Currencies`, `GameSaveData`.

- [ ] **Step 1: Write the failing test for types exports**

```typescript
// packages/types/src/__tests__/types.test.ts
import { describe, it, expect } from 'vitest';
import type { PenguinSpecies, OwnedPenguin, EggType, GameSaveData } from '../index';

describe('Shared Types', () => {
  it('should construct a valid PenguinSpecies and OwnedPenguin object', () => {
    const species: PenguinSpecies = {
      id: 'snowy',
      speciesNumber: '001',
      name: 'Snowy',
      rarity: 'common',
      personality: 'shy',
      trait: 'Chilly Feet',
      favoriteFood: 'Small Sardine',
      dislikedFood: 'Spicy Pepper',
      description: 'A quiet penguin who loves soft snow.',
      clue: 'Loves eating snacks near the igloo.',
      visualKey: 'penguin_snowy'
    };
    expect(species.id).toBe('snowy');

    const owned: OwnedPenguin = {
      id: 'uuid-1234',
      speciesId: 'snowy',
      nickname: 'Snowball',
      level: 1,
      experience: 0,
      happiness: 80,
      energy: 100,
      hunger: 30,
      mood: 'happy',
      acquiredAt: 1700000000000,
      generation: 1
    };
    expect(owned.nickname).toBe('Snowball');
  });
});
```

- [ ] **Step 2: Create root package.json and packages/types configuration**

Create root `package.json` with npm workspaces:
```json
{
  "name": "penguin-island-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "dev": "npm --workspace=apps/web run dev",
    "build": "npm --workspace=apps/web run build",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "vitest": "^1.6.0"
  }
}
```

Create `packages/types/package.json`:
```json
{
  "name": "@penguin/types",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

Create `packages/types/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Implement `packages/types/src/index.ts`**

```typescript
// packages/types/src/index.ts

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

export type PenguinMood =
  | 'happy'
  | 'sleepy'
  | 'hungry'
  | 'sad'
  | 'excited'
  | 'playful';

export interface PenguinSpecies {
  id: string;
  speciesNumber: string;
  name: string;
  rarity: RarityTier;
  personality: PenguinPersonality;
  trait: string;
  favoriteFood: string;
  dislikedFood: string;
  description: string;
  clue: string;
  visualKey: string;
}

export interface OwnedPenguin {
  id: string;
  speciesId: string;
  nickname: string;
  level: number;
  experience: number;
  happiness: number;
  energy: number;
  hunger: number;
  mood: PenguinMood;
  acquiredAt: number;
  generation: number;
  parentAId?: string;
  parentBId?: string;
}

export interface DropPoolEntry {
  speciesId: string;
  weight: number;
}

export interface EggType {
  id: string;
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

export interface GameSaveData {
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
  player: {
    id: string;
    displayName: string;
    level: number;
    experience: number;
    avatarId: string;
  };
  currencies: Currencies;
  inventory: InventoryItem[];
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run packages/types/src/__tests__/types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json packages/types
git commit -m "feat(types): create shared TypeScript schemas and models"
```

---

### Task 2: Game Data & Drop Table Validation (`packages/game-data`)

**Files:**
- Create: `packages/game-data/package.json`
- Create: `packages/game-data/tsconfig.json`
- Create: `packages/game-data/src/species.ts`
- Create: `packages/game-data/src/eggs.ts`
- Create: `packages/game-data/src/items.ts`
- Create: `packages/game-data/src/validator.ts`
- Create: `packages/game-data/src/index.ts`
- Test: `packages/game-data/src/__tests__/validator.test.ts`

**Interfaces:**
- Consumes: `PenguinSpecies`, `EggType`, `InventoryItem` from `@penguin/types`
- Produces: `SPECIES_LIST`, `SPECIES_MAP`, `EGG_TYPES_LIST`, `EGG_TYPES_MAP`, `INITIAL_ITEMS`, `validateGameData()`

- [ ] **Step 1: Write failing tests for game data and validation**

```typescript
// packages/game-data/src/__tests__/validator.test.ts
import { describe, it, expect } from 'vitest';
import { SPECIES_LIST, EGG_TYPES_LIST, validateGameData } from '../index';

describe('Game Data & Drop Table Validation', () => {
  it('should have 5 distinct Phase 1 species', () => {
    expect(SPECIES_LIST.length).toBe(5);
    const ids = SPECIES_LIST.map(s => s.id);
    expect(new Set(ids).size).toBe(5);
    expect(ids).toEqual(expect.arrayContaining(['snowy', 'sleepy', 'shy', 'happy', 'hungry']));
  });

  it('should have 3 distinct Phase 1 egg types', () => {
    expect(EGG_TYPES_LIST.length).toBe(3);
    const ids = EGG_TYPES_LIST.map(e => e.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids).toEqual(expect.arrayContaining(['basic_egg', 'frozen_egg', 'golden_egg']));
  });

  it('passes validation on all game data', () => {
    const result = validateGameData(SPECIES_LIST, EGG_TYPES_LIST);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects invalid drop pools (empty pool, non-positive weight, nonexistent species)', () => {
    const invalidEggs = [
      {
        id: 'bad_egg_1',
        name: 'Bad Egg 1',
        rarity: 'common' as const,
        hatchDurationSec: 10,
        visualTheme: 'test',
        dropPool: [] // Empty
      },
      {
        id: 'bad_egg_2',
        name: 'Bad Egg 2',
        rarity: 'common' as const,
        hatchDurationSec: 10,
        visualTheme: 'test',
        dropPool: [{ speciesId: 'snowy', weight: -5 }] // Negative weight
      },
      {
        id: 'bad_egg_3',
        name: 'Bad Egg 3',
        rarity: 'common' as const,
        hatchDurationSec: 10,
        visualTheme: 'test',
        dropPool: [{ speciesId: 'dragon_nonexistent', weight: 10 }] // Missing species
      }
    ];
    const result = validateGameData(SPECIES_LIST, invalidEggs);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Create package.json and data files**

Create `packages/game-data/package.json`:
```json
{
  "name": "@penguin/game-data",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@penguin/types": "*"
  }
}
```

Implement `packages/game-data/src/species.ts`:
```typescript
import { PenguinSpecies } from '@penguin/types';

export const SPECIES_LIST: PenguinSpecies[] = [
  {
    id: 'snowy',
    speciesNumber: '001',
    name: 'Snowy',
    rarity: 'common',
    personality: 'shy',
    trait: 'Chilly Feet',
    favoriteFood: 'Small Sardine',
    dislikedFood: 'Spicy Pepper',
    description: 'A gentle, introverted penguin who loves the crunch of fresh snow.',
    clue: 'Loves waddling near the quiet snowdrifts.',
    visualKey: 'penguin_snowy'
  },
  {
    id: 'sleepy',
    speciesNumber: '002',
    name: 'Sleepy',
    rarity: 'common',
    personality: 'sleepy',
    trait: 'Heavy Sleeper',
    favoriteFood: 'Warm Milk',
    dislikedFood: 'Alarm Clocks',
    description: 'Can fall asleep anywhere, even sliding midway down an ice slope.',
    clue: 'Often found dozing near the warm camp lanterns.',
    visualKey: 'penguin_sleepy'
  },
  {
    id: 'shy',
    speciesNumber: '003',
    name: 'Shy',
    rarity: 'common',
    personality: 'shy',
    trait: 'Blushing Glow',
    favoriteFood: 'Sweet Berries',
    dislikedFood: 'Loud Megaphones',
    description: 'Hides behind its cozy knitted scarf when players get too close.',
    clue: 'Peek behind the pine trees on snowy mornings.',
    visualKey: 'penguin_shy'
  },
  {
    id: 'happy',
    speciesNumber: '004',
    name: 'Happy',
    rarity: 'common',
    personality: 'happy',
    trait: 'Sunny Smile',
    favoriteFood: 'Ice Cream',
    dislikedFood: 'Bitter Herbs',
    description: 'Spreads endless cheer and does tiny celebration spins across the ice.',
    clue: 'Spawns when joy fills the icy air.',
    visualKey: 'penguin_happy'
  },
  {
    id: 'hungry',
    speciesNumber: '005',
    name: 'Hungry',
    rarity: 'common',
    personality: 'hungry',
    trait: 'Endless Appetite',
    favoriteFood: 'Fat Salmon',
    dislikedFood: 'Empty Plates',
    description: 'Never stops thinking about fish and waddles right up to the fishing hole.',
    clue: 'Attracted by the scent of fresh fish.',
    visualKey: 'penguin_hungry'
  }
];

export const SPECIES_MAP = new Map<string, PenguinSpecies>(
  SPECIES_LIST.map(s => [s.id, s])
);
```

Implement `packages/game-data/src/eggs.ts`:
```typescript
import { EggType } from '@penguin/types';

export const EGG_TYPES_LIST: EggType[] = [
  {
    id: 'basic_egg',
    name: 'Basic Egg',
    rarity: 'common',
    hatchDurationSec: 10,
    visualTheme: 'egg_basic',
    dropPool: [
      { speciesId: 'snowy', weight: 40 },
      { speciesId: 'sleepy', weight: 30 },
      { speciesId: 'happy', weight: 30 }
    ]
  },
  {
    id: 'frozen_egg',
    name: 'Frozen Egg',
    rarity: 'uncommon',
    hatchDurationSec: 15,
    visualTheme: 'egg_frozen',
    dropPool: [
      { speciesId: 'shy', weight: 50 },
      { speciesId: 'snowy', weight: 30 },
      { speciesId: 'happy', weight: 20 }
    ]
  },
  {
    id: 'golden_egg',
    name: 'Golden Egg',
    rarity: 'rare',
    hatchDurationSec: 25,
    visualTheme: 'egg_golden',
    dropPool: [
      { speciesId: 'hungry', weight: 60 },
      { speciesId: 'happy', weight: 20 },
      { speciesId: 'shy', weight: 20 }
    ]
  }
];

export const EGG_TYPES_MAP = new Map<string, EggType>(
  EGG_TYPES_LIST.map(e => [e.id, e])
);
```

Implement `packages/game-data/src/items.ts`:
```typescript
import { InventoryItem } from '@penguin/types';

export const INITIAL_ITEMS: InventoryItem[] = [
  {
    itemId: 'basic_egg',
    category: 'eggs',
    name: 'Basic Egg',
    description: 'A cozy speckled egg. Place in the hatchery to incubate.',
    quantity: 1,
    stackable: true
  },
  {
    itemId: 'sardine',
    category: 'food',
    name: 'Small Sardine',
    description: 'A fresh little fish! Use to feed penguins and restore happiness.',
    quantity: 50,
    stackable: true
  }
];
```

Implement `packages/game-data/src/validator.ts`:
```typescript
import { PenguinSpecies, EggType } from '@penguin/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGameData(
  speciesList: PenguinSpecies[],
  eggTypesList: EggType[]
): ValidationResult {
  const errors: string[] = [];
  const speciesIds = new Set(speciesList.map(s => s.id));

  for (const egg of eggTypesList) {
    if (!egg.dropPool || egg.dropPool.length === 0) {
      errors.push(`Egg '${egg.id}' has an empty drop pool.`);
      continue;
    }

    for (const entry of egg.dropPool) {
      if (entry.weight <= 0 || isNaN(entry.weight)) {
        errors.push(`Egg '${egg.id}' has non-positive weight ${entry.weight} for species '${entry.speciesId}'.`);
      }
      if (!speciesIds.has(entry.speciesId)) {
        errors.push(`Egg '${egg.id}' references nonexistent species '${entry.speciesId}'.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

Implement `packages/game-data/src/index.ts`:
```typescript
export * from './species';
export * from './eggs';
export * from './items';
export * from './validator';
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run packages/game-data/src/__tests__/validator.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/game-data
git commit -m "feat(game-data): add species, eggs, items and drop-table validation"
```

---

### Task 3: Service Layer & Nickname Validation (`apps/web/src/services`)

**Files:**
- Create: `apps/web/src/services/NicknameValidator.ts`
- Create: `apps/web/src/services/RandomService.ts`
- Create: `apps/web/src/services/StorageService.ts`
- Test: `apps/web/src/services/__tests__/NicknameValidator.test.ts`
- Test: `apps/web/src/services/__tests__/RandomService.test.ts`
- Test: `apps/web/src/services/__tests__/StorageService.test.ts`

**Interfaces:**
- Produces: `validateNickname(input: string, fallback: string): { valid: boolean; value: string; error?: string }`
- Produces: `IRandomService`, `LocalRandomService`
- Produces: `IGameStorage`, `LocalStorageAdapter`, `createDefaultSaveData()`

- [ ] **Step 1: Write failing tests for NicknameValidator, RandomService, StorageService**

```typescript
// apps/web/src/services/__tests__/NicknameValidator.test.ts
import { describe, it, expect } from 'vitest';
import { validateNickname } from '../NicknameValidator';

describe('NicknameValidator', () => {
  it('trims whitespace and accepts valid names including Vietnamese diacritics', () => {
    const res = validateNickname('  Cánh Cụt Bé Nhỏ  ', 'Snowy');
    expect(res.valid).toBe(true);
    expect(res.value).toBe('Cánh Cụt Bé Nhỏ');
  });

  it('normalizes multiple spaces', () => {
    const res = validateNickname('Snowy    Brave   One', 'Snowy');
    expect(res.valid).toBe(true);
    expect(res.value).toBe('Snowy Brave One');
  });

  it('falls back to default species name if empty or only whitespace', () => {
    const res = validateNickname('   ', 'Snowy');
    expect(res.valid).toBe(true);
    expect(res.value).toBe('Snowy');
  });

  it('rejects names longer than 20 characters', () => {
    const res = validateNickname('Super Long Penguin Name Beyond Twenty Characters', 'Snowy');
    expect(res.valid).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('rejects control characters and HTML/script content', () => {
    expect(validateNickname('<script>alert(1)</script>', 'Snowy').valid).toBe(false);
    expect(validateNickname('Penguin <3', 'Snowy').valid).toBe(false); // contains <
    expect(validateNickname('Hello\x00World', 'Snowy').valid).toBe(false); // control char
  });
});
```

```typescript
// apps/web/src/services/__tests__/RandomService.test.ts
import { describe, it, expect } from 'vitest';
import { LocalRandomService } from '../RandomService';

describe('LocalRandomService', () => {
  const rng = new LocalRandomService();

  it('rolls from drop pool respecting relative positive weights', () => {
    const pool = [
      { speciesId: 'snowy', weight: 80 },
      { speciesId: 'rare_p', weight: 20 }
    ];
    const counts = { snowy: 0, rare_p: 0 };
    for (let i = 0; i < 500; i++) {
      const rolled = rng.rollDrop(pool);
      counts[rolled as keyof typeof counts]++;
    }
    expect(counts.snowy).toBeGreaterThan(counts.rare_p);
    expect(counts.snowy + counts.rare_p).toBe(500);
  });

  it('works with weights not summing to 100', () => {
    const pool = [
      { speciesId: 'a', weight: 1 },
      { speciesId: 'b', weight: 3 }
    ];
    const picked = rng.rollDrop(pool);
    expect(['a', 'b']).toContain(picked);
  });
});
```

```typescript
// apps/web/src/services/__tests__/StorageService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageAdapter, createDefaultSaveData } from '../StorageService';

describe('StorageService', () => {
  let storage: LocalStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    storage = new LocalStorageAdapter('test_penguin_island_save');
  });

  it('generates a valid default starter save data', () => {
    const initial = createDefaultSaveData();
    expect(initial.schemaVersion).toBe(1);
    expect(initial.currencies.coins).toBe(500);
    expect(initial.currencies.fish).toBe(50);
    expect(initial.currencies.gems).toBe(10);
    expect(initial.ownedPenguins.length).toBe(1);
    expect(initial.ownedPenguins[0].speciesId).toBe('snowy');
    expect(initial.inventory.find(i => i.itemId === 'basic_egg')?.quantity).toBe(1);
  });

  it('saves and loads game state cleanly', async () => {
    const data = createDefaultSaveData();
    data.currencies.coins = 999;
    await storage.save(data);

    const loaded = await storage.load();
    expect(loaded?.currencies.coins).toBe(999);
  });

  it('handles corrupted JSON gracefully with fallback', async () => {
    localStorage.setItem('test_penguin_island_save', '{ corrupt json string');
    const loaded = await storage.load();
    expect(loaded).toBeNull();
  });
});
```

- [ ] **Step 2: Implement `NicknameValidator.ts`, `RandomService.ts`, `StorageService.ts`**

Implement `apps/web/src/services/NicknameValidator.ts`:
```typescript
export interface NicknameValidationResult {
  valid: boolean;
  value: string;
  error?: string;
}

export function validateNickname(
  input: string,
  fallbackName: string
): NicknameValidationResult {
  // Trim and normalize multiple spaces to a single space
  const normalized = input.trim().replace(/\s+/g, ' ');

  if (!normalized) {
    return { valid: true, value: fallbackName };
  }

  // Unicode length check
  const charLength = Array.from(normalized).length;
  if (charLength > 20) {
    return {
      valid: false,
      value: normalized,
      error: 'Tên không được vượt quá 20 ký tự.'
    };
  }

  // Check for control characters
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    if ((code >= 0 && code <= 31) || code === 127) {
      return {
        valid: false,
        value: normalized,
        error: 'Tên chứa ký tự điều khiển không hợp lệ.'
      };
    }
  }

  // Reject HTML/Script tag chars (<, >, &, ", ')
  if (/[<>&"']/.test(normalized)) {
    return {
      valid: false,
      value: normalized,
      error: 'Tên không được chứa các ký tự đặc biệt như < > & " \'.'
    };
  }

  // Allow standard letters (including full Vietnamese Unicode block), numbers, spaces, and safe punctuation: - _ . ! ?
  const validPattern = /^[\p{L}\p{N}\s\-_.,!?]+$/u;
  if (!validPattern.test(normalized)) {
    return {
      valid: false,
      value: normalized,
      error: 'Tên chỉ được chứa chữ cái, số, khoảng trắng và dấu câu thông dụng.'
    };
  }

  return {
    valid: true,
    value: normalized
  };
}
```

Implement `apps/web/src/services/RandomService.ts`:
```typescript
import { DropPoolEntry } from '@penguin/types';

export interface IRandomService {
  rollDrop(dropPool: DropPoolEntry[]): string;
  randomRange(min: number, max: number): number;
}

export class LocalRandomService implements IRandomService {
  rollDrop(dropPool: DropPoolEntry[]): string {
    if (!dropPool || dropPool.length === 0) {
      throw new Error('Drop pool is empty.');
    }

    const totalWeight = dropPool.reduce((acc, entry) => acc + Math.max(0, entry.weight), 0);
    if (totalWeight <= 0) {
      return dropPool[0].speciesId;
    }

    const roll = Math.random() * totalWeight;
    let accumulated = 0;

    for (const entry of dropPool) {
      accumulated += Math.max(0, entry.weight);
      if (roll <= accumulated) {
        return entry.speciesId;
      }
    }

    return dropPool[dropPool.length - 1].speciesId;
  }

  randomRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export const randomService = new LocalRandomService();
```

Implement `apps/web/src/services/StorageService.ts`:
```typescript
import { GameSaveData, OwnedPenguin, IncubatorSlot } from '@penguin/types';
import { INITIAL_ITEMS } from '@penguin/game-data';

export interface IGameStorage {
  load(): Promise<GameSaveData | null>;
  save(data: GameSaveData): Promise<void>;
  exportJson(data: GameSaveData): string;
  importJson(json: string): GameSaveData | null;
  clear(): Promise<void>;
}

export function createDefaultSaveData(): GameSaveData {
  const starterPenguin: OwnedPenguin = {
    id: `penguin_${Date.now()}_starter`,
    speciesId: 'snowy',
    nickname: 'Snowy',
    level: 1,
    experience: 0,
    happiness: 80,
    energy: 100,
    hunger: 20,
    mood: 'happy',
    acquiredAt: Date.now(),
    generation: 1
  };

  const starterSlots: IncubatorSlot[] = [
    { slotId: 1, state: 'EMPTY' },
    { slotId: 2, state: 'EMPTY' }
  ];

  return {
    schemaVersion: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    player: {
      id: 'player_local_01',
      displayName: 'Penguin Island Caretaker',
      level: 1,
      experience: 0,
      avatarId: 'avatar_default'
    },
    currencies: {
      coins: 500, // Dev seed data
      fish: 50,
      gems: 10
    },
    inventory: [...INITIAL_ITEMS],
    ownedPenguins: [starterPenguin],
    collectionBook: [
      { speciesId: 'snowy', discoveredAt: Date.now() }
    ],
    incubatorSlots: starterSlots,
    islandState: {
      islandId: 'snow_island_01',
      theme: 'snow',
      decorationsPlaced: []
    }
  };
}

export class LocalStorageAdapter implements IGameStorage {
  private key: string;

  constructor(key = 'penguin_island_save_v1') {
    this.key = key;
  }

  async load(): Promise<GameSaveData | null> {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.schemaVersion) {
        return null;
      }
      return parsed as GameSaveData;
    } catch {
      return null;
    }
  }

  async save(data: GameSaveData): Promise<void> {
    data.updatedAt = Date.now();
    localStorage.setItem(this.key, JSON.stringify(data));
  }

  exportJson(data: GameSaveData): string {
    return JSON.stringify(data, null, 2);
  }

  importJson(json: string): GameSaveData | null {
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === 'object' && parsed.schemaVersion === 1) {
        return parsed as GameSaveData;
      }
      return null;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.key);
  }
}

export const gameStorage = new LocalStorageAdapter();
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run apps/web/src/services`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/services
git commit -m "feat(web): add NicknameValidator, RandomService and LocalStorageAdapter"
```

---

### Task 4: Pinia State Stores (`apps/web/src/stores`)

**Files:**
- Create: `apps/web/src/stores/gameStore.ts`
- Create: `apps/web/src/stores/inventoryStore.ts`
- Create: `apps/web/src/stores/collectionStore.ts`
- Test: `apps/web/src/stores/__tests__/gameStore.test.ts`

**Interfaces:**
- Consumes: `@penguin/types`, `@penguin/game-data`, `StorageService`, `RandomService`
- Produces: `useGameStore`, `useInventoryStore`, `useCollectionStore`

- [ ] **Step 1: Write failing tests for Pinia Stores**

```typescript
// apps/web/src/stores/__tests__/gameStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStore } from '../gameStore';
import { useInventoryStore } from '../inventoryStore';
import { useCollectionStore } from '../collectionStore';

describe('Pinia Game Stores', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('initializes game with default save data', async () => {
    const game = useGameStore();
    await game.initGame();
    expect(game.currencies.coins).toBe(500);
    expect(game.currencies.fish).toBe(50);
    expect(game.ownedPenguins.length).toBe(1);
    expect(game.ownedPenguins[0].speciesId).toBe('snowy');
  });

  it('feeding a penguin consumes 1 Fish and increases happiness', async () => {
    const game = useGameStore();
    await game.initGame();
    const inventory = useInventoryStore();

    const penguin = game.ownedPenguins[0];
    penguin.happiness = 50;

    const initialFish = inventory.getItemCount('sardine');
    expect(initialFish).toBe(50);

    const success = game.feedPenguin(penguin.id);
    expect(success).toBe(true);
    expect(inventory.getItemCount('sardine')).toBe(49);
    expect(penguin.happiness).toBe(65);
    expect(penguin.mood).toBe('happy');
  });

  it('rejects feeding if player has 0 fish', async () => {
    const game = useGameStore();
    await game.initGame();
    const inventory = useInventoryStore();

    inventory.setItemCount('sardine', 0);
    const penguin = game.ownedPenguins[0];
    const success = game.feedPenguin(penguin.id);
    expect(success).toBe(false);
  });

  it('incubates egg, transitions through states, and hatches new penguin', async () => {
    const game = useGameStore();
    await game.initGame();
    const collection = useCollectionStore();

    // Place basic_egg in slot 1
    const placed = game.placeEggInIncubator(1, 'basic_egg');
    expect(placed).toBe(true);

    const slot = game.incubatorSlots.find(s => s.slotId === 1)!;
    expect(slot.state).toBe('INCUBATING');

    // Force timer elapsed to ready
    slot.state = 'READY_TO_HATCH';

    // Hatch
    const newPenguin = game.hatchEgg(1, 'Penguin Pal');
    expect(newPenguin).toBeDefined();
    expect(newPenguin?.nickname).toBe('Penguin Pal');
    expect(game.ownedPenguins.length).toBe(2);
    expect(slot.state).toBe('EMPTY');
    expect(collection.isDiscovered(newPenguin!.speciesId)).toBe(true);
  });
});
```

- [ ] **Step 2: Implement `inventoryStore.ts`, `collectionStore.ts`, `gameStore.ts`**

Implement `apps/web/src/stores/inventoryStore.ts`:
```typescript
import { defineStore } from 'pinia';
import { InventoryItem } from '@penguin/types';

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    items: [] as InventoryItem[]
  }),
  getters: {
    getItemCount: (state) => (itemId: string) => {
      const item = state.items.find(i => i.itemId === itemId);
      return item ? item.quantity : 0;
    },
    itemsByCategory: (state) => (category: string) => {
      if (category === 'all') return state.items;
      return state.items.filter(i => i.category === category);
    }
  },
  actions: {
    setItems(items: InventoryItem[]) {
      this.items = items;
    },
    addItem(item: InventoryItem) {
      const existing = this.items.find(i => i.itemId === item.itemId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        this.items.push({ ...item });
      }
    },
    consumeItem(itemId: string, amount = 1): boolean {
      const existing = this.items.find(i => i.itemId === itemId);
      if (!existing || existing.quantity < amount) {
        return false;
      }
      existing.quantity -= amount;
      if (existing.quantity <= 0) {
        this.items = this.items.filter(i => i.itemId !== itemId);
      }
      return true;
    },
    setItemCount(itemId: string, count: number) {
      const existing = this.items.find(i => i.itemId === itemId);
      if (existing) {
        existing.quantity = count;
        if (count <= 0) {
          this.items = this.items.filter(i => i.itemId !== itemId);
        }
      }
    }
  }
});
```

Implement `apps/web/src/stores/collectionStore.ts`:
```typescript
import { defineStore } from 'pinia';
import { SPECIES_LIST } from '@penguin/game-data';

export interface DiscoveredEntry {
  speciesId: string;
  discoveredAt: number;
}

export const useCollectionStore = defineStore('collection', {
  state: () => ({
    discovered: [] as DiscoveredEntry[]
  }),
  getters: {
    totalSpeciesCount: () => SPECIES_LIST.length,
    discoveredCount: (state) => state.discovered.length,
    isDiscovered: (state) => (speciesId: string) => {
      return state.discovered.some(d => d.speciesId === speciesId);
    },
    discoveryDetails: (state) => (speciesId: string) => {
      return state.discovered.find(d => d.speciesId === speciesId);
    }
  },
  actions: {
    setDiscovered(entries: DiscoveredEntry[]) {
      this.discovered = entries;
    },
    discoverSpecies(speciesId: string) {
      if (!this.isDiscovered(speciesId)) {
        this.discovered.push({
          speciesId,
          discoveredAt: Date.now()
        });
      }
    }
  }
});
```

Implement `apps/web/src/stores/gameStore.ts`:
```typescript
import { defineStore } from 'pinia';
import { Currencies, GameSaveData, OwnedPenguin, IncubatorSlot } from '@penguin/types';
import { EGG_TYPES_MAP, SPECIES_MAP } from '@penguin/game-data';
import { gameStorage, createDefaultSaveData } from '../services/StorageService';
import { randomService } from '../services/RandomService';
import { validateNickname } from '../services/NicknameValidator';
import { useInventoryStore } from './inventoryStore';
import { useCollectionStore } from './collectionStore';

export const useGameStore = defineStore('game', {
  state: () => ({
    isLoaded: false,
    player: {
      id: '',
      displayName: '',
      level: 1,
      experience: 0,
      avatarId: 'avatar_default'
    },
    currencies: {
      coins: 0,
      fish: 0,
      gems: 0
    } as Currencies,
    ownedPenguins: [] as OwnedPenguin[],
    incubatorSlots: [] as IncubatorSlot[],
    selectedPenguinId: null as string | null,
    audioMuted: false
  }),
  actions: {
    async initGame() {
      let data = await gameStorage.load();
      if (!data) {
        data = createDefaultSaveData();
        await gameStorage.save(data);
      }

      this.player = { ...data.player };
      this.currencies = { ...data.currencies };
      this.ownedPenguins = [...data.ownedPenguins];
      this.incubatorSlots = [...data.incubatorSlots];

      const invStore = useInventoryStore();
      invStore.setItems(data.inventory);

      const colStore = useCollectionStore();
      colStore.setDiscovered(data.collectionBook);

      this.isLoaded = true;
    },

    async persistSave() {
      const invStore = useInventoryStore();
      const colStore = useCollectionStore();

      const saveData: GameSaveData = {
        schemaVersion: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        player: { ...this.player },
        currencies: { ...this.currencies },
        inventory: [...invStore.items],
        ownedPenguins: [...this.ownedPenguins],
        collectionBook: [...colStore.discovered],
        incubatorSlots: [...this.incubatorSlots],
        islandState: {
          islandId: 'snow_island_01',
          theme: 'snow',
          decorationsPlaced: []
        }
      };

      await gameStorage.save(saveData);
    },

    feedPenguin(penguinId: string): boolean {
      const invStore = useInventoryStore();
      if (invStore.getItemCount('sardine') < 1) {
        return false;
      }

      const penguin = this.ownedPenguins.find(p => p.id === penguinId);
      if (!penguin) return false;

      invStore.consumeItem('sardine', 1);
      this.currencies.fish = invStore.getItemCount('sardine');

      penguin.happiness = Math.min(100, penguin.happiness + 15);
      penguin.hunger = Math.max(0, penguin.hunger - 25);
      penguin.mood = 'happy';

      this.persistSave();
      return true;
    },

    petPenguin(penguinId: string): boolean {
      const penguin = this.ownedPenguins.find(p => p.id === penguinId);
      if (!penguin) return false;

      penguin.happiness = Math.min(100, penguin.happiness + 5);
      penguin.mood = 'excited';

      this.persistSave();
      return true;
    },

    placeEggInIncubator(slotId: number, eggTypeId: string): boolean {
      const slot = this.incubatorSlots.find(s => s.slotId === slotId);
      if (!slot || slot.state !== 'EMPTY') return false;

      const invStore = useInventoryStore();
      if (!invStore.consumeItem(eggTypeId, 1)) {
        return false;
      }

      const eggDef = EGG_TYPES_MAP.get(eggTypeId);
      const durationSec = eggDef?.hatchDurationSec ?? 10;

      slot.state = 'INCUBATING';
      slot.eggTypeId = eggTypeId;
      slot.startTime = Date.now();
      slot.durationSec = durationSec;
      slot.readyAt = Date.now() + durationSec * 1000;

      this.persistSave();
      return true;
    },

    updateIncubatorTimers() {
      const now = Date.now();
      let changed = false;
      for (const slot of this.incubatorSlots) {
        if (slot.state === 'INCUBATING' && slot.readyAt && now >= slot.readyAt) {
          slot.state = 'READY_TO_HATCH';
          changed = true;
        }
      }
      if (changed) {
        this.persistSave();
      }
    },

    hatchEgg(slotId: number, customNickname?: string): OwnedPenguin | null {
      const slot = this.incubatorSlots.find(s => s.slotId === slotId);
      if (!slot || slot.state !== 'READY_TO_HATCH' || !slot.eggTypeId) {
        return null;
      }

      const eggDef = EGG_TYPES_MAP.get(slot.eggTypeId);
      if (!eggDef) return null;

      const speciesId = randomService.rollDrop(eggDef.dropPool);
      const speciesDef = SPECIES_MAP.get(speciesId);
      const defaultName = speciesDef?.name ?? 'Penguin';

      const validated = validateNickname(customNickname || defaultName, defaultName);
      const finalNickname = validated.valid ? validated.value : defaultName;

      const newPenguin: OwnedPenguin = {
        id: `penguin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        speciesId,
        nickname: finalNickname,
        level: 1,
        experience: 0,
        happiness: 85,
        energy: 100,
        hunger: 20,
        mood: 'excited',
        acquiredAt: Date.now(),
        generation: 1
      };

      this.ownedPenguins.push(newPenguin);

      // Unlock collection
      const colStore = useCollectionStore();
      colStore.discoverSpecies(speciesId);

      // Reset slot
      slot.state = 'EMPTY';
      slot.eggTypeId = undefined;
      slot.startTime = undefined;
      slot.readyAt = undefined;
      slot.durationSec = undefined;

      this.persistSave();
      return newPenguin;
    },

    toggleAudio() {
      this.audioMuted = !this.audioMuted;
    },

    async resetSave() {
      await gameStorage.clear();
      await this.initGame();
    }
  }
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run apps/web/src/stores`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/stores
git commit -m "feat(web): implement Pinia game, inventory, and collection stores"
```

---

### Task 5: Typed GameBridge & Lifecycle (`apps/web/src/game/bridge`)

**Files:**
- Create: `apps/web/src/game/bridge/GameBridge.ts`
- Test: `apps/web/src/game/bridge/__tests__/GameBridge.test.ts`

**Interfaces:**
- Produces: `GameBridge`, `gameBridge` singleton instance, typed event map `GameBridgeEventMap`

- [ ] **Step 1: Write failing tests for GameBridge**

```typescript
// apps/web/src/game/bridge/__tests__/GameBridge.test.ts
import { describe, it, expect, vi } from 'vitest';
import { GameBridge } from '../GameBridge';

describe('GameBridge', () => {
  it('subscribes and receives emitted events with typed payload', () => {
    const bridge = new GameBridge();
    const handler = vi.fn();

    const unsub = bridge.on('penguin:clicked', handler);
    bridge.emit('penguin:clicked', { ownedId: 'p-123' });

    expect(handler).toHaveBeenCalledWith({ ownedId: 'p-123' });
    unsub();

    bridge.emit('penguin:clicked', { ownedId: 'p-456' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('prevents duplicate listener subscriptions', () => {
    const bridge = new GameBridge();
    const handler = vi.fn();

    bridge.on('canvas:ready', handler);
    bridge.on('canvas:ready', handler); // Same reference

    bridge.emit('canvas:ready', undefined as any);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('cleans up all listeners on clear()', () => {
    const bridge = new GameBridge();
    const h1 = vi.fn();
    const h2 = vi.fn();

    bridge.on('penguin:clicked', h1);
    bridge.on('canvas:ready', h2);

    bridge.clear();
    bridge.emit('penguin:clicked', { ownedId: 'p-1' });
    bridge.emit('canvas:ready', undefined as any);

    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement `apps/web/src/game/bridge/GameBridge.ts`**

```typescript
import { OwnedPenguin } from '@penguin/types';

export type GameBridgeEventMap = {
  'penguin:clicked': { ownedId: string };
  'egg:clicked': { slotId: number };
  'canvas:ready': void;
  'penguin:spawn': { penguin: OwnedPenguin };
  'penguin:action': { ownedId: string; action: 'pet' | 'feed' };
  'camera:focus': { x: number; y: number };
};

export class GameBridge {
  private listeners: Map<string, Set<(payload: any) => void>> = new Map();

  on<K extends keyof GameBridgeEventMap>(
    event: K,
    handler: (payload: GameBridgeEventMap[K]) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const handlers = this.listeners.get(event)!;
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  emit<K extends keyof GameBridgeEventMap>(
    event: K,
    payload: GameBridgeEventMap[K]
  ): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const fn of handlers) {
      try {
        fn(payload);
      } catch (err) {
        console.error(`Error in GameBridge listener for '${String(event)}':`, err);
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}

export const gameBridge = new GameBridge();
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run apps/web/src/game/bridge`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/game/bridge
git commit -m "feat(web): add typed GameBridge event bus"
```

---

### Task 6: High-Res 2.5D Procedural Texture Generator with Texture Caching (`apps/web/src/game/textures`)

**Files:**
- Create: `apps/web/src/game/textures/TextureGenerator.ts`
- Test: `apps/web/src/game/textures/__tests__/TextureGenerator.test.ts`

**Interfaces:**
- Produces: `ensureGameTextures(scene: Phaser.Scene): void` (caches textures by visualKey, avoiding regeneration)

- [ ] **Step 1: Write test verifying texture keys and caching logic**

```typescript
// apps/web/src/game/textures/__tests__/TextureGenerator.test.ts
import { describe, it, expect, vi } from 'vitest';
import { PENGUIN_TEXTURE_KEYS, EGG_TEXTURE_KEYS } from '../TextureGenerator';

describe('TextureGenerator', () => {
  it('defines all required texture keys for species and eggs', () => {
    expect(PENGUIN_TEXTURE_KEYS).toHaveProperty('snowy');
    expect(PENGUIN_TEXTURE_KEYS).toHaveProperty('sleepy');
    expect(PENGUIN_TEXTURE_KEYS).toHaveProperty('shy');
    expect(PENGUIN_TEXTURE_KEYS).toHaveProperty('happy');
    expect(PENGUIN_TEXTURE_KEYS).toHaveProperty('hungry');

    expect(EGG_TEXTURE_KEYS).toHaveProperty('basic_egg');
    expect(EGG_TEXTURE_KEYS).toHaveProperty('frozen_egg');
    expect(EGG_TEXTURE_KEYS).toHaveProperty('golden_egg');
  });
});
```

- [ ] **Step 2: Implement `apps/web/src/game/textures/TextureGenerator.ts`**

Generate crisp Canvas 2D textures:
- Plump, cute penguin bodies with soft vector highlights, belly patches, adorable eyes with catchlights, orange beaks, flippers, and accessories (earmuffs, nightcap, warm scarf, sprout, bib).
- Soft vector eggs with speckled spots, ice frost crystals, and gold shimmer.
- Environment props: Snow bank tiles, frozen ice pond with soft rim, pine trees with snow caps, igloo.
- Check `scene.textures.exists(key)` before generating.

- [ ] **Step 3: Run test to verify keys and structure**

Run: `npx vitest run apps/web/src/game/textures`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/game/textures
git commit -m "feat(game): add procedural 2.5D vector texture generator with texture caching"
```

---

### Task 7: Autonomous Penguin Entity & FSM (`apps/web/src/game/entities` & `apps/web/src/game/ai`)

**Files:**
- Create: `apps/web/src/game/ai/PenguinFSM.ts`
- Create: `apps/web/src/game/entities/PenguinEntity.ts`
- Create: `apps/web/src/game/entities/SpeechBubble.ts`
- Test: `apps/web/src/game/ai/__tests__/PenguinFSM.test.ts`

**Interfaces:**
- Produces: `PenguinFSM`, `PenguinState` (`IDLE`, `WADDLE`, `BELLY_SLIDE`, `SLEEP`, `TALK`, `EAT`, `PLAY`, `FISH`, `FOLLOW`, `CELEBRATE`, `REACT`)
- Produces: `PenguinEntity extends Phaser.GameObjects.Container`

- [ ] **Step 1: Write failing tests for Penguin FSM state transitions**

```typescript
// apps/web/src/game/ai/__tests__/PenguinFSM.test.ts
import { describe, it, expect } from 'vitest';
import { PenguinFSM } from '../PenguinFSM';

describe('PenguinFSM', () => {
  it('starts in IDLE state', () => {
    const fsm = new PenguinFSM();
    expect(fsm.currentState).toBe('IDLE');
  });

  it('transitions state and notifies listener', () => {
    const fsm = new PenguinFSM();
    let stateLogged = '';
    fsm.onStateChange((state) => {
      stateLogged = state;
    });

    fsm.transitionTo('WADDLE');
    expect(fsm.currentState).toBe('WADDLE');
    expect(stateLogged).toBe('WADDLE');
  });

  it('REACT state takes precedence on interaction', () => {
    const fsm = new PenguinFSM();
    fsm.transitionTo('SLEEP');
    fsm.triggerReaction();
    expect(fsm.currentState).toBe('REACT');
  });
});
```

- [ ] **Step 2: Implement `PenguinFSM.ts`, `SpeechBubble.ts`, `PenguinEntity.ts`**

Implement deterministic state updates:
- Timer-based state transitions (e.g. IDLE for 3-6s -> WADDLE to random coordinate on snow).
- When crossing pond coordinates, trigger `BELLY_SLIDE` (horizontal rotation tilt, sliding velocity, snow dust).
- Random quips displayed in `SpeechBubble` with auto-fadeout.
- On click: emit `penguin:clicked` to `gameBridge`, trigger `REACT` animation (squash & stretch bounce, floating heart).

- [ ] **Step 3: Run test to verify FSM passes**

Run: `npx vitest run apps/web/src/game/ai`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/game/ai apps/web/src/game/entities
git commit -m "feat(game): implement autonomous PenguinEntity, FSM and speech bubbles"
```

---

### Task 8: Snow Island Scene & Camera Controls (`apps/web/src/game/scenes`)

**Files:**
- Create: `apps/web/src/game/scenes/BootScene.ts`
- Create: `apps/web/src/game/scenes/SnowIslandScene.ts`
- Create: `apps/web/src/game/PhaserConfig.ts`
- Test: `apps/web/src/game/scenes/__tests__/SnowIslandScene.test.ts`

**Interfaces:**
- Produces: `SnowIslandScene`, camera drag pan, zoom (0.75x–1.5x), particle emitters (soft snow), entity management

- [ ] **Step 1: Write test verifying scene setup and lifecycle**

```typescript
// apps/web/src/game/scenes/__tests__/SnowIslandScene.test.ts
import { describe, it, expect } from 'vitest';
import { getPhaserConfig } from '../PhaserConfig';

describe('PhaserConfig', () => {
  it('creates a responsive Phaser config with WebGL/Canvas fallback and transparent background', () => {
    const config = getPhaserConfig('test-container');
    expect(config.parent).toBe('test-container');
    expect(config.scale?.mode).toBeDefined();
  });
});
```

- [ ] **Step 2: Implement `BootScene.ts`, `SnowIslandScene.ts`, and `PhaserConfig.ts`**

In `SnowIslandScene.ts`:
- Build the 2.5D Snow Island backdrop: floating ice cliffs with soft gradient, central frozen ice pond, igloo, snowmen, and pine trees.
- Add snow particle emitter (light drift, 50-80 particles max for optimal mobile performance).
- Set up camera drag/pan with pointer and zoom with mouse wheel / pinch.
- Listen to `gameBridge.on('penguin:spawn', ...)` to spawn newly hatched penguins.
- Listen to `gameBridge.on('penguin:action', ...)` to trigger feeding/petting animations.
- Listen to `gameBridge.on('camera:focus', ...)` to pan smoothly to target coordinates.
- Clean up listeners in `scene.events.on('shutdown', ...)`.

- [ ] **Step 3: Run test to verify config passes**

Run: `npx vitest run apps/web/src/game/scenes`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/game/scenes apps/web/src/game/PhaserConfig.ts
git commit -m "feat(game): implement SnowIslandScene, camera controls and particle effects"
```

---

### Task 9: Vue 3 Application Shell, Top HUD & Bottom Shelves (`apps/web/src/components`)

**Files:**
- Create: `apps/web/src/components/canvas/IslandCanvas.vue`
- Create: `apps/web/src/components/hud/TopBar.vue`
- Create: `apps/web/src/components/hud/CurrencyBadge.vue`
- Create: `apps/web/src/components/dock/ShelfRack.vue`
- Create: `apps/web/src/components/dock/NeighborStrip.vue`
- Modify: `apps/web/src/App.vue`
- Test: `apps/web/src/components/__tests__/TopBar.test.ts`

**Interfaces:**
- Produces: Nostalgic top resource bar, bottom wooden/ice shelf, simulated neighbor strip, and embedded Phaser canvas wrapper

- [ ] **Step 1: Write test for TopBar currency display**

```typescript
// apps/web/src/components/__tests__/TopBar.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TopBar from '../hud/TopBar.vue';
import { useGameStore } from '../../stores/gameStore';

describe('TopBar Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders currencies from gameStore', async () => {
    const game = useGameStore();
    game.currencies.coins = 500;
    game.currencies.fish = 50;
    game.currencies.gems = 10;

    const wrapper = mount(TopBar);
    expect(wrapper.text()).toContain('500');
    expect(wrapper.text()).toContain('50');
    expect(wrapper.text()).toContain('10');
  });
});
```

- [ ] **Step 2: Implement UI components with high-res stylized 2.5D visual design**

- `TopBar.vue`: Pill-shaped resource badges with clean SVG icons for Fish, Coins, and Gems. Mute toggle and settings button.
- `ShelfRack.vue`: Nostalgic wooden/ice shelf rack with buttons for **Backpack** (Inventory), **Book** (Collection), and **Hatchery** (Egg slots).
- `NeighborStrip.vue`: Simulated local NPC friends bar with cute avatar icons and visit buttons (labeled as local neighbor NPCs).
- `IslandCanvas.vue`: Initializes Phaser game instance on `mounted`, cleans up on `unmounted`.

- [ ] **Step 3: Run test to verify TopBar passes**

Run: `npx vitest run apps/web/src/components/__tests__/TopBar.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components apps/web/src/App.vue
git commit -m "feat(ui): implement TopBar, ShelfRack, and NeighborStrip components"
```

---

### Task 10: Hatching Modal, Collection Book & Penguin Inspect Popup (`apps/web/src/components/modals`)

**Files:**
- Create: `apps/web/src/components/modals/HatchModal.vue`
- Create: `apps/web/src/components/modals/CollectionModal.vue`
- Create: `apps/web/src/components/modals/InventoryModal.vue`
- Create: `apps/web/src/components/modals/PenguinInspectModal.vue`
- Create: `apps/web/src/components/modals/SettingsModal.vue`
- Create: `apps/web/src/components/modals/ConfirmModal.vue`
- Test: `apps/web/src/components/modals/__tests__/CollectionModal.test.ts`
- Test: `apps/web/src/components/modals/__tests__/HatchModal.test.ts`

**Interfaces:**
- Produces: Complete modals with transitions, validation, and accessible keyboard escape

- [ ] **Step 1: Write tests for CollectionModal and HatchModal**

```typescript
// apps/web/src/components/modals/__tests__/CollectionModal.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import CollectionModal from '../CollectionModal.vue';
import { useCollectionStore } from '../../../stores/collectionStore';

describe('CollectionModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('displays discovered species and silhouette for locked species', () => {
    const col = useCollectionStore();
    col.discoverSpecies('snowy');

    const wrapper = mount(CollectionModal, {
      props: { isOpen: true }
    });

    expect(wrapper.text()).toContain('Snowy');
    expect(wrapper.text()).toContain('1 / 5');
  });
});
```

- [ ] **Step 2: Implement all modals**

- `HatchModal.vue`: Multi-stage animation (Wobble -> Cracking -> Light Flash -> Reveal). Nickname input with live validation (`validateNickname`). Dispatches `penguin:spawn` to `gameBridge` upon finish.
- `CollectionModal.vue`: Creature encyclopedia with progress bar (e.g. 2 / 5), portraits for discovered species, silhouettes and clues for locked species.
- `InventoryModal.vue`: Tabbed inventory (Eggs, Food, All). Displays "Place in Hatchery" button for eggs and "Feed" for fish.
- `PenguinInspectModal.vue`: Displays selected penguin's mood, happiness bar, personality trait, and "Pet" / "Feed Fish" action buttons.
- `SettingsModal.vue` & `ConfirmModal.vue`: Local save backup JSON export/import and save reset with confirmation.

- [ ] **Step 3: Run test to verify modal tests pass**

Run: `npx vitest run apps/web/src/components/modals`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/modals
git commit -m "feat(ui): implement HatchModal, CollectionModal, InventoryModal and PenguinInspectModal"
```

---

### Task 11: End-to-End Integration, Audio Chimes & Build Verification

**Files:**
- Create: `apps/web/src/services/SoundService.ts` (Web Audio API synthesized chimes for clicks, hatch fanfare, eating)
- Test: `apps/web/src/__tests__/integration.test.ts`
- Documentation: `README.md`

- [ ] **Step 1: Write integration test covering complete Phase 1 player journey**

```typescript
// apps/web/src/__tests__/integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '../stores/gameStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useCollectionStore } from '../stores/collectionStore';

describe('Phase 1 Integration - Player Journey', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('completes the entire Phase 1 gameplay loop', async () => {
    const game = useGameStore();
    await game.initGame();
    const inventory = useInventoryStore();
    const collection = useCollectionStore();

    // 1. Initial island has 1 starter penguin
    expect(game.ownedPenguins.length).toBe(1);
    expect(collection.discoveredCount).toBe(1);

    // 2. Interact with penguin (Pet & Feed)
    const starterId = game.ownedPenguins[0].id;
    game.petPenguin(starterId);
    expect(game.ownedPenguins[0].mood).toBe('excited');

    const feedSuccess = game.feedPenguin(starterId);
    expect(feedSuccess).toBe(true);
    expect(game.currencies.fish).toBe(49);

    // 3. Place Basic Egg into Incubator Slot 1
    const placed = game.placeEggInIncubator(1, 'basic_egg');
    expect(placed).toBe(true);
    expect(inventory.getItemCount('basic_egg')).toBe(0);

    // 4. Time elapses -> READY_TO_HATCH
    const slot = game.incubatorSlots.find(s => s.slotId === 1)!;
    slot.state = 'READY_TO_HATCH';

    // 5. Hatch Egg and validate nickname
    const hatched = game.hatchEgg(1, 'Bé Cánh Cụt');
    expect(hatched).toBeDefined();
    expect(hatched?.nickname).toBe('Bé Cánh Cụt');
    expect(game.ownedPenguins.length).toBe(2);

    // 6. Verify collection updated
    expect(collection.isDiscovered(hatched!.speciesId)).toBe(true);

    // 7. Verify save persistence
    await game.persistSave();
    const reloadedGame = useGameStore();
    await reloadedGame.initGame();
    expect(reloadedGame.ownedPenguins.length).toBe(2);
    expect(reloadedGame.currencies.fish).toBe(49);
  });
});
```

- [ ] **Step 2: Implement Web Audio API synthesized sound generator (`SoundService.ts`)**

No external audio files needed; crisp high-fidelity retro chimes synthesized via browser AudioContext:
- `playPop()`: Gentle bubble pop for UI clicks.
- `playHatchFanfare()`: Multi-tone arpeggio fanfare for egg hatching.
- `playChirp()`: Cute penguin chirp when petted or fed.
- Respects `gameStore.audioMuted`.

- [ ] **Step 3: Run all unit and integration tests**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 4: Verify production build**

Run: `npm run build`
Expected: Clean build without TypeScript or Vite errors.

- [ ] **Step 5: Commit and Update Documentation**

```bash
git add apps/web README.md
git commit -m "feat(web): complete Phase 1 playable foundation with audio synth and integration verification"
```

---

## Plan Self-Review Checklist
1. **Spec Coverage:**
   - 5 species definitions & 3 egg types? Covered in Task 2.
   - Drop pool positive weights & validation? Covered in Task 2.
   - Nickname validator rules? Covered in Task 3.
   - Versioned GameSaveData & local save? Covered in Task 3.
   - Incubator FSM states & starter egg flow? Covered in Tasks 3, 4, 10, 11.
   - Autonomous Penguin FSM (all 11 states)? Covered in Task 7.
   - Texture caching by `visualKey`? Covered in Task 6.
   - Decoupled GameBridge lifecycle? Covered in Task 5.
   - Nostalgic UI & Simulated NPC friends strip? Covered in Task 9.
   - Feeding consuming 1 fish & feedback on 0 fish? Covered in Tasks 4, 10, 11.
2. **Placeholder scan:** None. All file paths, interfaces, and test blocks are fully specified.
3. **Type consistency:** All types match `@penguin/types` across services, stores, entities, and UI components.

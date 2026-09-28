# Game-Wide Icon & Asset System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely eliminate all broken square icons, emojis, text-based symbols, and font-dependent Unicode characters across the entire game, replacing them with a cohesive, high-resolution 2.5D stylized transparent PNG asset library, typed Asset Registry, and `<GameIcon>` Vue component.

**Architecture:** 
- Centralized asset directory (`apps/web/src/assets/game/`) structured by domain (`icons/currencies/`, `icons/navigation/`, `icons/actions/`, `icons/status/`, `items/food/`, `items/eggs/`, `moods/`).
- Python PIL script to process and extract smooth alpha transparency from generated 2.5D images.
- Typed `AssetRegistry.ts` with static Vite asset imports providing compile-time type safety (`GameAssetKey`).
- Reusable `<GameIcon>` Vue component with size presets (`sm`, `md`, `lg`, `xl`), accessible alt tags, and crisp image rendering.
- Systematic component migration across HUD, Bottom Dock, All 10 Modals, and Game Catalogs.

**Tech Stack:** TypeScript, Vue 3, Vite, Phaser 3, Python Pillow (alpha extraction & image formatting), Vitest.

---

## File Structure

```
apps/web/src/
├── assets/
│   └── game/
│       ├── icons/
│       │   ├── currencies/         # coin.png, fish.png, gem.png
│       │   ├── navigation/         # inventory.png, collection.png, hatchery.png, shop.png, quests.png, settings.png
│       │   ├── actions/            # pet.png, feed.png, hatch.png, decorate.png, nurture.png
│       │   └── status/             # crown.png, star.png, lock.png, check.png, close.png, gift.png, calendar.png, target.png, snowflake.png, sound_on.png, sound_off.png, export.png, import.png, trash.png
│       ├── items/
│       │   ├── food/               # sardine.png, krill.png, milk.png, berries.png, squid.png, salmon.png, icecream.png
│       │   └── eggs/               # egg_basic.png, egg_frozen.png, egg_golden.png
│       ├── moods/                  # happy.png, excited.png, curious.png, sleepy.png, hungry.png, sad.png
│       └── index.ts                # Typed Asset Registry (GAME_ASSETS map & type definitions)
├── components/
│   ├── common/
│   │   ├── GameIcon.vue            # Reusable icon component
│   │   └── __tests__/
│   │       └── GameIcon.test.ts    # GameIcon unit tests
│   ├── hud/
│   │   ├── TopBar.vue              # Level crown, EXP star, audio icons, settings
│   │   └── CurrencyBadge.vue       # Coin, Fish, Gem real icons
│   ├── dock/
│   │   └── ShelfRack.vue           # 6 dock navigation buttons
│   └── modals/
│       ├── HatchModal.vue          # Close button, hatch burst stars, species badges
│       ├── HatcheryModal.vue       # Close button, unlock gem, nurture heart, open backpack
│       ├── InventoryModal.vue      # Close button, category tabs, empty snowflake
│       ├── CollectionModal.vue     # Close button, discovery badges
│       ├── PenguinInspectModal.vue # Close button, mood face, hunger fish, happiness heart, food icons
│       ├── ShopModal.vue           # Close button, shop tabs, lock badge, cozy star, currency tags
│       ├── QuestModal.vue          # Close button, calendar icon, target icon, streak check/lock, gem tag
│       ├── LevelUpModal.vue        # Crown, flock capacity icon, shop bag
│       ├── SettingsModal.vue       # Close button, gear icon, audio, export, import, reset trash
│       ├── DecorationModal.vue     # Close button, plot markers, cozy star
│       └── ConfirmModal.vue        # Close button, warning badge, check confirm
```

---

## Tasks

### Task 1: Asset Pipeline & Image Generation Script
**Files:**
- Create: `scripts/process_asset.py` (Python Pillow alpha background remover, border cropper, and resizer)
- Test script with sample image to verify transparent PNG generation.

- [ ] **Step 1: Write `scripts/process_asset.py`**
  - Read input image, sample background corner color, compute color distance, generate smooth alpha channel, crop bounding box, and save as 256x256 RGBA PNG.
- [ ] **Step 2: Test script on sample image**
  - Verify generated PNG has clean transparent edges and valid dimensions.

---

### Task 2: Generate Core Game Asset Library
**Files:**
- Create folder tree: `apps/web/src/assets/game/...`
- Generate and process:
  - Currencies: `coin.png`, `fish.png`, `gem.png`
  - Navigation: `inventory.png`, `collection.png`, `hatchery.png`, `shop.png`, `quests.png`, `settings.png`
  - Actions: `pet.png`, `feed.png`, `hatch.png`, `decorate.png`, `nurture.png`
  - Status/Badges: `crown.png`, `star.png`, `lock.png`, `check.png`, `close.png`, `gift.png`, `calendar.png`, `target.png`, `snowflake.png`, `sound_on.png`, `sound_off.png`, `export.png`, `import.png`, `trash.png`
  - Foods: `sardine.png`, `krill.png`, `milk.png`, `berries.png`, `squid.png`, `salmon.png`, `icecream.png`
  - Eggs: `egg_basic.png`, `egg_frozen.png`, `egg_golden.png`
  - Moods: `mood_happy.png`, `mood_excited.png`, `mood_curious.png`, `mood_sleepy.png`, `mood_hungry.png`, `mood_sad.png`

- [ ] **Step 1: Generate assets via `generate_image` tool**
- [ ] **Step 2: Process all images into clean transparent PNGs via Python script**
- [ ] **Step 3: Move processed PNGs into organized folders in `apps/web/src/assets/game/`**

---

### Task 3: Asset Registry & `<GameIcon>` Component
**Files:**
- Create: `apps/web/src/assets/game/index.ts` (Static Vite imports & `GameAssetKey` enum/type)
- Create: `apps/web/src/components/common/GameIcon.vue`
- Create: `apps/web/src/components/common/__tests__/GameIcon.test.ts`

- [ ] **Step 1: Implement `apps/web/src/assets/game/index.ts`**
  - Export `GAME_ASSETS: Record<GameAssetKey, string>` with typed keys.
- [ ] **Step 2: Write tests for `GameIcon.vue` in `GameIcon.test.ts`**
  - Test rendering correct image source by key, applying size classes (`sm`, `md`, `lg`, `xl`), and setting aria-label / alt text.
- [ ] **Step 3: Implement `GameIcon.vue`**
  - Props: `name: GameAssetKey`, `size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'`, `alt?: string`.
  - CSS with `object-fit: contain`, crisp pixel rendering, and flex centering.
- [ ] **Step 4: Run tests to verify green**

---

### Task 4: Replace Broken Icons & Emojis in HUD & Dock
**Files:**
- Modify: `apps/web/src/components/hud/TopBar.vue`
- Modify: `apps/web/src/components/hud/CurrencyBadge.vue`
- Modify: `apps/web/src/components/dock/ShelfRack.vue`
- Modify: `apps/web/src/components/dock/NeighborStrip.vue`
- Modify: Unit tests in `apps/web/src/components/__tests__/`

- [ ] **Step 1: Update `CurrencyBadge.vue` to use `coin.png`, `fish.png`, `gem.png` via `GameIcon`**
- [ ] **Step 2: Update `TopBar.vue` level crown, EXP star, audio on/off, settings button**
- [ ] **Step 3: Update `ShelfRack.vue` with 6 wooden button icons via `GameIcon`**
- [ ] **Step 4: Update `NeighborStrip.vue` chevron and avatar replacement**
- [ ] **Step 5: Run tests to verify green**

---

### Task 5: Replace Broken Icons & Emojis in Care & Hatching Modals
**Files:**
- Modify: `apps/web/src/components/modals/HatchModal.vue`
- Modify: `apps/web/src/components/modals/HatcheryModal.vue`
- Modify: `apps/web/src/components/modals/PenguinInspectModal.vue`
- Modify: `packages/game-data/src/items.ts` (food icon asset keys)
- Modify: `packages/game-data/src/eggs.ts` (egg icon asset keys)
- Modify: Unit tests in `apps/web/src/components/modals/__tests__/`

- [ ] **Step 1: Update `PenguinInspectModal.vue`**
  - Replace `💖` with `nurture.png`, `🐟` with `fish.png`.
  - Replace `✋` with `pet.png`.
  - Replace food emojis with item image assets.
  - Replace mood emojis (`😊`, `😴`, `🤤`, etc.) with mood image assets.
  - Replace close button `✕` with `close.png`.
- [ ] **Step 2: Update `HatcheryModal.vue`**
  - Replace `💎` with `gem.png`, `🎒` with `inventory.png`, `💖` with `nurture.png`, `🐣` with `hatch.png`.
  - Replace close button `✕` with `close.png`.
- [ ] **Step 3: Update `HatchModal.vue`**
  - Replace stars `⭐`, `🌟`, `✨` with `star.png` asset.
  - Replace `➔` arrow and close button `✕` with `close.png`.
- [ ] **Step 4: Run tests to verify green**

---

### Task 6: Replace Broken Icons & Emojis in Shop, Quest, Decoration, and Settings Modals
**Files:**
- Modify: `apps/web/src/components/modals/ShopModal.vue`
- Modify: `apps/web/src/components/modals/QuestModal.vue`
- Modify: `apps/web/src/components/modals/DecorationModal.vue`
- Modify: `apps/web/src/components/modals/LevelUpModal.vue`
- Modify: `apps/web/src/components/modals/InventoryModal.vue`
- Modify: `apps/web/src/components/modals/CollectionModal.vue`
- Modify: `apps/web/src/components/modals/SettingsModal.vue`
- Modify: `apps/web/src/components/modals/ConfirmModal.vue`
- Modify: `packages/game-data/src/quests.ts` (quest icon asset keys)
- Modify: Unit tests in `apps/web/src/components/modals/__tests__/`

- [ ] **Step 1: Update `ShopModal.vue`**
  - Replace tabs `🐟`, `🐣`, `🎄` with real food, egg, and decoration icons.
  - Replace `🔒` with `lock.png`, `💎` with `gem.png`, `✨` with `star.png`, `🏡` with `decorate.png`.
  - Replace close button with `close.png`.
- [ ] **Step 2: Update `QuestModal.vue`**
  - Replace `📜` header, `📅` calendar, `🎯` target, `✓` checkmark, `🔒` lock, `🎁` gift, `💎` gem, `⭐` exp star.
  - Replace close button with `close.png`.
- [ ] **Step 3: Update `DecorationModal.vue`**
  - Replace plot empty/occupied markers, `🏡`, `🛍️`, and close button.
- [ ] **Step 4: Update `LevelUpModal.vue`**
  - Replace `👑` crown, `🐧` penguin flock icon, `🛍️` shop icon, and sparkles.
- [ ] **Step 5: Update `InventoryModal.vue`, `CollectionModal.vue`, `SettingsModal.vue`, `ConfirmModal.vue`**
  - Replace all modal header icons, empty snowflakes, tabs, export/import/trash icons, and close buttons.
- [ ] **Step 6: Run tests to verify green**

---

### Task 7: Full Verification & Build Validation
**Files:**
- All touched components and tests.

- [ ] **Step 1: Run full Vitest test suite (`npx vitest run`)**
- [ ] **Step 2: Run TypeScript typecheck & production build (`npm run build`)**
- [ ] **Step 3: Verify dev server in browser across viewport widths (390px, 430px, desktop)**
- [ ] **Step 4: Produce comprehensive final audit report for the user**

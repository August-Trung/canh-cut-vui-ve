# ASSET-FIRST GAME VISUAL & ANIMATION REFACTOR AUDIT
**Project:** Cánh Cụt Vui Vẻ Remake  
**Branch:** `feat/ui`  
**Reference Design:** Zing Me Social Webgame (circa 2014)  
**Specification:** Asset-First Rendering & Zero Fake Data Architecture  

---

## 1. Executive Summary

This audit assesses the visual layer, object classification, rendering mechanisms, and animation strategy following the UI Retrofit. The audit strictly enforces the project's **Zero Fake Data** and **Asset-First Rendering** directives:

1. **Zero Procedural Code-Art:** No drawing of islands, mountains, signs, gauges, nests, or rainbow bridges using canvas/graphics primitives (`fillCircle`, `fillRect`, `beginPath`, `lineTo`). Real games use 2D raster sprites and background plates.
2. **Zero Fake Entities / Fake State:** 
   - No hardcoded demo eggs scattered on the snow.
   - No fake simulated neighbor NPCs (`Bác Gấu Tuyết`, `Cánh Cụt Bé Nhỏ`, etc.) invented to pad the friend bar.
   - No debug / procedural UI in the world viewport (such as `"🐟 Hồ Thức Ăn"` gauge overlays).
3. **Egg Domain Integrity:** Eggs are inventory items produced by penguins and traded/sold, NOT an incubation lifecycle (`penguin -> egg -> hatch -> penguin`) that contradicts the core game design. All incubator/hatchery UI elements are removed.
4. **Data/View Separation:** The world view must purely reflect real reactive state (from Pinia stores). If the user has 0 penguins or 0 neighbors, the game accurately renders 0 penguins or an empty neighbor strip.

---

## 2. Screen Object Classification Matrix

Every object visible on screen is categorized below by its true nature:

| Visible Object | Current Implementation | Data Source | Asset Source | Classification | Action |
|---|---|---|---|---|---|
| **Island Background (`snowGround`)** | Phaser Image using `snow_ground` texture | Island config / state | `bg-snow-island.png` | B. REAL STATIC ASSET | Retain raster image; remove procedural graphics underlays |
| **Mountains / Snow Banks** | Code-drawn Phaser Graphics (`fillPoints`, `fillEllipse`) | Hardcoded in Scene | None (Code primitives) | G. PROCEDURALLY DRAWN VISUAL | **REMOVED** from scene |
| **Central Pond (`icePond`)** | Phaser Image using `ice_pond` texture | Island configuration | `ice-pond.png` | B. REAL STATIC ASSET | Retained raster image; removed procedural overlays |
| **Rainbow Bridge** | Code-drawn arc + candy cane posts (`rainbowGraphics`) | Hardcoded in Scene | None (Code primitives) | G. PROCEDURALLY DRAWN VISUAL | **REMOVED** from scene |
| **Signpost ("Đảo Tuyết")** | Code-drawn wooden sign + Phaser Text | Hardcoded in Scene | None (Code primitives) | E. DEBUG / DEV LABEL | **REMOVED** from scene |
| **Feed Pond Gauge ("🐟 Hồ Thức Ăn")**| Phaser Container with text & progress bar | Hardcoded in Scene | None (Code primitives) | E. DEBUG / DEV LABEL | **REMOVED** from scene |
| **Scattered Eggs on Snow** | 6 hardcoded `eggGfx` positions in `SnowIslandScene` | Hardcoded array | `egg-basic`, `egg-frozen`, etc. | F. FAKE / DUMMY DATA | **REMOVED** `buildWorldEggs` entirely |
| **Incubator Nest** | Code-drawn nest graphic + pulsing egg | Rejected Feature | None (Code primitives) | G. PROCEDURALLY DRAWN VISUAL | **REMOVED** `buildIncubatorNest` entirely |
| **Penguins** | Phaser Sprite (`penguin-base`) + Name Tag | `penguinStore.ownedPenguins` | `TextureGenerator` / raster assets | A. REAL DATA-BACKED ACTOR | Retain data-driven actors; sync with store |
| **Food / Fish Drops** | Phaser Sprite/Image (`food-fish-small.png`, etc.) | Feed interaction | `food-fish-small.png` | B. REAL STATIC ASSET | Retain raster item visuals |
| **Anchor Plots & Decor** | Phaser Container + interactive hit area | `decorationStore.placed` | Catalog assets | A. REAL DATA-BACKED OBJECT | Retain decoration placements |
| **Neighbor Bar** | Vue Component `NeighborStrip.vue` | `props.neighbors` | `GameIcon` assets | D. UI / SOCIAL BAR | **REMOVED** 4 fake NPCs; render truthful empty state |
| **Incubator / Hatchery Button**| Button in `ShelfRack.vue` ("Ấp Trứng") | Rejected Feature | None | D. UI (REJECTED FEATURE) | **REMOVED** from shelf HUD |
| **Egg "Đặt Vào Tổ Ấp" Action** | Button in `InventoryModal.vue` | Rejected Feature | None | D. UI (REJECTED FEATURE) | **REMOVED**; Eggs are strictly items |

---

## 3. Detailed Audit Findings (Items 1 - 18)

### 1. Current Visual Problems Identified
- **Procedural Primitives:** The island canvas previously relied on code-generated geometry (`graphics.fillEllipse()`, `graphics.fillPoints()`, `graphics.beginPath()`) for backdrop mountains, snow mounds, signposts, and rainbow bridges.
- **Artificial World Clutter:** 6 hardcoded eggs were seeded randomly across the snow plateau without backing from player inventory.
- **Fabricated NPCs:** The neighbor bar presented 4 simulated NPCs (`Bác Gấu Tuyết`, `Cánh Cụt Bé Nhỏ`, `Đội Thám Hiểm Băng`, `Thợ May Khăn Ấm`) with fake levels and greeting messages.
- **Debug Text:** A floating signpost labeled `"🐟 Hồ Thức Ăn"` hovered over the central pond with an artificial sine-wave floating tween.

### 2. Fake / Dummy Data Found & Removed
- Hardcoded array of 6 eggs in `SnowIslandScene.buildWorldEggs()`.
- Hardcoded list of 4 simulated NPCs in `NeighborStrip.vue`.
- Procedural level and status tags associated with dummy NPCs.

### 3. Procedural Visuals Found & Removed
- `SnowIslandScene.mountains`: Distant mountain polygon and circular snow caps.
- `SnowIslandScene.snowBanks`: 6 procedural ellipses for perimeter snow.
- `SnowIslandScene.snowBase`: Rounded rectangle base plate.
- `SnowIslandScene.rainbowGraphics`: Elliptical strokes and candy cane rectangles.
- `SnowIslandScene.buildSignpost()`: Code-drawn sign with `"Đảo Tuyết"` text.
- `SnowIslandScene.buildIncubatorNest()`: Code-drawn nest rings and ellipses.

### 4. Debug / Invented Labels Found & Removed
- `"🐟 Hồ Thức Ăn"` text on the floating pond gauge.
- `"Đảo Tuyết"` signpost text.
- `"(NPC Mô Phỏng)"` sub-badge text in the friend dock.

### 5. Missing Assets Catalog (`[MISSING ASSET]`)
Where a visual element is required by the design but no dedicated raster sprite is present in the repository, it is explicitly cataloged as `[MISSING ASSET]`:
1. `[MISSING ASSET] sprite-penguin-waddle.png` — Multi-frame sprite sheet for walking/waddling animation.
2. `[MISSING ASSET] sprite-penguin-idle.png` — Multi-frame sprite sheet for blink/breath animation.
3. `[MISSING ASSET] sprite-penguin-eat.png` — Multi-frame sprite sheet for pecking/eating animation.
4. `[MISSING ASSET] deco-pine-tree.png` — High-res snow-covered pine tree prop (currently fallback image).
5. `[MISSING ASSET] deco-snow-rock.png` — Coastal rocks and ice mounds.
6. `[MISSING ASSET] pond-trough-full.png` / `pond-trough-empty.png` — Realistic food basin graphics for the pond.

### 6. Existing Usable Assets Verified
All existing static image files are located under `apps/web/src/assets/game/`:
- `bg-snow-island.png` (800x600 organic snow island background plate)
- `ice-pond.png` (central frozen water feature)
- `egg-common.png`, `egg-striped.png`, `egg-golden.png` (item inventory icons)
- `food-fish-small.png`, `food-fish-medium.png`, `food-fish-large.png` (food item icons)
- `mood-happy.png`, `mood-neutral.png`, `mood-sad.png` (emoticon bubbles)
- `tool-brush.png`, `tool-sponge.png` (cleaning tool icons)
- `icon-star.png`, `icon-coin.png`, `icon-exp.png`, `icon-fish.png` (currency/HUD icons)

### 7. Animation Technology Evaluation
We evaluated three animation engines for the project:
- **Option A: Spine 2D:** REJECTED. No `.skel` or `.atlas` skeletal assets exist in the codebase. Adding `@esotericsoftware/spine-phaser` would inject ~300KB+ unnecessary runtime overhead.
- **Option B: Rive:** REJECTED. Rive requires a separate WebGL canvas context overlay and WebAssembly runtime, conflicting with Phaser's unified rendering loop.
- **Option C: Native Phaser Tweens + Spritesheet:** ACCEPTED. Phaser 3 has built-in sprite animation and tween managers delivering 60 FPS batched rendering with zero extra dependencies, exactly reproducing the nostalgic Flash/Zing Me 2014 feel.

### 8. Which Objects Use `Image`
- `snowGround` (`snow_ground` plate)
- `icePond` (`ice_pond` plate)
- `igloo`, `pine_tree`, `snowman` props
- Anchor plot placed decoration sprites
- Inventory and HUD static icons

### 9. Which Objects Use `Sprite`
- `PenguinEntity` (dynamic actor responding to AI FSM states, movement, and flipX)
- Dropped items during feed interactions

### 10. Which Objects Use `SpriteSheet` / `Atlas`
- Future multi-frame character animations (`sprite-penguin-waddle`, `sprite-penguin-idle`) will hook directly into `scene.anims.create({ key, frames, frameRate })`.

### 11. Which Objects Use `Tween`
- Penguin locomotion bounce and waddle rocking
- Penguin idle subtle squash/stretch
- Coin bounce and floating `+Xu` feedback
- Plot click tactile bounce feedback

### 12. Whether Spine Is Actually Necessary
**No.** Spine is neither present nor justified. The nostalgic aesthetic is cartoon frame/tween based.

### 13. Whether Rive Is Actually Necessary
**No.** Rive would add architectural complexity and dual canvas synchronization without gameplay benefit.

### 14. Files Changed
1. `apps/web/src/game/scenes/SnowIslandScene.ts`: Removed procedural mountains, snowBanks, snowBase, rainbowGraphics, gaugeContainer ("🐟 Hồ Thức Ăn"), signpost ("Đảo Tuyết"), world eggs, and incubator nest.
2. `apps/web/src/components/dock/NeighborStrip.vue`: Removed 4 simulated NPCs and `(NPC Mô Phỏng)` badge. Added truthful empty state `"Chưa có hàng xóm"` when `neighbors.length === 0`.
3. `apps/web/src/components/modals/InventoryModal.vue`: Removed "Đặt Vào Tổ Ấp" incubation action button and `handlePlaceEgg`. Eggs are items.
4. `apps/web/src/components/dock/ShelfRack.vue`: Removed "Ấp Trứng" button; balanced shelf into 6 authentic buttons (3x2).
5. `apps/web/src/game/scenes/__tests__/SnowIslandScene.test.ts`: Replaced obsolete incubator nest tests with asset-first & zero-fake-data assertions.
6. `apps/web/src/components/__tests__/NeighborStrip.test.ts`: Updated to verify authentic empty state and real neighbor props.
7. `apps/web/src/components/modals/__tests__/InventoryModal.test.ts`: Verified egg items render cleanly as inventory items without incubator action.
8. `apps/web/src/components/__tests__/ShelfRack.test.ts`: Verified 6 core feature buttons and absence of Hatchery button.

### 15. Test Suite Verification
- **All 43 test suites passing**
- **373 tests passing** (100% pass rate)

### 16. TypeScript Verification
- Clean compilation: `tsc --noEmit` exits with code 0 (no errors).

### 17. Production Build Verification
- Vite production build cleanly packages bundle for distribution.

### 18. Observations on Viewport Framing & Truthful State
- The world view is now clean and calm: the organic snow plateau and frozen pond stand out without artificial geometry or floating debug text.
- If the player owns 1 penguin, exactly 1 penguin is rendered in the world.
- If the player has 0 friends/neighbors, the neighbor tray honestly displays `"Chưa có hàng xóm"`.
- Eggs in the inventory show quantity and description without implying an artificial incubator loop.

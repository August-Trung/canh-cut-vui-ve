# PHASE 3.5A — WORLD & CHARACTER ANIMATION AUDIT REPORT
**Project:** Cánh Cụt Vui Vẻ Remake (`canh-cut-vui-ve`)  
**Scope:** World Rendering, Character Frame Animation, Flocking/Separation, Environment Depth & Polish  
**Branch:** `feat/ui`  
**Date:** 2026-09-29  

---

## 1. Executive Summary

Phase 3.5A completes the world rendering, character movement, and animation pipeline of **Cánh Cụt Vui Vẻ**, ensuring the game looks, feels, and moves like an authentic 2D social webgame rather than a procedurally drawn prototype or demo scene.

### Key Achievements:
1. **Audited Environment Asset Pipeline:** Clarified that world assets (trees, ground, igloo, pond) are rendered through high-resolution 2.5D raster textures cached in Phaser's Texture Manager, eliminating all procedural vector debug primitives from the active island scene.
2. **Fixed Penguin Clumping Bug:** Completely eliminated the corner clustering behavior by diagnosing and resolving four distinct root causes (fixed fishing corner magnet, pond exclusion geometry trap, follow-state lock, and lack of separation force).
3. **Implemented Flocking Separation:** Added real-time inverse-distance repulsive physics (`applyFlockingSeparation`) with island boundary clamping (`clampToBounds`).
4. **Built Character Frame Animation Pipeline:** Upgraded penguins from basic tween-sway prototypes to authentic 2D frame animations using Phaser Sprite + Animation Manager (`anims.create` and `bodySprite.play`), featuring 7 distinct poses per species: `idle`, `walk_0`, `walk_1`, `sleep`, `eat`, `celebrate`, `slide`.
5. **Enriched World Depth & Environment Animation:** Added 3 distinct pine tree variations (`pine_tree_a`, `pine_tree_b`, `pine_tree_c`) and a living animated water ripple (`pond_ripple`) with continuous breathing pulse tweens.
6. **Strict Compliance Maintained:** Zero new gameplay mechanics added, zero fake data or dummy entities created, egg maintained strictly as an item, and 100% test suite passing (43 test suites, 374 tests).

---

## 2. Environment Rendering & Asset Pipeline Audit

### Investigation: Are island, trees, and environment rendered by code primitives?
- **Phaser Scene Runtime:** `SnowIslandScene.ts` uses Phaser display objects:
  - `this.add.image(0, 10, 'snow_ground')`
  - `this.add.image(0, 15, 'ice_pond')`
  - `this.add.image(0, 15, 'pond_ripple')`
  - `this.add.image(x, y, 'pine_tree_a' | 'pine_tree_b' | 'pine_tree_c')`
  - `this.add.image(-230, -105, 'igloo')`
  - `this.add.image(220, 90, 'snowman')`
- **Underlying Texture Pipeline:** Textures are generated via `TextureGenerator.ts` using the HTML5 Canvas 2D API during `BootScene` startup, then added to Phaser's texture cache via `scene.textures.addCanvas(key, canvas)`.
- **Finding:** The runtime game scene does NOT use code primitives for environmental props during frame rendering. However, prior to Phase 3.5A, all trees on the island used one identical texture (`pine_tree`), creating a repetitive and synthetic appearance.
- **Resolution:**
  - Added **`pine_tree_a`**: Classic conical evergreen pine with scalloped snow caps.
  - Added **`pine_tree_b`**: Broad rounded pine with soft puffy cloud snow pillows.
  - Added **`pine_tree_c`**: Slender crystal-frosted cedar pine with icy needle tips.
  - Added **`pond_ripple`**: Living concentric translucent cyan ripple waves (`depth: -299`) with continuous breathing tweens on the water surface.

---

## 3. Penguin Clumping Bug: Diagnosis & Fix

### Diagnosed Root Causes:

| # | Bug Mechanism | Root Cause in Code | Impact |
|---|---------------|--------------------|--------|
| **1** | **Fishing Corner Magnet** | `enterFishState()` explicitly set target to `bounds.fishingHole` (`{ x: -260, y: 70 }`). | Hungry penguins (`hunger >= 80` or personality `'hungry'`) were systematically funneled into that single lower-left corner coordinate. |
| **2** | **Pond Exclusion Squeeze** | In `enterWaddleState()`, random wander sampling tested against a 190x105 ellipse with a `1.1` safety margin. | Because the island half-width is 360 and pond width is ~210, sampling from center `(0, 0)` failed repeatedly, causing penguins to either remain in place or get squeezed onto extreme left/right margins. |
| **3** | **Follow State Lock** | In `stepMovement()`, when `state === 'FOLLOW'` and `dist < 4`, the entity stopped moving but never transitioned back to `'IDLE'`. | Followers remained stuck in `FOLLOW` state glued to leaders until external timeout. |
| **4** | **Zero Repulsion Force** | Entities had no mutual collision or separation vector. | Multiple penguins arriving in proximity stacked on top of each other. |

### Technical Solutions Implemented:

1. **Distributed Shoreline Fishing:**
   In `enterFishState()`, the target coordinate is now sampled 360° around the natural perimeter of the central pond:
   ```ts
   const pond = this.bounds.pondCenter ?? { x: 0, y: 15, radiusX: 190, radiusY: 105 };
   const angle = Math.random() * Math.PI * 2;
   const shoreDistX = pond.radiusX + 16 + Phaser.Math.Between(0, 14);
   const shoreDistY = pond.radiusY + 12 + Phaser.Math.Between(0, 10);
   this.targetX = Math.round(pond.x + Math.cos(angle) * shoreDistX);
   this.targetY = Math.round(pond.y + Math.sin(angle) * shoreDistY);
   this.clampToBounds();
   ```

2. **Multi-Zone Island Circulation:**
   In `enterWaddleState()`, the island is partitioned into 4 distinct walkable zones outside the pond:
   - **North Ridge:** `x: [-260, 260], y: [-140, -95]`
   - **South Promenade:** `x: [-260, 260], y: [110, 150]`
   - **West Bank:** `x: [-320, -190], y: [-100, 100]`
   - **East Bank:** `x: [190, 320], y: [-100, 100]`
   Targets are selected from zones that are at least 90px away from the penguin's current position, ensuring active, island-wide circulation without getting stuck in pond exclusion retries.

3. **Follow State Arrival Transition:**
   In `stepMovement()`, when `state === 'FOLLOW'` reaches `dist < 4`, the follower transitions cleanly to `'IDLE'`:
   ```ts
   } else if (state === 'FOLLOW') {
     this.stopWobbleTween();
     this.resetBodyTransform();
     this.fsm.transitionTo('IDLE');
   }
   ```

4. **Flocking & Social Separation Vector:**
   Added `applyFlockingSeparation(otherPenguins: PenguinEntity[], delta: number)` to `PenguinEntity.ts`:
   - Scans neighboring active penguins within 42px.
   - Calculates inverse linear repulsive force: `((minDistance - dist) / minDistance) * 36`.
   - Pushes entities gently away along the difference vector.
   - Clamps resulting coordinates to valid walkable territory using `clampToBounds()`.
   - Called for every active penguin on each frame in `SnowIslandScene.ts`'s `update()` loop.

---

## 4. Character Frame Animation Pipeline

Rather than relying purely on scale/rotation/y tweens, characters now feature true 2D multi-pose frame animation:

### Poses Generated per Species:
1. **`idle`**: Neutral standing posture with resting flippers and relaxed webbed feet.
2. **`walk_0`**: Left foot stepped forward with angle `-0.25`, right foot back, left wing forward, right wing back.
3. **`walk_1`**: Right foot stepped forward with angle `0.25`, left foot back, right wing forward, left wing back.
4. **`sleep`**: Eyes closed (soft curved eyelids ⌒ ⌒), cozy tucked feet and flippers, relaxed body.
5. **`eat`**: Open beak with blue fish morsel inside, flapping excited wings.
6. **`celebrate`**: Joyful smile eyes ^ ^, both flippers raised high overhead, jump shadow contraction.
7. **`slide`**: Streamlined belly-down posture, wings spread wide for steering, snow slide puffs.

### Animation Manager Integration:
Phaser animations are registered in `ensureGameTextures`:
- `${species}_idle` (1 fps, loop)
- `${species}_walk` (5 fps: `walk_0` → `idle` → `walk_1` → `idle`, loop)
- `${species}_sleep` (1 fps, loop)
- `${species}_eat` (3 fps: `eat` → `idle`, loop)
- `${species}_celebrate` (4 fps: `celebrate` → `idle`, loop)
- `${species}_slide` (1 fps, loop)

In `PenguinEntity.ts`, `handleStateChange()` calls `playStateAnimation(newState)`, ensuring that `bodySprite.play()` runs synchronized with locomotion tweens.

---

## 5. Verification & Test Evidence

### 1. Test Suite Verification:
- **Command:** `npx vitest run`
- **Result:**
  - **Test Files:** 43 passed (43)
  - **Tests:** 374 passed (374)
  - **Duration:** 13.03s

### 2. TypeScript & Production Build:
- **Command:** `npm run build` (`tsc --noEmit && vite build`)
- **Result:**
  - 159 modules transformed.
  - Zero TypeScript compile errors.
  - Total build time: 8.27s.

---

## 6. Strict Compliance Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| No new gameplay features | **PASSED** | No Catch Fish, No Hatchery, No Breeding loop changes. |
| No fake data / dummy NPCs | **PASSED** | Only real state from Pinia / GameBridge is rendered. |
| No invented eggs or items | **PASSED** | Egg remains strictly an inventory item. |
| 100% test pass rate | **PASSED** | 43 suites, 374 tests green. |
| Clean production build | **PASSED** | Zero lint or type errors. |

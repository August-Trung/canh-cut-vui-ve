import Phaser from 'phaser';
import { ensureGameTextures } from '../textures/TextureGenerator';

/**
 * BootScene
 *
 * Initial loading scene for the game canvas.
 * - Preloads all production 2D PNG assets (penguins 4-frame walk cycles, props, environment).
 * - Generates and registers procedural vector textures into cache as robust headless/Vitest fallback.
 * - Sets up character animation state machines.
 * - Transitions directly to SnowIslandScene once asset generation completes.
 *
 * Strict boundary: Never imports or mutates Pinia state.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    if (!this.load?.image) return;

    // 1. Production World Environment & Props
    this.load.image('snow_island', '/assets/game/world/snow_island.png');
    this.load.image('snow_ground', '/assets/game/world/snow_island.png');
    this.load.image('pine_tree_a', '/assets/game/world/pine_tree_a.png');
    this.load.image('pine_tree_b', '/assets/game/world/pine_tree_b.png');
    this.load.image('pine_tree_c', '/assets/game/world/pine_tree_c.png');
    this.load.image('snowman', '/assets/game/world/snowman.png');
    this.load.image('igloo', '/assets/game/world/igloo.png');

    // 2. Production Penguin Character Sprites (5 species, 9 animation frames each)
    const species = ['snowy', 'sleepy', 'shy', 'happy', 'hungry'];
    const poses = ['idle', 'walk_0', 'walk_1', 'walk_2', 'walk_3', 'sleep', 'eat', 'celebrate', 'slide'];

    for (const sp of species) {
      this.load.image(`penguin_${sp}`, `/assets/game/penguins/penguin_${sp}.png`);
      for (const pose of poses) {
        this.load.image(`penguin_${sp}_${pose}`, `/assets/game/penguins/penguin_${sp}_${pose}.png`);
      }
    }
  }

  create(): void {
    // Generate and register procedural fallback textures and Phaser animations
    ensureGameTextures(this);

    // Transition to the main snow island environment
    this.scene.start('SnowIslandScene');
  }
}

import Phaser from 'phaser';
import { ensureGameTextures } from '../textures/TextureGenerator';

/**
 * BootScene
 *
 * Initial loading scene for the game canvas.
 * - Procedurally generates and caches all 2.5D vector textures (penguins, eggs, props, effects).
 * - Transitions directly to SnowIslandScene once asset generation completes.
 *
 * Strict boundary: Never imports or mutates Pinia state.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Generate and register procedural vector textures into cache
    ensureGameTextures(this);

    // Transition to the main snow island environment
    this.scene.start('SnowIslandScene');
  }
}

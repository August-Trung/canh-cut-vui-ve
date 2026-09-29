import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { SnowIslandScene } from './scenes/SnowIslandScene';

/**
 * Returns a responsive, production-ready Phaser 3/4 GameConfig.
 *
 * Configured for:
 * - Decoupled rendering inside the Vue container
 * - Responsive auto-resize and center scale mode
 * - 30-60 FPS mobile/desktop performance targets
 * - Multi-touch support (activePointers: 2) for pinch-to-zoom
 * - Zero gravity arcade physics
 * - Strict isolation: zero direct Pinia store access
 */
export function getPhaserConfig(containerId: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: containerId,
    width: '100%',
    height: '100%',
    backgroundColor: '#bfe3f7',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    fps: {
      target: 60,
      min: 30,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
    input: {
      activePointers: 2,
    },
    scene: [BootScene, SnowIslandScene],
  };
}

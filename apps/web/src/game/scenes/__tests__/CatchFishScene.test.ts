import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CatchFishScene, ActiveFishTarget } from '../CatchFishScene';
import { gameBridge } from '../../bridge/GameBridge';
import type { MiniGameResult } from '@penguin/types';

describe('CatchFishScene', () => {
  let scene: CatchFishScene;
  let mockDisplayObject: any;
  let mockGraphics: any;

  beforeEach(() => {
    gameBridge.clear();
    scene = new CatchFishScene();

    mockDisplayObject = {
      setDepth: vi.fn().mockReturnThis(),
      setSize: vi.fn().mockReturnThis(),
      setInteractive: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      add: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      setOrigin: vi.fn().mockReturnThis(),
      x: 400,
      y: 300,
    };

    mockGraphics = {
      ...mockDisplayObject,
      fillStyle: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeCircle: vi.fn().mockReturnThis(),
      clear: vi.fn().mockReturnThis(),
    };

    scene.add = {
      container: vi.fn().mockImplementation(() => ({ ...mockDisplayObject })),
      graphics: vi.fn().mockImplementation(() => ({ ...mockGraphics })),
      text: vi.fn().mockImplementation(() => ({ ...mockDisplayObject })),
    } as any;

    scene.scale = {
      width: 800,
      height: 600,
    } as any;

    scene.time = {
      addEvent: vi.fn().mockReturnValue({ destroy: vi.fn() }),
    } as any;

    scene.tweens = {
      add: vi.fn().mockReturnValue({ stop: vi.fn() }),
    } as any;

    scene.events = {
      once: vi.fn(),
    } as any;
  });

  it('has scene key CatchFishScene', () => {
    expect(scene.sys.settings.key).toBe('CatchFishScene');
  });

  it('initializes game and emits time and score updates over gameBridge', () => {
    let timeUpdate: { remainingSeconds: number } | null = null;
    let scoreUpdate: { score: number; combo: number } | null = null;

    gameBridge.on('minigame:time_update', (data) => {
      timeUpdate = data;
    });
    gameBridge.on('minigame:score_update', (data) => {
      scoreUpdate = data;
    });

    scene.create({ sessionId: 'session_test_1', companionPenguinId: 'p_comp' });

    expect(timeUpdate).toEqual({ remainingSeconds: 30 });
    expect(scoreUpdate).toEqual({ score: 0, combo: 0, maxCombo: 0 });
  });

  it('clicking fish target increases score, increments combo, and emits update', () => {
    scene.create({ sessionId: 'session_test_1' });

    let latestScore = 0;
    let latestCombo = 0;
    gameBridge.on('minigame:score_update', (data) => {
      latestScore = data.score;
      latestCombo = data.combo;
    });

    const target: ActiveFishTarget = {
      id: 'target_sardine_1',
      container: { ...mockDisplayObject },
      def: { id: 'sardine', name: 'Cá Mòi Nhỏ', points: 10, weight: 45, speed: 1.0 },
      spawnTime: Date.now(),
      durationMs: 1400,
      reticle: { ...mockGraphics },
      scaleProgress: 1.1, // Perfect timing
      clicked: false,
    };

    scene.clickTarget(target);

    // Perfect timing multiplier 1.5 -> Math.round(10 * 1.5 * 1.05) = 16
    expect(latestScore).toBeGreaterThanOrEqual(15);
    expect(latestCombo).toBe(1);
    expect(target.clicked).toBe(true);
    expect(target.container.destroy).toHaveBeenCalled();
  });

  it('clicking hazard (old boot) breaks combo and applies score penalty clamped to 0', () => {
    scene.create({ sessionId: 'session_test_1' });

    let latestScore = 0;
    let latestCombo = 0;
    gameBridge.on('minigame:score_update', (data) => {
      latestScore = data.score;
      latestCombo = data.combo;
    });

    // Score a fish first to build score & combo
    const fishTarget: ActiveFishTarget = {
      id: 'fish_1',
      container: { ...mockDisplayObject },
      def: { id: 'sardine', name: 'Sardine', points: 20, weight: 45, speed: 1.0 },
      spawnTime: Date.now(),
      durationMs: 1400,
      reticle: { ...mockGraphics },
      scaleProgress: 1.5,
      clicked: false,
    };
    scene.clickTarget(fishTarget);
    expect(latestCombo).toBe(1);
    const scoreAfterFish = latestScore;

    // Now click old boot hazard
    const bootTarget: ActiveFishTarget = {
      id: 'boot_1',
      container: { ...mockDisplayObject },
      def: { id: 'old_boot', name: 'Ủng Cũ', points: -15, weight: 10, speed: 1.0, isObstacle: true },
      spawnTime: Date.now(),
      durationMs: 1400,
      reticle: { ...mockGraphics },
      scaleProgress: 1.0,
      clicked: false,
    };
    scene.clickTarget(bootTarget);

    expect(latestCombo).toBe(0); // Combo broken
    expect(latestScore).toBe(Math.max(0, scoreAfterFish - 15));
  });

  it('countdown reaches 0 -> ends game and emits minigame:ended with verified result', () => {
    scene.create({ sessionId: 'session_end_test', companionPenguinId: 'p_companion_01' });

    let endedResult: MiniGameResult | null = null;
    gameBridge.on('minigame:ended', ({ result }) => {
      endedResult = result;
    });

    // Score a fish
    const target: ActiveFishTarget = {
      id: 'fish_1',
      container: { ...mockDisplayObject },
      def: { id: 'sardine', name: 'Sardine', points: 30, weight: 45, speed: 1.0 },
      spawnTime: Date.now(),
      durationMs: 1400,
      reticle: { ...mockGraphics },
      scaleProgress: 1.0,
      clicked: false,
    };
    scene.clickTarget(target);

    // Fast-forward 30 seconds
    for (let sec = 0; sec < 30; sec++) {
      scene.tickClock();
    }

    expect(endedResult).toBeDefined();
    expect(endedResult?.sessionId).toBe('session_end_test');
    expect(endedResult?.gameId).toBe('catch_fish');
    expect(endedResult?.companionPenguinId).toBe('p_companion_01');
    expect(endedResult?.durationSec).toBe(30);
    expect(endedResult?.score).toBeGreaterThan(0);
    expect(endedResult?.catchesCount).toBe(1);
  });
});

import Phaser from 'phaser';
import type { MiniGameResult } from '@penguin/types';
import { MINIGAME_CATCH_FISH_CONFIG, FISH_TARGET_TABLE, FishTargetDefinition } from '@penguin/game-data';
import { gameBridge } from '../bridge/GameBridge';

export interface ActiveFishTarget {
  id: string;
  container: Phaser.GameObjects.Container;
  def: FishTargetDefinition;
  spawnTime: number;
  durationMs: number;
  reticle: Phaser.GameObjects.Graphics;
  scaleProgress: number;
  clicked: boolean;
}

/**
 * CatchFishScene
 *
 * Interactive ice-fishing mini-game running inside the Phaser engine:
 * - 30-second countdown session.
 * - Dynamic target spawning based on FISH_TARGET_TABLE weights.
 * - Precision timing catch reticle (Perfect, Good, Hazard / Boot).
 * - Combo multiplier and real-time score calculation.
 * - Emits real-time score/time updates and session results over GameBridge.
 *
 * Strict boundary rule: Never mutates Pinia state directly.
 */
export class CatchFishScene extends Phaser.Scene {
  private sessionId = '';
  private gameId = 'catch_fish';
  private companionPenguinId?: string;

  private isPlaying = false;
  private timeRemaining = 30;
  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private totalSpawned = 0;
  private totalCatches = 0;

  private activeTargets: ActiveFishTarget[] = [];
  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private clockTimer: Phaser.Time.TimerEvent | null = null;
  private unsubs: (() => void)[] = [];

  constructor() {
    super({ key: 'CatchFishScene' });
  }

  create(data?: { sessionId?: string; gameId?: string; companionPenguinId?: string }): void {
    this.sessionId = data?.sessionId ?? `catch_${Date.now()}`;
    this.gameId = data?.gameId ?? 'catch_fish';
    this.companionPenguinId = data?.companionPenguinId;

    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalSpawned = 0;
    this.totalCatches = 0;
    this.timeRemaining = MINIGAME_CATCH_FISH_CONFIG.durationSeconds;
    this.activeTargets = [];

    this.buildBackdrop();
    this.setupBridgeSubscriptions();

    this.events.once('shutdown', () => this.handleShutdown());
    this.events.once('destroy', () => this.handleShutdown());

    this.startGame();
  }

  private buildBackdrop(): void {
    const width = this.scale?.width ?? 800;
    const height = this.scale?.height ?? 600;
    const cx = width / 2;
    const cy = height / 2;

    const bg = this.add.graphics();
    bg.setDepth(-100);

    // Deep water circular hole
    bg.fillStyle(0x1e3a5f, 0.95);
    bg.fillCircle(cx, cy, 140);

    // Outer ice ring
    bg.lineStyle(8, 0xa5f3fc, 0.9);
    bg.strokeCircle(cx, cy, 140);

    bg.lineStyle(4, 0xffffff, 0.7);
    bg.strokeCircle(cx, cy, 144);
  }

  private setupBridgeSubscriptions(): void {
    const unsubStart = gameBridge.on('minigame:start', ({ sessionId, gameId, companionPenguinId }) => {
      this.sessionId = sessionId;
      this.gameId = gameId;
      this.companionPenguinId = companionPenguinId;
      this.startGame();
    });
    this.unsubs.push(unsubStart);

    const unsubQuit = gameBridge.on('minigame:quit', () => {
      this.endGame(true);
    });
    this.unsubs.push(unsubQuit);
  }

  startGame(): void {
    this.isPlaying = true;
    this.timeRemaining = MINIGAME_CATCH_FISH_CONFIG.durationSeconds;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalSpawned = 0;
    this.totalCatches = 0;
    this.activeTargets = [];

    // Periodic second clock
    if (this.time?.addEvent) {
      this.clockTimer = this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => this.tickClock(),
      });

      // Target spawner timer (every 1.1s)
      this.spawnTimer = this.time.addEvent({
        delay: 1100,
        loop: true,
        callback: () => this.spawnTarget(),
      });
    }

    gameBridge.emit('minigame:time_update', { remainingSeconds: this.timeRemaining });
    gameBridge.emit('minigame:score_update', { score: this.score, combo: this.combo, maxCombo: this.maxCombo });
  }

  tickClock(): void {
    if (!this.isPlaying) return;

    this.timeRemaining = Math.max(0, this.timeRemaining - 1);
    gameBridge.emit('minigame:time_update', { remainingSeconds: this.timeRemaining });

    if (this.timeRemaining <= 0) {
      this.endGame(false);
    }
  }

  spawnTarget(): ActiveFishTarget | null {
    if (!this.isPlaying) return null;

    const width = this.scale?.width ?? 800;
    const height = this.scale?.height ?? 600;
    const cx = width / 2;
    const cy = height / 2;

    // Pick target definition from weighted table
    const def = this.rollTargetDefinition();

    // Random position within ice hole radius
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 95;
    const targetX = cx + Math.cos(angle) * dist;
    const targetY = cy + Math.sin(angle) * dist;

    const container = this.add.container(targetX, targetY);
    container.setDepth(10);

    // Target visual background
    const circle = this.add.graphics();
    circle.fillStyle(def.isObstacle ? 0x78350f : 0x0284c7, 0.85);
    circle.fillCircle(0, 0, 22);
    container.add(circle);

    // Target label or symbol
    const label = this.add.text(0, 0, def.isObstacle ? '👢' : '🐟', {
      fontSize: '20px',
    });
    label.setOrigin(0.5, 0.5);
    container.add(label);

    // Expanding / contracting timing reticle
    const reticle = this.add.graphics();
    container.add(reticle);

    container.setSize(48, 48);
    container.setInteractive({
      useHandCursor: true,
    });

    const durationMs = Math.round(1400 / (def.speed || 1.0));
    const targetObj: ActiveFishTarget = {
      id: `target_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      container,
      def,
      spawnTime: Date.now(),
      durationMs,
      reticle,
      scaleProgress: 2.0,
      clicked: false,
    };

    container.on('pointerdown', () => {
      this.clickTarget(targetObj);
    });

    this.activeTargets.push(targetObj);
    this.totalSpawned++;

    return targetObj;
  }

  private rollTargetDefinition(): FishTargetDefinition {
    const totalWeight = FISH_TARGET_TABLE.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const item of FISH_TARGET_TABLE) {
      if (roll < item.weight) {
        return item;
      }
      roll -= item.weight;
    }

    return FISH_TARGET_TABLE[0];
  }

  clickTarget(target: ActiveFishTarget): void {
    if (!this.isPlaying || target.clicked) return;
    target.clicked = true;

    if (target.def.isObstacle) {
      // Hazard: Boot penalty
      this.score = Math.max(0, this.score + target.def.points);
      this.combo = 0;
      this.spawnFloatingEffect(target.container.x, target.container.y, 'ỦNG CŨ! 💥', '#ef4444');
    } else {
      // Successful catch
      this.totalCatches++;
      this.combo++;
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }

      // Timing judgment based on scaleProgress
      let timingMultiplier = 1.0;
      let timingText = 'GOOD!';
      let color = '#38bdf8';

      if (target.scaleProgress <= 1.35 && target.scaleProgress >= 0.95) {
        timingMultiplier = 1.5;
        timingText = 'PERFECT!';
        color = '#facc15';
      }

      const comboBonus = 1 + Math.min(10, this.combo) * 0.05;
      const pointsEarned = Math.round(target.def.points * timingMultiplier * comboBonus);

      this.score = Math.min(MINIGAME_CATCH_FISH_CONFIG.maxScoreCap, this.score + pointsEarned);
      this.spawnFloatingEffect(
        target.container.x,
        target.container.y,
        `${timingText} +${pointsEarned}`,
        color
      );
    }

    gameBridge.emit('minigame:score_update', {
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
    });

    this.removeTarget(target);
  }

  private spawnFloatingEffect(x: number, y: number, text: string, color: string): void {
    const floatText = this.add.text(x, y - 10, text, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    });
    floatText.setOrigin(0.5, 0.5);
    floatText.setDepth(100);

    if (this.tweens?.add) {
      this.tweens.add({
        targets: floatText,
        y: y - 35,
        alpha: 0,
        duration: 700,
        ease: 'Quad.easeOut',
        onComplete: () => {
          floatText.destroy();
        },
      });
    }
  }

  private removeTarget(target: ActiveFishTarget): void {
    target.container.destroy();
    this.activeTargets = this.activeTargets.filter((t) => t.id !== target.id);
  }

  update(_time: number, delta: number): void {
    if (!this.isPlaying) return;

    const now = Date.now();
    for (let i = this.activeTargets.length - 1; i >= 0; i--) {
      const target = this.activeTargets[i];
      const elapsed = now - target.spawnTime;
      const progress = elapsed / target.durationMs;

      if (progress >= 1.0) {
        // Target expired without click -> Combo break (unless it was a hazard)
        if (!target.def.isObstacle) {
          this.combo = 0;
          gameBridge.emit('minigame:score_update', {
            score: this.score,
            combo: this.combo,
            maxCombo: this.maxCombo,
          });
        }
        this.removeTarget(target);
      } else {
        // Reticle shrinks from 2.0 down to 0.8
        target.scaleProgress = 2.0 - progress * 1.2;
        target.reticle.clear();
        target.reticle.lineStyle(2, 0xffffff, 0.85);
        target.reticle.strokeCircle(0, 0, 22 * target.scaleProgress);
      }
    }
  }

  endGame(isEarlyQuit: boolean = false): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    if (this.spawnTimer) {
      this.spawnTimer.destroy();
      this.spawnTimer = null;
    }
    if (this.clockTimer) {
      this.clockTimer.destroy();
      this.clockTimer = null;
    }

    for (const target of this.activeTargets) {
      target.container.destroy();
    }
    this.activeTargets = [];

    if (!isEarlyQuit) {
      const accuracy =
        this.totalSpawned > 0
          ? Math.min(100, Math.round((this.totalCatches / this.totalSpawned) * 100))
          : 100;

      const result: MiniGameResult = {
        sessionId: this.sessionId,
        gameId: this.gameId,
        companionPenguinId: this.companionPenguinId,
        score: this.score,
        accuracy,
        catchesCount: this.totalCatches,
        durationSec: 30,
        completedAt: Date.now(),
      };

      gameBridge.emit('minigame:ended', { result });
    }
  }

  private handleShutdown(): void {
    this.endGame(true);
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];
  }
}

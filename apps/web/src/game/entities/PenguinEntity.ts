import Phaser from 'phaser';
import { OwnedPenguin } from '@penguin/types';
import { gameBridge } from '../bridge/GameBridge';
import { PenguinFSM, PenguinState } from '../ai/PenguinFSM';
import { SpeechBubble } from './SpeechBubble';

export interface IslandBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  pondCenter?: { x: number; y: number; radiusX: number; radiusY: number };
  fishingHole?: { x: number; y: number };
}

const DEFAULT_BOUNDS: IslandBounds = {
  minX: -260,
  maxX: 260,
  minY: -160,
  maxY: 160,
  pondCenter: { x: 0, y: 10, radiusX: 95, radiusY: 55 },
  fishingHole: { x: -170, y: 70 },
};

/**
 * Autonomous Penguin Entity in Phaser 3.
 *
 * Implements 11 AI state behaviors, high-res procedural texture rendering,
 * shadow projection, speech bubbles, and decoupled event bridge interactions.
 *
 * Strict boundary: NEVER mutates Pinia state directly. All player interactions
 * emit typed events over GameBridge.
 */
export class PenguinEntity extends Phaser.GameObjects.Container {
  readonly ownedPenguin: OwnedPenguin;
  readonly fsm: PenguinFSM;

  private shadow: Phaser.GameObjects.Image;
  private bodySprite: Phaser.GameObjects.Sprite;
  private speechBubble: SpeechBubble;

  private bounds: IslandBounds;
  private targetX = 0;
  private targetY = 0;

  // Active tweens and timers for clean destruction
  private activeBodyTween: Phaser.Tweens.Tween | null = null;
  private activeWobbleTween: Phaser.Tweens.Tween | null = null;
  private activeShadowTween: Phaser.Tweens.Tween | null = null;
  private sleepZzzTimer: Phaser.Time.TimerEvent | null = null;
  private unsubFsm: (() => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    ownedPenguin: OwnedPenguin,
    bounds: IslandBounds = DEFAULT_BOUNDS
  ) {
    super(scene, x, y);

    this.ownedPenguin = ownedPenguin;
    this.bounds = bounds;
    this.targetX = x;
    this.targetY = y;

    // 1. Soft ground drop shadow (always at bottom of container)
    this.shadow = scene.add.image(0, 16, 'entity_shadow');
    this.shadow.setScale(0.58, 0.38);
    this.shadow.setAlpha(0.65);
    this.add(this.shadow);

    // 2. Penguin Body Sprite
    const textureKey = `penguin_${ownedPenguin.speciesId}`;
    this.bodySprite = scene.add.sprite(0, 0, textureKey);
    this.bodySprite.setOrigin(0.5, 0.85); // Pivot at feet for natural squash & stretch
    this.bodySprite.setScale(0.52);
    this.add(this.bodySprite);

    // 3. Cute Speech Bubble (positioned over head)
    this.speechBubble = new SpeechBubble(scene, 0, -62);
    this.add(this.speechBubble);

    // 4. Interactive Click Area
    this.setSize(56, 64);
    this.setInteractive(
      new Phaser.Geom.Circle(0, -12, 28),
      Phaser.Geom.Circle.Contains
    );

    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleClick(pointer);
    });

    this.on('pointerover', () => {
      this.scene.input?.setDefaultCursor?.('pointer');
    });

    this.on('pointerout', () => {
      this.scene.input?.setDefaultCursor?.('default');
    });

    // 5. Initialize AI State Machine
    this.fsm = new PenguinFSM();
    this.unsubFsm = this.fsm.onStateChange((newState, prevState) => {
      this.handleStateChange(newState, prevState);
    });

    // Start in IDLE
    this.enterIdleState();
  }

  /**
   * Handle user click on penguin:
   * Strictly decoupled — triggers reaction animation and emits event across bridge.
   * Does NOT award coins or mutate Pinia directly.
   */
  handleClick(_pointer?: Phaser.Input.Pointer): void {
    // 1. Notify UI layer via GameBridge
    gameBridge.emit('penguin:clicked', { ownedId: this.ownedPenguin.id });

    // 2. Trigger FSM reaction
    this.fsm.triggerReaction();
  }

  /**
   * External action trigger: play eating animation and spawn heart burst.
   */
  playEatAnimation(): void {
    this.fsm.transitionTo('EAT');
  }

  /**
   * External action trigger: play petting/happiness reaction.
   */
  playPetAnimation(): void {
    this.fsm.triggerReaction();
  }

  /**
   * External action trigger: celebration jump.
   */
  playCelebrationAnimation(): void {
    this.fsm.transitionTo('CELEBRATE');
  }

  /**
   * Make the penguin say something or a random quip.
   */
  say(text?: string, durationMs?: number): void {
    if (text) {
      this.speechBubble.showText(text, durationMs);
    } else {
      this.speechBubble.showRandomQuip(durationMs);
    }
  }

  /**
   * Navigate towards target coordinates in FOLLOW state.
   */
  follow(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
    this.fsm.transitionTo('FOLLOW');
  }

  /**
   * Follow another penguin entity with a slight offset.
   */
  followPenguin(target: PenguinEntity): void {
    const offsetX = target.bodySprite?.flipX ? 28 : -28;
    this.follow(target.x + offsetX, target.y + 6);
  }

  /**
   * Update island wander bounds.
   */
  setBounds(bounds: IslandBounds): void {
    this.bounds = bounds;
  }

  /**
   * Frame update loop called by the parent Phaser Scene.
   */
  update(_time: number, delta: number): void {
    if (!this.active) return;

    // Progress FSM
    this.fsm.update(delta);

    // Movement & pathing logic
    const state = this.fsm.currentState;
    if (state === 'WADDLE' || state === 'BELLY_SLIDE' || state === 'FOLLOW' || state === 'FISH') {
      this.stepMovement(delta, state);
    }

    // 2.5D Depth sorting based on Y position
    this.setDepth(this.y);
  }

  private stepMovement(delta: number, state: PenguinState): void {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 4) {
      // Arrived at destination
      if (state === 'BELLY_SLIDE' || state === 'WADDLE') {
        this.fsm.transitionTo('IDLE');
      } else if (state === 'FISH') {
        this.startFishingPeeking();
      } else if (state === 'FOLLOW') {
        this.stopWobbleTween();
        this.resetBodyTransform();
      }
      return;
    }

    // Movement speed: Waddle/Follow/Fish (42 px/s), Slide (140 px/s)
    const speed = state === 'BELLY_SLIDE' ? 140 : 42;
    const step = (speed * delta) / 1000;
    const moveDist = Math.min(step, dist);

    this.x += (dx / dist) * moveDist;
    this.y += (dy / dist) * moveDist;

    // Orient facing direction
    if (Math.abs(dx) > 1) {
      this.bodySprite.setFlipX(dx < 0);
    }

    // Check if crossing ice pond during waddle -> trigger belly slide!
    if (state === 'WADDLE' && this.isInsideIcePond(this.x, this.y)) {
      this.fsm.transitionTo('BELLY_SLIDE');
    }
  }

  private handleStateChange(newState: PenguinState, _prevState: PenguinState): void {
    this.stopActiveTweens();

    switch (newState) {
      case 'IDLE':
        this.enterIdleState();
        break;
      case 'WADDLE':
        this.enterWaddleState();
        break;
      case 'BELLY_SLIDE':
        this.enterBellySlideState();
        break;
      case 'SLEEP':
        this.enterSleepState();
        break;
      case 'TALK':
        this.enterTalkState();
        break;
      case 'EAT':
        this.enterEatState();
        break;
      case 'PLAY':
        this.enterPlayState();
        break;
      case 'FISH':
        this.enterFishState();
        break;
      case 'FOLLOW':
        this.enterFollowState();
        break;
      case 'CELEBRATE':
        this.enterCelebrateState();
        break;
      case 'REACT':
        this.enterReactState();
        break;
    }
  }

  private enterIdleState(): void {
    this.resetBodyTransform();

    // Gentle breathing squash & stretch tween
    this.activeBodyTween = this.scene.tweens.add({
      targets: this.bodySprite,
      scaleY: 0.54,
      scaleX: 0.50,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private enterWaddleState(): void {
    this.resetBodyTransform();

    // Pick random wander waypoint within bounds
    const wanderX = Phaser.Math.Between(this.bounds.minX, this.bounds.maxX);
    const wanderY = Phaser.Math.Between(this.bounds.minY, this.bounds.maxY);
    this.targetX = wanderX;
    this.targetY = wanderY;

    this.startWaddleWobble();
  }

  private enterBellySlideState(): void {
    this.resetBodyTransform();

    // Orient and tilt onto belly
    const facingLeft = this.bodySprite.flipX;
    const slideAngle = facingLeft ? -75 : 75;

    // Slide across pond towards exit coordinate
    const pond = this.bounds.pondCenter ?? { x: 0, y: 10, radiusX: 95, radiusY: 55 };
    const exitAngle = Math.random() * Math.PI * 2;
    this.targetX = pond.x + Math.cos(exitAngle) * (pond.radiusX + 25);
    this.targetY = pond.y + Math.sin(exitAngle) * (pond.radiusY + 20);

    this.activeBodyTween = this.scene.tweens.add({
      targets: this.bodySprite,
      angle: slideAngle,
      scaleY: 0.44,
      scaleX: 0.58,
      duration: 200,
      ease: 'Quad.easeOut',
    });

    // Spawn subtle snow slide particles
    this.spawnSlideSnowPuff();
  }

  private enterSleepState(): void {
    this.resetBodyTransform();

    // Squat down into cozy sleeping posture
    this.bodySprite.setScale(0.55, 0.45);
    this.bodySprite.setAngle(0);

    // Spawn floating Zzz indicators periodically
    this.spawnZzzIndicator();
    this.sleepZzzTimer = this.scene.time.addEvent({
      delay: 2200,
      loop: true,
      callback: () => this.spawnZzzIndicator(),
    });
  }

  private enterTalkState(): void {
    this.resetBodyTransform();
    this.speechBubble.showRandomQuip(3500);

    // Little curious head tilt
    this.activeBodyTween = this.scene.tweens.add({
      targets: this.bodySprite,
      angle: 6,
      duration: 350,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
    });
  }

  private enterEatState(): void {
    this.resetBodyTransform();

    // Joyful eating hop & excited wiggles
    this.activeBodyTween = this.scene.tweens.add({
      targets: this.bodySprite,
      y: -14,
      scaleY: 0.56,
      scaleX: 0.48,
      duration: 220,
      yoyo: true,
      repeat: 3,
      ease: 'Back.easeOut',
    });

    // Spawn heart burst above head
    this.spawnFloatingHeart(0, -32);
  }

  private enterPlayState(): void {
    this.resetBodyTransform();

    // Playful double hop with rotation
    this.activeBodyTween = this.scene.tweens.add({
      targets: this.bodySprite,
      y: -24,
      scaleY: 0.58,
      scaleX: 0.46,
      duration: 280,
      yoyo: true,
      repeat: 2,
      ease: 'Back.easeOut',
    });

    this.activeWobbleTween = this.scene.tweens.add({
      targets: this.bodySprite,
      angle: { from: -14, to: 14 },
      duration: 180,
      yoyo: true,
      repeat: 4,
      ease: 'Sine.easeInOut',
    });
  }

  private enterFishState(): void {
    this.resetBodyTransform();

    // Head towards fishing hole
    const hole = this.bounds.fishingHole ?? { x: -170, y: 70 };
    this.targetX = hole.x + Phaser.Math.Between(-15, 15);
    this.targetY = hole.y + Phaser.Math.Between(-10, 10);

    const dist = Math.hypot(this.targetX - this.x, this.targetY - this.y);
    if (dist < 8) {
      this.startFishingPeeking();
    } else {
      this.startWaddleWobble();
    }
  }

  private startFishingPeeking(): void {
    this.stopWobbleTween();
    if (!this.activeBodyTween) {
      this.activeBodyTween = this.scene.tweens.add({
        targets: this.bodySprite,
        angle: this.bodySprite.flipX ? -15 : 15,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private startWaddleWobble(): void {
    if (!this.activeWobbleTween) {
      this.activeWobbleTween = this.scene.tweens.add({
        targets: this.bodySprite,
        angle: { from: -8, to: 8 },
        duration: 240,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private stopWobbleTween(): void {
    if (this.activeWobbleTween) {
      this.activeWobbleTween.stop();
      this.activeWobbleTween = null;
    }
  }

  private enterFollowState(): void {
    this.resetBodyTransform();
    this.startWaddleWobble();
  }

  private enterCelebrateState(): void {
    this.resetBodyTransform();

    // Full 360-degree celebration jump
    this.activeBodyTween = this.scene.tweens.add({
      targets: this.bodySprite,
      y: -36,
      scaleX: 0.56,
      scaleY: 0.48,
      angle: 360,
      duration: 650,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        if (!this.active) return;
        this.resetBodyTransform();
        this.spawnFloatingHeart(0, -35);
      },
    });

    // Shadow scales down during high jump
    this.activeShadowTween = this.scene.tweens.add({
      targets: this.shadow,
      scaleX: 0.35,
      scaleY: 0.22,
      alpha: 0.3,
      duration: 325,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  private enterReactState(): void {
    this.resetBodyTransform();

    // Squash down first, then joyful jump
    this.activeBodyTween = this.scene.tweens.add({
      targets: this.bodySprite,
      scaleX: 0.60,
      scaleY: 0.42,
      duration: 90,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!this.active) return;

        // Jump upward with heart
        this.activeBodyTween = this.scene.tweens.add({
          targets: this.bodySprite,
          y: -22,
          scaleX: 0.48,
          scaleY: 0.58,
          duration: 260,
          yoyo: true,
          ease: 'Back.easeOut',
          onComplete: () => {
            if (!this.active) return;
            this.resetBodyTransform();
          },
        });

        // Shadow contracts during jump
        this.activeShadowTween = this.scene.tweens.add({
          targets: this.shadow,
          scaleX: 0.42,
          scaleY: 0.26,
          alpha: 0.4,
          duration: 260,
          yoyo: true,
        });

        this.spawnFloatingHeart(0, -32);
      },
    });
  }

  private spawnFloatingHeart(offsetX: number, offsetY: number): void {
    if (!this.scene?.textures?.exists('particle_heart')) return;

    const heart = this.scene.add.image(offsetX, offsetY, 'particle_heart');
    heart.setScale(0.35);
    heart.setAlpha(1);
    this.add(heart);

    this.scene.tweens.add({
      targets: heart,
      y: offsetY - 36,
      x: offsetX + Phaser.Math.Between(-10, 10),
      scaleX: 0.65,
      scaleY: 0.65,
      alpha: 0,
      duration: 850,
      ease: 'Quad.easeOut',
      onComplete: () => {
        heart.destroy();
      },
    });
  }

  private spawnZzzIndicator(): void {
    if (!this.active || this.fsm.currentState !== 'SLEEP') return;

    const zzz = this.scene.add.text(12, -28, 'Zzz', {
      fontFamily: `'Nunito', 'Segoe UI', sans-serif`,
      fontSize: '11px',
      color: '#90CAF9',
      fontStyle: 'bold',
    });
    zzz.setOrigin(0.5, 0.5);
    this.add(zzz);

    this.scene.tweens.add({
      targets: zzz,
      x: 24,
      y: -58,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 1800,
      ease: 'Sine.easeOut',
      onComplete: () => {
        zzz.destroy();
      },
    });
  }

  private spawnSlideSnowPuff(): void {
    if (!this.scene?.textures?.exists('particle_snow')) return;

    const puff = this.scene.add.image(0, 8, 'particle_snow');
    puff.setScale(0.3);
    puff.setAlpha(0.7);
    this.add(puff);

    this.scene.tweens.add({
      targets: puff,
      x: this.bodySprite.flipX ? 20 : -20,
      y: 12,
      scaleX: 0.6,
      scaleY: 0.6,
      alpha: 0,
      duration: 400,
      onComplete: () => puff.destroy(),
    });
  }

  private isInsideIcePond(x: number, y: number): boolean {
    const pond = this.bounds.pondCenter ?? { x: 0, y: 10, radiusX: 95, radiusY: 55 };
    const dx = (x - pond.x) / pond.radiusX;
    const dy = (y - pond.y) / pond.radiusY;
    return dx * dx + dy * dy <= 1;
  }

  private resetBodyTransform(): void {
    this.bodySprite.setPosition(0, 0);
    this.bodySprite.setScale(0.52);
    this.bodySprite.setAngle(0);

    this.shadow.setScale(0.58, 0.38);
    this.shadow.setAlpha(0.65);
  }

  private stopActiveTweens(): void {
    if (this.activeBodyTween) {
      this.activeBodyTween.stop();
      this.activeBodyTween = null;
    }
    if (this.activeWobbleTween) {
      this.activeWobbleTween.stop();
      this.activeWobbleTween = null;
    }
    if (this.activeShadowTween) {
      this.activeShadowTween.stop();
      this.activeShadowTween = null;
    }
    if (this.sleepZzzTimer) {
      this.sleepZzzTimer.remove();
      this.sleepZzzTimer = null;
    }
  }

  override destroy(fromScene?: boolean): void {
    this.stopActiveTweens();
    this.unsubFsm?.();
    this.unsubFsm = null;
    this.scene.input?.setDefaultCursor?.('default');
    super.destroy(fromScene);
  }
}

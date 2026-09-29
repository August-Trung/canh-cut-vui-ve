import Phaser from 'phaser';
import { OwnedPenguin } from '@penguin/types';
import { SPECIES_MAP } from '@penguin/game-data';
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
  public static readonly BASE_BODY_SCALE = 0.72;
  public static readonly BASE_SHADOW_SCALE_X = 0.82;
  public static readonly BASE_SHADOW_SCALE_Y = 0.52;

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
    this.shadow = scene.add.image(0, 20, 'entity_shadow');
    this.shadow.setScale(PenguinEntity.BASE_SHADOW_SCALE_X, PenguinEntity.BASE_SHADOW_SCALE_Y);
    this.shadow.setAlpha(0.65);
    this.add(this.shadow);

    // 2. Penguin Body Sprite
    const textureKey = `penguin_${ownedPenguin.speciesId}`;
    this.bodySprite = scene.add.sprite(0, 0, textureKey);
    this.bodySprite.setOrigin(0.5, 0.85); // Pivot at feet for natural squash & stretch
    this.bodySprite.setScale(PenguinEntity.BASE_BODY_SCALE);
    this.add(this.bodySprite);

    // 3. Cute Speech Bubble (positioned over head)
    this.speechBubble = new SpeechBubble(scene, 0, -84);
    this.add(this.speechBubble);

    // 4. Interactive Click Area attached directly to bodySprite
    // Texture is 128x128. Penguin body occupies approx (16, 12) to (112, 120).
    // An explicit rectangle matching the actual penguin bounds in texture coordinates:
    this.bodySprite.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(14, 10, 100, 108),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });

    this.bodySprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleClick(pointer);
    });

    this.bodySprite.on('pointerover', () => {
      this.scene.input?.setDefaultCursor?.('pointer');
      this.bodySprite.setTint(0xe0f2fe); // Subtle cool snow highlight
    });

    this.bodySprite.on('pointerout', () => {
      this.scene.input?.setDefaultCursor?.('default');
      this.bodySprite.clearTint();
    });

    // Also support pointerdown on the container for direct test calls or event forwarding
    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleClick(pointer);
    });

    // 5. Initialize AI State Machine with personality & needs
    const speciesDef = SPECIES_MAP.get(ownedPenguin.speciesId);
    const personality = speciesDef?.personality ?? 'shy';
    this.fsm = new PenguinFSM({
      personality,
      traits: ownedPenguin.traits ?? [],
      getNeeds: () => ({
        hunger: this.ownedPenguin.hunger,
        happiness: this.ownedPenguin.happiness,
      }),
    });
    this.unsubFsm = this.fsm.onStateChange((newState, prevState) => {
      this.handleStateChange(newState, prevState);
    });

    // Start in IDLE
    this.enterIdleState();
    this.playStateAnimation('IDLE');
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
   * Clamp penguin position safely within island boundaries.
   */
  clampToBounds(): void {
    const minX = this.bounds.minX + 20;
    const maxX = this.bounds.maxX - 20;
    const minY = this.bounds.minY + 20;
    const maxY = this.bounds.maxY - 20;
    this.x = Phaser.Math.Clamp(this.x, minX, maxX);
    this.y = Phaser.Math.Clamp(this.y, minY, maxY);
  }

  /**
   * Applies social separation force to prevent penguins from overlapping or clumping.
   * If another penguin is within minDistance (42px), pushes gently away.
   */
  applyFlockingSeparation(otherPenguins: PenguinEntity[], delta: number): void {
    if (!this.active) return;
    const minDistance = 42;
    const dt = delta / 1000;
    let pushX = 0;
    let pushY = 0;

    for (const other of otherPenguins) {
      if (other === this || !other.active) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0.001 && dist < minDistance) {
        // Inverse linear repulsive force
        const force = ((minDistance - dist) / minDistance) * 36;
        pushX += (dx / dist) * force;
        pushY += (dy / dist) * force;
      } else if (dist <= 0.001) {
        pushX += (Math.random() - 0.5) * 20;
        pushY += (Math.random() - 0.5) * 20;
      }
    }

    if (pushX !== 0 || pushY !== 0) {
      this.x += pushX * dt;
      this.y += pushY * dt;
      this.clampToBounds();
    }
  }

  /**
   * Plays character frame animation matching the current FSM state.
   */
  private playStateAnimation(state: PenguinState): void {
    const rawSp = this.ownedPenguin.speciesId.replace('penguin_', '');
    const animMap: Record<PenguinState, string> = {
      IDLE: `${rawSp}_idle`,
      WADDLE: `${rawSp}_walk`,
      FOLLOW: `${rawSp}_walk`,
      BELLY_SLIDE: `${rawSp}_slide`,
      SLEEP: `${rawSp}_sleep`,
      EAT: `${rawSp}_eat`,
      CELEBRATE: `${rawSp}_celebrate`,
      TALK: `${rawSp}_idle`,
      PLAY: `${rawSp}_celebrate`,
      FISH: `${rawSp}_idle`,
      REACT: `${rawSp}_celebrate`,
    };
    const animKey = animMap[state];
    if (animKey && this.scene?.anims?.exists?.(animKey)) {
      this.bodySprite.play?.(animKey, true);
    }
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
        this.fsm.transitionTo('IDLE');
      }
      return;
    }

    // Movement speed: Waddle/Follow/Fish (42 px/s), Slide (140 px/s)
    // Miserable penguins (happiness <= 25) move at 60% waddle speed
    let speed = state === 'BELLY_SLIDE' ? 140 : 42;
    if (this.ownedPenguin.happiness <= 25 && state !== 'BELLY_SLIDE') {
      speed *= 0.6;
    }
    const step = (speed * delta) / 1000;
    const moveDist = Math.min(step, dist);

    this.x += (dx / dist) * moveDist;
    this.y += (dy / dist) * moveDist;
    this.clampToBounds();

    // Orient facing direction
    if (Math.abs(dx) > 1) {
      this.bodySprite.setFlipX(dx < 0);
    }

    // Check if crossing ice pond during waddle -> trigger belly slide!
    if (state === 'WADDLE' && this.isInsideIcePond(this.x, this.y)) {
      this.fsm.transitionTo('BELLY_SLIDE');
    }
  }

  setFacingLeft(facingLeft: boolean): void {
    this.bodySprite?.setFlipX(facingLeft);
  }

  getFacingLeft(): boolean {
    return Boolean(this.bodySprite?.flipX);
  }

  private handleStateChange(newState: PenguinState, _prevState: PenguinState): void {
    this.stopActiveTweens();
    this.playStateAnimation(newState);

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
      scaleY: PenguinEntity.BASE_BODY_SCALE * 1.04,
      scaleX: PenguinEntity.BASE_BODY_SCALE * 0.96,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private enterWaddleState(): void {
    this.resetBodyTransform();

    // 4 distinct walkable zones covering all 4 quadrants of the island (outside the central pond)
    const zones = [
      { minX: -260, maxX: 260, minY: -140, maxY: -95 }, // North ridge
      { minX: -260, maxX: 260, minY: 110, maxY: 150 },  // South promenade
      { minX: -320, maxX: -190, minY: -100, maxY: 100 }, // West bank
      { minX: 190, maxX: 320, minY: -100, maxY: 100 },   // East bank
    ];

    // Pick a destination zone sufficiently far from current position to ensure good journey
    const farZones = zones.filter((z) => {
      const midX = (z.minX + z.maxX) / 2;
      const midY = (z.minY + z.maxY) / 2;
      return Math.hypot(midX - this.x, midY - this.y) > 90;
    });
    const chosenZone = farZones.length > 0
      ? farZones[Math.floor(Math.random() * farZones.length)]
      : zones[Math.floor(Math.random() * zones.length)];

    this.targetX = Phaser.Math.Between(chosenZone.minX, chosenZone.maxX);
    this.targetY = Phaser.Math.Between(chosenZone.minY, chosenZone.maxY);
    this.clampToBounds();

    this.startWaddleWobble();
  }

  private enterBellySlideState(): void {
    this.resetBodyTransform();

    // Orient and tilt onto belly
    const facingLeft = this.bodySprite.flipX;
    const slideAngle = facingLeft ? -75 : 75;

    // Slide across pond towards exit coordinate on snowy bank
    const pond = this.bounds.pondCenter ?? { x: 0, y: 15, radiusX: 190, radiusY: 105 };
    const exitAngle = Math.random() * Math.PI * 2;
    this.targetX = Math.round(pond.x + Math.cos(exitAngle) * (pond.radiusX + 35));
    this.targetY = Math.round(pond.y + Math.sin(exitAngle) * (pond.radiusY + 25));

    this.activeBodyTween = this.scene.tweens.add({
      targets: this.bodySprite,
      angle: slideAngle,
      scaleY: PenguinEntity.BASE_BODY_SCALE * 0.85,
      scaleX: PenguinEntity.BASE_BODY_SCALE * 1.12,
      duration: 200,
      ease: 'Quad.easeOut',
    });

    // Spawn subtle snow slide particles
    this.spawnSlideSnowPuff();
  }

  private enterSleepState(): void {
    this.resetBodyTransform();

    // Squat down into cozy sleeping posture
    this.bodySprite.setScale(PenguinEntity.BASE_BODY_SCALE * 1.05, PenguinEntity.BASE_BODY_SCALE * 0.86);
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
      y: -18,
      scaleY: PenguinEntity.BASE_BODY_SCALE * 1.08,
      scaleX: PenguinEntity.BASE_BODY_SCALE * 0.92,
      duration: 220,
      yoyo: true,
      repeat: 3,
      ease: 'Back.easeOut',
    });

    // Spawn heart burst above head
    this.spawnFloatingHeart(0, -42);
  }

  private enterPlayState(): void {
    this.resetBodyTransform();

    // Playful double hop with rotation
    this.activeBodyTween = this.scene.tweens.add({
      targets: this.bodySprite,
      y: -30,
      scaleY: PenguinEntity.BASE_BODY_SCALE * 1.12,
      scaleX: PenguinEntity.BASE_BODY_SCALE * 0.88,
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

    // Head towards natural pond perimeter shoreline instead of one fixed corner
    const pond = this.bounds.pondCenter ?? { x: 0, y: 15, radiusX: 190, radiusY: 105 };
    const angle = Math.random() * Math.PI * 2;
    const shoreDistX = pond.radiusX + 16 + Phaser.Math.Between(0, 14);
    const shoreDistY = pond.radiusY + 12 + Phaser.Math.Between(0, 10);
    this.targetX = Math.round(pond.x + Math.cos(angle) * shoreDistX);
    this.targetY = Math.round(pond.y + Math.sin(angle) * shoreDistY);
    this.clampToBounds();

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
      y: -46,
      scaleX: PenguinEntity.BASE_BODY_SCALE * 1.08,
      scaleY: PenguinEntity.BASE_BODY_SCALE * 0.92,
      angle: 360,
      duration: 650,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        if (!this.active) return;
        this.resetBodyTransform();
        this.spawnFloatingHeart(0, -46);
      },
    });

    // Shadow scales down during high jump
    this.activeShadowTween = this.scene.tweens.add({
      targets: this.shadow,
      scaleX: PenguinEntity.BASE_SHADOW_SCALE_X * 0.6,
      scaleY: PenguinEntity.BASE_SHADOW_SCALE_Y * 0.6,
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
      scaleX: PenguinEntity.BASE_BODY_SCALE * 1.15,
      scaleY: PenguinEntity.BASE_BODY_SCALE * 0.80,
      duration: 90,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!this.active) return;

        // Jump upward with heart
        this.activeBodyTween = this.scene.tweens.add({
          targets: this.bodySprite,
          y: -28,
          scaleX: PenguinEntity.BASE_BODY_SCALE * 0.92,
          scaleY: PenguinEntity.BASE_BODY_SCALE * 1.12,
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
          scaleX: PenguinEntity.BASE_SHADOW_SCALE_X * 0.72,
          scaleY: PenguinEntity.BASE_SHADOW_SCALE_Y * 0.72,
          alpha: 0.4,
          duration: 260,
          yoyo: true,
        });

        this.spawnFloatingHeart(0, -42);
      },
    });
  }

  private spawnFloatingHeart(offsetX: number, offsetY: number): void {
    if (!this.scene?.textures?.exists('particle_heart')) return;

    const heart = this.scene.add.image(offsetX, offsetY, 'particle_heart');
    heart.setScale(0.5);
    heart.setAlpha(1);
    this.add(heart);

    this.scene.tweens.add({
      targets: heart,
      y: offsetY - 44,
      x: offsetX + Phaser.Math.Between(-12, 12),
      scaleX: 0.85,
      scaleY: 0.85,
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

    const zzz = this.scene.add.text(16, -36, 'Zzz', {
      fontFamily: `'Nunito', 'Segoe UI', sans-serif`,
      fontSize: '13px',
      color: '#90CAF9',
      fontStyle: 'bold',
    });
    zzz.setOrigin(0.5, 0.5);
    this.add(zzz);

    this.scene.tweens.add({
      targets: zzz,
      x: 30,
      y: -70,
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

    const puff = this.scene.add.image(0, 10, 'particle_snow');
    puff.setScale(0.4);
    puff.setAlpha(0.7);
    this.add(puff);

    this.scene.tweens.add({
      targets: puff,
      x: this.bodySprite.flipX ? 24 : -24,
      y: 16,
      scaleX: 0.75,
      scaleY: 0.75,
      alpha: 0,
      duration: 400,
      onComplete: () => puff.destroy(),
    });
  }

  private isInsideIcePond(x: number, y: number): boolean {
    const pond = this.bounds.pondCenter ?? { x: 0, y: 15, radiusX: 190, radiusY: 105 };
    const dx = (x - pond.x) / pond.radiusX;
    const dy = (y - pond.y) / pond.radiusY;
    return dx * dx + dy * dy <= 1;
  }

  private resetBodyTransform(): void {
    this.bodySprite.setPosition(0, 0);
    this.bodySprite.setScale(PenguinEntity.BASE_BODY_SCALE);
    this.bodySprite.setAngle(0);

    this.shadow.setScale(PenguinEntity.BASE_SHADOW_SCALE_X, PenguinEntity.BASE_SHADOW_SCALE_Y);
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

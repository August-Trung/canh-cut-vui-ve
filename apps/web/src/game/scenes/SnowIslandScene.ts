import Phaser from 'phaser';
import { OwnedPenguin } from '@penguin/types';
import { gameBridge } from '../bridge/GameBridge';
import { PenguinEntity, IslandBounds } from '../entities/PenguinEntity';

/**
 * SnowIslandScene
 *
 * Primary 2.5D isometric game environment:
 * - High-resolution procedural Snow Island backdrop with floating ice cliffs and snow banks.
 * - Center frozen ice pond with physical boundaries for belly sliding.
 * - Winter props (Igloo, snow-dusted pine trees, snowman, wooden signpost).
 * - Interactive Incubator Nest emitting 'egg:clicked' across GameBridge.
 * - Ambient snow particle emitter (50-80 particles) optimized for 60 FPS desktop / 30-60 FPS mobile.
 * - Smooth camera drag, pinch-to-zoom (0.75x to 1.5x), and smooth pan focus.
 * - Autonomous PenguinEntity lifecycle management (spawn, actions, frame updates).
 *
 * Strict boundary rule: Never directly imports or mutates Pinia state.
 */
export class SnowIslandScene extends Phaser.Scene {
  private penguins = new Map<string, PenguinEntity>();
  private unsubs: (() => void)[] = [];

  // Camera Drag & Pinch-to-zoom state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private cameraStartX = 0;
  private cameraStartY = 0;
  private lastPinchDistance = 0;

  // Environment references
  private snowParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private nestContainer: Phaser.GameObjects.Container | null = null;

  private islandBounds: IslandBounds = {
    minX: -260,
    maxX: 260,
    minY: -160,
    maxY: 160,
    pondCenter: { x: 0, y: 10, radiusX: 95, radiusY: 55 },
    fishingHole: { x: -170, y: 70 },
  };

  constructor() {
    super({ key: 'SnowIslandScene' });
  }

  create(): void {
    // 1. Build 2.5D Snow Island Environment & Backdrop
    this.buildBackdrop();
    this.buildWinterProps();
    this.buildIncubatorNest();
    this.buildAmbientSnowParticles();

    // 2. Setup Camera Controls & Bounds
    this.setupCameraControls();

    // 3. Setup GameBridge Subscriptions
    this.setupBridgeSubscriptions();

    // 4. Register Scene Lifecycle Cleanup
    this.events.once('shutdown', () => this.handleShutdown());
    this.events.once('destroy', () => this.handleShutdown());

    // 5. Notify Vue UI layer that canvas & scene are ready
    gameBridge.emit('canvas:ready', undefined as void);
  }

  /**
   * Constructs floating ice cliffs, multi-layered snow banks, and center frozen ice pond.
   */
  private buildBackdrop(): void {
    // 1. Lower floating ice cliffs backdrop (faceted depth polygons with gradient shading)
    const cliffs = this.add.graphics();
    cliffs.setDepth(-100);

    // Deep ice cliff shadow
    cliffs.fillStyle(0x5a8fa8, 0.45);
    cliffs.fillEllipse(0, 50, 620, 360);

    // Mid ice cliff body
    cliffs.fillStyle(0x7fb3cd, 0.7);
    cliffs.fillEllipse(0, 35, 590, 330);

    // Soft ice shelf rim
    cliffs.fillStyle(0xa6d8ef, 0.85);
    cliffs.fillEllipse(0, 20, 560, 310);

    // 2. Base Snow Ground Island surface
    const snowGround = this.add.image(0, 0, 'snow_ground');
    snowGround.setOrigin(0.5, 0.5);
    snowGround.setScale(1.0);
    snowGround.setDepth(-50);

    // 3. Multi-layer soft snow banks surrounding the perimeter
    const snowBanks = this.add.graphics();
    snowBanks.setDepth(-40);
    snowBanks.fillStyle(0xffffff, 0.5);
    snowBanks.fillEllipse(-160, -90, 220, 110);
    snowBanks.fillEllipse(170, -80, 210, 100);
    snowBanks.fillEllipse(-150, 70, 200, 95);
    snowBanks.fillEllipse(160, 60, 190, 90);

    // 4. Center Frozen Ice Pond
    const icePond = this.add.image(0, 10, 'ice_pond');
    icePond.setOrigin(0.5, 0.5);
    icePond.setScale(1.0);
    icePond.setDepth(-10);
  }

  /**
   * Constructs winter props (Igloo, snow-dusted pine trees, snowman, wooden signpost).
   */
  private buildWinterProps(): void {
    // 1. Cozy Igloo placed in upper-left snow bank
    const igloo = this.add.image(-160, -90, 'igloo');
    igloo.setOrigin(0.5, 0.82);
    igloo.setScale(0.65);
    igloo.setDepth(-90);

    // 2. Pine trees dusted in snow around perimeter
    const treePositions = [
      { x: -220, y: -110, scale: 0.68 },
      { x: -190, y: -135, scale: 0.54 },
      { x: 180, y: -120, scale: 0.64 },
      { x: 220, y: -90, scale: 0.72 },
      { x: 210, y: 50, scale: 0.62 },
      { x: -210, y: 60, scale: 0.66 },
    ];

    for (const pos of treePositions) {
      const tree = this.add.image(pos.x, pos.y, 'pine_tree');
      tree.setOrigin(0.5, 0.9);
      tree.setScale(pos.scale);
      tree.setDepth(pos.y);
    }

    // 3. Cute Snowman placed in lower-right snow bank
    const snowman = this.add.image(150, 70, 'snowman');
    snowman.setOrigin(0.5, 0.85);
    snowman.setScale(0.65);
    snowman.setDepth(70);

    // 4. Wooden Signpost with snow cap
    this.buildSignpost(-180, 30);
  }

  /**
   * Constructs a stylized 2.5D wooden signpost on the island.
   */
  private buildSignpost(x: number, y: number): void {
    const postContainer = this.add.container(x, y);
    postContainer.setDepth(y);

    const graphics = this.add.graphics();

    // Wooden post
    graphics.fillStyle(0x7a5230, 1.0);
    graphics.fillRoundedRect(-4, -28, 8, 30, 2);

    // Wooden sign board
    graphics.fillStyle(0x9c6644, 1.0);
    graphics.fillRoundedRect(-24, -36, 48, 18, 3);
    graphics.lineStyle(1.5, 0x603813, 0.8);
    graphics.strokeRoundedRect(-24, -36, 48, 18, 3);

    // Snow dusting on top of sign board
    graphics.fillStyle(0xffffff, 0.95);
    graphics.fillRoundedRect(-25, -39, 50, 6, 3);

    postContainer.add(graphics);

    // Sign label text
    const label = this.add.text(0, -27, '❄ Đảo Tuyết', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '9px',
      color: '#ffffff',
      stroke: '#5c3a21',
      strokeThickness: 2,
    });
    label.setOrigin(0.5, 0.5);
    postContainer.add(label);
  }

  /**
   * Constructs interactive Incubator Nest with egg sprite.
   */
  private buildIncubatorNest(): void {
    const nestX = 120;
    const nestY = -60;

    const container = this.add.container(nestX, nestY);
    container.setDepth(nestY);

    const nestGraphics = this.add.graphics();

    // Ground nest shadow
    nestGraphics.fillStyle(0x000000, 0.2);
    nestGraphics.fillEllipse(0, 10, 48, 22);

    // Woven twig & snow nest ring
    nestGraphics.fillStyle(0x8a5a36, 0.95);
    nestGraphics.fillEllipse(0, 4, 44, 20);

    nestGraphics.fillStyle(0x5c3a21, 1.0);
    nestGraphics.fillEllipse(0, 3, 38, 16);

    nestGraphics.fillStyle(0xe8f4f8, 0.9);
    nestGraphics.fillEllipse(0, 1, 32, 12);

    container.add(nestGraphics);

    // Egg sprite resting in nest
    const eggSprite = this.add.image(0, -6, 'egg_basic');
    eggSprite.setScale(0.55);
    container.add(eggSprite);

    // Interactive click area
    container.setSize(56, 56);
    container.setInteractive(
      new Phaser.Geom.Circle(0, 0, 28),
      Phaser.Geom.Circle.Contains
    );

    container.on('pointerdown', () => {
      this.handleNestClick();
    });

    container.on('pointerover', () => {
      this.input?.setDefaultCursor?.('pointer');
    });

    container.on('pointerout', () => {
      this.input?.setDefaultCursor?.('default');
    });

    this.nestContainer = container;
  }

  /**
   * Handle incubator egg nest click.
   */
  handleNestClick(): void {
    // Tactile squish & bounce animation
    if (this.nestContainer) {
      this.tweens.add({
        targets: this.nestContainer,
        scaleX: 1.15,
        scaleY: 0.88,
        duration: 90,
        yoyo: true,
        ease: 'Quad.easeInOut',
      });
    }

    // Emit decoupled bridge event
    gameBridge.emit('egg:clicked', { slotId: 1 });
  }

  /**
   * Builds ambient falling snowflakes particle emitter with max 50-80 particles.
   */
  private buildAmbientSnowParticles(): void {
    this.snowParticles = this.add.particles(0, -320, 'particle_snow', {
      x: { min: -460, max: 460 },
      y: 0,
      lifespan: { min: 4500, max: 7500 },
      speedY: { min: 25, max: 60 },
      speedX: { min: -14, max: 14 },
      scale: { start: 0.25, end: 0.52 },
      alpha: { start: 0.8, end: 0.15 },
      frequency: 110,
      maxAliveParticles: 65,
    });

    this.snowParticles.setDepth(2000);
  }

  /**
   * Configures camera drag/pan, zoom clamping (0.75x to 1.5x), and world bounds.
   */
  private setupCameraControls(): void {
    const camera = this.cameras.main;

    // Center camera on island center (0, 0)
    camera.centerOn(0, 0);

    // Clamped bounds to keep island centered and prevent panning into empty void
    camera.setBounds(-800, -600, 1600, 1200);

    // 1. Mouse Drag & Touch Pan
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.input.pointer1?.isDown && this.input.pointer2?.isDown) {
        return;
      }
      this.isDragging = true;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.cameraStartX = camera.scrollX;
      this.cameraStartY = camera.scrollY;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // 2. Pinch-to-zoom on multi-touch mobile devices
      if (this.input.pointer1?.isDown && this.input.pointer2?.isDown) {
        this.isDragging = false;
        const p1 = this.input.pointer1;
        const p2 = this.input.pointer2;
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

        if (this.lastPinchDistance > 0) {
          const ratio = dist / this.lastPinchDistance;
          const targetZoom = Phaser.Math.Clamp(camera.zoom * ratio, 0.75, 1.5);
          camera.setZoom(targetZoom);
        }
        this.lastPinchDistance = dist;
        return;
      }

      this.lastPinchDistance = 0;

      // Single-pointer drag
      if (this.isDragging && pointer.isDown) {
        const zoom = camera.zoom || 1;
        const dx = (pointer.x - this.dragStartX) / zoom;
        const dy = (pointer.y - this.dragStartY) / zoom;
        camera.scrollX = this.cameraStartX - dx;
        camera.scrollY = this.cameraStartY - dy;
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
      this.lastPinchDistance = 0;
    });

    // 3. Mouse Wheel Zoom (clamped between 0.75x and 1.5x)
    this.input.on(
      'wheel',
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: unknown[],
        _deltaX: number,
        deltaY: number
      ) => {
        const zoomDelta = deltaY > 0 ? -0.06 : 0.06;
        const nextZoom = Phaser.Math.Clamp(camera.zoom + zoomDelta, 0.75, 1.5);
        camera.setZoom(nextZoom);
      }
    );
  }

  /**
   * Subscribes to GameBridge events with type-safe listeners.
   */
  private setupBridgeSubscriptions(): void {
    // 1. Spawn newly hatched penguin
    const unsubSpawn = gameBridge.on('penguin:spawn', ({ penguin }) => {
      this.spawnPenguin(penguin);
    });
    this.unsubs.push(unsubSpawn);

    // 2. Route interaction actions (pet, feed) to target penguin entity
    const unsubAction = gameBridge.on('penguin:action', ({ ownedId, action }) => {
      const target = this.penguins.get(ownedId);
      if (!target) return;

      if (action === 'pet') {
        target.playPetAnimation();
      } else if (action === 'feed') {
        target.playEatAnimation();
      }
    });
    this.unsubs.push(unsubAction);

    // 3. Smooth camera focus to coordinates { x, y }
    const unsubFocus = gameBridge.on('camera:focus', ({ x, y }) => {
      this.cameras.main.pan(x, y, 600, 'Power2');
    });
    this.unsubs.push(unsubFocus);
  }

  /**
   * Instantiates and tracks a new PenguinEntity on the island.
   */
  spawnPenguin(penguin: OwnedPenguin): PenguinEntity {
    const existing = this.penguins.get(penguin.id);
    if (existing) {
      return existing;
    }

    // Spawn near island center or incubator nest
    const spawnX = Phaser.Math.Between(-140, 140);
    const spawnY = Phaser.Math.Between(-80, 80);

    const entity = new PenguinEntity(
      this,
      spawnX,
      spawnY,
      penguin,
      this.islandBounds
    );

    this.add.existing(entity);
    this.penguins.set(penguin.id, entity);

    // Trigger welcoming celebration hop
    entity.playCelebrationAnimation();

    return entity;
  }

  /**
   * Retrieve a tracked penguin by its unique owned ID.
   */
  getPenguin(ownedId: string): PenguinEntity | undefined {
    return this.penguins.get(ownedId);
  }

  /**
   * Get the current count of spawned penguins.
   */
  getPenguinCount(): number {
    return this.penguins.size;
  }

  /**
   * Frame update loop called by Phaser runtime.
   */
  update(time: number, delta: number): void {
    for (const penguin of this.penguins.values()) {
      penguin.update(time, delta);
    }
  }

  /**
   * Cleans up all GameBridge subscriptions and active entities on scene shutdown.
   */
  private handleShutdown(): void {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];

    for (const penguin of this.penguins.values()) {
      penguin.destroy();
    }
    this.penguins.clear();

    if (this.snowParticles) {
      this.snowParticles.stop();
      this.snowParticles = null;
    }
  }
}

import Phaser from 'phaser';
import { OwnedPenguin, IncubatorSlot } from '@penguin/types';
import { gameBridge } from '../bridge/GameBridge';
import { PenguinEntity, IslandBounds } from '../entities/PenguinEntity';
import { EGG_TEXTURE_KEYS } from '../textures/TextureGenerator';

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
  private nestEggSprite: Phaser.GameObjects.Image | null = null;

  private islandBounds: IslandBounds = {
    minX: -320,
    maxX: 320,
    minY: -160,
    maxY: 150,
    pondCenter: { x: 0, y: 15, radiusX: 190, radiusY: 105 },
    fishingHole: { x: -260, y: 70 },
  };

  private static readonly SPAWN_POINTS = [
    { x: -200, y: -65 },  // Upper-left snowy bank (near igloo)
    { x: 180, y: -75 },   // Upper-right snowy bank (near pine trees/nest)
    { x: -220, y: 60 },   // Lower-left snowy bank (near fishing hole)
    { x: 210, y: 70 },    // Lower-right snowy bank (near snowman)
    { x: -50, y: 130 },   // Lower snow bank (south shore)
    { x: 70, y: 130 },    // Lower-right south shore
    { x: -240, y: 0 },    // Far-left snowy shore
    { x: 240, y: 10 },    // Far-right snowy shore
  ];

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
    cliffs.setDepth(-500);

    // Deep ice cliff shadow
    cliffs.fillStyle(0x5a8fa8, 0.45);
    cliffs.fillEllipse(0, 60, 880, 480);

    // Mid ice cliff body
    cliffs.fillStyle(0x7fb3cd, 0.7);
    cliffs.fillEllipse(0, 40, 840, 450);

    // Soft ice shelf rim
    cliffs.fillStyle(0xa6d8ef, 0.85);
    cliffs.fillEllipse(0, 20, 800, 420);

    // 2. Base Snow Ground Island surface (organic elliptical snowy plateau)
    const snowGround = this.add.image(0, 5, 'snow_ground');
    snowGround.setOrigin(0.5, 0.5);
    snowGround.setScale(3.2, 1.7);
    snowGround.setDepth(-400);

    // 3. Multi-layer soft snow banks surrounding the perimeter
    const snowBanks = this.add.graphics();
    snowBanks.setDepth(-350);
    snowBanks.fillStyle(0xffffff, 0.5);
    snowBanks.fillEllipse(-230, -110, 260, 130);
    snowBanks.fillEllipse(240, -100, 250, 120);
    snowBanks.fillEllipse(-210, 90, 240, 115);
    snowBanks.fillEllipse(220, 80, 230, 110);

    // 4. Center Frozen Ice Pond (focal point scaled gracefully, ground level behind entities)
    const icePond = this.add.image(0, 15, 'ice_pond');
    icePond.setOrigin(0.5, 0.5);
    icePond.setScale(1.35);
    icePond.setDepth(-300);
  }

  /**
   * Constructs winter props (Igloo, snow-dusted pine trees, snowman, wooden signpost).
   */
  private buildWinterProps(): void {
    // 1. Cozy Igloo placed in upper-left snow bank
    const igloo = this.add.image(-230, -105, 'igloo');
    igloo.setOrigin(0.5, 0.82);
    igloo.setScale(0.85);
    igloo.setDepth(-105);

    // 2. Pine trees dusted in snow around perimeter
    const treePositions = [
      { x: -320, y: -125, scale: 0.90 },
      { x: -270, y: -155, scale: 0.75 },
      { x: 260, y: -140, scale: 0.85 },
      { x: 310, y: -105, scale: 0.92 },
      { x: 300, y: 70, scale: 0.82 },
      { x: -300, y: 80, scale: 0.85 },
      { x: 0, y: -170, scale: 0.70 },
    ];

    for (const pos of treePositions) {
      const tree = this.add.image(pos.x, pos.y, 'pine_tree');
      tree.setOrigin(0.5, 0.9);
      tree.setScale(pos.scale);
      tree.setDepth(pos.y);
    }

    // 3. Cute Snowman placed in lower-right snow bank
    const snowman = this.add.image(220, 90, 'snowman');
    snowman.setOrigin(0.5, 0.85);
    snowman.setScale(0.82);
    snowman.setDepth(90);

    // 4. Wooden Signpost with snow cap
    this.buildSignpost(-250, 45);
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
   * Constructs interactive Incubator Nest.
   * By default, the nest is empty and dynamically reflects the live status of incubator slot 1.
   */
  private buildIncubatorNest(): void {
    const nestX = 175;
    const nestY = -75;

    const container = this.add.container(nestX, nestY);
    container.setDepth(nestY);

    const nestGraphics = this.add.graphics();

    // Ground nest shadow
    nestGraphics.fillStyle(0x000000, 0.2);
    nestGraphics.fillEllipse(0, 14, 62, 28);

    // Woven twig & snow nest ring
    nestGraphics.fillStyle(0x8a5a36, 0.95);
    nestGraphics.fillEllipse(0, 5, 56, 26);

    nestGraphics.fillStyle(0x5c3a21, 1.0);
    nestGraphics.fillEllipse(0, 4, 48, 20);

    nestGraphics.fillStyle(0xe8f4f8, 0.9);
    nestGraphics.fillEllipse(0, 1, 40, 15);

    container.add(nestGraphics);

    // Interactive click area accurately centered over the visible nest bowl and egg
    container.setSize(72, 72);
    container.setInteractive({
      hitArea: new Phaser.Geom.Circle(36, 32, 38),
      hitAreaCallback: Phaser.Geom.Circle.Contains,
      useHandCursor: true,
    });

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
   * Synchronizes the in-world incubator nest visual with incubator slot 1.
   * - EMPTY / HATCHED / null: empty nest (egg sprite removed).
   * - EGG_PLACED / INCUBATING: renders the corresponding egg sprite.
   * - READY_TO_HATCH / HATCHING: renders the egg sprite with gentle anticipation wobble.
   */
  updateNestState(slot: IncubatorSlot | null | undefined): void {
    if (!this.nestContainer) return;

    const hasEgg = Boolean(
      slot &&
      slot.state !== 'EMPTY' &&
      slot.state !== 'HATCHED' &&
      slot.eggTypeId
    );

    if (!hasEgg) {
      if (this.nestEggSprite) {
        this.tweens?.killTweensOf?.(this.nestEggSprite);
        this.nestEggSprite.destroy();
        this.nestEggSprite = null;
      }
      return;
    }

    const eggTypeId = slot!.eggTypeId!;
    const mappedKey = (EGG_TEXTURE_KEYS as Record<string, string>)[eggTypeId];
    const textureKey =
      mappedKey ??
      (this.textures?.exists?.(`egg_${eggTypeId}`) ? `egg_${eggTypeId}` : 'egg_basic');

    if (!this.nestEggSprite) {
      this.nestEggSprite = this.add.image(0, -8, textureKey);
      this.nestEggSprite.setScale(0.72);
      this.nestContainer.add(this.nestEggSprite);
    } else {
      this.nestEggSprite.setTexture(textureKey);
      this.nestEggSprite.setVisible(true);
    }

    if (slot!.state === 'READY_TO_HATCH' || slot!.state === 'HATCHING') {
      if (this.tweens && !this.tweens.isTweening(this.nestEggSprite)) {
        this.tweens.add({
          targets: this.nestEggSprite,
          angle: { from: -5, to: 5 },
          scaleY: { from: 0.70, to: 0.74 },
          duration: 350,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    } else {
      this.tweens?.killTweensOf?.(this.nestEggSprite);
      this.nestEggSprite.setAngle(0);
      this.nestEggSprite.setScale(0.72);
    }
  }

  /**
   * Returns the nest container GameObject.
   */
  getNestContainer(): Phaser.GameObjects.Container | null {
    return this.nestContainer;
  }

  /**
   * Returns the current egg image GameObject inside the nest, or null if the nest is empty.
   */
  getNestEggSprite(): Phaser.GameObjects.Image | null {
    return this.nestEggSprite;
  }

  /**
   * Handle incubator egg nest click.
   */
  handleNestClick(): void {
    // Tactile squish & bounce animation
    if (this.nestContainer) {
      this.tweens.killTweensOf(this.nestContainer);
      this.nestContainer.setScale(1.0);
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
      x: { min: -520, max: 520 },
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
   * Dynamically frames the island to fill the viewport responsively.
   */
  public updateCameraFraming(): void {
    if (!this.cameras?.main) return;

    const camera = this.cameras.main;
    const width = this.scale?.width || 1280;
    const height = this.scale?.height || 720;

    // Island content reference dimensions
    const targetWidth = 1000;
    const targetHeight = 650;

    // Available space reserving room for TopBar (~54px) and Bottom ShelfRack (~76px)
    const availWidth = Math.max(380, width - 40);
    const availHeight = Math.max(300, height - 130);

    const zoomX = availWidth / targetWidth;
    const zoomY = availHeight / targetHeight;

    // Fit island with high visual presence
    const optimalZoom = Phaser.Math.Clamp(Math.min(zoomX, zoomY), 0.75, 1.75);
    camera.setZoom(optimalZoom);

    // Center camera on island (0, 0) with a slight vertical balance
    const verticalOffset = (54 - 76) / (2 * optimalZoom);
    camera.centerOn(0, verticalOffset);

    // World bounds clamped to allow gentle panning
    const boundW = Math.max(2200, width / optimalZoom + 600);
    const boundH = Math.max(1600, height / optimalZoom + 600);
    camera.setBounds(-boundW / 2, -boundH / 2, boundW, boundH);
  }

  /**
   * Configures camera drag/pan, zoom clamping (0.75x to 1.5x), and world bounds.
   */
  private setupCameraControls(): void {
    const camera = this.cameras.main;

    // Center camera on island center (0, 0)
    camera.centerOn(0, 0);

    // Initial clamped bounds
    camera.setBounds(-1100, -800, 2200, 1600);

    // Apply responsive camera framing
    this.updateCameraFraming();

    // Re-frame automatically when game canvas / window resizes
    this.scale?.on?.('resize', () => {
      this.updateCameraFraming();
    });

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
          const targetZoom = Phaser.Math.Clamp(camera.zoom * ratio, 0.65, 2.0);
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

    // 3. Mouse Wheel Zoom (clamped between 0.65x and 2.0x)
    this.input.on(
      'wheel',
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: unknown[],
        _deltaX: number,
        deltaY: number
      ) => {
        const zoomDelta = deltaY > 0 ? -0.06 : 0.06;
        const nextZoom = Phaser.Math.Clamp(camera.zoom + zoomDelta, 0.65, 2.0);
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

    // 4. Synchronize world entities on startup, save reset, or save import
    const unsubSync = gameBridge.on('world:sync', ({ penguins, nestSlot }) => {
      this.syncPenguins(penguins);
      if (nestSlot !== undefined) {
        this.updateNestState(nestSlot);
      }
    });
    this.unsubs.push(unsubSync);

    // 5. Synchronize incubator nest state dynamically
    const unsubNestSync = gameBridge.on('nest:sync', ({ slot }) => {
      this.updateNestState(slot);
    });
    this.unsubs.push(unsubNestSync);

    // 6. Pause / resume scene input when Vue modals open / close
    const unsubModal = gameBridge.on('ui:modal', ({ open }) => {
      if (this.input) {
        this.input.enabled = !open;
        if (open) {
          this.isDragging = false;
          this.lastPinchDistance = 0;
          this.input.setDefaultCursor?.('default');
        }
      }
    });
    this.unsubs.push(unsubModal);
  }

  /**
   * Synchronizes island entities with the provided owned penguins array,
   * clearing any previously active penguin entities and creating fresh ones.
   */
  syncPenguins(penguins: OwnedPenguin[]): void {
    for (const penguin of this.penguins.values()) {
      penguin.destroy();
    }
    this.penguins.clear();

    for (const penguin of penguins) {
      this.spawnPenguin(penguin);
    }
  }

  /**
   * Instantiates and tracks a new PenguinEntity on the island.
   */
  spawnPenguin(penguin: OwnedPenguin): PenguinEntity {
    const existing = this.penguins.get(penguin.id);
    if (existing) {
      return existing;
    }

    // Select curated spawn point with subtle jitter
    const index = this.penguins.size % SnowIslandScene.SPAWN_POINTS.length;
    const basePoint = SnowIslandScene.SPAWN_POINTS[index];
    const spawnX = basePoint.x + Phaser.Math.Between(-12, 12);
    const spawnY = basePoint.y + Phaser.Math.Between(-8, 8);

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
    this.scale?.off?.('resize');

    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];

    for (const penguin of this.penguins.values()) {
      penguin.destroy();
    }
    this.penguins.clear();

    if (this.nestEggSprite) {
      this.tweens?.killTweensOf?.(this.nestEggSprite);
      this.nestEggSprite = null;
    }

    if (this.snowParticles) {
      this.snowParticles.stop();
      this.snowParticles = null;
    }
  }
}

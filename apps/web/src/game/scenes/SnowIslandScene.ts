import Phaser from 'phaser';
import { OwnedPenguin, IncubatorSlot, PlacedDecoration } from '@penguin/types';
import { DECORATION_PLOTS, DECORATION_CATALOG } from '@penguin/game-data';
import { gameBridge } from '../bridge/GameBridge';
import { PenguinEntity, IslandBounds } from '../entities/PenguinEntity';
import { EGG_TEXTURE_KEYS } from '../textures/TextureGenerator';
import { soundService } from '../../services/SoundService';


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
  private plotContainers = new Map<number, Phaser.GameObjects.Container>();
  private decorationSprites = new Map<number, Phaser.GameObjects.Image>();

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
    this.buildCentralPondProps();
    this.buildWinterProps();
    this.buildAnchorPlots();
    this.buildIncubatorNest();
    this.buildWorldEggs();
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
   * Constructs expansive natural snow terrain, distant arctic mountains, and central feeding pond.
   */
  private buildBackdrop(): void {
    // 1. Distant icy mountain peaks on horizon
    const mountains = this.add.graphics();
    mountains.setDepth(-550);

    // Pale mountain silhouettes in the distance
    mountains.fillStyle(0xcce7f6, 0.85);
    mountains.beginPath();
    mountains.moveTo(-600, -180);
    mountains.lineTo(-420, -290);
    mountains.lineTo(-240, -190);
    mountains.lineTo(-100, -280);
    mountains.lineTo(80, -190);
    mountains.lineTo(260, -310);
    mountains.lineTo(460, -200);
    mountains.lineTo(600, -270);
    mountains.lineTo(600, 200);
    mountains.lineTo(-600, 200);
    mountains.closePath();
    mountains.fillPath();

    // Snow caps on mountain peaks
    mountains.fillStyle(0xffffff, 0.95);
    const peaks = [
      [-420, -290, 45],
      [-100, -280, 40],
      [260, -310, 50],
      [600, -270, 35],
    ];
    for (const [px, py, radius] of peaks) {
      mountains.fillCircle(px, py + 20, radius);
    }

    // 2. Wide sprawling snow base across the game world
    const snowBase = this.add.graphics();
    snowBase.setDepth(-480);
    snowBase.fillStyle(0xe2f1fb, 0.95);
    snowBase.fillRoundedRect(-650, -320, 1300, 640, 60);

    // 3. Base Snow Ground Island surface (organic snowy plateau)
    const snowGround = this.add.image(0, 10, 'snow_ground');
    snowGround.setOrigin(0.5, 0.5);
    snowGround.setScale(4.5, 2.3);
    snowGround.setDepth(-400);

    // 4. Multi-layer soft undulating snow banks surrounding the perimeter
    const snowBanks = this.add.graphics();
    snowBanks.setDepth(-350);
    snowBanks.fillStyle(0xffffff, 0.65);
    snowBanks.fillEllipse(-280, -130, 320, 150);
    snowBanks.fillEllipse(280, -120, 310, 140);
    snowBanks.fillEllipse(-260, 110, 300, 135);
    snowBanks.fillEllipse(270, 100, 290, 130);
    snowBanks.fillEllipse(0, -150, 400, 130);
    snowBanks.fillEllipse(0, 150, 420, 130);

    // 5. Center Water Pond (focal point scaled prominently in center)
    const icePond = this.add.image(0, 15, 'ice_pond');
    icePond.setOrigin(0.5, 0.5);
    icePond.setScale(1.55);
    icePond.setDepth(-300);
  }

  /**
   * Constructs the Central Pond environment:
   * - Rainbow arched bridge on the left shore (matching original Zing Me screenshot).
   * - Interactive water splash feedback on click.
   * - Floating Food Storage signpost above the pond.
   */
  private buildCentralPondProps(): void {
    const pondProps = this.add.container(0, 15);
    pondProps.setDepth(-290);

    // 1. Rainbow Slide / Bridge on the left pond shore
    const rainbowGraphics = this.add.graphics();
    rainbowGraphics.setPosition(-165, -15);
    const colors = [0xef4444, 0xf59e0b, 0x10b981, 0x3b82f6];
    for (let i = 0; i < colors.length; i++) {
      rainbowGraphics.lineStyle(3, colors[i], 1.0);
      rainbowGraphics.strokeEllipse(0, 0, (28 + i * 4) * 2, (16 + i * 2) * 2);
    }
    // Candy stripe posts supporting the rainbow bridge
    rainbowGraphics.fillStyle(0xffffff, 1.0);
    rainbowGraphics.fillRoundedRect(-36, 0, 6, 22, 0);
    rainbowGraphics.fillRoundedRect(28, 0, 6, 22, 0);
    rainbowGraphics.fillStyle(0xef4444, 1.0);
    rainbowGraphics.fillRoundedRect(-36, 4, 6, 4, 0);
    rainbowGraphics.fillRoundedRect(-36, 12, 6, 4, 0);
    rainbowGraphics.fillRoundedRect(28, 4, 6, 4, 0);
    rainbowGraphics.fillRoundedRect(28, 12, 6, 4, 0);
    pondProps.add(rainbowGraphics);

    // 2. Floating Food Storage Gauge Sign above the pond
    const gaugeContainer = this.add.container(0, -82);
    gaugeContainer.setDepth(-200);

    const signGfx = this.add.graphics();
    // Shadow
    signGfx.fillStyle(0x0f172a, 0.25);
    signGfx.fillRoundedRect(-52, -13, 104, 28, 14);
    // Plaque background
    signGfx.fillStyle(0xffffff, 0.95);
    signGfx.fillRoundedRect(-54, -15, 108, 28, 14);
    signGfx.lineStyle(2, 0x0284c7, 1.0);
    signGfx.strokeRoundedRect(-54, -15, 108, 28, 14);

    const signText = this.add.text(0, -1, '🐟 Hồ Thức Ăn', {
      fontFamily: `'Nunito', 'Quicksand', system-ui, sans-serif`,
      fontSize: '11px',
      color: '#0369a1',
      fontStyle: 'bold',
      align: 'center',
    });
    signText.setOrigin(0.5, 0.5);

    gaugeContainer.add([signGfx, signText]);

    // Gentle floating bobbing tween
    this.tweens?.add?.({
      targets: gaugeContainer,
      y: -88,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Make pond area interactive: clicking ripples water and sparkles
    if (typeof this.add.zone === 'function') {
      const pondHitArea = this.add.zone(0, 15, 260, 130);
      pondHitArea.setOrigin?.(0.5, 0.5);
      pondHitArea.setInteractive?.({ useHandCursor: true });
      pondHitArea.on?.('pointerdown', (pointer: Phaser.Input.Pointer) => {
        soundService.playPop();
        if (typeof this.add.particles === 'function') {
          const emitter = this.add.particles(pointer.worldX, pointer.worldY, 'particle_sparkle', {
            speed: { min: 20, max: 70 },
            scale: { start: 0.8, end: 0 },
            lifespan: 450,
            quantity: 4,
            emitting: false,
          });
          emitter?.explode?.();
          this.time?.delayedCall?.(500, () => emitter?.destroy?.());
        }
      });
    }
  }

  /**
   * Constructs collectible cartoon eggs scattered on the snow
   * matching the iconic visual clutter of Zing Me Cánh Cụt Vui Vẻ.
   */
  private buildWorldEggs(): void {
    const eggPositions = [
      { x: -140, y: -45, texture: 'egg_basic', scale: 0.65 },
      { x: 135, y: -40, texture: 'egg_frozen', scale: 0.68 },
      { x: -85, y: 75, texture: 'egg_basic', scale: 0.64 },
      { x: 95, y: 80, texture: 'egg_golden', scale: 0.72 },
      { x: -185, y: 25, texture: 'egg_frozen', scale: 0.62 },
      { x: 175, y: 15, texture: 'egg_basic', scale: 0.66 },
    ];

    for (const eggData of eggPositions) {
      const egg = this.add.image(eggData.x, eggData.y, eggData.texture);
      egg.setOrigin(0.5, 0.8);
      egg.setScale(eggData.scale);
      egg.setDepth(eggData.y);

      egg.setInteractive({ useHandCursor: true });
      egg.on('pointerdown', () => {
        soundService.playPop();
        // Playful hop animation
        this.tweens?.add?.({
          targets: egg,
          y: eggData.y - 14,
          scaleY: eggData.scale * 1.25,
          scaleX: eggData.scale * 0.85,
          duration: 180,
          yoyo: true,
          ease: 'Back.easeOut',
        });
      });
    }
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
    const label = this.add.text(0, -27, 'Đảo Tuyết', {
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
   * Constructs the 6 predefined 2.5D anchor plots for island decorations.
   */
  private buildAnchorPlots(): void {
    for (const plot of DECORATION_PLOTS) {
      const container = this.add.container(plot.x, plot.y);
      container.setDepth(plot.depthOffset);

      // Plot marker pad: soft ice ellipse with subtle outline
      const pad = this.add.graphics();
      pad.fillStyle(0xd0e8f8, 0.4);
      pad.fillEllipse(0, 0, 48, 24);
      pad.lineStyle(1.5, 0x93c5fd, 0.6);
      pad.strokeEllipse?.(0, 0, 48, 24);
      container.add(pad);


      container.setSize(48, 36);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => {
        this.handlePlotClick(plot.id);
      });

      this.plotContainers.set(plot.id, container);
    }
  }

  /**
   * Handles plot clicking with tactile squeeze bounce animation and GameBridge event emission.
   */
  handlePlotClick(plotId: number): void {
    const container = this.plotContainers.get(plotId);
    if (container && this.tweens) {
      this.tweens.killTweensOf(container);
      container.setScale(1.0);
      this.tweens.add({
        targets: container,
        scaleX: 1.15,
        scaleY: 0.88,
        duration: 90,
        yoyo: true,
        ease: 'Quad.easeInOut',
      });
    }

    gameBridge.emit('plot:clicked', { plotId });
  }

  /**
   * Returns the container GameObject for an anchor plot.
   */
  getPlotContainer(plotId: number): Phaser.GameObjects.Container | undefined {
    return this.plotContainers.get(plotId);
  }

  /**
   * Returns the active decoration image sprite on an anchor plot, if present.
   */
  getDecorationSprite(plotId: number): Phaser.GameObjects.Image | undefined {
    return this.decorationSprites.get(plotId);
  }

  /**
   * Synchronizes placed decorations on anchor plots, updating sprites with proper depth sorting.
   */
  syncDecorations(decorations: PlacedDecoration[]): void {
    for (const sprite of this.decorationSprites.values()) {
      sprite.destroy();
    }
    this.decorationSprites.clear();

    for (const placed of decorations) {
      const container = this.plotContainers.get(placed.plotId);
      if (container) {
        const def = DECORATION_CATALOG[placed.decorationId];
        const visualKey = def?.visualKey || placed.decorationId;
        const sprite = this.add.image(0, -14, visualKey);
        sprite.setOrigin(0.5, 0.85);
        container.add(sprite);
        this.decorationSprites.set(placed.plotId, sprite);
      }
    }
  }

  /**
   * Spawns a floating bounce coin effect with +Amount text that auto-destroys.
   */
  spawnCoinDropEffect(x: number, y: number, amount: number): void {
    soundService.playCoinDrop();

    const coinText = this.add.text(x, y - 20, `+${amount} Xu`, {
      fontSize: '18px',
      color: '#facc15',
      fontStyle: 'bold',
      stroke: '#78350f',
      strokeThickness: 3,
    });
    coinText.setOrigin(0.5, 0.5);
    coinText.setDepth(2500);

    if (this.tweens) {
      this.tweens.add({
        targets: coinText,
        y: y - 65,
        alpha: 0,
        duration: 800,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          coinText.destroy();
        },
      });
    }
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

    // 7. Synchronize placed decorations on anchor plots
    const unsubDecor = gameBridge.on('decorations:sync', ({ decorations }) => {
      this.syncDecorations(decorations);
    });
    this.unsubs.push(unsubDecor);

    // 8. Spawn bounce coin drop effect
    const unsubCoin = gameBridge.on('effect:coin_drop', ({ x, y, amount }) => {
      this.spawnCoinDropEffect(x, y, amount);
    });
    this.unsubs.push(unsubCoin);

    // 9. Trigger celebration on penguin level-up
    const unsubLevelUp = gameBridge.on('effect:penguin_level_up', ({ penguinId, newLevel }) => {
      const entity = this.penguins.get(penguinId);
      if (entity) {
        entity.playCelebrationAnimation();
        entity.say(`Level ${newLevel}! ✨`, 3000);
      }
    });
    this.unsubs.push(unsubLevelUp);
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

  private socialScanTimer = 0;

  /**
   * Frame update loop called by Phaser runtime.
   */
  update(time: number, delta: number): void {
    for (const penguin of this.penguins.values()) {
      penguin.update(time, delta);
    }

    this.socialScanTimer += delta;
    if (this.socialScanTimer >= 6000) {
      this.socialScanTimer = 0;
      this.checkSocialProximity();
    }
  }

  /**
   * Scans penguin pairs within 60px proximity:
   * 40% chance: face each other and enter TALK state.
   * 25% chance: one penguin initiates FOLLOW behind the other.
   */
  checkSocialProximity(): void {
    const list = Array.from(this.penguins.values());
    if (list.length < 2) return;

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const p1 = list[i];
        const p2 = list[j];
        if (p1.fsm.currentState === 'IDLE' && p2.fsm.currentState === 'IDLE') {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= 60) {
            const roll = Math.random();
            if (roll < 0.40) {
              p1.setFacingLeft(p2.x < p1.x);
              p2.setFacingLeft(p1.x < p2.x);
              p1.fsm.transitionTo('TALK');
              p2.fsm.transitionTo('TALK');
              p1.say();
              p2.say();
            } else if (roll < 0.65) {
              p1.followPenguin(p2);
            }
            return;
          }
        }
      }
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

    for (const sprite of this.decorationSprites.values()) {
      sprite.destroy();
    }
    this.decorationSprites.clear();

    for (const container of this.plotContainers.values()) {
      container.destroy();
    }
    this.plotContainers.clear();

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

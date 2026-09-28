import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Phaser from 'phaser';
import { getPhaserConfig } from '../../PhaserConfig';
import { BootScene } from '../BootScene';
import { SnowIslandScene } from '../SnowIslandScene';
import { gameBridge } from '../../bridge/GameBridge';
import { OwnedPenguin } from '@penguin/types';
import { DECORATION_PLOTS } from '@penguin/game-data';


describe('Task 8: Snow Island Scene & Camera Controls', () => {
  describe('PhaserConfig', () => {
    it('returns a valid, responsive Phaser configuration for a container', () => {
      const config = getPhaserConfig('game-canvas-container');

      expect(config).toBeDefined();
      expect(config.parent).toBe('game-canvas-container');
      expect(config.type).toBe(Phaser.AUTO);
      expect(config.width).toBe('100%');
      expect(config.height).toBe('100%');

      // Scale manager
      expect(config.scale).toBeDefined();
      expect(config.scale?.mode).toBe(Phaser.Scale.RESIZE);
      expect(config.scale?.autoCenter).toBe(Phaser.Scale.CENTER_BOTH);

      // Physics (arcade with 0 gravity)
      expect(config.physics?.default).toBe('arcade');
      expect(config.physics?.arcade?.gravity).toEqual({ x: 0, y: 0 });

      // Scenes list
      expect(config.scene).toEqual([BootScene, SnowIslandScene]);

      // FPS & performance targets (30-60 FPS)
      expect(config.fps?.target).toBe(60);
      expect(config.fps?.min).toBe(30);

      // Multi-touch active pointers for mobile drag / pinch
      const inputConfig = config.input as Phaser.Types.Core.InputConfig;
      expect(inputConfig?.activePointers).toBeGreaterThanOrEqual(2);
    });
  });

  describe('BootScene', () => {
    it('is defined with key BootScene', () => {
      const scene = new BootScene();
      expect(scene.sys.settings.key).toBe('BootScene');
    });

    it('generates textures via ensureGameTextures and transitions to SnowIslandScene', () => {
      const scene = new BootScene();
      const startSpy = vi.fn();
      scene.scene = {
        key: 'BootScene',
        start: startSpy,
      } as unknown as Phaser.Scenes.ScenePlugin;

      // Mock texture manager
      const existsSpy = vi.fn().mockReturnValue(true);
      const addCanvasSpy = vi.fn();
      scene.textures = {
        exists: existsSpy,
        addCanvas: addCanvasSpy,
      } as unknown as Phaser.Textures.TextureManager;

      scene.create();

      expect(startSpy).toHaveBeenCalledWith('SnowIslandScene');
    });
  });

  describe('SnowIslandScene', () => {
    let scene: SnowIslandScene;
    let mockCamera: {
      setBounds: ReturnType<typeof vi.fn>;
      centerOn: ReturnType<typeof vi.fn>;
      setZoom: ReturnType<typeof vi.fn>;
      pan: ReturnType<typeof vi.fn>;
      zoom: number;
      scrollX: number;
      scrollY: number;
    };
    let mockAdd: {
      image: ReturnType<typeof vi.fn>;
      sprite: ReturnType<typeof vi.fn>;
      graphics: ReturnType<typeof vi.fn>;
      container: ReturnType<typeof vi.fn>;
      existing: ReturnType<typeof vi.fn>;
      particles: ReturnType<typeof vi.fn>;
      text: ReturnType<typeof vi.fn>;
    };
    let mockInput: {
      on: ReturnType<typeof vi.fn>;
      off: ReturnType<typeof vi.fn>;
      enable?: ReturnType<typeof vi.fn>;
      disable?: ReturnType<typeof vi.fn>;
      enabled: boolean;
      setDefaultCursor: ReturnType<typeof vi.fn>;
      pointer1?: { isDown: boolean; x: number; y: number };
      pointer2?: { isDown: boolean; x: number; y: number };
    };
    let mockTweens: {
      add: ReturnType<typeof vi.fn>;
      killTweensOf: ReturnType<typeof vi.fn>;
      isTweening: ReturnType<typeof vi.fn>;
    };
    let mockEvents: Phaser.Events.EventEmitter;

    beforeEach(() => {
      gameBridge.clear();
      scene = new SnowIslandScene();

      mockCamera = {
        setBounds: vi.fn().mockReturnThis(),
        centerOn: vi.fn().mockReturnThis(),
        setZoom: vi.fn().mockReturnThis(),
        pan: vi.fn().mockReturnThis(),
        zoom: 1,
        scrollX: 0,
        scrollY: 0,
      };

      const mockDisplayObject = {
        setScale: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setOrigin: vi.fn().mockReturnThis(),
        setSize: vi.fn().mockReturnThis(),
        setInteractive: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        once: vi.fn().mockReturnThis(),
        off: vi.fn().mockReturnThis(),
        emit: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        add: vi.fn().mockReturnThis(),
        remove: vi.fn().mockReturnThis(),
        removeFromDisplayList: vi.fn().mockReturnThis(),
        addToDisplayList: vi.fn().mockReturnThis(),
        addedToScene: vi.fn().mockReturnThis(),
        removedFromScene: vi.fn().mockReturnThis(),
        setPosition: vi.fn().mockReturnThis(),
        setAngle: vi.fn().mockReturnThis(),
        setRotation: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        setFlipX: vi.fn().mockReturnThis(),
        setTexture: vi.fn().mockReturnThis(),
        active: true,
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
      };

      const mockGraphics = {
        ...mockDisplayObject,
        fillStyle: vi.fn().mockReturnThis(),
        fillCircle: vi.fn().mockReturnThis(),
        fillEllipse: vi.fn().mockReturnThis(),
        strokeEllipse: vi.fn().mockReturnThis(),
        fillPath: vi.fn().mockReturnThis(),

        beginPath: vi.fn().mockReturnThis(),
        closePath: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        strokePath: vi.fn().mockReturnThis(),
        fillRoundedRect: vi.fn().mockReturnThis(),
        strokeRoundedRect: vi.fn().mockReturnThis(),
        clear: vi.fn().mockReturnThis(),
        generateTexture: vi.fn().mockReturnThis(),
      };

      const mockEmitter = {
        ...mockDisplayObject,
        stop: vi.fn().mockReturnThis(),
        start: vi.fn().mockReturnThis(),
        maxAliveParticles: 60,
      };

      mockAdd = {
        image: vi.fn().mockReturnValue(mockDisplayObject),
        sprite: vi.fn().mockReturnValue(mockDisplayObject),
        graphics: vi.fn().mockReturnValue(mockGraphics),
        container: vi.fn().mockImplementation(() => ({
          ...mockDisplayObject,
          setSize: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          add: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
        })),
        existing: vi.fn((obj) => obj),
        particles: vi.fn().mockReturnValue(mockEmitter),
        text: vi.fn().mockReturnValue(mockDisplayObject),
      };

      mockInput = {
        on: vi.fn().mockReturnThis(),
        off: vi.fn().mockReturnThis(),
        enable: vi.fn(),
        disable: vi.fn(),
        enabled: true,
        setDefaultCursor: vi.fn(),
      };

      mockTweens = {
        add: vi.fn().mockReturnValue({ stop: vi.fn() }),
        killTweensOf: vi.fn(),
        isTweening: vi.fn().mockReturnValue(false),
      };

      mockEvents = new Phaser.Events.EventEmitter();

      scene.cameras = {
        main: mockCamera as unknown as Phaser.Cameras.Scene2D.Camera,
      } as unknown as Phaser.Cameras.Scene2D.CameraManager;

      scene.add = mockAdd as unknown as Phaser.GameObjects.GameObjectFactory;
      scene.input = mockInput as unknown as Phaser.Input.InputPlugin;
      scene.events = mockEvents;
      scene.tweens = mockTweens as unknown as Phaser.Tweens.TweenManager;
      if (scene.sys) {
        scene.sys.queueDepthSort = vi.fn();
        (scene.sys as unknown as { input: unknown }).input = mockInput;
      }
    });

    afterEach(() => {
      gameBridge.clear();
    });

    it('has scene key SnowIslandScene', () => {
      expect(scene.sys.settings.key).toBe('SnowIslandScene');
    });

    it('emits canvas:ready over gameBridge when created', () => {
      const readyHandler = vi.fn();
      gameBridge.on('canvas:ready', readyHandler);

      scene.create();

      expect(readyHandler).toHaveBeenCalledTimes(1);
    });

    it('builds island environment props and ambient snow particles', () => {
      scene.create();

      // Backdrop floating ice cliffs, multi-layer snow banks, ice pond
      expect(mockAdd.image).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'ice_pond');
      expect(mockAdd.image).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'snow_ground');

      // Winter props: igloo, pine_tree, snowman
      expect(mockAdd.image).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'igloo');
      expect(mockAdd.image).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'pine_tree');
      expect(mockAdd.image).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'snowman');

      // Ambient particle snow (max 50-80 particles)
      expect(mockAdd.particles).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'particle_snow',
        expect.objectContaining({
          maxAliveParticles: expect.any(Number),
        })
      );
      const particleCall = mockAdd.particles.mock.calls.find((call) => call[2] === 'particle_snow');
      const particleConfig = particleCall?.[3] as { maxAliveParticles: number };
      expect(particleConfig.maxAliveParticles).toBeGreaterThanOrEqual(50);
      expect(particleConfig.maxAliveParticles).toBeLessThanOrEqual(80);
    });

    it('configures camera controls with bounds and drag/wheel listeners', () => {
      scene.create();

      expect(mockCamera.setBounds).toHaveBeenCalled();
      expect(mockCamera.centerOn).toHaveBeenCalledWith(0, 0);

      // Input listeners registered for drag & zoom
      const registeredEvents = mockInput.on.mock.calls.map((c) => c[0]);
      expect(registeredEvents).toContain('pointerdown');
      expect(registeredEvents).toContain('pointermove');
      expect(registeredEvents).toContain('pointerup');
      expect(registeredEvents).toContain('wheel');
    });

    it('emits egg:clicked and resets/kills tweens on nestContainer when incubator nest is clicked', () => {
      const eggHandler = vi.fn();
      gameBridge.on('egg:clicked', eggHandler);

      scene.create();

      // Trigger the nest click callback
      scene.handleNestClick();

      expect(mockTweens.killTweensOf).toHaveBeenCalled();
      expect(mockTweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          scaleX: 1.15,
          scaleY: 0.88,
          duration: 90,
          yoyo: true,
        })
      );
      expect(eggHandler).toHaveBeenCalledWith({ slotId: 1 });
    });

    it('synchronizes island entities on world:sync, clearing old entities and spawning incoming ones', () => {
      scene.create();

      const p1: OwnedPenguin = {
        id: 'p_sync_1',
        speciesId: 'snowy',
        nickname: 'Snowy',
        level: 1,
        exp: 0,
        experience: 0,
        happiness: 80,
        energy: 100,
        hunger: 20,
        mood: 'happy',
        lastPetAt: 0,
        lastFedAt: 0,
        lastNeedsUpdateAt: Date.now(),
        acquiredAt: Date.now(),
        generation: 1,
      };

      const p2: OwnedPenguin = {
        id: 'p_sync_2',
        speciesId: 'happy',
        nickname: 'Happy',
        level: 2,
        exp: 50,
        experience: 50,
        happiness: 90,
        energy: 85,
        hunger: 10,
        mood: 'excited',
        lastPetAt: 0,
        lastFedAt: 0,
        lastNeedsUpdateAt: Date.now(),
        acquiredAt: Date.now(),
        generation: 1,
      };

      // Initially spawn p1
      gameBridge.emit('penguin:spawn', { penguin: p1 });
      expect(scene.getPenguinCount()).toBe(1);
      expect(scene.getPenguin('p_sync_1')).toBeDefined();

      // Now emit world:sync with only p2
      gameBridge.emit('world:sync', { penguins: [p2] });
      expect(scene.getPenguinCount()).toBe(1);
      expect(scene.getPenguin('p_sync_1')).toBeUndefined();
      expect(scene.getPenguin('p_sync_2')).toBeDefined();
      expect(scene.getPenguin('p_sync_2')?.ownedPenguin.nickname).toBe('Happy');
    });

    it('spawns a new penguin entity when penguin:spawn is received', () => {
      scene.create();

      const testPenguin: OwnedPenguin = {
        id: 'p_spawn_1',
        speciesId: 'snowy',
        nickname: 'Bông Tuyết',
        level: 1,
        exp: 0,
        experience: 0,
        happiness: 80,
        energy: 100,
        hunger: 20,
        mood: 'happy',
        lastPetAt: 0,
        lastFedAt: 0,
        lastNeedsUpdateAt: Date.now(),
        acquiredAt: Date.now(),
        generation: 1,
      };

      gameBridge.emit('penguin:spawn', { penguin: testPenguin });

      const spawned = scene.getPenguin('p_spawn_1');
      expect(spawned).toBeDefined();
      expect(spawned?.ownedPenguin.nickname).toBe('Bông Tuyết');
      expect(mockAdd.existing).toHaveBeenCalledWith(spawned);
    });

    it('routes penguin:action to playPetAnimation and playEatAnimation', () => {
      scene.create();

      const testPenguin: OwnedPenguin = {
        id: 'p_act_1',
        speciesId: 'happy',
        nickname: 'Vui Vẻ',
        level: 2,
        exp: 100,
        experience: 100,
        happiness: 85,
        energy: 90,
        hunger: 30,
        mood: 'happy',
        lastPetAt: 0,
        lastFedAt: 0,
        lastNeedsUpdateAt: Date.now(),
        acquiredAt: Date.now(),
        generation: 1,
      };

      gameBridge.emit('penguin:spawn', { penguin: testPenguin });
      const entity = scene.getPenguin('p_act_1');
      expect(entity).toBeDefined();

      if (entity) {
        const petSpy = vi.spyOn(entity, 'playPetAnimation');
        const eatSpy = vi.spyOn(entity, 'playEatAnimation');

        gameBridge.emit('penguin:action', { ownedId: 'p_act_1', action: 'pet' });
        expect(petSpy).toHaveBeenCalledTimes(1);

        gameBridge.emit('penguin:action', { ownedId: 'p_act_1', action: 'feed' });
        expect(eatSpy).toHaveBeenCalledTimes(1);
      }
    });

    it('pans camera smoothly when camera:focus is received', () => {
      scene.create();

      gameBridge.emit('camera:focus', { x: 120, y: -80 });

      expect(mockCamera.pan).toHaveBeenCalledWith(120, -80, expect.any(Number), expect.any(String));
    });

    it('updates all penguin entities in frame update loop', () => {
      scene.create();

      const testPenguin: OwnedPenguin = {
        id: 'p_upd_1',
        speciesId: 'shy',
        nickname: 'Mắc Cỡ',
        level: 1,
        exp: 0,
        experience: 0,
        happiness: 70,
        energy: 95,
        hunger: 10,
        mood: 'shy' as unknown as OwnedPenguin['mood'],
        lastPetAt: 0,
        lastFedAt: 0,
        lastNeedsUpdateAt: Date.now(),
        acquiredAt: Date.now(),
        generation: 1,
      };

      gameBridge.emit('penguin:spawn', { penguin: testPenguin });
      const entity = scene.getPenguin('p_upd_1');
      expect(entity).toBeDefined();

      if (entity) {
        const updateSpy = vi.spyOn(entity, 'update');
        scene.update(1000, 16.6);
        expect(updateSpy).toHaveBeenCalledWith(1000, 16.6);
      }
    });

    it('unregisters all gameBridge listeners and cleans up on shutdown', () => {
      const initialListeners = gameBridge.listenerCount();

      scene.create();
      // Listeners registered: canvas:ready (0), penguin:spawn (+1), penguin:action (+1), camera:focus (+1), world:sync (+1), nest:sync (+1), ui:modal (+1), decorations:sync (+1), effect:coin_drop (+1)
      expect(gameBridge.listenerCount()).toBe(initialListeners + 8);

      // Trigger shutdown event

      mockEvents.emit('shutdown');

      // Listeners should be cleaned up
      expect(gameBridge.listenerCount()).toBe(initialListeners);
      expect(scene.getPenguinCount()).toBe(0);
    });

    describe('Dynamic Incubator Nest Visual Synchronization', () => {
      it('initializes with an empty nest without hardcoding an egg sprite', () => {
        scene.create();

        expect(scene.getNestContainer()).toBeDefined();
        // Slot 1 is EMPTY by default, so no egg sprite is rendered in the nest
        expect(scene.getNestEggSprite()).toBeNull();
      });

      it('displays correct egg sprite when an egg is placed in slot 1 (basic_egg, frozen_egg, golden_egg)', () => {
        scene.create();

        // 1. Place basic_egg
        gameBridge.emit('nest:sync', {
          slot: { slotId: 1, state: 'INCUBATING', eggTypeId: 'basic_egg' },
        });

        expect(mockAdd.image).toHaveBeenCalledWith(0, -8, 'egg_basic');
        expect(scene.getNestEggSprite()).not.toBeNull();

        // 2. Place frozen_egg
        gameBridge.emit('nest:sync', {
          slot: { slotId: 1, state: 'INCUBATING', eggTypeId: 'frozen_egg' },
        });
        const eggSprite = scene.getNestEggSprite() as unknown as { setTexture: ReturnType<typeof vi.fn> };
        expect(eggSprite.setTexture).toHaveBeenCalledWith('egg_frozen');

        // 3. Place golden_egg
        gameBridge.emit('nest:sync', {
          slot: { slotId: 1, state: 'INCUBATING', eggTypeId: 'golden_egg' },
        });
        expect(eggSprite.setTexture).toHaveBeenCalledWith('egg_golden');
      });

      it('starts gentle wobble animation when egg enters READY_TO_HATCH state', () => {
        scene.create();

        gameBridge.emit('nest:sync', {
          slot: { slotId: 1, state: 'READY_TO_HATCH', eggTypeId: 'basic_egg' },
        });

        expect(mockTweens.add).toHaveBeenCalledWith(
          expect.objectContaining({
            duration: 350,
            yoyo: true,
            repeat: -1,
          })
        );
      });

      it('removes egg and restores empty nest when egg is hatched and slot returns to EMPTY', () => {
        scene.create();

        // Egg placed
        gameBridge.emit('nest:sync', {
          slot: { slotId: 1, state: 'INCUBATING', eggTypeId: 'basic_egg' },
        });
        expect(scene.getNestEggSprite()).not.toBeNull();

        // Egg hatched -> slot returns to EMPTY
        gameBridge.emit('nest:sync', {
          slot: { slotId: 1, state: 'EMPTY' },
        });

        expect(mockTweens.killTweensOf).toHaveBeenCalled();
        expect(scene.getNestEggSprite()).toBeNull();
      });

      it('restores nest visual when reloading saved state via world:sync with nestSlot', () => {
        scene.create();

        gameBridge.emit('world:sync', {
          penguins: [],
          nestSlot: { slotId: 1, state: 'INCUBATING', eggTypeId: 'frozen_egg' },
        });

        expect(mockAdd.image).toHaveBeenCalledWith(0, -8, 'egg_frozen');
        expect(scene.getNestEggSprite()).not.toBeNull();
      });

      it('clicking the nestContainer emits egg:clicked { slotId: 1 } and plays bounce animation', () => {
        const eggHandler = vi.fn();
        gameBridge.on('egg:clicked', eggHandler);

        scene.create();
        scene.handleNestClick();

        expect(mockTweens.killTweensOf).toHaveBeenCalled();
        expect(mockTweens.add).toHaveBeenCalledWith(
          expect.objectContaining({
            scaleX: 1.15,
            scaleY: 0.88,
            duration: 90,
            yoyo: true,
          })
        );
        expect(eggHandler).toHaveBeenCalledWith({ slotId: 1 });
      });

      it('configures incubator nest container with centered circular hitArea matching nest and egg geometry', () => {
        scene.create();

        const nestContainer = scene.getNestContainer();
        expect(nestContainer).not.toBeNull();

        // Inspect setInteractive call on the nest container
        expect(nestContainer?.setSize).toHaveBeenCalledWith(72, 72);
        expect(nestContainer?.setInteractive).toHaveBeenCalledWith(
          expect.objectContaining({
            hitArea: expect.any(Phaser.Geom.Circle),
            hitAreaCallback: Phaser.Geom.Circle.Contains,
            useHandCursor: true,
          })
        );

        // Verify the Circle geometry: center (36, 32) with radius 38
        const interactiveConfig = (nestContainer?.setInteractive as ReturnType<typeof vi.fn>).mock.calls[0][0];
        const circle = interactiveConfig.hitArea as Phaser.Geom.Circle;
        expect(circle.x).toBe(36);
        expect(circle.y).toBe(32);
        expect(circle.radius).toBe(38);

        // Center point (36, 36) in Container hit-test space corresponds to visual (0, 0)
        expect(Phaser.Geom.Circle.Contains(circle, 36, 36)).toBe(true);

        // Top of egg (36, 6) corresponds to visual (0, -26)
        expect(Phaser.Geom.Circle.Contains(circle, 36, 6)).toBe(true);

        // Bottom of nest (36, 61) corresponds to visual (0, +29)
        expect(Phaser.Geom.Circle.Contains(circle, 36, 61)).toBe(true);

        // Upper-left shifted point (0, 0) is correctly outside the circle (distance ~48 > 38)
        expect(Phaser.Geom.Circle.Contains(circle, 0, 0)).toBe(false);

        // Distant outside point (100, 100) is rejected
        expect(Phaser.Geom.Circle.Contains(circle, 100, 100)).toBe(false);
      });

      it('disables scene input and resets cursor when ui:modal is open, and restores scene input when closed', () => {
        scene.create();
        expect(scene.input.enabled).toBe(true);

        // Modal opened: scene input disabled and cursor reset to default
        gameBridge.emit('ui:modal', { open: true });
        expect(scene.input.enabled).toBe(false);
        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith('default');

        // Modal closed: scene input re-enabled
        gameBridge.emit('ui:modal', { open: false });
        expect(scene.input.enabled).toBe(true);
      });

      it('renders 6 anchor plot containers at predefined coordinates with depth sorting', () => {
        scene.create();

        for (const plot of DECORATION_PLOTS) {
          const container = scene.getPlotContainer(plot.id);
          expect(container).toBeDefined();
          expect(mockAdd.container).toHaveBeenCalledWith(plot.x, plot.y);
          expect(container?.setDepth).toHaveBeenCalledWith(plot.depthOffset);
        }
      });

      it('emits plot:clicked { plotId } when an anchor plot is clicked', () => {
        scene.create();
        const plotSpy = vi.fn();
        gameBridge.on('plot:clicked', plotSpy);

        scene.handlePlotClick(2);
        expect(plotSpy).toHaveBeenCalledWith({ plotId: 2 });
      });

      it('synchronizes decorations on anchor plots and creates sprites with proper origin', () => {
        scene.create();

        const placedDecors = [
          { instanceId: 'd1', decorationId: 'bench_wood', plotId: 1, placedAt: 1000 },
          { instanceId: 'd2', decorationId: 'pine_crystal', plotId: 5, placedAt: 1000 },
        ];

        gameBridge.emit('decorations:sync', { decorations: placedDecors });

        expect(scene.getDecorationSprite(1)).toBeDefined();
        expect(scene.getDecorationSprite(5)).toBeDefined();
        expect(mockAdd.image).toHaveBeenCalledWith(0, -14, 'dec_bench_wood');
        expect(mockAdd.image).toHaveBeenCalledWith(0, -14, 'dec_pine_crystal');
      });

      it('spawns floating bounce coin text on effect:coin_drop', () => {
        scene.create();

        gameBridge.emit('effect:coin_drop', { x: 50, y: 80, amount: 25 });

        expect(mockAdd.text).toHaveBeenCalledWith(
          50,
          60,
          '+25 🪙',
          expect.objectContaining({ color: '#facc15' })
        );
        expect(mockTweens.add).toHaveBeenCalledWith(
          expect.objectContaining({
            y: 15,
            alpha: 0,
            duration: 800,
          })
        );
      });
    });
  });
});


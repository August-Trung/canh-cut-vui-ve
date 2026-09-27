import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Phaser from 'phaser';
import { getPhaserConfig } from '../../PhaserConfig';
import { BootScene } from '../BootScene';
import { SnowIslandScene } from '../SnowIslandScene';
import { gameBridge } from '../../bridge/GameBridge';
import { OwnedPenguin } from '@penguin/types';

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
      setDefaultCursor: ReturnType<typeof vi.fn>;
      pointer1?: { isDown: boolean; x: number; y: number };
      pointer2?: { isDown: boolean; x: number; y: number };
    };
    let mockTweens: {
      add: ReturnType<typeof vi.fn>;
      killTweensOf: ReturnType<typeof vi.fn>;
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
        container: vi.fn().mockReturnValue(mockDisplayObject),
        existing: vi.fn((obj) => obj),
        particles: vi.fn().mockReturnValue(mockEmitter),
        text: vi.fn().mockReturnValue(mockDisplayObject),
      };

      mockInput = {
        on: vi.fn().mockReturnThis(),
        off: vi.fn().mockReturnThis(),
        enable: vi.fn(),
        disable: vi.fn(),
        setDefaultCursor: vi.fn(),
      };

      mockTweens = {
        add: vi.fn().mockReturnValue({ stop: vi.fn() }),
        killTweensOf: vi.fn(),
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
        experience: 0,
        happiness: 80,
        energy: 100,
        hunger: 20,
        mood: 'happy',
        acquiredAt: Date.now(),
        generation: 1,
      };

      const p2: OwnedPenguin = {
        id: 'p_sync_2',
        speciesId: 'happy',
        nickname: 'Happy',
        level: 2,
        experience: 50,
        happiness: 90,
        energy: 85,
        hunger: 10,
        mood: 'excited',
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
        experience: 0,
        happiness: 80,
        energy: 100,
        hunger: 20,
        mood: 'happy',
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
        experience: 100,
        happiness: 85,
        energy: 90,
        hunger: 30,
        mood: 'happy',
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
        experience: 0,
        happiness: 70,
        energy: 95,
        hunger: 10,
        mood: 'shy' as unknown as OwnedPenguin['mood'],
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
      // Listeners registered: canvas:ready (0), penguin:spawn (+1), penguin:action (+1), camera:focus (+1), world:sync (+1)
      expect(gameBridge.listenerCount()).toBe(initialListeners + 4);

      // Trigger shutdown event
      mockEvents.emit('shutdown');

      // Listeners should be cleaned up
      expect(gameBridge.listenerCount()).toBe(initialListeners);
      expect(scene.getPenguinCount()).toBe(0);
    });
  });
});

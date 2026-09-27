import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PENGUIN_TEXTURE_KEYS,
  EGG_TEXTURE_KEYS,
  ENVIRONMENT_TEXTURE_KEYS,
  ensureGameTextures,
  generatePenguinTexture,
  generateEggTexture,
  generateEnvironmentTexture,
  createSafeCanvas,
  SceneLike,
} from '../TextureGenerator';

describe('TextureGenerator', () => {
  let createdTextures: Map<string, HTMLCanvasElement>;
  let mockScene: SceneLike;

  beforeEach(() => {
    createdTextures = new Map();
    mockScene = {
      textures: {
        exists: vi.fn((key: string) => createdTextures.has(key)),
        addCanvas: vi.fn((key: string, canvas: HTMLCanvasElement) => {
          createdTextures.set(key, canvas);
          return canvas;
        }),
      },
    };
  });

  describe('Texture Keys Specification', () => {
    it('defines all required texture keys for the 5 penguin species', () => {
      expect(PENGUIN_TEXTURE_KEYS).toHaveProperty('snowy', 'penguin_snowy');
      expect(PENGUIN_TEXTURE_KEYS).toHaveProperty('sleepy', 'penguin_sleepy');
      expect(PENGUIN_TEXTURE_KEYS).toHaveProperty('shy', 'penguin_shy');
      expect(PENGUIN_TEXTURE_KEYS).toHaveProperty('happy', 'penguin_happy');
      expect(PENGUIN_TEXTURE_KEYS).toHaveProperty('hungry', 'penguin_hungry');
    });

    it('defines all required texture keys for the 3 egg types', () => {
      expect(EGG_TEXTURE_KEYS).toHaveProperty('basic_egg', 'egg_basic');
      expect(EGG_TEXTURE_KEYS).toHaveProperty('frozen_egg', 'egg_frozen');
      expect(EGG_TEXTURE_KEYS).toHaveProperty('golden_egg', 'egg_golden');
    });

    it('defines all required environment and particle texture keys', () => {
      expect(ENVIRONMENT_TEXTURE_KEYS).toHaveProperty('ice_pond', 'ice_pond');
      expect(ENVIRONMENT_TEXTURE_KEYS).toHaveProperty('snow_ground', 'snow_ground');
      expect(ENVIRONMENT_TEXTURE_KEYS).toHaveProperty('pine_tree', 'pine_tree');
      expect(ENVIRONMENT_TEXTURE_KEYS).toHaveProperty('igloo', 'igloo');
      expect(ENVIRONMENT_TEXTURE_KEYS).toHaveProperty('snowman', 'snowman');
      expect(ENVIRONMENT_TEXTURE_KEYS).toHaveProperty('entity_shadow', 'entity_shadow');
      expect(ENVIRONMENT_TEXTURE_KEYS).toHaveProperty('particle_heart', 'particle_heart');
      expect(ENVIRONMENT_TEXTURE_KEYS).toHaveProperty('particle_snow', 'particle_snow');
      expect(ENVIRONMENT_TEXTURE_KEYS).toHaveProperty('particle_sparkle', 'particle_sparkle');
    });
  });

  describe('ensureGameTextures and Caching Logic', () => {
    it('generates and caches all 17 textures when cache is empty', () => {
      ensureGameTextures(mockScene);

      // 5 penguins + 3 eggs + 9 environment/particles = 17 textures
      const expectedKeys = [
        'penguin_snowy',
        'penguin_sleepy',
        'penguin_shy',
        'penguin_happy',
        'penguin_hungry',
        'egg_basic',
        'egg_frozen',
        'egg_golden',
        'ice_pond',
        'snow_ground',
        'pine_tree',
        'igloo',
        'snowman',
        'entity_shadow',
        'particle_heart',
        'particle_snow',
        'particle_sparkle',
      ];

      expect(mockScene.textures.addCanvas).toHaveBeenCalledTimes(17);
      for (const key of expectedKeys) {
        expect(createdTextures.has(key)).toBe(true);
      }
    });

    it('checks exists() before generating any texture and does not regenerate cached textures', () => {
      // Pre-populate some textures in cache
      createdTextures.set('penguin_snowy', createSafeCanvas(128, 128));
      createdTextures.set('egg_basic', createSafeCanvas(128, 128));
      createdTextures.set('ice_pond', createSafeCanvas(320, 180));

      ensureGameTextures(mockScene);

      // Should check existence for each key
      expect(mockScene.textures.exists).toHaveBeenCalledWith('penguin_snowy');
      expect(mockScene.textures.exists).toHaveBeenCalledWith('egg_basic');
      expect(mockScene.textures.exists).toHaveBeenCalledWith('ice_pond');

      // The 3 pre-existing textures must NOT be added again
      expect(mockScene.textures.addCanvas).not.toHaveBeenCalledWith('penguin_snowy', expect.anything());
      expect(mockScene.textures.addCanvas).not.toHaveBeenCalledWith('egg_basic', expect.anything());
      expect(mockScene.textures.addCanvas).not.toHaveBeenCalledWith('ice_pond', expect.anything());

      // 17 total minus 3 already cached = 14 new additions
      expect(mockScene.textures.addCanvas).toHaveBeenCalledTimes(14);
    });

    it('never regenerates any texture on subsequent ensureGameTextures calls', () => {
      ensureGameTextures(mockScene);
      expect(mockScene.textures.addCanvas).toHaveBeenCalledTimes(17);

      // Second call should generate 0 new textures because all 17 now exist
      ensureGameTextures(mockScene);
      expect(mockScene.textures.addCanvas).toHaveBeenCalledTimes(17);
    });
  });

  describe('Procedural Canvas Generators', () => {
    it('generates high-res 128x128 canvas for each penguin species', () => {
      const speciesList = ['snowy', 'sleepy', 'shy', 'happy', 'hungry'];
      for (const sp of speciesList) {
        const canvas = generatePenguinTexture(sp);
        expect(canvas).toBeDefined();
        expect(canvas.width).toBe(128);
        expect(canvas.height).toBe(128);
      }
    });

    it('generates high-res canvas for each egg type', () => {
      const eggTypes = ['egg_basic', 'egg_frozen', 'egg_golden'];
      for (const egg of eggTypes) {
        const canvas = generateEggTexture(egg);
        expect(canvas).toBeDefined();
        expect(canvas.width).toBe(128);
        expect(canvas.height).toBe(128);
      }
    });

    it('generates properly dimensioned environment and effect canvases', () => {
      const pond = generateEnvironmentTexture('ice_pond');
      expect(pond.width).toBe(320);
      expect(pond.height).toBe(180);

      const snow = generateEnvironmentTexture('snow_ground');
      expect(snow.width).toBe(256);
      expect(snow.height).toBe(256);

      const tree = generateEnvironmentTexture('pine_tree');
      expect(tree.width).toBe(128);
      expect(tree.height).toBe(160);

      const igloo = generateEnvironmentTexture('igloo');
      expect(igloo.width).toBe(160);
      expect(igloo.height).toBe(140);

      const snowman = generateEnvironmentTexture('snowman');
      expect(snowman.width).toBe(96);
      expect(snowman.height).toBe(128);

      const shadow = generateEnvironmentTexture('entity_shadow');
      expect(shadow.width).toBe(96);
      expect(shadow.height).toBe(48);

      const heart = generateEnvironmentTexture('particle_heart');
      expect(heart.width).toBe(32);
      expect(heart.height).toBe(32);

      const snowflake = generateEnvironmentTexture('particle_snow');
      expect(snowflake.width).toBe(32);
      expect(snowflake.height).toBe(32);

      const sparkle = generateEnvironmentTexture('particle_sparkle');
      expect(sparkle.width).toBe(32);
      expect(sparkle.height).toBe(32);
    });

    it('createSafeCanvas creates a functional canvas with 2D drawing capabilities', () => {
      const canvas = createSafeCanvas(64, 64);
      expect(canvas.width).toBe(64);
      expect(canvas.height).toBe(64);

      const ctx = canvas.getContext('2d');
      expect(ctx).toBeDefined();
      if (ctx) {
        expect(() => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(32, 32, 16, 0, Math.PI * 2);
          const grad = ctx.createLinearGradient(0, 0, 64, 64);
          grad.addColorStop(0, '#ff0000');
          grad.addColorStop(1, '#0000ff');
          ctx.fillStyle = grad;
          ctx.fill();

          const radGrad = ctx.createRadialGradient(32, 32, 2, 32, 32, 20);
          radGrad.addColorStop(0, '#ffffff');
          radGrad.addColorStop(1, '#000000');
          ctx.fillStyle = radGrad;
          ctx.fill();

          ctx.restore();
        }).not.toThrow();
      }
    });

    it('resolves penguin species keys with or without penguin_ prefix and safely defaults', () => {
      const c1 = generatePenguinTexture('penguin_shy');
      const c2 = generatePenguinTexture('shy');
      const cFallback = generatePenguinTexture('invalid_species_name');

      expect(c1.width).toBe(128);
      expect(c2.width).toBe(128);
      expect(cFallback.width).toBe(128);
    });

    it('resolves egg keys with or without egg_ prefix', () => {
      const e1 = generateEggTexture('basic_egg');
      const e2 = generateEggTexture('egg_basic');
      const e3 = generateEggTexture('frozen_egg');
      const e4 = generateEggTexture('golden_egg');
      const eFallback = generateEggTexture('unknown_egg');

      expect(e1.width).toBe(128);
      expect(e2.width).toBe(128);
      expect(e3.width).toBe(128);
      expect(e4.width).toBe(128);
      expect(eFallback.width).toBe(128);
    });

    it('gracefully returns fallback canvas for unknown environment key', () => {
      const c = generateEnvironmentTexture('non_existent_env_key');
      expect(c).toBeDefined();
      expect(c.width).toBe(64);
      expect(c.height).toBe(64);
    });
  });
});

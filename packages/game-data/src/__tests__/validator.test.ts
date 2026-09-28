import { describe, it, expect } from 'vitest';
import {
  SPECIES_LIST,
  SPECIES_MAP,
  EGG_TYPES_LIST,
  EGG_TYPES_MAP,
  INITIAL_ITEMS,
  validateGameData,
} from '../index';
import type { EggType, PenguinSpecies } from '@penguin/types';

describe('Game Data & Drop Table Validation', () => {
  describe('Species Data', () => {
    it('should have 5 distinct Phase 1 species', () => {
      expect(SPECIES_LIST.length).toBe(5);
      const ids = SPECIES_LIST.map((s) => s.id);
      expect(new Set(ids).size).toBe(5);
      expect(ids).toEqual(expect.arrayContaining(['snowy', 'sleepy', 'shy', 'happy', 'hungry']));
    });

    it('should have valid species numbers and properties', () => {
      for (const species of SPECIES_LIST) {
        expect(species.id).toBeTruthy();
        expect(species.speciesNumber).toMatch(/^\d{3}$/);
        expect(species.name).toBeTruthy();
        expect(species.rarity).toBe('common');
        expect(species.personality).toBeTruthy();
        expect(species.trait).toBeTruthy();
        expect(species.favoriteFood).toBeTruthy();
        expect(species.dislikedFood).toBeTruthy();
        expect(species.description).toBeTruthy();
        expect(species.clue).toBeTruthy();
        expect(species.visualKey).toBe(`penguin_${species.id}`);
      }
    });

    it('SPECIES_MAP should map id to species object', () => {
      expect(SPECIES_MAP.size).toBe(5);
      for (const species of SPECIES_LIST) {
        expect(SPECIES_MAP.get(species.id)).toEqual(species);
      }
    });
  });

  describe('Egg Types Data', () => {
    it('should have 3 distinct Phase 1 egg types', () => {
      expect(EGG_TYPES_LIST.length).toBe(3);
      const ids = EGG_TYPES_LIST.map((e) => e.id);
      expect(new Set(ids).size).toBe(3);
      expect(ids).toEqual(expect.arrayContaining(['basic_egg', 'frozen_egg', 'golden_egg']));
    });

    it('EGG_TYPES_MAP should map id to egg type object', () => {
      expect(EGG_TYPES_MAP.size).toBe(3);
      for (const egg of EGG_TYPES_LIST) {
        expect(EGG_TYPES_MAP.get(egg.id)).toEqual(egg);
      }
    });

    it('should configure correct hatch durations and drop pools', () => {
      const basic = EGG_TYPES_MAP.get('basic_egg');
      expect(basic).toBeDefined();
      expect(basic?.hatchDurationSec).toBe(10);
      expect(basic?.dropPool.length).toBeGreaterThan(0);

      const frozen = EGG_TYPES_MAP.get('frozen_egg');
      expect(frozen).toBeDefined();
      expect(frozen?.hatchDurationSec).toBe(15);
      expect(frozen?.dropPool.length).toBeGreaterThan(0);

      const golden = EGG_TYPES_MAP.get('golden_egg');
      expect(golden).toBeDefined();
      expect(golden?.hatchDurationSec).toBe(25);
      expect(golden?.dropPool.length).toBeGreaterThan(0);
    });
  });

  describe('Initial Items Data', () => {
    it('should contain basic egg and sardine starter items', () => {
      expect(INITIAL_ITEMS.length).toBeGreaterThanOrEqual(2);
      const eggItem = INITIAL_ITEMS.find((i) => i.itemId === 'basic_egg');
      expect(eggItem).toBeDefined();
      expect(eggItem?.category).toBe('eggs');
      expect(eggItem?.quantity).toBe(1);
      expect(eggItem?.stackable).toBe(true);

      const sardineItem = INITIAL_ITEMS.find((i) => i.itemId === 'sardine');
      expect(sardineItem).toBeDefined();
      expect(sardineItem?.category).toBe('food');
      expect(sardineItem?.quantity).toBe(50);
      expect(sardineItem?.stackable).toBe(true);
    });
  });

  describe('Drop Table Validator', () => {
    it('passes validation on all game data', () => {
      const result = validateGameData(SPECIES_LIST, EGG_TYPES_LIST);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid drop pools (empty pool, non-positive weight, nonexistent species)', () => {
      const invalidEggs: EggType[] = [
        {
          id: 'bad_egg_1',
          name: 'Bad Egg 1',
          rarity: 'common',
          hatchDurationSec: 10,
          visualTheme: 'test',
          dropPool: [], // Empty
        },
        {
          id: 'bad_egg_2',
          name: 'Bad Egg 2',
          rarity: 'common',
          hatchDurationSec: 10,
          visualTheme: 'test',
          dropPool: [{ speciesId: 'snowy', weight: -5 }], // Negative weight
        },
        {
          id: 'bad_egg_3',
          name: 'Bad Egg 3',
          rarity: 'common',
          hatchDurationSec: 10,
          visualTheme: 'test',
          dropPool: [{ speciesId: 'dragon_nonexistent', weight: 10 }], // Missing species
        },
      ];
      const result = validateGameData(SPECIES_LIST, invalidEggs);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('rejects zero weight and NaN weight entries', () => {
      const invalidEggs: EggType[] = [
        {
          id: 'zero_weight_egg',
          name: 'Zero Weight Egg',
          rarity: 'common',
          hatchDurationSec: 10,
          visualTheme: 'test',
          dropPool: [{ speciesId: 'snowy', weight: 0 }],
        },
        {
          id: 'nan_weight_egg',
          name: 'NaN Weight Egg',
          rarity: 'common',
          hatchDurationSec: 10,
          visualTheme: 'test',
          dropPool: [{ speciesId: 'snowy', weight: NaN }],
        },
      ];
      const result = validateGameData(SPECIES_LIST, invalidEggs);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('non-positive weight');
      expect(result.errors[1]).toContain('non-positive weight');
    });

    it('passes when egg types list is empty', () => {
      const result = validateGameData(SPECIES_LIST, []);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects egg referencing species when species list is empty', () => {
      const eggs: EggType[] = [
        {
          id: 'solo_egg',
          name: 'Solo Egg',
          rarity: 'common',
          hatchDurationSec: 10,
          visualTheme: 'test',
          dropPool: [{ speciesId: 'snowy', weight: 10 }],
        },
      ];
      const result = validateGameData([], eggs);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain("references nonexistent species 'snowy'");
    });
  });

  describe('Phase 2 Catalogs', () => {
    it('should export valid FOOD_CATALOG with all 7 foods', async () => {
      const { FOOD_CATALOG } = await import('../index');
      expect(Object.keys(FOOD_CATALOG)).toHaveLength(7);
      expect(FOOD_CATALOG.sardine).toBeDefined();
      expect(FOOD_CATALOG.krill).toBeDefined();
      expect(FOOD_CATALOG.warm_milk).toBeDefined();
      expect(FOOD_CATALOG.sweet_berries).toBeDefined();
      expect(FOOD_CATALOG.squid).toBeDefined();
      expect(FOOD_CATALOG.fat_salmon).toBeDefined();
      expect(FOOD_CATALOG.ice_cream).toBeDefined();
    });

    it('should export valid EGG_CATALOG with 3 eggs', async () => {
      const { EGG_CATALOG } = await import('../index');
      expect(Object.keys(EGG_CATALOG)).toHaveLength(3);
      expect(EGG_CATALOG.basic_egg.priceCoins).toBe(150);
      expect(EGG_CATALOG.frozen_egg.playerLevelRequired).toBe(4);
      expect(EGG_CATALOG.golden_egg.priceGems).toBe(10);
    });

    it('should export 6 DECORATION_PLOTS and 6 DECORATION_CATALOG entries', async () => {
      const { DECORATION_PLOTS, DECORATION_CATALOG } = await import('../index');
      expect(DECORATION_PLOTS).toHaveLength(6);
      expect(Object.keys(DECORATION_CATALOG)).toHaveLength(6);
      expect(DECORATION_CATALOG.master_caretaker_trophy.playerLevelRequired).toBe(10);
      expect(DECORATION_CATALOG.master_caretaker_trophy.cozyPoints).toBe(50);
    });

    it('should export QUEST_POOL with 5 quest templates', async () => {
      const { QUEST_POOL } = await import('../index');
      expect(QUEST_POOL).toHaveLength(5);
      const hatchQuest = QUEST_POOL.find((q) => q.id === 'quest_hatch');
      expect(hatchQuest).toBeDefined();
      expect(hatchQuest?.targetType).toBe('hatch');
      expect(hatchQuest?.rewardGems).toBe(1);
    });
  });
});


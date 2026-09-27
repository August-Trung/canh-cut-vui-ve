import { EggType } from '@penguin/types';

export const EGG_TYPES_LIST: EggType[] = [
  {
    id: 'basic_egg',
    name: 'Basic Egg',
    rarity: 'common',
    hatchDurationSec: 10,
    visualTheme: 'egg_basic',
    dropPool: [
      { speciesId: 'snowy', weight: 40 },
      { speciesId: 'sleepy', weight: 30 },
      { speciesId: 'happy', weight: 30 },
    ],
  },
  {
    id: 'frozen_egg',
    name: 'Frozen Egg',
    rarity: 'uncommon',
    hatchDurationSec: 15,
    visualTheme: 'egg_frozen',
    dropPool: [
      { speciesId: 'shy', weight: 50 },
      { speciesId: 'snowy', weight: 30 },
      { speciesId: 'happy', weight: 20 },
    ],
  },
  {
    id: 'golden_egg',
    name: 'Golden Egg',
    rarity: 'rare',
    hatchDurationSec: 25,
    visualTheme: 'egg_golden',
    dropPool: [
      { speciesId: 'hungry', weight: 60 },
      { speciesId: 'happy', weight: 20 },
      { speciesId: 'shy', weight: 20 },
    ],
  },
];

export const EGG_TYPES_MAP = new Map<string, EggType>(
  EGG_TYPES_LIST.map((e) => [e.id, e])
);

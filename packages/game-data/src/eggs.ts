import { EggType, EggShopDefinition } from '@penguin/types';

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

export const EGG_CATALOG: Record<string, EggShopDefinition> = {
  basic_egg: {
    id: 'basic_egg',
    name: 'Trứng Cơ Bản (Basic Egg)',
    description: 'Quả trứng đốm ấm áp nở ra các loài chim cánh cụt phổ biến.',
    incubationSeconds: 180,
    playerLevelRequired: 1,
    priceCoins: 150,
    icon: 'egg_basic',
  },
  frozen_egg: {
    id: 'frozen_egg',
    name: 'Trứng Băng Giá (Frozen Egg)',
    description: 'Quả trứng đóng băng lấp lánh kết tinh từ bão tuyết phương Bắc.',
    incubationSeconds: 900,
    playerLevelRequired: 4,
    priceCoins: 450,
    icon: 'egg_frozen',
  },
  golden_egg: {
    id: 'golden_egg',
    name: 'Trứng Hoàng Kim (Golden Egg)',
    description: 'Quả trứng vàng quý giá tỏa hào quang rực rỡ.',
    incubationSeconds: 3600,
    playerLevelRequired: 7,
    priceCoins: 1200,
    priceGems: 10,
    icon: 'egg_golden',
  },
};

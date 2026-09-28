import { MiniGameConfig } from '@penguin/types';

export const MINIGAME_CATCH_FISH_CONFIG: MiniGameConfig = {
  id: 'catch_fish',
  title: 'Câu Cá Băng (Catch Fish)',
  description: 'Tham gia câu cá tại hố băng cùng chú chim cánh cụt yêu quý để kiếm cá và phần thưởng!',
  durationSeconds: 30,
  dailyFreePlays: 3,
  maxExtraPlaysPerDay: 3,
  extraPlayCostCoins: 50,
  maxScoreCap: 500,
};

export interface FishTargetDefinition {
  id: string;
  name: string;
  points: number;
  weight: number;
  speed: number;
  rewardItemId?: string;
  isObstacle?: boolean;
}

export const FISH_TARGET_TABLE: FishTargetDefinition[] = [
  {
    id: 'sardine',
    name: 'Cá Mòi Nhỏ',
    points: 10,
    weight: 45,
    speed: 1.0,
    rewardItemId: 'sardine',
  },
  {
    id: 'krill',
    name: 'Tép Biển Giòn',
    points: 15,
    weight: 25,
    speed: 1.4,
    rewardItemId: 'krill',
  },
  {
    id: 'fat_salmon',
    name: 'Cá Hồi Béo Mầm',
    points: 30,
    weight: 15,
    speed: 0.8,
    rewardItemId: 'fat_salmon',
  },
  {
    id: 'golden_fish',
    name: 'Cá Hoàng Kim',
    points: 60,
    weight: 5,
    speed: 1.8,
    rewardItemId: 'squid',
  },
  {
    id: 'old_boot',
    name: 'Chiếc Ủng Cũ',
    points: -15,
    weight: 10,
    speed: 1.1,
    isObstacle: true,
  },
];

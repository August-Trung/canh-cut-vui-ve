export const PLAYER_EXP_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  300,   // Level 3
  650,   // Level 4
  1200,  // Level 5
  2000,  // Level 6
  3100,  // Level 7
  4600,  // Level 8
  6600,  // Level 9
  9200,  // Level 10 (Max)
];

export const PENGUIN_EXP_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  450,   // Level 4
  700,   // Level 5
  1000,  // Level 6
  1350,  // Level 7
  1750,  // Level 8
  2200,  // Level 9
  2700,  // Level 10 (Max)
];

export interface LevelInfo {
  level: number;
  currentLevelBaseExp: number;
  nextLevelExp: number;
  progressPercent: number;
}

export function getPlayerLevelFromExp(cumulativeExp: number): LevelInfo {
  let level = 1;
  for (let i = PLAYER_EXP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (cumulativeExp >= PLAYER_EXP_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  level = Math.min(10, Math.max(1, level));
  const currentLevelBaseExp = PLAYER_EXP_THRESHOLDS[level - 1];
  const nextLevelExp = level < 10 ? PLAYER_EXP_THRESHOLDS[level] : currentLevelBaseExp;
  const range = nextLevelExp - currentLevelBaseExp;
  const progressPercent = range > 0
    ? Math.min(100, Math.max(0, Math.floor(((cumulativeExp - currentLevelBaseExp) / range) * 100)))
    : 100;

  return { level, currentLevelBaseExp, nextLevelExp, progressPercent };
}

export function getPenguinLevelFromExp(cumulativeExp: number): LevelInfo {
  let level = 1;
  for (let i = PENGUIN_EXP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (cumulativeExp >= PENGUIN_EXP_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  level = Math.min(10, Math.max(1, level));
  const currentLevelBaseExp = PENGUIN_EXP_THRESHOLDS[level - 1];
  const nextLevelExp = level < 10 ? PENGUIN_EXP_THRESHOLDS[level] : currentLevelBaseExp;
  const range = nextLevelExp - currentLevelBaseExp;
  const progressPercent = range > 0
    ? Math.min(100, Math.max(0, Math.floor(((cumulativeExp - currentLevelBaseExp) / range) * 100)))
    : 100;

  return { level, currentLevelBaseExp, nextLevelExp, progressPercent };
}

export function getMaxFlockCapacity(playerLevel: number): number {
  if (playerLevel >= 8) return 5;
  if (playerLevel >= 5) return 4;
  if (playerLevel >= 2) return 3;
  return 2;
}

export function getNextFlockCapacityLevel(currentLevel: number): number | null {
  const currentCap = getMaxFlockCapacity(currentLevel);
  for (let lvl = currentLevel + 1; lvl <= 10; lvl++) {
    if (getMaxFlockCapacity(lvl) > currentCap) {
      return lvl;
    }
  }
  return null;
}

export interface LevelReward {
  level: number;
  coins: number;
  gems: number;
  description?: string;
}

export const LEVEL_UP_REWARDS_TABLE: Record<number, { coins: number; gems: number; description?: string }> = {
  1: { coins: 0, gems: 0 },
  2: { coins: 100, gems: 0, description: 'Sức chứa đàn +1, Tép Biển trong Cửa Hàng' },
  3: { coins: 150, gems: 0, description: 'Ô Ấp 2, Sữa Nóng & Quả Mọng, Ghế Gỗ Mùa Đông' },
  4: { coins: 200, gems: 2, description: 'Trứng Băng Giá, Mực Ống' },
  5: { coins: 300, gems: 3, description: 'Sức chứa đàn +1, Cá Hồi Béo Mầm, Thông Pha Lê' },
  6: { coins: 400, gems: 5, description: 'Kem Tuyết, Đèn Đường Cổ Điển' },
  7: { coins: 500, gems: 5, description: 'Trứng Hoàng Kim' },
  8: { coins: 600, gems: 8, description: 'Sức chứa đàn +1, Lâu Đài Tuyết Mini' },
  9: { coins: 800, gems: 10, description: 'Đèn Băng Lều Tuyết' },
  10: { coins: 1500, gems: 20, description: 'Cúp Người Nuôi Đại Tài' },
};

export function calculateLevelUpRewards(oldLevel: number, newLevel: number): LevelReward[] {
  if (newLevel <= oldLevel) return [];
  const rewards: LevelReward[] = [];
  for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
    const config = LEVEL_UP_REWARDS_TABLE[lvl] ?? { coins: 0, gems: 0 };
    rewards.push({
      level: lvl,
      coins: config.coins,
      gems: config.gems,
    });
  }
  return rewards;
}

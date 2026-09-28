import type { ActiveQuest, DailyLoginState, QuestTemplate } from '@penguin/types';
import { QUEST_POOL } from '@penguin/game-data';

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDeterministicDailyQuests(
  dateStr: string,
  pool: QuestTemplate[] = QUEST_POOL
): ActiveQuest[] {
  // Score each quest template using its stable ID combined with the local date string
  const scored = [...pool].map((tpl) => ({
    template: tpl,
    score: hashString(`${dateStr}:${tpl.id}`),
  }));

  // Sort descending by deterministic score; tie-breaker on alphabetical ID
  scored.sort((a, b) => b.score - a.score || a.template.id.localeCompare(b.template.id));

  // Pick top 3
  const selected = scored.slice(0, 3).map((item) => item.template);

  return selected.map((tpl) => ({
    questId: tpl.id,
    currentCount: 0,
    targetCount: tpl.targetCount,
    isCompleted: false,
    isClaimed: false,
  }));
}

export interface StreakReward {
  day: number;
  coins: number;
  gems?: number;
  items: { itemId: string; quantity: number }[];
  description: string;
}

export const LOGIN_STREAK_REWARDS: StreakReward[] = [
  {
    day: 1,
    coins: 100,
    items: [{ itemId: 'sardine', quantity: 5 }],
    description: '100 Vàng + 5 Cá Mòi',
  },
  {
    day: 2,
    coins: 150,
    items: [{ itemId: 'basic_egg', quantity: 1 }],
    description: '150 Vàng + 1 Trứng Cơ Bản',
  },
  {
    day: 3,
    coins: 200,
    items: [{ itemId: 'krill', quantity: 3 }],
    description: '200 Vàng + 3 Tép Biển',
  },
  {
    day: 4,
    coins: 250,
    gems: 2,
    items: [],
    description: '250 Vàng + 2 Kim Cương',
  },
  {
    day: 5,
    coins: 300,
    items: [{ itemId: 'frozen_egg', quantity: 1 }],
    description: '300 Vàng + 1 Trứng Băng Giá',
  },
  {
    day: 6,
    coins: 400,
    gems: 5,
    items: [{ itemId: 'squid', quantity: 2 }],
    description: '400 Vàng + 5 Kim Cương + 2 Mực Ống',
  },
  {
    day: 7,
    coins: 1000,
    gems: 10,
    items: [{ itemId: 'golden_egg', quantity: 1 }],
    description: '1,000 Vàng + 10 Kim Cương + 1 Trứng Hoàng Kim',
  },
];

export interface StreakEvaluation {
  canClaim: boolean;
  nextStreak: number;
  reason?: 'ALREADY_CLAIMED';
}

export function evaluateLoginStreak(
  loginState: DailyLoginState,
  today: string,
  yesterday: string
): StreakEvaluation {
  if (loginState.lastClaimDate === today) {
    return {
      canClaim: false,
      nextStreak: loginState.currentStreak,
      reason: 'ALREADY_CLAIMED',
    };
  }

  if (loginState.lastClaimDate === yesterday) {
    if (loginState.currentStreak >= 7) {
      return { canClaim: true, nextStreak: 1 };
    }
    return { canClaim: true, nextStreak: loginState.currentStreak + 1 };
  }

  // Missed day or fresh save
  return { canClaim: true, nextStreak: 1 };
}

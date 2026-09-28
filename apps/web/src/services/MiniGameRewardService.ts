import { MiniGameResult, MiniGameReward } from '@penguin/types';
import { MINIGAME_CATCH_FISH_CONFIG } from '@penguin/game-data';

export interface SessionValidationResult {
  valid: boolean;
  reason?: 'MISSING_SESSION_ID' | 'INVALID_DURATION' | 'INVALID_SCORE';
}

export interface PlayEligibilityResult {
  canPlay: boolean;
  isFree: boolean;
  cost: number;
  reason?: 'INSUFFICIENT_FUNDS' | 'DAILY_LIMIT_REACHED';
}

/**
 * Pure domain service for mini-game reward calculations, session validation,
 * and daily limit gating.
 */
export function calculateCatchFishReward(
  score: number,
  companionLevel: number = 1,
  companionTraits: string[] = []
): MiniGameReward {
  let boundedScore = Math.max(0, Math.min(MINIGAME_CATCH_FISH_CONFIG.maxScoreCap, score));

  // Trait bonus: 'angler' trait grants +20% score bonus
  if (companionTraits.includes('angler')) {
    boundedScore = Math.min(
      MINIGAME_CATCH_FISH_CONFIG.maxScoreCap,
      Math.floor(boundedScore * 1.2)
    );
  }

  // Clamped companion level [1, 10]
  const clampedLevel = Math.max(1, Math.min(10, companionLevel));

  if (boundedScore >= 180) {
    return {
      tier: 'diamond',
      coins: Math.min(120, 80 + Math.floor(boundedScore * 0.2)),
      playerExp: 40,
      penguinExp: Math.min(35, 15 + clampedLevel * 2), // strictly bounded [10, 35]
      items: [
        { itemId: 'fat_salmon', quantity: 1 },
        { itemId: 'sardine', quantity: 3 },
      ],
    };
  } else if (boundedScore >= 110) {
    return {
      tier: 'gold',
      coins: Math.min(80, 50 + Math.floor(boundedScore * 0.2)),
      playerExp: 30,
      penguinExp: Math.min(35, 12 + clampedLevel * 2), // strictly bounded [10, 35]
      items: [
        { itemId: 'krill', quantity: 2 },
        { itemId: 'sardine', quantity: 2 },
      ],
    };
  } else if (boundedScore >= 50) {
    return {
      tier: 'silver',
      coins: Math.min(50, 30 + Math.floor(boundedScore * 0.2)),
      playerExp: 20,
      penguinExp: Math.min(35, 10 + clampedLevel * 1), // strictly bounded [10, 35]
      items: [{ itemId: 'sardine', quantity: 2 }],
    };
  } else {
    return {
      tier: 'bronze',
      coins: Math.min(25, 10 + Math.floor(boundedScore * 0.2)),
      playerExp: 10,
      penguinExp: 10, // strictly bounded [10, 35]
      items: [{ itemId: 'sardine', quantity: 1 }],
    };
  }
}

export function validateMiniGameSessionResult(
  result: MiniGameResult,
  expectedDuration: number = 30
): SessionValidationResult {
  if (!result.sessionId || result.sessionId.trim() === '') {
    return { valid: false, reason: 'MISSING_SESSION_ID' };
  }

  if (Math.abs(result.durationSec - expectedDuration) > 2) {
    return { valid: false, reason: 'INVALID_DURATION' };
  }

  if (result.score < 0 || result.score > MINIGAME_CATCH_FISH_CONFIG.maxScoreCap) {
    return { valid: false, reason: 'INVALID_SCORE' };
  }

  return { valid: true };
}

export function canPlayMiniGame(
  gameId: string,
  currentPlaysCount: number,
  coins: number
): PlayEligibilityResult {
  const config = MINIGAME_CATCH_FISH_CONFIG;
  const maxTotalPlays = config.dailyFreePlays + config.maxExtraPlaysPerDay;

  if (currentPlaysCount >= maxTotalPlays) {
    return { canPlay: false, isFree: false, cost: 0, reason: 'DAILY_LIMIT_REACHED' };
  }

  if (currentPlaysCount < config.dailyFreePlays) {
    return { canPlay: true, isFree: true, cost: 0 };
  }

  // Extra play
  const extraCost = config.extraPlayCostCoins;
  if (coins < extraCost) {
    return { canPlay: false, isFree: false, cost: extraCost, reason: 'INSUFFICIENT_FUNDS' };
  }

  return { canPlay: true, isFree: false, cost: extraCost };
}

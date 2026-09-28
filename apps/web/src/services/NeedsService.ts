import type { OwnedPenguin, PenguinMood } from '@penguin/types';
import { SPECIES_MAP, FOOD_CATALOG } from '@penguin/game-data';

export function derivePenguinMood(
  hunger: number,
  happiness: number,
  isSleeping: boolean = false
): PenguinMood {
  if (hunger >= 80) return 'hungry';
  if (happiness <= 25) return 'sad';
  if (isSleeping) return 'sleepy';
  if (happiness >= 80) return 'happy';
  return 'content';
}

export function isFavoriteFood(speciesId: string, foodId: string): boolean {
  const species = SPECIES_MAP.get(speciesId);
  return species?.favoriteFoodId === foodId;
}

export function simulatePenguinNeeds(
  penguin: OwnedPenguin,
  currentTime: number = Date.now()
): void {
  const elapsedSeconds = Math.max(0, Math.floor((currentTime - penguin.lastNeedsUpdateAt) / 1000));
  if (elapsedSeconds <= 0) return;

  const hungerInterval = penguin.speciesId === 'hungry' ? 96 : 120;
  const initialHunger = penguin.hunger;
  let happinessDecrease = 0;

  if (initialHunger >= 80) {
    // Hunger was already >= 80 for the entire elapsed period
    const hungerIncrease = Math.floor(elapsedSeconds / hungerInterval);
    penguin.hunger = Math.min(100, initialHunger + hungerIncrease);
    happinessDecrease = Math.floor(elapsedSeconds / 90);
  } else {
    // Hunger started below 80: calculate time required to reach 80
    const pointsTo80 = 80 - initialHunger;
    const secondsTo80 = pointsTo80 * hungerInterval;

    if (elapsedSeconds <= secondsTo80) {
      // Entire period elapsed before hunger reached 80
      const hungerIncrease = Math.floor(elapsedSeconds / hungerInterval);
      penguin.hunger = Math.min(100, initialHunger + hungerIncrease);
      happinessDecrease = Math.floor(elapsedSeconds / 180);
    } else {
      // Piecewise: time before reaching 80 + time after reaching 80
      const secondsAfter80 = elapsedSeconds - secondsTo80;
      const hungerIncreaseAfter80 = Math.floor(secondsAfter80 / hungerInterval);
      penguin.hunger = Math.min(100, 80 + hungerIncreaseAfter80);

      const decayBefore80 = Math.floor(secondsTo80 / 180);
      const decayAfter80 = Math.floor(secondsAfter80 / 90);
      happinessDecrease = decayBefore80 + decayAfter80;
    }
  }

  // Clamping
  penguin.happiness = Math.max(0, Math.min(100, penguin.happiness - happinessDecrease));
  penguin.hunger = Math.min(100, Math.max(0, penguin.hunger));

  // Recalculate mood deterministically
  penguin.mood = derivePenguinMood(penguin.hunger, penguin.happiness);

  // Advance timestamp
  penguin.lastNeedsUpdateAt = currentTime;
}

export interface CareRewards {
  coins: number;
  happinessBonus: number;
  hungerReduction: number;
  penguinExp: number;
  playerExp: number;
  isFavorite: boolean;
}

export function calculateCareRewards(
  speciesId: string,
  foodId?: string,
  cozyMultiplier: number = 1.0,
  penguinLevel: number = 1
): CareRewards {
  if (!foodId) {
    // Petting: +8 Happiness, +3 Penguin EXP, +2 Player EXP, strictly 0 Coins
    return {
      coins: 0,
      happinessBonus: 8,
      hungerReduction: 0,
      penguinExp: 3,
      playerExp: 2,
      isFavorite: false,
    };
  }

  const food = FOOD_CATALOG[foodId];
  const favorite = isFavoriteFood(speciesId, foodId);

  if (favorite) {
    const baseHunger = food?.hungerReduction ?? 25;
    const baseHappiness = food?.happinessBonus ?? 10;
    const hungerReduction = Math.round(baseHunger * 1.5);
    const happinessBonus = Math.round(baseHappiness * 2.0);
    const playerExp = 12;
    const penguinExp = speciesId === 'hungry' ? 18 : 15;
    const baseCoins = 15;
    const coins = Math.round(baseCoins * cozyMultiplier * (1 + (penguinLevel - 1) * 0.05));

    return {
      coins,
      happinessBonus,
      hungerReduction,
      penguinExp,
      playerExp,
      isFavorite: true,
    };
  }

  // Standard food
  const hungerReduction = food?.hungerReduction ?? 25;
  const happinessBonus = food?.happinessBonus ?? 10;
  const playerExp = 5;
  const penguinExp = 5;
  const coins = 3;

  return {
    coins,
    happinessBonus,
    hungerReduction,
    penguinExp,
    playerExp,
    isFavorite: false,
  };
}

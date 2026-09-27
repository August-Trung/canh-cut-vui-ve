import { DropPoolEntry } from '@penguin/types';

export interface IRandomService {
  rollDrop(dropPool: DropPoolEntry[]): string;
  randomRange(min: number, max: number): number;
}

export class LocalRandomService implements IRandomService {
  rollDrop(dropPool: DropPoolEntry[]): string {
    if (!dropPool || dropPool.length === 0) {
      throw new Error('Drop pool is empty.');
    }

    // Filter out entries where weight <= 0 to ensure 0-weight entries are never selected
    const validEntries = dropPool.filter((entry) => entry.weight > 0);
    if (validEntries.length === 0) {
      return dropPool[0].speciesId;
    }

    const totalWeight = validEntries.reduce((acc, entry) => acc + entry.weight, 0);
    const roll = Math.random() * totalWeight;
    let accumulated = 0;

    for (const entry of validEntries) {
      accumulated += entry.weight;
      if (roll <= accumulated) {
        return entry.speciesId;
      }
    }

    return validEntries[validEntries.length - 1].speciesId;
  }

  randomRange(min: number, max: number): number {
    const lower = Math.min(min, max);
    const upper = Math.max(min, max);
    return Math.floor(Math.random() * (upper - lower + 1)) + lower;
  }
}

export const randomService = new LocalRandomService();

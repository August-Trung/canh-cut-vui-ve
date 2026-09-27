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

    const totalWeight = dropPool.reduce((acc, entry) => acc + Math.max(0, entry.weight), 0);
    if (totalWeight <= 0) {
      return dropPool[0].speciesId;
    }

    const roll = Math.random() * totalWeight;
    let accumulated = 0;

    for (const entry of dropPool) {
      accumulated += Math.max(0, entry.weight);
      if (roll <= accumulated) {
        return entry.speciesId;
      }
    }

    return dropPool[dropPool.length - 1].speciesId;
  }

  randomRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export const randomService = new LocalRandomService();

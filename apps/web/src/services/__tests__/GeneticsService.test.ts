import { describe, it, expect } from 'vitest';
import { GeneticsService } from '../GeneticsService';
import { OwnedPenguin } from '@penguin/types';
import { IRandomService } from '../RandomService';

class MockRng implements IRandomService {
  private rolls: number[] = [];
  private dropIndex = 0;

  constructor(rolls: number[] = []) {
    this.rolls = rolls;
  }

  rollDrop(dropPool: { speciesId: string; weight: number }[]): string {
    if (this.rolls.length > 0) {
      const idx = Math.floor(this.rolls.shift()! * dropPool.length);
      return dropPool[Math.min(idx, dropPool.length - 1)].speciesId;
    }
    return dropPool[0].speciesId;
  }

  randomRange(min: number, max: number): number {
    if (this.rolls.length > 0) {
      const r = this.rolls.shift()!;
      return Math.floor(r * (max - min + 1)) + min;
    }
    return min;
  }

  nextFloat(): number {
    return this.rolls.length > 0 ? this.rolls.shift()! : 0.5;
  }
}

describe('GeneticsService', () => {
  const parentA: OwnedPenguin = {
    id: 'parent-a',
    speciesId: 'snowy',
    nickname: 'Snowy Dad',
    level: 3,
    exp: 250,
    happiness: 90,
    hunger: 20,
    mood: 'happy',
    lastPetAt: 0,
    lastFedAt: 0,
    lastNeedsUpdateAt: 1000,
    generation: 1,
    traits: ['glutton'],
    createdAt: 1000,
  };

  const parentB: OwnedPenguin = {
    id: 'parent-b',
    speciesId: 'snowy',
    nickname: 'Snowy Mom',
    level: 4,
    exp: 500,
    happiness: 85,
    hunger: 30,
    mood: 'happy',
    lastPetAt: 0,
    lastFedAt: 0,
    lastNeedsUpdateAt: 1000,
    generation: 2,
    traits: ['speedy', 'romantic'],
    createdAt: 1000,
  };

  it('calculates offspring generation as max(genA, genB) + 1', () => {
    const service = new GeneticsService(new MockRng([0.1, 0.1, 0.1, 0.1, 0.1]));
    const result = service.deriveOffspringGenetics(parentA, parentB);
    expect(result.generation).toBe(3);
    expect(result.parentAId).toBe('parent-a');
    expect(result.parentBId).toBe('parent-b');
  });

  it('inherits same species when roll is within 85%', () => {
    // 0.5 < 0.85 -> inherits parent species
    const rng = new MockRng([0.5, 0.1, 0.1, 0.1, 0.1]);
    const service = new GeneticsService(rng);
    const result = service.deriveOffspringGenetics(parentA, parentB);
    expect(result.speciesId).toBe('snowy');
    expect(result.mutatedSpecies).toBe(false);
  });

  it('rolls mutation from sameSpeciesMutationPool when roll >= 85%', () => {
    // 0.9 >= 0.85 -> triggers mutation roll
    const rng = new MockRng([0.9, 0.0, 0.1, 0.1, 0.1]);
    const service = new GeneticsService(rng);
    const result = service.deriveOffspringGenetics(parentA, parentB);
    expect(result.mutatedSpecies).toBe(true);
    expect(['shy', 'sleepy']).toContain(result.speciesId);
  });

  it('cross-species parents inherit Parent A or Parent B or mutation', () => {
    const parentCross: OwnedPenguin = { ...parentB, speciesId: 'hungry' };
    // 0.2 < 0.425 -> Parent A
    const rngA = new MockRng([0.2, 0.1, 0.1, 0.1]);
    const serviceA = new GeneticsService(rngA);
    expect(serviceA.deriveOffspringGenetics(parentA, parentCross).speciesId).toBe('snowy');

    // 0.5 -> between 0.425 and 0.85 -> Parent B
    const rngB = new MockRng([0.5, 0.1, 0.1, 0.1]);
    const serviceB = new GeneticsService(rngB);
    expect(serviceB.deriveOffspringGenetics(parentA, parentCross).speciesId).toBe('hungry');

    // 0.9 >= 0.85 -> Cross mutation
    const rngM = new MockRng([0.9, 0.0, 0.1, 0.1]);
    const serviceM = new GeneticsService(rngM);
    const resM = serviceM.deriveOffspringGenetics(parentA, parentCross);
    expect(resM.mutatedSpecies).toBe(true);
    expect(['happy', 'hungry', 'shy']).toContain(resM.speciesId);
  });

  it('enforces exact 8-step trait inheritance and max 2 traits', () => {
    // Both parents have traits: parentA has ['glutton'], parentB has ['speedy', 'romantic']
    // Step 1: Parent A glutton roll (pass if < 0.5)
    // Step 2: Parent B speedy roll, romantic roll
    // Let's pass all 3: glutton, speedy, romantic -> deduplicate -> length 3 -> sliced to 2!
    const rng = new MockRng([
      0.1, // species same (< 0.85 -> snowy)
      0.1, // Parent A glutton inherits (< 0.5)
      0.1, // Parent B speedy inherits (< 0.5)
      0.1, // Parent B romantic inherits (< 0.5)
      0.9, // Mutation roll (no mutation if >= 0.10)
      0.1, // Personality roll
    ]);
    const service = new GeneticsService(rng);
    const result = service.deriveOffspringGenetics(parentA, parentB);
    expect(result.traits.length).toBeLessThanOrEqual(2);
    expect(result.traits).toEqual(['glutton', 'speedy']);
  });

  it('mutation only adds a trait if a slot remains available (< 2)', () => {
    const parentEmpty: OwnedPenguin = { ...parentA, traits: [] };
    const parentOne: OwnedPenguin = { ...parentB, traits: ['lucky'] };
    // Roll: species (0.1), lucky inherits (0.1) -> traits: ['lucky'] (length 1)
    // Mutation roll (< 0.10 triggers mutation) -> 0.05 -> adds new trait
    const rng = new MockRng([
      0.1,  // species
      0.1,  // lucky inherited
      0.05, // mutation triggered (< 0.10)
      0.0,  // mutation picks trait
      0.1,  // personality
    ]);
    const service = new GeneticsService(rng);
    const result = service.deriveOffspringGenetics(parentEmpty, parentOne);
    expect(result.traits.length).toBe(2);
    expect(result.traits).toContain('lucky');
  });

  it('never duplicates an existing trait', () => {
    const p1: OwnedPenguin = { ...parentA, traits: ['lucky'] };
    const p2: OwnedPenguin = { ...parentB, traits: ['lucky'] };
    const rng = new MockRng([0.1, 0.1, 0.1, 0.9, 0.1]);
    const service = new GeneticsService(rng);
    const result = service.deriveOffspringGenetics(p1, p2);
    // Deduplication should ensure 'lucky' appears only once
    const luckyCount = result.traits.filter((t) => t === 'lucky').length;
    expect(luckyCount).toBe(1);
  });
});

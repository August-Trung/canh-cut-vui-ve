import { describe, it, expect } from 'vitest';
import { HatchService, rollSpeciesForEgg } from '../HatchService';
import type { IRandomService } from '../RandomService';

class MockRandomService implements IRandomService {
  constructor(private returnId: string) {}
  rollDrop(): string {
    return this.returnId;
  }
  randomRange(): number {
    return 1;
  }
  nextFloat(): number {
    return 0.5;
  }
}

describe('HatchService', () => {
  it('rolls species authoritatively from egg drop pool', () => {
    const mockRandom = new MockRandomService('hungry');
    const service = new HatchService(mockRandom);
    const rolled = service.rollSpeciesForEgg('golden_egg');
    expect(rolled).toBe('hungry');
  });

  it('rollSpeciesForEgg helper returns species from pool', () => {
    const mockRandom = new MockRandomService('snowy');
    const rolled = rollSpeciesForEgg('basic_egg', mockRandom);
    expect(rolled).toBe('snowy');
  });

  it('falls back to snowy if egg type is unknown', () => {
    const mockRandom = new MockRandomService('hungry');
    const service = new HatchService(mockRandom);
    const rolled = service.rollSpeciesForEgg('nonexistent_egg');
    expect(rolled).toBe('snowy');
  });
});

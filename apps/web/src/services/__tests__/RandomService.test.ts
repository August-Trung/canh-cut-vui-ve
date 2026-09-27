import { describe, it, expect } from 'vitest';
import { LocalRandomService, randomService } from '../RandomService';

describe('LocalRandomService', () => {
  const rng = new LocalRandomService();

  it('rolls from drop pool respecting relative positive weights', () => {
    const pool = [
      { speciesId: 'snowy', weight: 80 },
      { speciesId: 'rare_p', weight: 20 },
    ];
    const counts = { snowy: 0, rare_p: 0 };
    for (let i = 0; i < 500; i++) {
      const rolled = rng.rollDrop(pool);
      counts[rolled as keyof typeof counts]++;
    }
    expect(counts.snowy).toBeGreaterThan(counts.rare_p);
    expect(counts.snowy + counts.rare_p).toBe(500);
  });

  it('works with weights not summing to 100', () => {
    const pool = [
      { speciesId: 'a', weight: 1 },
      { speciesId: 'b', weight: 3 },
    ];
    const picked = rng.rollDrop(pool);
    expect(['a', 'b']).toContain(picked);
  });

  it('throws an error if drop pool is empty', () => {
    expect(() => rng.rollDrop([])).toThrow('Drop pool is empty.');
  });

  it('returns species when total weight is zero or non-positive', () => {
    const pool = [
      { speciesId: 'snowy', weight: 0 },
      { speciesId: 'sleepy', weight: 0 },
    ];
    const rolled = rng.rollDrop(pool);
    expect(rolled).toBe('snowy');
  });

  it('generates random numbers in range [min, max]', () => {
    for (let i = 0; i < 100; i++) {
      const val = rng.randomRange(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('exports singleton randomService instance', () => {
    expect(randomService).toBeInstanceOf(LocalRandomService);
  });
});

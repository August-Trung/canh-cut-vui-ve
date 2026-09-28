import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PenguinFSM, PenguinState } from '../PenguinFSM';

describe('PenguinFSM', () => {
  let fsm: PenguinFSM;

  beforeEach(() => {
    fsm = new PenguinFSM();
  });

  it('starts in IDLE state', () => {
    expect(fsm.currentState).toBe('IDLE');
    expect(fsm.previousState).toBe('IDLE');
  });

  it('supports transitions to all 11 required states', () => {
    const states: PenguinState[] = [
      'IDLE',
      'WADDLE',
      'BELLY_SLIDE',
      'SLEEP',
      'TALK',
      'EAT',
      'PLAY',
      'FISH',
      'FOLLOW',
      'CELEBRATE',
      'REACT',
    ];

    for (const s of states) {
      const changed = fsm.transitionTo(s);
      expect(changed).toBe(true);
      expect(fsm.currentState).toBe(s);
    }
  });

  it('notifies listener on state change', () => {
    const listener = vi.fn();
    const unsub = fsm.onStateChange(listener);

    fsm.transitionTo('WADDLE');
    expect(listener).toHaveBeenCalledWith('WADDLE', 'IDLE');
    expect(listener).toHaveBeenCalledTimes(1);

    // Unsubscribe check
    unsub();
    fsm.transitionTo('SLEEP');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('REACT state immediately interrupts other states', () => {
    fsm.transitionTo('SLEEP');
    expect(fsm.currentState).toBe('SLEEP');

    fsm.triggerReaction();
    expect(fsm.currentState).toBe('REACT');
    expect(fsm.previousState).toBe('SLEEP');
  });

  it('supports self-transition to re-enter state and reset timer', () => {
    const listener = vi.fn();
    fsm.onStateChange(listener);

    const changed = fsm.transitionTo('IDLE');
    expect(changed).toBe(true);
    expect(listener).toHaveBeenCalledWith('IDLE', 'IDLE');
  });

  it('automatically transitions temporary states back to IDLE after duration', () => {
    // Transition to REACT with a short duration of 500ms
    fsm.transitionTo('REACT', 500);
    expect(fsm.currentState).toBe('REACT');

    // Update by 300ms (not yet finished)
    fsm.update(300);
    expect(fsm.currentState).toBe('REACT');

    // Update by another 250ms (total 550ms, elapsed > 500ms)
    fsm.update(250);
    expect(fsm.currentState).toBe('IDLE');
  });

  it('resets state correctly', () => {
    fsm.transitionTo('BELLY_SLIDE');
    expect(fsm.currentState).toBe('BELLY_SLIDE');

    fsm.reset('IDLE');
    expect(fsm.currentState).toBe('IDLE');
    expect(fsm.stateTime).toBe(0);
  });

  it('resets reaction timer and notifies listeners when triggerReaction is called while already in REACT', () => {
    fsm.transitionTo('REACT', 1000);
    fsm.update(700);
    expect(fsm.stateTime).toBe(700);

    const listener = vi.fn();
    fsm.onStateChange(listener);

    fsm.triggerReaction(1500);
    expect(fsm.currentState).toBe('REACT');
    expect(fsm.stateTime).toBe(0);
    expect(fsm.stateDuration).toBe(1500);
    expect(listener).toHaveBeenCalledWith('REACT', 'REACT');
  });

  it('autonomously transitions from IDLE to a new activity when timer expires', () => {
    const autoFsm = new PenguinFSM({
      minIdleDuration: 100,
      maxIdleDuration: 200,
    });
    expect(autoFsm.currentState).toBe('IDLE');

    autoFsm.update(250);
    // After timeout, it should have picked an autonomous state
    expect(autoFsm.currentState).not.toBe('IDLE');
    expect([
      'WADDLE',
      'TALK',
      'PLAY',
      'FISH',
      'SLEEP',
    ]).toContain(autoFsm.currentState);
  });

  it('does not autonomously transition when autonomous config is false', () => {
    const manualFsm = new PenguinFSM({
      autonomous: false,
      minIdleDuration: 100,
      maxIdleDuration: 200,
    });
    manualFsm.update(300);
    expect(manualFsm.currentState).toBe('IDLE');
  });

  describe('Phase 3: Deterministic RNG, Personality Weighting & Needs Overrides', () => {
    it('uses injected deterministic IRandomService', () => {
      // Mock RNG that always returns 0 (which maps to WADDLE)
      const mockRandom = {
        next: vi.fn().mockReturnValue(0),
        nextFloat: vi.fn().mockReturnValue(0),
        nextInt: vi.fn().mockReturnValue(0),
        nextItem: vi.fn(),
      };

      const testFsm = new PenguinFSM(
        { minIdleDuration: 100, maxIdleDuration: 100 },
        mockRandom
      );

      testFsm.update(150);
      expect(mockRandom.nextFloat).toHaveBeenCalled();
      expect(testFsm.currentState).toBe('WADDLE');
    });

    it('lazy personality halves waddle duration and increases sleep weight', () => {
      const lazyFsm = new PenguinFSM({
        personality: 'lazy',
        waddleDuration: 4000,
      });

      lazyFsm.transitionTo('WADDLE');
      expect(lazyFsm.stateDuration).toBe(2000); // 4000 * 0.5
    });

    it('starving override (hunger >= 80) forces FISH state from IDLE', () => {
      const hungryFsm = new PenguinFSM({
        minIdleDuration: 100,
        maxIdleDuration: 100,
        getNeeds: () => ({ hunger: 85, happiness: 50 }),
      });

      hungryFsm.update(150);
      expect(hungryFsm.currentState).toBe('FISH');
    });

    it('miserable override (happiness <= 25) prevents PLAY and CELEBRATE states', () => {
      // Return value that would otherwise land in PLAY range if weights weren't 0
      const mockRandom = {
        next: vi.fn().mockReturnValue(0),
        nextFloat: vi.fn().mockReturnValue(0.999), // near the end
        nextInt: vi.fn().mockReturnValue(0),
        nextItem: vi.fn(),
      };

      const sadFsm = new PenguinFSM(
        {
          minIdleDuration: 100,
          maxIdleDuration: 100,
          getNeeds: () => ({ hunger: 10, happiness: 15 }),
        },
        mockRandom
      );

      sadFsm.update(150);
      expect(sadFsm.currentState).not.toBe('PLAY');
      expect(sadFsm.currentState).not.toBe('CELEBRATE');
    });

    it('chaotic personality enables BELLY_SLIDE autonomous transition', () => {
      // Total weight: WADDLE (50) + TALK (15) + PLAY (15) + FISH (10) + SLEEP (10) + BELLY_SLIDE (15) = 115
      // BELLY_SLIDE is at the end (100 to 115), so roll = 105/115 ~ 0.913
      const mockRandom = {
        next: vi.fn().mockReturnValue(0),
        nextFloat: vi.fn().mockReturnValue(105 / 115),
        nextInt: vi.fn().mockReturnValue(0),
        nextItem: vi.fn(),
      };

      const chaoticFsm = new PenguinFSM(
        {
          personality: 'chaotic',
          minIdleDuration: 100,
          maxIdleDuration: 100,
        },
        mockRandom
      );

      chaoticFsm.update(150);
      expect(chaoticFsm.currentState).toBe('BELLY_SLIDE');
    });
  });
});

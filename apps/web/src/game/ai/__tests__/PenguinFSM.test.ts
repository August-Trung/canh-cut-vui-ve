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

  it('resets reaction timer when triggerReaction is called while already in REACT', () => {
    fsm.transitionTo('REACT', 1000);
    fsm.update(700);
    expect(fsm.stateTime).toBe(700);

    fsm.triggerReaction(1500);
    expect(fsm.currentState).toBe('REACT');
    expect(fsm.stateTime).toBe(0);
    expect(fsm.stateDuration).toBe(1500);
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
});

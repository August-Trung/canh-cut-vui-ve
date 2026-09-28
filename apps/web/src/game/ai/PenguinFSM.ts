import type { PenguinPersonality } from '@penguin/types';
import { IRandomService, randomService } from '../../services/RandomService';

export type PenguinState =
  | 'IDLE'
  | 'WADDLE'
  | 'BELLY_SLIDE'
  | 'SLEEP'
  | 'TALK'
  | 'EAT'
  | 'PLAY'
  | 'FISH'
  | 'FOLLOW'
  | 'CELEBRATE'
  | 'REACT';

export type StateChangeListener = (
  newState: PenguinState,
  prevState: PenguinState
) => void;

export interface PenguinFSMConfig {
  initialState?: PenguinState;
  autonomous?: boolean;
  minIdleDuration?: number;
  maxIdleDuration?: number;
  reactionDuration?: number;
  eatDuration?: number;
  playDuration?: number;
  celebrateDuration?: number;
  talkDuration?: number;
  fishDuration?: number;
  sleepDuration?: number;
  waddleDuration?: number;
  bellySlideDuration?: number;
  personality?: PenguinPersonality;
  traits?: string[];
  getNeeds?: () => { hunger: number; happiness: number };
}

const DEFAULT_CONFIG: Required<Omit<PenguinFSMConfig, 'personality' | 'traits' | 'getNeeds'>> = {
  initialState: 'IDLE',
  autonomous: true,
  minIdleDuration: 3000,
  maxIdleDuration: 6000,
  reactionDuration: 1200,
  eatDuration: 2000,
  playDuration: 2200,
  celebrateDuration: 2500,
  talkDuration: 3500,
  fishDuration: 4000,
  sleepDuration: 8000,
  waddleDuration: 4000,
  bellySlideDuration: 2500,
};

/**
 * Pure TypeScript Finite State Machine governing autonomous penguin behaviors.
 * Fully decoupled from rendering or DOM runtimes for headless testability.
 */
export class PenguinFSM {
  private _currentState: PenguinState;
  private _previousState: PenguinState;
  private _stateTime = 0;
  private _stateDuration = 0;
  private _listeners = new Set<StateChangeListener>();
  private readonly config: Required<Omit<PenguinFSMConfig, 'personality' | 'traits' | 'getNeeds'>>;
  private random: IRandomService;
  public personality?: PenguinPersonality;
  public traits: string[] = [];
  public getNeeds?: () => { hunger: number; happiness: number };

  constructor(config?: PenguinFSMConfig, random?: IRandomService) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
    this.random = random ?? randomService;
    this.personality = config?.personality;
    this.traits = config?.traits ? [...config.traits] : [];
    this.getNeeds = config?.getNeeds;
    this._currentState = this.config.initialState;
    this._previousState = this.config.initialState;
    this._stateDuration = this.resolveDuration(this._currentState);
  }

  get currentState(): PenguinState {
    return this._currentState;
  }

  get previousState(): PenguinState {
    return this._previousState;
  }

  get stateTime(): number {
    return this._stateTime;
  }

  get stateDuration(): number {
    return this._stateDuration;
  }

  setRandomService(random: IRandomService): void {
    this.random = random;
  }

  setPersonality(personality: PenguinPersonality): void {
    this.personality = personality;
  }

  setTraits(traits: string[]): void {
    this.traits = [...traits];
  }

  setNeedsGetter(fn: () => { hunger: number; happiness: number }): void {
    this.getNeeds = fn;
  }

  /**
   * Register a state change listener.
   * Returns an unsubscribe function.
   */
  onStateChange(listener: StateChangeListener): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  /**
   * Transition to a new state.
   * Supports transitions across all states including self-transitions.
   */
  transitionTo(nextState: PenguinState, customDuration?: number): boolean {
    const prev = this._currentState;
    this._previousState = prev;
    this._currentState = nextState;
    this._stateTime = 0;
    this._stateDuration = customDuration ?? this.resolveDuration(nextState);

    // Notify listeners
    for (const listener of this._listeners) {
      try {
        listener(nextState, prev);
      } catch (err) {
        console.error('[PenguinFSM] Error in listener:', err);
      }
    }

    return true;
  }

  /**
   * Trigger immediate reaction (e.g. on click).
   * Takes precedence over and immediately interrupts all other states.
   * If already in REACT, resets state timer and re-notifies listeners
   * to provide responsive visual feedback on rapid clicking.
   */
  triggerReaction(customDuration?: number): void {
    this.transitionTo('REACT', customDuration ?? this.config.reactionDuration);
  }

  /**
   * Progress state timer and perform autonomous transitions.
   * delta is in milliseconds.
   */
  update(delta: number): void {
    this._stateTime += delta;

    if (this._stateDuration > 0 && this._stateTime >= this._stateDuration) {
      this.handleStateTimeout();
    }
  }

  /**
   * Reset FSM back to a baseline state.
   */
  reset(initialState: PenguinState = 'IDLE'): void {
    this._currentState = initialState;
    this._previousState = initialState;
    this._stateTime = 0;
    this._stateDuration = this.resolveDuration(initialState);
  }

  private handleStateTimeout(): void {
    if (!this.config.autonomous) {
      return;
    }

    switch (this._currentState) {
      case 'IDLE':
        this.pickAutonomousState();
        break;
      case 'REACT':
      case 'EAT':
      case 'PLAY':
      case 'CELEBRATE':
      case 'TALK':
      case 'FISH':
      case 'SLEEP':
      case 'WADDLE':
      case 'BELLY_SLIDE':
      case 'FOLLOW':
        this.transitionTo('IDLE');
        break;
    }
  }

  private pickAutonomousState(): void {
    const needs = this.getNeeds?.();
    if (needs && needs.hunger >= 80) {
      this.transitionTo('FISH');
      return;
    }

    const weights: Record<PenguinState, number> = {
      IDLE: 0,
      WADDLE: 50,
      TALK: 15,
      PLAY: 15,
      FISH: 10,
      SLEEP: 10,
      BELLY_SLIDE: 0,
      CELEBRATE: 0,
      EAT: 0,
      FOLLOW: 0,
      REACT: 0,
    };

    if (this.personality === 'lazy' || this.personality === 'sleepy') {
      weights.SLEEP = Math.round(weights.SLEEP * 2.5);
    } else if (this.personality === 'hungry') {
      weights.FISH = Math.round(weights.FISH * 2.0);
    } else if (this.personality === 'chaotic') {
      weights.BELLY_SLIDE = 15;
    } else if (this.personality === 'happy') {
      weights.PLAY = Math.round(weights.PLAY * 2.0);
      weights.CELEBRATE = 10;
    }

    if (needs) {
      if (needs.happiness <= 25) {
        weights.PLAY = 0;
        weights.CELEBRATE = 0;
      } else if (needs.happiness >= 80) {
        weights.CELEBRATE = Math.max(10, weights.CELEBRATE * 2);
      }
    }

    let totalWeight = 0;
    for (const st in weights) {
      totalWeight += weights[st as PenguinState];
    }

    if (totalWeight <= 0) {
      this.transitionTo('WADDLE');
      return;
    }

    let roll = this.random.nextFloat() * totalWeight;
    for (const st in weights) {
      const state = st as PenguinState;
      const w = weights[state];
      if (w > 0) {
        if (roll < w) {
          this.transitionTo(state);
          return;
        }
        roll -= w;
      }
    }

    this.transitionTo('WADDLE');
  }

  private resolveDuration(state: PenguinState): number {
    switch (state) {
      case 'IDLE': {
        const min = this.config.minIdleDuration;
        const max = this.config.maxIdleDuration;
        return min + this.random.nextFloat() * (max - min);
      }
      case 'WADDLE': {
        const factor = (this.personality === 'lazy' || this.personality === 'sleepy') ? 0.5 : 1.0;
        return this.config.waddleDuration * factor;
      }
      case 'BELLY_SLIDE':
        return this.config.bellySlideDuration;
      case 'SLEEP':
        return this.config.sleepDuration;
      case 'TALK':
        return this.config.talkDuration;
      case 'EAT':
        return this.config.eatDuration;
      case 'PLAY':
        return this.config.playDuration;
      case 'FISH':
        return this.config.fishDuration;
      case 'FOLLOW':
        return this.config.waddleDuration;
      case 'CELEBRATE':
        return this.config.celebrateDuration;
      case 'REACT':
        return this.config.reactionDuration;
    }
  }
}

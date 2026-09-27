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
}

const DEFAULT_CONFIG: Required<PenguinFSMConfig> = {
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
  private readonly config: Required<PenguinFSMConfig>;

  constructor(config?: PenguinFSMConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
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
    // Weighted autonomous behavior selection
    const rand = Math.random();
    if (rand < 0.5) {
      this.transitionTo('WADDLE');
    } else if (rand < 0.65) {
      this.transitionTo('TALK');
    } else if (rand < 0.8) {
      this.transitionTo('PLAY');
    } else if (rand < 0.9) {
      this.transitionTo('FISH');
    } else {
      this.transitionTo('SLEEP');
    }
  }

  private resolveDuration(state: PenguinState): number {
    switch (state) {
      case 'IDLE': {
        const min = this.config.minIdleDuration;
        const max = this.config.maxIdleDuration;
        return min + Math.random() * (max - min);
      }
      case 'WADDLE':
        return this.config.waddleDuration;
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

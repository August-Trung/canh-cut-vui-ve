import { OwnedPenguin, IncubatorSlot } from '@penguin/types';

export type GameBridgeEventMap = {
  'penguin:clicked': { ownedId: string };
  'egg:clicked': { slotId: number };
  'canvas:ready': void;
  'penguin:spawn': { penguin: OwnedPenguin };
  'penguin:action': { ownedId: string; action: 'pet' | 'feed' };
  'camera:focus': { x: number; y: number };
  'world:sync': { penguins: OwnedPenguin[]; nestSlot?: IncubatorSlot | null };
  'nest:sync': { slot: IncubatorSlot | null };
};

export type GameBridgeHandler<K extends keyof GameBridgeEventMap> = (
  payload: GameBridgeEventMap[K]
) => void;

/**
 * GameBridge acts as the decoupled, type-safe event bus boundary
 * connecting Vue 3 UI / Pinia stores with Phaser 3.
 *
 * Strict boundary rule: Phaser must never directly mutate Pinia state.
 * Events flow across this bridge, and store actions handle state transitions.
 */
export class GameBridge {
  private listeners = new Map<keyof GameBridgeEventMap, Set<(payload: unknown) => void>>();

  /**
   * Subscribe to an event. Returns an explicit unsubscribe function.
   * Duplicate subscriptions with the exact same handler reference are ignored.
   */
  on<K extends keyof GameBridgeEventMap>(
    event: K,
    handler: GameBridgeHandler<K>
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }

    set.add(handler as (payload: unknown) => void);

    return () => {
      this.off(event, handler);
    };
  }

  /**
   * Unsubscribe a handler from an event.
   */
  off<K extends keyof GameBridgeEventMap>(
    event: K,
    handler: GameBridgeHandler<K>
  ): void {
    const set = this.listeners.get(event);
    if (!set) return;

    set.delete(handler as (payload: unknown) => void);
    if (set.size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Emit an event to all registered listeners.
   * Listener errors are caught and logged so one failing listener never interrupts others.
   */
  emit<K extends keyof GameBridgeEventMap>(
    ...args: GameBridgeEventMap[K] extends void
      ? [event: K, payload?: void]
      : [event: K, payload: GameBridgeEventMap[K]]
  ): void {
    const [event, payload] = args;
    const set = this.listeners.get(event);
    if (!set) return;

    // Iterate over a snapshot copy to prevent concurrent modification issues
    const handlers = Array.from(set);
    for (const handler of handlers) {
      try {
        (handler as (p: unknown) => void)(payload);
      } catch (error) {
        console.error(`[GameBridge] Error in listener for event "${String(event)}":`, error);
      }
    }
  }

  /**
   * Remove all registered listeners across all events.
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Returns the number of active listeners for a specific event or in total.
   */
  listenerCount<K extends keyof GameBridgeEventMap>(event?: K): number {
    if (event !== undefined) {
      return this.listeners.get(event)?.size ?? 0;
    }

    let total = 0;
    for (const set of this.listeners.values()) {
      total += set.size;
    }
    return total;
  }
}

/**
 * Authoritative global GameBridge singleton instance.
 */
export const gameBridge = new GameBridge();

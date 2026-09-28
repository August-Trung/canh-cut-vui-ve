import { describe, it, expect, vi } from 'vitest';
import { GameBridge, gameBridge, GameBridgeEventMap } from '../GameBridge';
import { OwnedPenguin } from '@penguin/types';

describe('GameBridge', () => {
  it('subscribes and receives emitted events with typed payload', () => {
    const bridge = new GameBridge();
    const handler = vi.fn();

    const unsub = bridge.on('penguin:clicked', handler);
    bridge.emit('penguin:clicked', { ownedId: 'p-123' });

    expect(handler).toHaveBeenCalledWith({ ownedId: 'p-123' });
    unsub();

    bridge.emit('penguin:clicked', { ownedId: 'p-456' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('prevents duplicate listener subscriptions', () => {
    const bridge = new GameBridge();
    const handler = vi.fn();

    bridge.on('canvas:ready', handler);
    bridge.on('canvas:ready', handler); // Same reference

    bridge.emit('canvas:ready', undefined as void);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('cleans up all listeners on clear()', () => {
    const bridge = new GameBridge();
    const h1 = vi.fn();
    const h2 = vi.fn();

    bridge.on('penguin:clicked', h1);
    bridge.on('canvas:ready', h2);

    bridge.clear();
    bridge.emit('penguin:clicked', { ownedId: 'p-1' });
    bridge.emit('canvas:ready', undefined as void);

    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it('catches and isolates listener errors without breaking other listeners', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const bridge = new GameBridge();
    const badHandler = vi.fn(() => {
      throw new Error('Listener error');
    });
    const goodHandler = vi.fn();

    bridge.on('penguin:clicked', badHandler);
    bridge.on('penguin:clicked', goodHandler);

    expect(() => {
      bridge.emit('penguin:clicked', { ownedId: 'p-1' });
    }).not.toThrow();

    expect(badHandler).toHaveBeenCalled();
    expect(goodHandler).toHaveBeenCalledWith({ ownedId: 'p-1' });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[GameBridge] Error in listener for event "penguin:clicked":'),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('supports explicit off() to remove a listener', () => {
    const bridge = new GameBridge();
    const handler = vi.fn();

    bridge.on('egg:clicked', handler);
    bridge.emit('egg:clicked', { slotId: 2 });
    expect(handler).toHaveBeenCalledWith({ slotId: 2 });

    bridge.off('egg:clicked', handler);
    bridge.emit('egg:clicked', { slotId: 3 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('handles multiple calls to unsub() safely', () => {
    const bridge = new GameBridge();
    const handler = vi.fn();

    const unsub = bridge.on('egg:clicked', handler);
    unsub();
    expect(() => unsub()).not.toThrow();
  });

  it('correctly tracks listenerCount for specific events and overall', () => {
    const bridge = new GameBridge();
    const h1 = vi.fn();
    const h2 = vi.fn();

    expect(bridge.listenerCount('penguin:clicked')).toBe(0);
    expect(bridge.listenerCount()).toBe(0);

    const unsub1 = bridge.on('penguin:clicked', h1);
    const unsub2 = bridge.on('penguin:clicked', h2);
    bridge.on('camera:focus', h1);

    expect(bridge.listenerCount('penguin:clicked')).toBe(2);
    expect(bridge.listenerCount('camera:focus')).toBe(1);
    expect(bridge.listenerCount()).toBe(3);

    unsub1();
    expect(bridge.listenerCount('penguin:clicked')).toBe(1);
    expect(bridge.listenerCount()).toBe(2);

    bridge.clear();
    expect(bridge.listenerCount()).toBe(0);
  });

  it('supports all events in GameBridgeEventMap with valid payload shapes', () => {
    const bridge = new GameBridge();

    const penguinClicked = vi.fn();
    const eggClicked = vi.fn();
    const canvasReady = vi.fn();
    const penguinSpawn = vi.fn();
    const penguinAction = vi.fn();
    const cameraFocus = vi.fn();
    const worldSync = vi.fn();
    const nestSync = vi.fn();

    bridge.on('penguin:clicked', penguinClicked);
    bridge.on('egg:clicked', eggClicked);
    bridge.on('canvas:ready', canvasReady);
    bridge.on('penguin:spawn', penguinSpawn);
    bridge.on('penguin:action', penguinAction);
    bridge.on('camera:focus', cameraFocus);
    bridge.on('world:sync', worldSync);
    bridge.on('nest:sync', nestSync);

    const mockPenguin: OwnedPenguin = {
      id: 'p-1',
      speciesId: 'emperor',
      nickname: 'Pip',
      level: 1,
      exp: 0,
      experience: 0,
      happiness: 100,
      energy: 100,
      hunger: 0,
      mood: 'happy',
      lastPetAt: 0,
      lastFedAt: 0,
      lastNeedsUpdateAt: 1000,
      acquiredAt: 1000,
      generation: 1,
    };

    const uiModal = vi.fn();
    bridge.on('ui:modal', uiModal);

    bridge.emit('penguin:clicked', { ownedId: 'p-1' });
    bridge.emit('egg:clicked', { slotId: 0 });
    bridge.emit('canvas:ready', undefined);
    bridge.emit('penguin:spawn', { penguin: mockPenguin });
    bridge.emit('penguin:action', { ownedId: 'p-1', action: 'feed' });
    bridge.emit('camera:focus', { x: 100, y: 200 });
    bridge.emit('world:sync', { penguins: [mockPenguin] });
    bridge.emit('nest:sync', { slot: { slotId: 1, state: 'INCUBATING', eggTypeId: 'basic_egg' } });
    bridge.emit('ui:modal', { open: true });

    expect(penguinClicked).toHaveBeenCalledWith({ ownedId: 'p-1' });
    expect(eggClicked).toHaveBeenCalledWith({ slotId: 0 });
    expect(canvasReady).toHaveBeenCalledWith(undefined);
    expect(penguinSpawn).toHaveBeenCalledWith({ penguin: mockPenguin });
    expect(penguinAction).toHaveBeenCalledWith({ ownedId: 'p-1', action: 'feed' });
    expect(cameraFocus).toHaveBeenCalledWith({ x: 100, y: 200 });
    expect(worldSync).toHaveBeenCalledWith({ penguins: [mockPenguin] });
    expect(nestSync).toHaveBeenCalledWith({ slot: { slotId: 1, state: 'INCUBATING', eggTypeId: 'basic_egg' } });
    expect(uiModal).toHaveBeenCalledWith({ open: true });
  });

  it('exports a default singleton instance', () => {
    expect(gameBridge).toBeDefined();
    expect(gameBridge).toBeInstanceOf(GameBridge);
  });

  it('does nothing when emitting an event that has no listeners', () => {
    const bridge = new GameBridge();
    expect(() => {
      bridge.emit('camera:focus', { x: 0, y: 0 });
    }).not.toThrow();
  });

  it('supports Phase 2 anchor plot, effect, and decoupled action events', () => {
    const bridge = new GameBridge();

    const plotClicked = vi.fn();
    const decorSync = vi.fn();
    const coinDrop = vi.fn();
    const levelUp = vi.fn();
    const actionPet = vi.fn();
    const actionFeed = vi.fn();
    const actionHatch = vi.fn();
    const actionShop = vi.fn();
    const actionDecor = vi.fn();

    bridge.on('plot:clicked', plotClicked);
    bridge.on('decorations:sync', decorSync);
    bridge.on('effect:coin_drop', coinDrop);
    bridge.on('effect:level_up', levelUp);
    bridge.on('action:pet', actionPet);
    bridge.on('action:feed', actionFeed);
    bridge.on('action:hatch', actionHatch);
    bridge.on('action:shop_purchase', actionShop);
    bridge.on('action:decorate', actionDecor);

    const mockPenguin: OwnedPenguin = {
      id: 'p-1',
      speciesId: 'emperor',
      nickname: 'Pip',
      level: 1,
      exp: 0,
      experience: 0,
      happiness: 100,
      energy: 100,
      hunger: 0,
      mood: 'happy',
      lastPetAt: 0,
      lastFedAt: 0,
      lastNeedsUpdateAt: 1000,
      acquiredAt: 1000,
      generation: 1,
    };

    bridge.emit('plot:clicked', { plotId: 3 });
    bridge.emit('decorations:sync', { decorations: [{ instanceId: 'd1', decorationId: 'bench_wood', plotId: 1, placedAt: 1000 }] });
    bridge.emit('effect:coin_drop', { x: 150, y: 250, amount: 20 });
    bridge.emit('effect:level_up', { newLevel: 5 });
    bridge.emit('action:pet', { ownedId: 'p-1', penguin: mockPenguin });
    bridge.emit('action:feed', { ownedId: 'p-1', foodId: 'sardine', penguin: mockPenguin });
    bridge.emit('action:hatch', { ownedId: 'p-1', penguin: mockPenguin });
    bridge.emit('action:shop_purchase', { itemId: 'sardine', category: 'food', quantity: 2 });
    bridge.emit('action:decorate', { plotId: 1, decorationId: 'bench_wood' });

    expect(plotClicked).toHaveBeenCalledWith({ plotId: 3 });
    expect(decorSync).toHaveBeenCalledWith({ decorations: [{ instanceId: 'd1', decorationId: 'bench_wood', plotId: 1, placedAt: 1000 }] });
    expect(coinDrop).toHaveBeenCalledWith({ x: 150, y: 250, amount: 20 });
    expect(levelUp).toHaveBeenCalledWith({ newLevel: 5 });
    expect(actionPet).toHaveBeenCalledWith({ ownedId: 'p-1', penguin: mockPenguin });
    expect(actionFeed).toHaveBeenCalledWith({ ownedId: 'p-1', foodId: 'sardine', penguin: mockPenguin });
    expect(actionHatch).toHaveBeenCalledWith({ ownedId: 'p-1', penguin: mockPenguin });
    expect(actionShop).toHaveBeenCalledWith({ itemId: 'sardine', category: 'food', quantity: 2 });
    expect(actionDecor).toHaveBeenCalledWith({ plotId: 1, decorationId: 'bench_wood' });
  });
});


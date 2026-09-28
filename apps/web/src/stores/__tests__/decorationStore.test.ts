import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDecorationStore } from '../decorationStore';
import { useGameStore } from '../gameStore';
import { useInventoryStore } from '../inventoryStore';
import { gameBridge } from '../../game/bridge/GameBridge';

describe('useDecorationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('places item on empty Plot 1 (deducts from inventory, adds to placedDecorations, awards +15 Player EXP, emits action:decorate)', () => {
    const gameStore = useGameStore();
    const invStore = useInventoryStore();
    const decorStore = useDecorationStore();

    gameStore.player.exp = 0;
    gameStore.player.level = 3;
    invStore.setItemCount('bench_wood', 2);

    const bridgeSpy = vi.spyOn(gameBridge, 'emit');

    const result = decorStore.placeDecoration(1, 'bench_wood');
    expect(result).toBe(true);

    expect(invStore.getItemCount('bench_wood')).toBe(1);
    expect(decorStore.placedDecorations).toHaveLength(1);
    expect(decorStore.getDecorationOnPlot(1)?.decorationId).toBe('bench_wood');
    expect(gameStore.player.exp).toBe(15);
    expect(gameStore.island.unlockedPlacementExpIds).toContain('bench_wood');

    expect(bridgeSpy).toHaveBeenCalledWith('decorations:sync', expect.objectContaining({
      decorations: expect.arrayContaining([expect.objectContaining({ decorationId: 'bench_wood', plotId: 1 })]),
    }));
    expect(bridgeSpy).toHaveBeenCalledWith('action:decorate', {
      plotId: 1,
      decorationId: 'bench_wood',
    });
  });

  it('does NOT award +15 Player EXP again when removing and re-placing the same decoration type', () => {
    const gameStore = useGameStore();
    const invStore = useInventoryStore();
    const decorStore = useDecorationStore();

    gameStore.player.exp = 0;
    gameStore.player.level = 3;
    invStore.setItemCount('bench_wood', 2);

    // First placement: +15 EXP
    decorStore.placeDecoration(1, 'bench_wood');
    expect(gameStore.player.exp).toBe(15);

    // Remove
    decorStore.removeDecoration(1);
    expect(decorStore.getDecorationOnPlot(1)).toBeUndefined();
    expect(gameStore.player.exp).toBe(15);

    // Second placement of same decoration type: 0 additional EXP
    decorStore.placeDecoration(1, 'bench_wood');
    expect(gameStore.player.exp).toBe(15);
  });

  it('rejects placing on occupied plot without replace', () => {
    const invStore = useInventoryStore();
    const decorStore = useDecorationStore();

    invStore.setItemCount('bench_wood', 2);
    expect(decorStore.placeDecoration(1, 'bench_wood')).toBe(true);

    // Attempt to place again on plot 1
    expect(decorStore.placeDecoration(1, 'bench_wood')).toBe(false);
    expect(invStore.getItemCount('bench_wood')).toBe(1);
  });

  it('rejects placing if item is not in inventory', () => {
    const decorStore = useDecorationStore();
    expect(decorStore.placeDecoration(1, 'bench_wood')).toBe(false);
  });

  it('rejects invalid plot IDs', () => {
    const invStore = useInventoryStore();
    const decorStore = useDecorationStore();

    invStore.setItemCount('bench_wood', 2);
    expect(decorStore.placeDecoration(0, 'bench_wood')).toBe(false);
    expect(decorStore.placeDecoration(7, 'bench_wood')).toBe(false);
  });

  it('removes item from Plot 1 (clears plot, returns item to inventory, emits decorations:sync)', () => {
    const invStore = useInventoryStore();
    const decorStore = useDecorationStore();

    invStore.setItemCount('bench_wood', 1);
    decorStore.placeDecoration(1, 'bench_wood');
    expect(invStore.getItemCount('bench_wood')).toBe(0);

    const bridgeSpy = vi.spyOn(gameBridge, 'emit');
    const removed = decorStore.removeDecoration(1);
    expect(removed).toBe(true);

    expect(decorStore.getDecorationOnPlot(1)).toBeUndefined();
    expect(invStore.getItemCount('bench_wood')).toBe(1);
    expect(bridgeSpy).toHaveBeenCalledWith('decorations:sync', { decorations: [] });
  });

  it('replaces item on Plot 1 (returns old item, places new item)', () => {
    const gameStore = useGameStore();
    const invStore = useInventoryStore();
    const decorStore = useDecorationStore();

    gameStore.player.exp = 0;
    invStore.setItemCount('bench_wood', 1);
    invStore.setItemCount('pine_crystal', 1);

    decorStore.placeDecoration(1, 'bench_wood');
    expect(invStore.getItemCount('bench_wood')).toBe(0);
    expect(gameStore.player.exp).toBe(15);

    const replaced = decorStore.replaceDecoration(1, 'pine_crystal');
    expect(replaced).toBe(true);

    expect(invStore.getItemCount('bench_wood')).toBe(1);
    expect(invStore.getItemCount('pine_crystal')).toBe(0);
    expect(decorStore.getDecorationOnPlot(1)?.decorationId).toBe('pine_crystal');
    // pine_crystal is a new decoration type, so it gets +15 EXP
    expect(gameStore.player.exp).toBe(30);
    expect(gameStore.island.unlockedPlacementExpIds).toContain('pine_crystal');
  });

  it('dynamically computes cozyRating and coinDropMultiplier from placed items', () => {
    const invStore = useInventoryStore();
    const decorStore = useDecorationStore();

    invStore.setItemCount('bench_wood', 1);
    invStore.setItemCount('pine_crystal', 1);

    expect(decorStore.cozyRating).toBe(0);
    expect(decorStore.coinDropMultiplier).toBe(1);

    decorStore.placeDecoration(1, 'bench_wood'); // cozyPoints: 10
    expect(decorStore.cozyRating).toBe(10);
    expect(decorStore.coinDropMultiplier).toBe(1.01);

    decorStore.placeDecoration(2, 'pine_crystal'); // cozyPoints: 15 -> total 25
    expect(decorStore.cozyRating).toBe(25);
    expect(decorStore.coinDropMultiplier).toBe(1.02);
  });
});

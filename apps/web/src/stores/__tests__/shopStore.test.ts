import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useShopStore } from '../shopStore';
import { useGameStore } from '../gameStore';
import { useInventoryStore } from '../inventoryStore';
import { gameBridge } from '../../game/bridge/GameBridge';

describe('shopStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('provides available foods, eggs, and decorations lists', () => {
    const shop = useShopStore();
    expect(shop.availableFoods.length).toBe(7);
    expect(shop.availableEggs.length).toBe(3);
    expect(shop.availableDecorations.length).toBe(6);
  });

  it('rejects purchase if quantity <= 0 or not an integer', () => {
    const shop = useShopStore();
    const res1 = shop.buyFood('sardine', 0);
    expect(res1.success).toBe(false);
    expect(res1.reason).toBe('INVALID_QUANTITY');

    const res2 = shop.buyFood('sardine', -5);
    expect(res2.success).toBe(false);
    expect(res2.reason).toBe('INVALID_QUANTITY');
  });

  it('rejects purchase if item is level-locked', async () => {
    const game = useGameStore();
    await game.initGame();
    expect(game.player.level).toBe(1);

    const shop = useShopStore();
    // Krill requires Player Level 2
    const res = shop.buyFood('krill', 1);
    expect(res.success).toBe(false);
    expect(res.reason).toBe('LEVEL_LOCKED');
  });

  it('rejects purchase if player has insufficient coins or gems', async () => {
    const game = useGameStore();
    await game.initGame();
    game.currencies.coins = 10;
    game.currencies.gems = 0;

    const shop = useShopStore();
    // Small sardine costs 15 coins
    const res = shop.buyFood('sardine', 1);
    expect(res.success).toBe(false);
    expect(res.reason).toBe('INSUFFICIENT_FUNDS');
  });

  it('atomicity guarantee: failed purchase produces zero state changes and emits zero events', async () => {
    const game = useGameStore();
    await game.initGame();
    const invStore = useInventoryStore();
    game.currencies.coins = 20;
    const initialCoins = game.currencies.coins;
    const initialGems = game.currencies.gems;
    const initialSardines = invStore.getItemCount('sardine');

    const purchaseSpy = vi.fn();
    gameBridge.on('action:shop_purchase', purchaseSpy);

    const shop = useShopStore();
    // Try to buy 5 sardines (15 * 5 = 75 coins, only have 20)
    const res = shop.buyFood('sardine', 5);
    expect(res.success).toBe(false);
    expect(res.reason).toBe('INSUFFICIENT_FUNDS');

    // Verify zero mutations
    expect(game.currencies.coins).toBe(initialCoins);
    expect(game.currencies.gems).toBe(initialGems);
    expect(invStore.getItemCount('sardine')).toBe(initialSardines);
    expect(purchaseSpy).not.toHaveBeenCalled();
  });

  it('successful food purchase deducts coins, adds item to inventory, and emits action:shop_purchase', async () => {
    const game = useGameStore();
    await game.initGame();
    const invStore = useInventoryStore();
    game.currencies.coins = 100;
    const initialSardines = invStore.getItemCount('sardine');

    const purchaseSpy = vi.fn();
    gameBridge.on('action:shop_purchase', purchaseSpy);

    const shop = useShopStore();
    const res = shop.buyFood('sardine', 2); // 15 * 2 = 30 coins
    expect(res.success).toBe(true);
    expect(game.currencies.coins).toBe(70);
    expect(invStore.getItemCount('sardine')).toBe(initialSardines + 2);
    expect(purchaseSpy).toHaveBeenCalledWith({
      itemId: 'sardine',
      category: 'food',
      quantity: 2,
    });
  });

  it('successful egg purchase with coins & level requirement', async () => {
    const game = useGameStore();
    await game.initGame();
    game.player.level = 4;
    game.currencies.coins = 500;
    const invStore = useInventoryStore();

    const shop = useShopStore();
    // Frozen Egg costs 450 coins, requires level 4
    const res = shop.buyEgg('frozen_egg', 1);
    expect(res.success).toBe(true);
    expect(game.currencies.coins).toBe(50);
    expect(invStore.getItemCount('frozen_egg')).toBe(1);
  });

  it('successful decoration purchase with coins & gems', async () => {
    const game = useGameStore();
    await game.initGame();
    game.player.level = 9;
    game.currencies.coins = 1000;
    game.currencies.gems = 20;
    const invStore = useInventoryStore();

    const shop = useShopStore();
    // lantern_igloo costs 600 coins + 10 gems, requires level 9
    const res = shop.buyDecoration('lantern_igloo', 1);
    expect(res.success).toBe(true);
    expect(game.currencies.coins).toBe(400);
    expect(game.currencies.gems).toBe(10);
    expect(invStore.getItemCount('lantern_igloo')).toBe(1);
  });
});

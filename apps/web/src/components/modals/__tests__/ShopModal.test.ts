// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ShopModal from '../ShopModal.vue';
import { useGameStore } from '../../../stores/gameStore';
import { useShopStore } from '../../../stores/shopStore';

describe('ShopModal.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('renders shop dialog with balance header and category tabs', () => {
    const gameStore = useGameStore();
    gameStore.currencies.coins = 500;
    gameStore.currencies.gems = 15;

    const wrapper = mount(ShopModal);

    expect(wrapper.find('[data-testid="shop-coin-balance"]').text()).toContain('500');
    expect(wrapper.find('[data-testid="shop-gem-balance"]').text()).toContain('15');
    expect(wrapper.find('[data-testid="tab-food"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="tab-eggs"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="tab-decorations"]').exists()).toBe(true);
  });

  it('switches tabs and displays items corresponding to active category', async () => {
    const wrapper = mount(ShopModal);

    // Default tab is food
    expect(wrapper.find('[data-testid="shop-item-sardine"]').exists()).toBe(true);

    // Switch to eggs tab
    await wrapper.find('[data-testid="tab-eggs"]').trigger('click');
    expect(wrapper.find('[data-testid="shop-item-basic_egg"]').exists()).toBe(true);

    // Switch to decorations tab
    await wrapper.find('[data-testid="tab-decorations"]').trigger('click');
    expect(wrapper.find('[data-testid="shop-item-bench_wood"]').exists()).toBe(true);
  });

  it('disables buy button and shows locked badge when player level is insufficient', async () => {
    const gameStore = useGameStore();
    gameStore.player.level = 1; // squid requires level 4
    gameStore.currencies.coins = 1000;

    const wrapper = mount(ShopModal);

    const squidCard = wrapper.find('[data-testid="shop-item-squid"]');
    expect(squidCard.classes()).toContain('shop-card--locked');
    expect(squidCard.text()).toContain('Yêu cầu Lv. 4');

    const buyBtn = wrapper.find('[data-testid="btn-buy-squid"]');
    expect(buyBtn.attributes('disabled')).toBeDefined();
  });

  it('calls shopStore.buyFood when clicking buy button for food item', async () => {
    const gameStore = useGameStore();
    const shopStore = useShopStore();
    gameStore.player.level = 2;
    gameStore.currencies.coins = 500;

    const buySpy = vi.spyOn(shopStore, 'buyFood').mockReturnValue(true);

    const wrapper = mount(ShopModal);
    await wrapper.find('[data-testid="btn-buy-sardine"]').trigger('click');

    expect(buySpy).toHaveBeenCalledWith('sardine', 1);
  });

  it('emits close event when clicking close button', async () => {
    const wrapper = mount(ShopModal);
    await wrapper.find('[data-testid="modal-close-btn"]').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});

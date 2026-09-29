// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import InventoryModal from '../InventoryModal.vue';
import { useGameStore } from '../../../stores/gameStore';
import { useInventoryStore } from '../../../stores/inventoryStore';

describe('InventoryModal.vue', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const game = useGameStore();
    await game.initGame();
  });

  it('renders tab buttons: Trứng (eggs), Thức Ăn (food), Tất Cả (all)', () => {
    const wrapper = mount(InventoryModal);

    expect(wrapper.find('[data-testid="tab-all"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="tab-eggs"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="tab-food"]').exists()).toBe(true);
  });

  it('filters items correctly when switching tabs', async () => {
    const invStore = useInventoryStore();
    invStore.setItems([
      { itemId: 'basic_egg', category: 'eggs', name: 'Basic Egg', description: 'Trứng cơ bản', quantity: 2, stackable: true },
      { itemId: 'sardine', category: 'food', name: 'Small Sardine', description: 'Cá mòi nhỏ', quantity: 15, stackable: true },
    ]);

    const wrapper = mount(InventoryModal);

    // Default 'all' tab shows both
    expect(wrapper.findAll('[data-testid^="inventory-item-"]').length).toBe(2);

    // Switch to 'eggs'
    await wrapper.find('[data-testid="tab-eggs"]').trigger('click');
    expect(wrapper.findAll('[data-testid^="inventory-item-"]').length).toBe(1);
    expect(wrapper.find('[data-testid="inventory-item-basic_egg"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="inventory-item-sardine"]').exists()).toBe(false);

    // Switch to 'food'
    await wrapper.find('[data-testid="tab-food"]').trigger('click');
    expect(wrapper.findAll('[data-testid^="inventory-item-"]').length).toBe(1);
    expect(wrapper.find('[data-testid="inventory-item-sardine"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="inventory-item-basic_egg"]').exists()).toBe(false);
  });

  it('renders egg items as inventory items without incubation placement actions', async () => {
    const invStore = useInventoryStore();
    invStore.setItems([
      { itemId: 'basic_egg', category: 'eggs', name: 'Basic Egg', description: 'Trứng cơ bản', quantity: 3, stackable: true },
    ]);

    const wrapper = mount(InventoryModal);
    await wrapper.find('[data-testid="tab-eggs"]').trigger('click');

    expect(wrapper.find('[data-testid="inventory-item-basic_egg"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Basic Egg');
    expect(wrapper.text()).toContain('x3');
    // Ensure no incubation trigger exists
    expect(wrapper.find('[data-testid="action-place-egg-basic_egg"]').exists()).toBe(false);
  });

  it('feeds penguin when "Cho Ăn" is clicked on fish item', async () => {
    const game = useGameStore();
    const invStore = useInventoryStore();
    invStore.setItems([
      { itemId: 'sardine', category: 'food', name: 'Small Sardine', description: 'Cá mòi', quantity: 5, stackable: true },
    ]);

    const feedSpy = vi.spyOn(game, 'feedPenguin');

    const wrapper = mount(InventoryModal);
    await wrapper.find('[data-testid="tab-food"]').trigger('click');

    const feedBtn = wrapper.find('[data-testid="action-feed-fish-sardine"]');
    expect(feedBtn.exists()).toBe(true);
    await feedBtn.trigger('click');

    expect(feedSpy).toHaveBeenCalled();
  });

  it('displays out-of-fish feedback toast when fish count is 0', async () => {
    const invStore = useInventoryStore();
    invStore.setItems([
      { itemId: 'sardine', category: 'food', name: 'Small Sardine', description: 'Cá mòi', quantity: 0, stackable: true },
    ]);

    const wrapper = mount(InventoryModal);
    await wrapper.find('[data-testid="tab-food"]').trigger('click');

    const feedBtn = wrapper.find('[data-testid="action-feed-fish-sardine"]');
    await feedBtn.trigger('click');

    expect(wrapper.text()).toContain('Hết cá rồi! Hãy kiếm thêm cá nhé.');
  });

  it('emits close event when close button or backdrop is clicked', async () => {
    const wrapper = mount(InventoryModal);

    const closeBtn = wrapper.find('[data-testid="modal-close-btn"]');
    await closeBtn.trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });
});

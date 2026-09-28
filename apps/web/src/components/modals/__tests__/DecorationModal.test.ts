// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import DecorationModal from '../DecorationModal.vue';
import { useGameStore } from '../../../stores/gameStore';
import { useDecorationStore } from '../../../stores/decorationStore';
import { useInventoryStore } from '../../../stores/inventoryStore';

describe('DecorationModal.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('renders 6 anchor plot buttons and cozy rating badge', () => {
    const wrapper = mount(DecorationModal);

    expect(wrapper.find('[data-testid="decor-cozy-rating"]').exists()).toBe(true);
    for (let i = 1; i <= 6; i++) {
      expect(wrapper.find(`[data-testid="plot-btn-${i}"]`).exists()).toBe(true);
    }
  });

  it('shows empty plot view and inventory placement options when selecting an empty plot', async () => {
    const invStore = useInventoryStore();
    invStore.addItem({
      itemId: 'bench_wood',
      category: 'decorations',
      name: 'Ghế Gỗ Sưởi Ấm',
      description: 'Ghế gỗ',
      quantity: 1,
      stackable: true,
    });

    const wrapper = mount(DecorationModal, {
      props: { initialPlotId: 1 },
    });

    expect(wrapper.find('[data-testid="plot-empty-view"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="inv-decor-bench_wood"]').exists()).toBe(true);
  });

  it('calls decorStore.placeDecoration when placing an item on an empty plot', async () => {
    const invStore = useInventoryStore();
    const decorStore = useDecorationStore();
    invStore.addItem({
      itemId: 'bench_wood',
      category: 'decorations',
      name: 'Ghế Gỗ Sưởi Ấm',
      description: 'Ghế gỗ',
      quantity: 1,
      stackable: true,
    });

    const placeSpy = vi.spyOn(decorStore, 'placeDecoration').mockReturnValue(true);

    const wrapper = mount(DecorationModal, {
      props: { initialPlotId: 1 },
    });

    await wrapper.find('[data-testid="btn-place-bench_wood"]').trigger('click');

    expect(placeSpy).toHaveBeenCalledWith(1, 'bench_wood');
  });

  it('shows occupied plot view and removes decoration when clicking remove button', async () => {
    const gameStore = useGameStore();
    const decorStore = useDecorationStore();
    gameStore.island.decorations = [
      { instanceId: 'd1', decorationId: 'bench_wood', plotId: 2, placedAt: 1000 },
    ];

    const removeSpy = vi.spyOn(decorStore, 'removeDecoration').mockReturnValue(true);

    const wrapper = mount(DecorationModal, {
      props: { initialPlotId: 2 },
    });

    expect(wrapper.find('[data-testid="plot-occupied-view"]').exists()).toBe(true);
    await wrapper.find('[data-testid="btn-remove-decor"]').trigger('click');

    expect(removeSpy).toHaveBeenCalledWith(2);
  });

  it('emits close event when clicking close button', async () => {
    const wrapper = mount(DecorationModal);
    await wrapper.find('[data-testid="modal-close-btn"]').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});

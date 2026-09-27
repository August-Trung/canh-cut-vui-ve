// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import CollectionModal from '../CollectionModal.vue';
import { useCollectionStore } from '../../../stores/collectionStore';
import { SPECIES_LIST } from '@penguin/game-data';

describe('CollectionModal.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders progress counter with total species count', () => {
    const colStore = useCollectionStore();
    colStore.setDiscovered([
      { speciesId: 'snowy', discoveredAt: Date.now() },
      { speciesId: 'happy', discoveredAt: Date.now() },
    ]);

    const wrapper = mount(CollectionModal);

    // Should display 2 / 5
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('5');
    expect(wrapper.text()).toContain('Đã Thu Thập');
  });

  it('displays all 5 species cards in the encyclopedia grid', () => {
    const wrapper = mount(CollectionModal);
    const cards = wrapper.findAll('[data-testid^="species-card-"]');

    expect(cards.length).toBe(SPECIES_LIST.length);
    expect(cards.length).toBe(5);
  });

  it('shows rich illustration and stats for discovered species', () => {
    const colStore = useCollectionStore();
    colStore.setDiscovered([
      { speciesId: 'snowy', discoveredAt: 1700000000000 },
    ]);

    const wrapper = mount(CollectionModal);
    const snowyCard = wrapper.find('[data-testid="species-card-snowy"]');

    expect(snowyCard.exists()).toBe(true);
    expect(snowyCard.classes()).toContain('is-discovered');
    expect(snowyCard.text()).toContain('Snowy');
    expect(snowyCard.text()).toContain('001');
  });

  it('shows silhouette with question mark and clue text for undiscovered species', () => {
    const colStore = useCollectionStore();
    colStore.setDiscovered([
      { speciesId: 'snowy', discoveredAt: Date.now() },
    ]);

    const wrapper = mount(CollectionModal);
    const sleepyCard = wrapper.find('[data-testid="species-card-sleepy"]');

    expect(sleepyCard.exists()).toBe(true);
    expect(sleepyCard.classes()).toContain('is-undiscovered');
    expect(sleepyCard.text()).toContain('???');
    expect(sleepyCard.text()).toContain('002');
  });

  it('displays full details when a species card is selected', async () => {
    const colStore = useCollectionStore();
    colStore.setDiscovered([
      { speciesId: 'snowy', discoveredAt: 1700000000000 },
    ]);

    const wrapper = mount(CollectionModal);

    // Select Snowy
    await wrapper.find('[data-testid="species-card-snowy"]').trigger('click');

    const detailPanel = wrapper.find('[data-testid="species-detail"]');
    expect(detailPanel.exists()).toBe(true);
    expect(detailPanel.text()).toContain('Snowy');
    expect(detailPanel.text()).toContain('Chilly Feet');
    expect(detailPanel.text()).toContain('Small Sardine');

    // Select undiscovered Sleepy
    await wrapper.find('[data-testid="species-card-sleepy"]').trigger('click');
    expect(detailPanel.text()).toContain('Chưa phát hiện');
    expect(detailPanel.text()).toContain('dozing near the warm camp lanterns');
  });

  it('emits close event when close button or backdrop is clicked', async () => {
    const wrapper = mount(CollectionModal);

    const closeBtn = wrapper.find('[data-testid="modal-close-btn"]');
    await closeBtn.trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();

    const backdrop = wrapper.find('[data-testid="modal-backdrop"]');
    await backdrop.trigger('click');
    expect(wrapper.emitted('close')?.length).toBe(2);
  });
});

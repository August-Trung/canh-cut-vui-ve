// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import App from '../App.vue';
import { useGameStore } from '../stores/gameStore';

vi.mock('../components/canvas/IslandCanvas.vue', () => ({
  default: {
    name: 'IslandCanvas',
    template: '<div id="mock-island-canvas"></div>',
  },
}));

describe('App Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('mounts and initializes gameStore on mounted', async () => {
    const game = useGameStore();
    const initSpy = vi.spyOn(game, 'initGame').mockResolvedValue();

    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    expect(initSpy).toHaveBeenCalled();
  });

  it('renders top HUD, canvas mock, and bottom dock elements', () => {
    const wrapper = mount(App);

    expect(wrapper.find('#mock-island-canvas').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'TopBar' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'ShelfRack' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'NeighborStrip' }).exists()).toBe(true);
  });

  it('opens modals via ShelfRack events', async () => {
    const wrapper = mount(App);
    const shelfRack = wrapper.findComponent({ name: 'ShelfRack' });

    const vm = wrapper.vm as unknown as { activeModal: string | null };

    await shelfRack.vm.$emit('open-inventory');
    expect(vm.activeModal).toBe('inventory');

    await shelfRack.vm.$emit('open-collection');
    expect(vm.activeModal).toBe('collection');

    await shelfRack.vm.$emit('open-hatchery');
    expect(vm.activeModal).toBe('hatchery');

    await shelfRack.vm.$emit('open-settings');
    expect(vm.activeModal).toBe('settings');
  });
});

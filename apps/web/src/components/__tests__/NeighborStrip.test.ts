// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import NeighborStrip from '../dock/NeighborStrip.vue';

describe('NeighborStrip Component', () => {
  it('explicitly displays simulated NPC indicator', () => {
    const wrapper = mount(NeighborStrip);
    expect(wrapper.text()).toContain('NPC Mô Phỏng');
  });

  it('renders all friendly simulated NPC neighbor cards', () => {
    const wrapper = mount(NeighborStrip);
    expect(wrapper.text()).toContain('Bác Gấu Tuyết');
    expect(wrapper.text()).toContain('Cánh Cụt Bé Nhỏ');
    expect(wrapper.text()).toContain('Đội Thám Hiểm Băng');
    expect(wrapper.text()).toContain('Thợ May Khăn Ấm');
  });

  it('triggers response feedback toast when wave button is clicked', async () => {
    vi.useFakeTimers();
    const wrapper = mount(NeighborStrip);

    const waveBtn = wrapper.find('[data-testid="wave-btn-npc-bear"]');
    expect(waveBtn.exists()).toBe(true);

    await waveBtn.trigger('click');
    expect(wrapper.text()).toContain('Bác Gấu Tuyết mỉm cười');

    vi.runAllTimers();
    await wrapper.vm.$nextTick();

    vi.useRealTimers();
  });
});

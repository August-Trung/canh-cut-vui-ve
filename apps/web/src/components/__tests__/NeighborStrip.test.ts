// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import NeighborStrip from '../dock/NeighborStrip.vue';

interface NeighborData {
  id: string;
  name: string;
  role?: string;
  level: number;
  status?: string;
  avatarIcon: string;
  avatarBg?: string;
  response?: string;
}

describe('NeighborStrip Component', () => {
  it('displays authentic neighbor strip badge without fake NPC simulation indicators', () => {
    const wrapper = mount(NeighborStrip);
    expect(wrapper.text()).toContain('Hàng Xóm Đảo Băng');
    expect(wrapper.text()).not.toContain('NPC Mô Phỏng');
  });

  it('renders truthful empty state when no neighbors exist', () => {
    const wrapper = mount(NeighborStrip);
    const emptyState = wrapper.find('[data-testid="neighbor-empty-state"]');
    expect(emptyState.exists()).toBe(true);
    expect(emptyState.text()).toContain('Chưa có hàng xóm');
    // Absolute rule: No invented NPCs
    expect(wrapper.text()).not.toContain('Bác Gấu Tuyết');
    expect(wrapper.text()).not.toContain('Cánh Cụt Bé Nhỏ');
    expect(wrapper.text()).not.toContain('Đội Thám Hiểm Băng');
    expect(wrapper.text()).not.toContain('Thợ May Khăn Ấm');
  });

  it('renders real neighbor cards when passed via props', async () => {
    const realNeighbors: NeighborData[] = [
      {
        id: 'friend-1',
        name: 'Minh Tuấn',
        level: 5,
        status: 'Đang online',
        avatarIcon: 'crown',
        response: 'Minh Tuấn vẫy tay chào bạn!',
      },
    ];

    const wrapper = mount(NeighborStrip, {
      props: {
        neighbors: realNeighbors,
      },
    });

    expect(wrapper.text()).toContain('Minh Tuấn');
    expect(wrapper.find('[data-testid="neighbor-empty-state"]').exists()).toBe(false);
  });

  it('triggers response feedback toast when wave button is clicked on a neighbor card', async () => {
    vi.useFakeTimers();
    const testNeighbor: NeighborData = {
      id: 'neighbor-test',
      name: 'Bạn Băng',
      level: 3,
      avatarIcon: 'fish',
      response: 'Bạn Băng mỉm cười gật đầu chào bạn!',
    };

    const wrapper = mount(NeighborStrip, {
      props: {
        neighbors: [testNeighbor],
      },
    });

    const waveBtn = wrapper.find('[data-testid="wave-btn-neighbor-test"]');
    expect(waveBtn.exists()).toBe(true);

    await waveBtn.trigger('click');
    expect(wrapper.text()).toContain('Bạn Băng mỉm cười gật đầu chào bạn!');

    vi.runAllTimers();
    await wrapper.vm.$nextTick();

    vi.useRealTimers();
  });

  it('cleans up toastTimer when unmounted', async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const wrapper = mount(NeighborStrip, {
      props: {
        neighbors: [
          {
            id: 'n1',
            name: 'Bạn Test',
            level: 1,
            avatarIcon: 'star',
          },
        ],
      },
    });
    const waveBtn = wrapper.find('[data-testid="wave-btn-n1"]');
    await waveBtn.trigger('click');

    wrapper.unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
    vi.useRealTimers();
  });
});

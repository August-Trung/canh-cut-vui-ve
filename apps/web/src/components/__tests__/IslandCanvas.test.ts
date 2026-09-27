// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import IslandCanvas from '../canvas/IslandCanvas.vue';
import Phaser from 'phaser';
import { getPhaserConfig } from '../../game/PhaserConfig';

const mockDestroy = vi.fn();

vi.mock('../../game/PhaserConfig', () => ({
  getPhaserConfig: vi.fn().mockReturnValue({ test: true }),
}));

vi.mock('phaser', () => {
  return {
    default: {
      Game: vi.fn().mockImplementation(() => ({
        destroy: mockDestroy,
      })),
      Scene: class MockScene {},
      AUTO: 0,
      Scale: {
        RESIZE: 'RESIZE',
        CENTER_BOTH: 'CENTER_BOTH',
      },
    },
  };
});

describe('IslandCanvas Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders canvas container with correct id', () => {
    const wrapper = mount(IslandCanvas);
    expect(wrapper.find('#island-canvas').exists()).toBe(true);
  });

  it('instantiates Phaser.Game on mounted and cleans up on unmounted', () => {
    const wrapper = mount(IslandCanvas);
    expect(getPhaserConfig).toHaveBeenCalledWith('island-canvas');
    expect(Phaser.Game).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    expect(mockDestroy).toHaveBeenCalledWith(true);
  });
});

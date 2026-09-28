// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import LevelUpModal from '../LevelUpModal.vue';
import { soundService } from '../../../services/SoundService';

describe('LevelUpModal.vue', () => {
  it('displays the new level and plays level up sound on mount', () => {
    const soundSpy = vi.spyOn(soundService, 'playLevelUp');

    const wrapper = mount(LevelUpModal, {
      props: { newLevel: 5 },
    });

    expect(wrapper.find('[data-testid="levelup-level-display"]').text()).toContain('Lv. 5');
    expect(soundSpy).toHaveBeenCalled();
  });

  it('emits close when clicking the celebrate button', async () => {
    const wrapper = mount(LevelUpModal, {
      props: { newLevel: 2 },
    });

    await wrapper.find('[data-testid="btn-levelup-confirm"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits close when clicking backdrop', async () => {
    const wrapper = mount(LevelUpModal, {
      props: { newLevel: 3 },
    });

    await wrapper.find('[data-testid="levelup-modal-backdrop"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });
});

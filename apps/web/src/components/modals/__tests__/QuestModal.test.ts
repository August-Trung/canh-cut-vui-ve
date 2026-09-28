// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import QuestModal from '../QuestModal.vue';
import { useGameStore } from '../../../stores/gameStore';
import { useQuestStore } from '../../../stores/questStore';

describe('QuestModal.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('renders daily login streak calendar and active quests', () => {
    const gameStore = useGameStore();
    gameStore.dailyLogin = { lastClaimDate: null, currentStreak: 2 };
    gameStore.questState = {
      assignedDate: '2026-09-28',
      quests: [
        { questId: 'quest_pet', currentCount: 2, targetCount: 5, isCompleted: false, isClaimed: false },
      ],
    };

    const wrapper = mount(QuestModal);

    expect(wrapper.find('[data-testid="section-daily-login"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="streak-count"]').text()).toContain('2 ngày');
    expect(wrapper.find('[data-testid="section-daily-quests"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="quest-card-quest_pet"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="quest-progress-quest_pet"]').text()).toContain('2 / 5');
  });

  it('calls questStore.claimDailyLogin when clicking daily login button', async () => {
    const questStore = useQuestStore();
    const claimSpy = vi.spyOn(questStore, 'claimDailyLogin').mockReturnValue(true);

    const wrapper = mount(QuestModal);
    await wrapper.find('[data-testid="btn-claim-daily-login"]').trigger('click');

    expect(claimSpy).toHaveBeenCalled();
  });

  it('calls questStore.claimQuestReward when clicking claim button on completed quest', async () => {
    const gameStore = useGameStore();
    const questStore = useQuestStore();
    gameStore.questState = {
      assignedDate: '2026-09-28',
      quests: [
        { questId: 'quest_pet', currentCount: 5, targetCount: 5, isCompleted: true, isClaimed: false },
      ],
    };

    const claimSpy = vi.spyOn(questStore, 'claimQuestReward').mockReturnValue(true);

    const wrapper = mount(QuestModal);
    const claimBtn = wrapper.find('[data-testid="btn-claim-quest-quest_pet"]');
    expect(claimBtn.attributes('disabled')).toBeUndefined();
    await claimBtn.trigger('click');

    expect(claimSpy).toHaveBeenCalledWith('quest_pet');
  });

  it('emits close event when clicking close button', async () => {
    const wrapper = mount(QuestModal);
    await wrapper.find('[data-testid="modal-close-btn"]').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});

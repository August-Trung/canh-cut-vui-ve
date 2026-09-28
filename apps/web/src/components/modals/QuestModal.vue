<template>
  <div
    class="modal-backdrop"
    data-testid="quest-modal-backdrop"
    @pointerdown.stop
    @pointerup.stop
    @mousedown.stop
    @mouseup.stop
    @click.self.stop="emit('close')"
  >
    <div
      class="quest-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Nhiệm Vụ & Điểm Danh Hàng Ngày"
      @pointerdown.stop
      @pointerup.stop
      @mousedown.stop
      @mouseup.stop
      @click.stop
    >
      <!-- Modal Header -->
      <div class="quest-header">
        <div class="quest-header__title-group">
          <span class="quest-header__icon">📜</span>
          <div>
            <h2 class="quest-header__title">Nhiệm Vụ & Điểm Danh</h2>
            <p class="quest-header__sub">Đăng nhập mỗi ngày và hoàn thành nhiệm vụ để nhận quà khủng!</p>
          </div>
        </div>

        <button
          type="button"
          class="modal-close-btn"
          data-testid="modal-close-btn"
          aria-label="Đóng"
          @pointerdown.stop
          @pointerup.stop
          @mousedown.stop
          @mouseup.stop
          @click.stop="emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="quest-body">
        <!-- 1. Daily Login Streak Section -->
        <section class="section-login" data-testid="section-daily-login">
          <div class="section-title-wrap">
            <h3 class="section-title">📅 Chuỗi Điểm Danh 7 Ngày</h3>
            <span class="streak-badge" data-testid="streak-count">
              Chuỗi hiện tại: {{ gameStore.dailyLogin.currentStreak }} ngày
            </span>
          </div>

          <div class="streak-grid">
            <div
              v-for="reward in streakRewards"
              :key="reward.day"
              class="streak-day-card"
              :class="{
                'streak-day-card--claimed': isDayClaimed(reward.day),
                'streak-day-card--today': isDayReadyToClaim(reward.day),
              }"
              :data-testid="`streak-day-${reward.day}`"
            >
              <div class="day-num">Ngày {{ reward.day }}</div>
              <div class="day-icon">{{ getDayRewardIcon(reward.day) }}</div>
              <div class="day-desc">{{ reward.description }}</div>
              <div class="day-status">
                <span v-if="isDayClaimed(reward.day)" class="status-claimed">✓ Đã Nhận</span>
                <span v-else-if="isDayReadyToClaim(reward.day)" class="status-ready">Nhận Ngay!</span>
                <span v-else class="status-locked">🔒 Chưa Đến</span>
              </div>
            </div>
          </div>

          <div class="login-action-wrap">
            <button
              type="button"
              class="btn-claim-daily"
              :disabled="!questStore.canClaimDailyLogin"
              data-testid="btn-claim-daily-login"
              @click="claimDailyLogin"
            >
              {{ questStore.canClaimDailyLogin ? '🎁 Điểm Danh Nhận Thưởng Ngay' : '✓ Hôm Nay Đã Điểm Danh' }}
            </button>
          </div>
        </section>

        <!-- 2. Daily Quests Section -->
        <section class="section-quests" data-testid="section-daily-quests">
          <div class="section-title-wrap">
            <h3 class="section-title">🎯 Nhiệm Vụ Hôm Nay</h3>
            <span class="quest-date-badge">{{ gameStore.questState.assignedDate }}</span>
          </div>

          <div class="quests-list">
            <div
              v-for="quest in activeQuestsWithTemplate"
              :key="quest.questId"
              class="quest-card"
              :class="{
                'quest-card--completed': quest.isCompleted,
                'quest-card--claimed': quest.isClaimed,
              }"
              :data-testid="`quest-card-${quest.questId}`"
            >
              <div class="quest-card__icon">{{ quest.template.icon }}</div>

              <div class="quest-card__content">
                <div class="quest-card__title">{{ quest.template.title }}</div>
                <div class="quest-card__desc">{{ quest.template.description }}</div>

                <!-- Progress Bar -->
                <div class="progress-wrap">
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      :style="{ width: `${Math.min(100, (quest.currentCount / quest.targetCount) * 100)}%` }"
                    ></div>
                  </div>
                  <span class="progress-label" :data-testid="`quest-progress-${quest.questId}`">
                    {{ quest.currentCount }} / {{ quest.targetCount }}
                  </span>
                </div>
              </div>

              <!-- Rewards & Action -->
              <div class="quest-card__right">
                <div class="reward-preview">
                  <span class="reward-tag">🪙 +{{ quest.template.rewardCoins }}</span>
                  <span class="reward-tag reward-tag--exp">⭐ +{{ quest.template.rewardExp }} EXP</span>
                  <span v-if="quest.template.rewardGems" class="reward-tag reward-tag--gem">💎 +{{ quest.template.rewardGems }}</span>
                </div>

                <button
                  type="button"
                  class="btn-quest-claim"
                  :disabled="!quest.isCompleted || quest.isClaimed"
                  :data-testid="`btn-claim-quest-${quest.questId}`"
                  @click="claimQuest(quest.questId)"
                >
                  <template v-if="quest.isClaimed">Đã Nhận</template>
                  <template v-else-if="quest.isCompleted">Nhận Quà</template>
                  <template v-else>Chưa Xong</template>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { QUEST_POOL } from '@penguin/game-data';
import { LOGIN_STREAK_REWARDS } from '../../services/QuestService';
import { useGameStore } from '../../stores/gameStore';
import { useQuestStore } from '../../stores/questStore';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const gameStore = useGameStore();
const questStore = useQuestStore();

const streakRewards = LOGIN_STREAK_REWARDS;

const activeQuestsWithTemplate = computed(() => {
  return questStore.activeQuests.map((q) => {
    const template = QUEST_POOL.find((t) => t.id === q.questId) || {
      id: q.questId,
      title: 'Nhiệm Vụ',
      description: '',
      icon: '⭐',
      targetType: 'pet' as const,
      targetCount: q.targetCount,
      rewardCoins: 50,
      rewardExp: 25,
    };
    return {
      ...q,
      template,
    };
  });
});

function isDayClaimed(day: number): boolean {
  if (questStore.canClaimDailyLogin) {
    return day < (gameStore.dailyLogin.currentStreak + 1);
  }
  return day <= gameStore.dailyLogin.currentStreak;
}

function isDayReadyToClaim(day: number): boolean {
  if (!questStore.canClaimDailyLogin) return false;
  const nextStreak = gameStore.dailyLogin.currentStreak >= 7 ? 1 : gameStore.dailyLogin.currentStreak + 1;
  return day === nextStreak;
}

function getDayRewardIcon(day: number): string {
  switch (day) {
    case 1:
      return '🐟';
    case 2:
      return '🥚';
    case 3:
      return '🦐';
    case 4:
      return '💎';
    case 5:
      return '❄️';
    case 6:
      return '🦑';
    case 7:
      return '👑';
    default:
      return '🎁';
  }
}

function claimDailyLogin() {
  questStore.claimDailyLogin();
}

function claimQuest(questId: string) {
  questStore.claimQuestReward(questId);
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.2s ease-out;
}

.quest-dialog {
  background: #ffffff;
  border-radius: 24px;
  width: 100%;
  max-width: 760px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.25s ease-out;
}

.quest-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #fef3c7 0%, #e0f2fe 100%);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quest-header__title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quest-header__icon {
  font-size: 2.2rem;
}

.quest-header__title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.quest-header__sub {
  margin: 2px 0 0 0;
  font-size: 0.85rem;
  color: #64748b;
}

.modal-close-btn {
  background: rgba(255, 255, 255, 0.8);
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.modal-close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.quest-body {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.streak-badge {
  background: #fef3c7;
  color: #92400e;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid #fde68a;
}

.quest-date-badge {
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
}

.streak-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}

@media (max-width: 680px) {
  .streak-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.streak-day-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 10px 6px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: transform 0.15s;
}

.streak-day-card--today {
  border-color: #f59e0b;
  background: #fffbeb;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2);
}

.streak-day-card--claimed {
  background: #f1f5f9;
  opacity: 0.85;
}

.day-num {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
}

.day-icon {
  font-size: 1.5rem;
}

.day-desc {
  font-size: 0.65rem;
  color: #334155;
  font-weight: 600;
  line-height: 1.2;
  min-height: 26px;
}

.status-claimed {
  font-size: 0.65rem;
  color: #16a34a;
  font-weight: 700;
}

.status-ready {
  font-size: 0.65rem;
  color: #d97706;
  font-weight: 800;
}

.status-locked {
  font-size: 0.65rem;
  color: #94a3b8;
}

.login-action-wrap {
  display: flex;
  justify-content: center;
}

.btn-claim-daily {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
  border: none;
  border-radius: 14px;
  padding: 10px 24px;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25);
  transition: all 0.15s;
}

.btn-claim-daily:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(217, 119, 6, 0.35);
}

.btn-claim-daily:disabled {
  background: #cbd5e1;
  color: #64748b;
  cursor: not-allowed;
  box-shadow: none;
}

.quests-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quest-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.15s;
}

.quest-card--completed {
  border-color: #86efac;
  background: #f0fdf4;
}

.quest-card--claimed {
  opacity: 0.75;
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.quest-card__icon {
  font-size: 2rem;
}

.quest-card__content {
  flex: 1;
}

.quest-card__title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.quest-card__desc {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 6px;
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #0284c7;
  border-radius: 4px;
  transition: width 0.3s ease-out;
}

.quest-card--completed .progress-fill {
  background: #16a34a;
}

.progress-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  min-width: 40px;
  text-align: right;
}

.quest-card__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.reward-preview {
  display: flex;
  gap: 4px;
}

.reward-tag {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  background: #fef9c3;
  color: #854d0e;
}

.reward-tag--exp {
  background: #e0f2fe;
  color: #0369a1;
}

.reward-tag--gem {
  background: #ede9fe;
  color: #6b21a8;
}

.btn-quest-claim {
  background: #16a34a;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 6px 14px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-quest-claim:hover:not(:disabled) {
  background: #15803d;
}

.btn-quest-claim:disabled {
  background: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>

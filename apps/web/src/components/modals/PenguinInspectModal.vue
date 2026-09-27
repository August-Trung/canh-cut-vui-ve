<template>
  <div class="modal-backdrop" data-testid="modal-backdrop" @click.self="emit('close')">
    <div class="inspect-dialog" role="dialog" aria-modal="true" aria-label="Thông Tin Chim Cánh Cụt">
      <!-- Modal Close Button -->
      <button
        type="button"
        class="modal-close-btn"
        data-testid="modal-close-btn"
        aria-label="Đóng"
        @click="emit('close')"
      >
        ✕
      </button>

      <!-- Feedback Toast Notification -->
      <transition name="toast-fade">
        <div v-if="feedbackMessage" class="feedback-toast" :class="`feedback-toast--${feedbackType}`">
          {{ feedbackMessage }}
        </div>
      </transition>

      <template v-if="penguin">
        <!-- Penguin Header / Avatar -->
        <div class="inspect-header">
          <div class="inspect-avatar-wrap">
            <svg viewBox="0 0 48 48" class="inspect-avatar-svg">
              <ellipse cx="24" cy="26" rx="16" ry="18" :fill="speciesColor" />
              <ellipse cx="24" cy="28" rx="10" ry="13" fill="#FFFFFF" />
              <circle cx="17" cy="23" r="2.5" fill="#FDA4AF" opacity="0.8" />
              <circle cx="31" cy="23" r="2.5" fill="#FDA4AF" opacity="0.8" />
              <circle cx="19" cy="19" r="2" fill="#0F172A" />
              <circle cx="29" cy="19" r="2" fill="#0F172A" />
              <polygon points="24,21 21,24 27,24" fill="#F59E0B" />
              <ellipse cx="19" cy="43" rx="4" ry="2" fill="#F59E0B" />
              <ellipse cx="29" cy="43" rx="4" ry="2" fill="#F59E0B" />
            </svg>
          </div>

          <div class="inspect-title-wrap">
            <h3 class="inspect-nickname" data-testid="inspect-nickname">{{ penguin.nickname }}</h3>
            <div class="inspect-sub">
              <span class="inspect-species" data-testid="inspect-species">{{ speciesName }}</span>
              <span class="level-tag">Lv. {{ penguin.level }}</span>
            </div>
            <span class="mood-badge" data-testid="inspect-mood">
              {{ getMoodIcon(penguin.mood) }} {{ penguin.mood }}
            </span>
          </div>
        </div>

        <!-- Vital Bars (Happiness & Hunger) -->
        <div class="vitals-section">
          <!-- Happiness Bar -->
          <div class="vital-row">
            <div class="vital-label-wrap">
              <span class="vital-name">💖 Vui Vẻ:</span>
              <span class="vital-value">{{ penguin.happiness }}/100</span>
            </div>
            <div
              class="bar-track"
              role="progressbar"
              :aria-valuenow="penguin.happiness"
              aria-valuemin="0"
              aria-valuemax="100"
              data-testid="bar-happiness"
            >
              <div
                class="bar-fill bar-fill--happiness"
                :style="{ width: `${penguin.happiness}%` }"
              ></div>
            </div>
          </div>

          <!-- Hunger Bar -->
          <div class="vital-row">
            <div class="vital-label-wrap">
              <span class="vital-name">🐟 Đói Bụng:</span>
              <span class="vital-value">{{ penguin.hunger }}/100</span>
            </div>
            <div
              class="bar-track"
              role="progressbar"
              :aria-valuenow="penguin.hunger"
              aria-valuemin="0"
              aria-valuemax="100"
              data-testid="bar-hunger"
            >
              <div
                class="bar-fill bar-fill--hunger"
                :style="{ width: `${penguin.hunger}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Quick Interaction Actions -->
        <div class="actions-grid">
          <button
            type="button"
            class="btn-interact btn-interact--pet"
            data-testid="btn-action-pet"
            @click="handlePet"
          >
            <span class="btn-emoji">✋</span>
            <div class="btn-text-wrap">
              <span class="btn-main-text">Vuốt Ve</span>
              <span class="btn-sub-text">+5 Vui Vẻ</span>
            </div>
          </button>

          <button
            type="button"
            class="btn-interact btn-interact--feed"
            data-testid="btn-action-feed"
            @click="handleFeed"
          >
            <span class="btn-emoji">🐟</span>
            <div class="btn-text-wrap">
              <span class="btn-main-text">Cho Ăn Cá</span>
              <span class="btn-sub-text">-1 Cá (+15 Vui Vẻ)</span>
            </div>
          </button>
        </div>
      </template>

      <div v-else class="not-found-state">
        <p>Không tìm thấy thông tin chim cánh cụt.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { SPECIES_MAP } from '@penguin/game-data';
import { PenguinMood } from '@penguin/types';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { gameBridge } from '../../game/bridge/GameBridge';

const props = defineProps<{
  penguinId: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const gameStore = useGameStore();
const invStore = useInventoryStore();

const feedbackMessage = ref<string | null>(null);
const feedbackType = ref<'success' | 'warning' | 'info'>('info');

const penguin = computed(() => {
  return gameStore.getPenguinById(props.penguinId);
});

const speciesName = computed(() => {
  if (!penguin.value?.speciesId) return 'Chim Cánh Cụt';
  const def = SPECIES_MAP.get(penguin.value.speciesId);
  return def?.name ?? 'Chim Cánh Cụt';
});

const speciesColor = computed(() => {
  switch (penguin.value?.speciesId) {
    case 'snowy':
      return '#38BDF8';
    case 'sleepy':
      return '#818CF8';
    case 'shy':
      return '#F472B6';
    case 'happy':
      return '#FBBF24';
    case 'hungry':
      return '#34D399';
    default:
      return '#38BDF8';
  }
});

function getMoodIcon(mood: PenguinMood): string {
  switch (mood) {
    case 'happy':
      return '😊';
    case 'excited':
      return '🤩';
    case 'playful':
      return '🥳';
    case 'sleepy':
      return '😴';
    case 'hungry':
      return '🤤';
    case 'sad':
      return '🥺';
  }
}

function showFeedback(msg: string, type: 'success' | 'warning' | 'info' = 'info') {
  feedbackMessage.value = msg;
  feedbackType.value = type;
}

function handlePet() {
  if (!penguin.value) return;

  const success = gameStore.petPenguin(penguin.value.id);
  if (success) {
    gameBridge.emit('penguin:action', {
      ownedId: penguin.value.id,
      action: 'pet',
    });
    showFeedback(`${penguin.value.nickname} rất thích khi được bạn vuốt ve! 🥰`, 'success');
  }
}

function handleFeed() {
  if (!penguin.value) return;

  const fishCount = invStore.getItemCount('sardine');
  if (fishCount < 1) {
    showFeedback('Hết cá rồi! Hãy kiếm thêm cá nhé.', 'warning');
    return;
  }

  const success = gameStore.feedPenguin(penguin.value.id);
  if (success) {
    gameBridge.emit('penguin:action', {
      ownedId: penguin.value.id,
      action: 'feed',
    });
    showFeedback(`Đã cho ${penguin.value.nickname} ăn cá no nê! 🐟✨`, 'success');
  } else {
    showFeedback('Hết cá rồi! Hãy kiếm thêm cá nhé.', 'warning');
  }
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

.inspect-dialog {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%);
  border: 3px solid #7DD3FC;
  border-radius: 28px;
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.35),
    0 0 0 2px rgba(255, 255, 255, 0.9) inset;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: none;
  background: #E2E8F0;
  color: #64748B;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, background 0.15s ease;
}

.modal-close-btn:hover {
  background: #FEE2E2;
  color: #DC2626;
  transform: scale(1.08);
}

/* Feedback Toast */
.feedback-toast {
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
}

.feedback-toast--success {
  background: #DCFCE7;
  color: #15803D;
  border: 1px solid #86EFAC;
}

.feedback-toast--warning {
  background: #FEF3C7;
  color: #B45309;
  border: 1px solid #FDE68A;
}

.feedback-toast--info {
  background: #E0F2FE;
  color: #0369A1;
  border: 1px solid #BAE6FD;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Header & Avatar */
.inspect-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.inspect-avatar-wrap {
  width: 72px;
  height: 72px;
  background: #E0F2FE;
  border: 2px solid #BAE6FD;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.inspect-avatar-svg {
  width: 58px;
  height: 58px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15));
}

.inspect-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inspect-nickname {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
}

.inspect-sub {
  display: flex;
  align-items: center;
  gap: 8px;
}

.inspect-species {
  font-size: 0.88rem;
  font-weight: 700;
  color: #64748B;
}

.level-tag {
  font-size: 0.75rem;
  font-weight: 800;
  background: #FEF3C7;
  color: #B45309;
  padding: 1px 6px;
  border-radius: 6px;
}

.mood-badge {
  font-size: 0.8rem;
  font-weight: 700;
  color: #0369A1;
  background: #E0F2FE;
  padding: 2px 8px;
  border-radius: 999px;
  width: fit-content;
  text-transform: capitalize;
}

/* Vitals */
.vitals-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #FFFFFF;
  border: 2px solid #E2E8F0;
  border-radius: 18px;
  padding: 14px;
}

.vital-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vital-label-wrap {
  display: flex;
  justify-content: space-between;
  font-size: 0.84rem;
  font-weight: 700;
}

.vital-name {
  color: #334155;
}

.vital-value {
  color: #64748B;
}

.bar-track {
  width: 100%;
  height: 10px;
  background: #F1F5F9;
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid #E2E8F0;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bar-fill--happiness {
  background: linear-gradient(90deg, #F43F5E 0%, #FB7185 100%);
}

.bar-fill--hunger {
  background: linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%);
}

/* Actions */
.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btn-interact {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 18px;
  border: none;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.btn-interact:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
}

.btn-interact:active {
  transform: translateY(1px);
}

.btn-emoji {
  font-size: 1.5rem;
}

.btn-text-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.btn-main-text {
  font-size: 0.92rem;
  font-weight: 800;
}

.btn-sub-text {
  font-size: 0.72rem;
  font-weight: 600;
  opacity: 0.9;
}

.btn-interact--pet {
  background: linear-gradient(180deg, #F472B6 0%, #DB2777 100%);
  color: #FFFFFF;
}

.btn-interact--feed {
  background: linear-gradient(180deg, #38BDF8 0%, #0284C7 100%);
  color: #FFFFFF;
}

.not-found-state {
  padding: 24px;
  text-align: center;
  color: #64748B;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popIn {
  from { transform: scale(0.92); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>

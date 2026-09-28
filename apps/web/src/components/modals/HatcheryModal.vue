<template>
  <div
    class="modal-backdrop"
    data-testid="modal-backdrop"
    @pointerdown.stop
    @pointerup.stop
    @mousedown.stop
    @mouseup.stop
    @click.self.stop="emit('close')"
  >
    <div
      class="hatchery-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Tổ Ấp Trứng"
      @pointerdown.stop
      @pointerup.stop
      @mousedown.stop
      @mouseup.stop
      @click.stop
    >
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-header__title-group">
          <span class="modal-header__icon">🪺</span>
          <h2 class="modal-header__title">Tổ Ấp Trứng Cánh Cụt</h2>
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

      <!-- Incubator Slots -->
      <div class="slots-container">
        <div
          v-for="slot in gameStore.incubatorSlots"
          :key="slot.slotId"
          class="slot-card"
          :class="`slot-card--${slot.state.toLowerCase()}`"
          :data-testid="`incubator-slot-${slot.slotId}`"
        >
          <div class="slot-card__header">
            <span class="slot-badge">Tổ #{{ slot.slotId }}</span>
            <span
              class="status-pill"
              :class="`status-pill--${slot.state.toLowerCase()}`"
            >
              {{ getStatusLabel(slot.state) }}
            </span>
          </div>

          <!-- Slot Visual Nest & Egg -->
          <div class="slot-card__visual">
            <div class="nest-graphic">
              <!-- Nest SVG -->
              <svg viewBox="0 0 100 60" class="nest-svg">
                <ellipse cx="50" cy="38" rx="42" ry="16" fill="#78350F" />
                <ellipse cx="50" cy="36" rx="36" ry="12" fill="#A16207" />
                <path
                  d="M12 36C22 45 38 50 50 50C62 50 78 45 88 36"
                  stroke="#D97706"
                  stroke-width="3"
                  stroke-linecap="round"
                  fill="none"
                />
              </svg>

              <!-- Egg in Nest (if not empty) -->
              <template v-if="slot.state !== 'EMPTY'">
                <div class="nest-egg" :class="{ 'nest-egg--ready': slot.state === 'READY_TO_HATCH' }">
                  <svg viewBox="0 0 48 64" class="egg-svg">
                    <ellipse cx="24" cy="36" rx="18" ry="24" fill="#E0F2FE" stroke="#0284C7" stroke-width="2" />
                    <circle cx="18" cy="28" r="3" fill="#38BDF8" opacity="0.8" />
                    <circle cx="30" cy="35" r="4" fill="#38BDF8" opacity="0.8" />
                    <ellipse cx="16" cy="22" rx="3" ry="6" transform="rotate(-30 16 22)" fill="#FFFFFF" opacity="0.8" />
                  </svg>
                </div>
              </template>

              <!-- Empty Nest Placeholder -->
              <template v-else>
                <div class="empty-nest-placeholder">
                  <span class="placeholder-icon">🪹</span>
                </div>
              </template>
            </div>
          </div>

          <!-- Slot Info & Controls -->
          <div class="slot-card__controls">
            <!-- 0. LOCKED STATE -->
            <template v-if="slot.unlocked === false">
              <p class="slot-desc">Tổ #{{ slot.slotId }} chưa mở khóa.</p>
              <button
                type="button"
                class="btn-slot-action btn-slot-action--unlock"
                :data-testid="`btn-unlock-slot-${slot.slotId}`"
                :disabled="gameStore.currencies.gems < (slot.unlockCost ?? 50)"
                @click="gameStore.unlockIncubatorSlot(slot.slotId)"
              >
                💎 Mở Khóa ({{ slot.unlockCost ?? 50 }} Kim Cương)
              </button>
            </template>

            <!-- 1. EMPTY STATE -->
            <template v-else-if="slot.state === 'EMPTY'">
              <p class="slot-desc">Tổ đang trống. Hãy đặt trứng từ túi đồ vào ấp!</p>
              <button
                type="button"
                class="btn-slot-action btn-slot-action--empty"
                :data-testid="`btn-place-egg-slot-${slot.slotId}`"
                @click="emit('open-inventory')"
              >
                🎒 Mở Túi Đồ Đặt Trứng
              </button>
            </template>

            <!-- 2. INCUBATING STATE -->
            <template v-else-if="slot.state === 'INCUBATING'">
              <div class="timer-box" :data-testid="`slot-timer-${slot.slotId}`">
                <span class="timer-icon">⏳</span>
                <span class="timer-value">{{ getRemainingTime(slot) }}</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar-fill" :style="{ width: `${getProgressPercent(slot)}%` }"></div>
              </div>
              <p class="incubating-hint">Đang giữ ấm cho bé... Hãy kiên nhẫn!</p>
              <button
                type="button"
                class="btn-slot-action btn-slot-action--nurture"
                :data-testid="`btn-nurture-slot-${slot.slotId}`"
                :disabled="!canNurture(slot)"
                @click="handleNurture(slot.slotId)"
              >
                💖 Ấp Nhanh (-15s) [{{ slot.nurtureCount || 0 }}/10]
                <span v-if="getNurtureCooldown(slot) > 0">({{ getNurtureCooldown(slot) }}s)</span>
              </button>
            </template>

            <!-- 3. READY TO HATCH STATE -->
            <template v-else-if="slot.state === 'READY_TO_HATCH'">
              <p class="ready-banner">✨ Trứng đã sẵn sàng nở!</p>
              <button
                type="button"
                class="btn-slot-action btn-slot-action--hatch"
                :data-testid="`btn-hatch-slot-${slot.slotId}`"
                @click="emit('hatch', slot.slotId)"
              >
                🐣 Mở Trứng Ngay!
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { IncubatorSlot, IncubatorState } from '@penguin/types';
import { useGameStore } from '../../stores/gameStore';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'hatch', slotId: number): void;
  (e: 'open-inventory'): void;
}>();

const gameStore = useGameStore();
const now = ref(Date.now());
let timerInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timerInterval = setInterval(() => {
    now.value = Date.now();
    gameStore.updateIncubatorTimers();
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
});

function getStatusLabel(state: IncubatorState): string {
  switch (state) {
    case 'EMPTY':
      return 'Trống';
    case 'INCUBATING':
      return 'Đang Ấp';
    case 'READY_TO_HATCH':
      return 'Sẵn Sàng Nở';
    case 'EGG_PLACED':
      return 'Đã Đặt Trứng';
    case 'HATCHING':
      return 'Đang Nở';
    case 'HATCHED':
      return 'Đã Nở';
  }
}

function getRemainingTime(slot: IncubatorSlot): string {
  if (!slot.readyAt) return '00:00';
  const remainingSec = Math.max(0, Math.ceil((slot.readyAt - now.value) / 1000));
  const m = Math.floor(remainingSec / 60);
  const s = remainingSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getProgressPercent(slot: IncubatorSlot): number {
  if (!slot.startTime || !slot.readyAt) return 0;
  const total = slot.readyAt - slot.startTime;
  if (total <= 0) return 100;
  const elapsed = now.value - slot.startTime;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function canNurture(slot: IncubatorSlot): boolean {
  if (slot.unlocked === false) return false;
  if (slot.state !== 'INCUBATING') return false;
  if ((slot.nurtureCount || 0) >= 10) return false;
  if (slot.lastNurtureAt && (now.value - slot.lastNurtureAt) < 30000) return false;
  return true;
}

function getNurtureCooldown(slot: IncubatorSlot): number {
  if (!slot.lastNurtureAt) return 0;
  const remaining = Math.ceil((30000 - (now.value - slot.lastNurtureAt)) / 1000);
  return Math.max(0, remaining);
}

function handleNurture(slotId: number) {
  gameStore.nurtureEgg(slotId);
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

.hatchery-dialog {
  width: 100%;
  max-width: 680px;
  background: linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%);
  border: 3px solid #0284C7;
  border-radius: 28px;
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.35),
    0 0 0 2px rgba(255, 255, 255, 0.9) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(180deg, #E0F2FE 0%, #BAE6FD 100%);
  border-bottom: 2px solid #0284C7;
}

.modal-header__title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-header__icon {
  font-size: 1.5rem;
}

.modal-header__title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0369A1;
  margin: 0;
}

.modal-close-btn {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: none;
  background: #FFFFFF;
  color: #0369A1;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.15s ease, background 0.15s ease;
}

.modal-close-btn:hover {
  background: #FEE2E2;
  color: #DC2626;
  transform: scale(1.08);
}

.slots-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 20px;
}

@media (max-width: 600px) {
  .slots-container {
    grid-template-columns: 1fr;
  }
}

.slot-card {
  background: #FFFFFF;
  border: 2px solid #BAE6FD;
  border-radius: 22px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.slot-card__header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.slot-badge {
  font-size: 0.82rem;
  font-weight: 800;
  color: #64748B;
}

.status-pill {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 999px;
  text-transform: uppercase;
}

.status-pill--empty {
  background: #F1F5F9;
  color: #64748B;
}

.status-pill--incubating {
  background: #FEF3C7;
  color: #B45309;
}

.status-pill--ready_to_hatch {
  background: #DCFCE7;
  color: #15803D;
  animation: pulse 1s infinite alternate;
}

.slot-card__visual {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.nest-graphic {
  position: relative;
  width: 120px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nest-svg {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 60px;
}

.nest-egg {
  position: absolute;
  bottom: 18px;
  width: 44px;
  height: 60px;
}

.nest-egg--ready {
  animation: eggBounce 1s infinite ease-in-out;
}

.egg-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.empty-nest-placeholder {
  position: absolute;
  bottom: 24px;
  font-size: 1.8rem;
  opacity: 0.6;
}

.slot-card__controls {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  text-align: center;
}

.slot-desc {
  font-size: 0.84rem;
  color: #64748B;
  margin: 0;
  line-height: 1.3;
}

.timer-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #FEF3C7;
  border: 1px solid #FDE68A;
  padding: 4px 12px;
  border-radius: 999px;
  color: #B45309;
  font-weight: 800;
  font-size: 0.95rem;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: #E2E8F0;
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #F59E0B 0%, #10B981 100%);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.incubating-hint {
  font-size: 0.78rem;
  color: #64748B;
  margin: 0;
  font-style: italic;
}

.ready-banner {
  font-size: 0.88rem;
  font-weight: 800;
  color: #15803D;
  margin: 0;
}

.btn-slot-action {
  width: 100%;
  padding: 10px 14px;
  border-radius: 14px;
  border: none;
  font-family: inherit;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.btn-slot-action:hover {
  transform: translateY(-2px);
  filter: brightness(1.06);
}

.btn-slot-action--empty {
  background: linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%);
  color: #334155;
}

.btn-slot-action--hatch {
  background: linear-gradient(180deg, #34D399 0%, #059669 100%);
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
  animation: pulse 1.2s infinite alternate;
}

@keyframes eggBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes pulse {
  from { opacity: 0.85; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1.02); }
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

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
      class="breeding-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Tổ Ấm Phối Giống"
      @pointerdown.stop
      @pointerup.stop
      @mousedown.stop
      @mouseup.stop
      @click.stop
    >
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-header__title-group">
          <GameIcon name="pet" size="sm" class="modal-header__icon" />
          <h2 class="modal-header__title">Tổ Ấm Phối Giống</h2>
        </div>
        <button
          type="button"
          class="modal-close-btn"
          data-testid="modal-close-btn"
          aria-label="Đóng"
          @click="emit('close')"
        >
          <GameIcon name="close" size="sm" />
        </button>
      </div>

      <!-- Main Body -->
      <div class="modal-body">
        <!-- State 1: EMPTY - Parent Selection & Preview -->
        <div v-if="slotState === 'EMPTY'" class="breeding-setup">
          <div class="parents-row">
            <!-- Parent A Card -->
            <div
              class="parent-card"
              :class="{ 'parent-card--selected': parentA }"
              data-testid="parent-a-slot"
              @click="openPicker('A')"
            >
              <div class="parent-card__header">Chim Bố/Mẹ 1</div>
              <div v-if="parentA" class="parent-card__info">
                <div class="parent-name">{{ parentA.nickname }}</div>
                <div class="parent-meta">Cấp {{ parentA.level }} • {{ parentA.speciesId }}</div>
                <div v-if="parentA.traits?.length" class="parent-traits">
                  <span v-for="t in parentA.traits" :key="t" class="trait-tag">{{ t }}</span>
                </div>
              </div>
              <div v-else class="parent-card__placeholder">
                <span class="plus-icon">+</span>
                <span>Chọn Cánh Cụt</span>
              </div>
            </div>

            <div class="heart-separator">❤️</div>

            <!-- Parent B Card -->
            <div
              class="parent-card"
              :class="{ 'parent-card--selected': parentB }"
              data-testid="parent-b-slot"
              @click="openPicker('B')"
            >
              <div class="parent-card__header">Chim Bố/Mẹ 2</div>
              <div v-if="parentB" class="parent-card__info">
                <div class="parent-name">{{ parentB.nickname }}</div>
                <div class="parent-meta">Cấp {{ parentB.level }} • {{ parentB.speciesId }}</div>
                <div v-if="parentB.traits?.length" class="parent-traits">
                  <span v-for="t in parentB.traits" :key="t" class="trait-tag">{{ t }}</span>
                </div>
              </div>
              <div v-else class="parent-card__placeholder">
                <span class="plus-icon">+</span>
                <span>Chọn Cánh Cụt</span>
              </div>
            </div>
          </div>

          <!-- Penguin Picker Overlay -->
          <div v-if="pickingSlot" class="picker-panel" data-testid="penguin-picker-panel">
            <div class="picker-panel__header">
              <span>Chọn chim cho vị trí {{ pickingSlot }}</span>
              <button type="button" class="btn-cancel-pick" @click="pickingSlot = null">Đóng</button>
            </div>
            <div class="picker-list">
              <div
                v-for="penguin in eligiblePenguins"
                :key="penguin.id"
                class="picker-item"
                :class="{ 'picker-item--disabled': isPenguinDisabled(penguin) }"
                :data-testid="`picker-penguin-${penguin.id}`"
                @click="!isPenguinDisabled(penguin) && choosePenguin(penguin.id)"
              >
                <div class="picker-item__details">
                  <div class="picker-item__name">{{ penguin.nickname }} (Cấp {{ penguin.level }})</div>
                  <div class="picker-item__sub">
                    {{ penguin.speciesId }} • Đói: {{ penguin.hunger }}%
                    <span v-if="isCooldown(penguin)" class="text-danger">• Hồi chiêu</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Offspring Preview -->
          <div v-if="breedingStore.previewOffspring" class="preview-panel" data-testid="preview-panel">
            <div class="preview-title">Dự Đoán Con Lai (Thế hệ {{ breedingStore.previewOffspring.generation }}):</div>
            <div class="preview-species">
              Loài có thể: {{ breedingStore.previewOffspring.possibleSpecies.join(', ') }}
            </div>
          </div>

          <!-- Breeding Cost & Action -->
          <div class="cost-and-action">
            <div class="cost-banner">
              <span>Chi phí:</span>
              <span class="cost-item"><GameIcon name="coin" size="xs" /> 200 Xu</span>
              <span class="cost-item"><GameIcon name="gem" size="xs" /> 1 Kim Cương</span>
            </div>

            <div v-if="!eligibility.eligible && eligibility.reason" class="error-msg" data-testid="breeding-error-msg">
              {{ formatReason(eligibility.reason) }}
            </div>

            <button
              type="button"
              class="btn-start-breeding"
              data-testid="btn-start-breeding"
              :disabled="!eligibility.eligible"
              @click="handleStartBreeding"
            >
              Bắt Đầu Phối Giống
            </button>
          </div>
        </div>

        <!-- State 2: BREEDING - In Progress -->
        <div v-else-if="slotState === 'BREEDING'" class="breeding-active" data-testid="breeding-active-view">
          <div class="active-nest-visual">
            <div class="floating-hearts">💖 💞 💖</div>
            <div class="nest-label">Đang phối giống trong Tổ Ấm...</div>
            <div class="timer-countdown" data-testid="breeding-timer">
              ⏱️ Còn lại: {{ remainingTimeText }}
            </div>
          </div>
          <button type="button" class="btn-fast-forward" @click="fastForwardTimer">
            Tua Nhanh (Dev)
          </button>
        </div>

        <!-- State 3: READY_TO_COLLECT - Harvest Egg -->
        <div v-else-if="slotState === 'READY_TO_COLLECT'" class="breeding-ready" data-testid="breeding-ready-view">
          <div class="ready-egg-visual">
            <div class="sparkles">✨ 🥚 ✨</div>
            <div class="ready-title">Trứng Lai Ghép Đã Sẵn Sàng!</div>
            <div class="ready-desc">
              Một quả trứng kết tinh tình yêu đã xuất hiện. Hãy đưa vào Nhà Ấp để ấp nở!
            </div>
          </div>
          <button
            type="button"
            class="btn-collect-egg"
            data-testid="btn-collect-egg"
            @click="handleCollectEgg"
          >
            Thu Hoạch Trứng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useBreedingStore } from '../../stores/breedingStore';
import { useGameStore } from '../../stores/gameStore';
import type { OwnedPenguin } from '@penguin/types';
import GameIcon from '../common/GameIcon.vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const breedingStore = useBreedingStore();
const gameStore = useGameStore();

const pickingSlot = ref<'A' | 'B' | null>(null);
const timerInterval = ref<any>(null);
const nowTime = ref(Date.now());

onMounted(() => {
  timerInterval.value = setInterval(() => {
    nowTime.value = Date.now();
    breedingStore.updateTimer();
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
});

const slotState = computed(() => breedingStore.breedingSlot.state);
const parentA = computed(() => breedingStore.parentA);
const parentB = computed(() => breedingStore.parentB);

const eligiblePenguins = computed(() => {
  return gameStore.ownedPenguins;
});

const eligibility = computed(() => breedingStore.canBreedCurrentSelection);

const remainingTimeText = computed(() => {
  const readyAt = breedingStore.breedingSlot.readyAt ?? 0;
  const diffSec = Math.max(0, Math.ceil((readyAt - nowTime.value) / 1000));
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});

function isCooldown(p: OwnedPenguin): boolean {
  if (!p.lastBredAt || p.lastBredAt === 0) return false;
  return nowTime.value - p.lastBredAt < 1800000;
}

function isPenguinDisabled(p: OwnedPenguin): boolean {
  if (p.level < 3) return true;
  if (isCooldown(p)) return true;
  if (p.hunger >= 80) return true;
  if (pickingSlot.value === 'A' && parentB.value?.id === p.id) return true;
  if (pickingSlot.value === 'B' && parentA.value?.id === p.id) return true;
  return false;
}

function openPicker(slot: 'A' | 'B') {
  pickingSlot.value = slot;
}

function choosePenguin(id: string) {
  if (pickingSlot.value === 'A') {
    breedingStore.selectParentA(id);
  } else if (pickingSlot.value === 'B') {
    breedingStore.selectParentB(id);
  }
  pickingSlot.value = null;
}

function formatReason(reason: string): string {
  switch (reason) {
    case 'SAME_PENGUIN':
      return 'Không thể phối giống một chú cánh cụt với chính nó!';
    case 'LEVEL_TOO_LOW':
      return 'Cả hai chim bố mẹ phải đạt tối thiểu Cấp 3!';
    case 'ON_COOLDOWN':
      return 'Một trong hai chú chim đang trong thời gian hồi sức (30 phút)!';
    case 'STARVING':
      return 'Cánh cụt đang quá đói (Đói >= 80%), hãy cho ăn trước!';
    case 'INSUFFICIENT_FUNDS':
      return 'Không đủ Xu (200) hoặc Kim Cương (1)!';
    default:
      return reason;
  }
}

function handleStartBreeding() {
  breedingStore.startBreeding();
}

function fastForwardTimer() {
  breedingStore.breedingSlot.readyAt = Date.now() - 1000;
  breedingStore.updateTimer();
}

function handleCollectEgg() {
  const res = breedingStore.collectEgg();
  if (res.success) {
    emit('close');
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.breeding-dialog {
  background: linear-gradient(180deg, #fdf4ff 0%, #fae8ff 100%);
  border: 3px solid #d946ef;
  border-radius: 20px;
  width: 90%;
  max-width: 520px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  color: #4a044e;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f5d0fe;
  border-bottom: 2px solid #e879f9;
}

.modal-header__title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-header__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.modal-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.modal-body {
  padding: 20px;
}

.parents-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.parent-card {
  flex: 1;
  background: #ffffff;
  border: 2px dashed #f472b6;
  border-radius: 14px;
  padding: 14px;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.parent-card:hover {
  border-color: #ec4899;
  background: #fff1f2;
}

.parent-card--selected {
  border-style: solid;
  border-color: #db2777;
  background: #fdf2f8;
}

.parent-card__header {
  font-size: 0.8rem;
  font-weight: 600;
  color: #9d174d;
  margin-bottom: 6px;
}

.parent-name {
  font-size: 1rem;
  font-weight: 700;
  color: #831843;
}

.parent-meta {
  font-size: 0.75rem;
  color: #9d174d;
}

.parent-traits {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}

.trait-tag {
  background: #fbcfe8;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 0.7rem;
  color: #831843;
}

.parent-card__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ec4899;
  font-weight: 600;
  font-size: 0.85rem;
}

.plus-icon {
  font-size: 1.5rem;
}

.heart-separator {
  font-size: 1.6rem;
}

.picker-panel {
  margin-top: 14px;
  background: #ffffff;
  border: 1px solid #f472b6;
  border-radius: 12px;
  padding: 12px;
  max-height: 180px;
  overflow-y: auto;
}

.picker-panel__header {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 8px;
}

.btn-cancel-pick {
  background: transparent;
  border: none;
  color: #e11d48;
  cursor: pointer;
  font-weight: bold;
}

.picker-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.picker-item {
  padding: 8px 10px;
  background: #fdf2f8;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
}

.picker-item:hover {
  background: #fce7f3;
}

.picker-item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.picker-item__name {
  font-weight: 700;
  font-size: 0.9rem;
}

.picker-item__sub {
  font-size: 0.75rem;
  color: #701a75;
}

.text-danger {
  color: #e11d48;
}

.preview-panel {
  margin-top: 14px;
  background: #fae8ff;
  border: 1px solid #e879f9;
  border-radius: 12px;
  padding: 12px;
  font-size: 0.85rem;
}

.preview-title {
  font-weight: 700;
  color: #86198f;
  margin-bottom: 4px;
}

.cost-and-action {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.cost-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.cost-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.error-msg {
  color: #e11d48;
  font-size: 0.8rem;
  font-weight: 600;
}

.btn-start-breeding {
  width: 100%;
  padding: 12px;
  background: linear-gradient(180deg, #ec4899 0%, #db2777 100%);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(219, 39, 119, 0.4);
}

.btn-start-breeding:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.breeding-active,
.breeding-ready {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  text-align: center;
}

.floating-hearts,
.sparkles {
  font-size: 2.2rem;
  margin-bottom: 8px;
}

.nest-label {
  font-weight: 700;
  font-size: 1.1rem;
  color: #86198f;
  margin-bottom: 6px;
}

.timer-countdown {
  font-size: 1rem;
  font-weight: 600;
  color: #a21caf;
  margin-bottom: 14px;
}

.btn-fast-forward {
  background: #fdf2f8;
  border: 1px solid #f472b6;
  color: #be185d;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  cursor: pointer;
}

.ready-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #86198f;
  margin-bottom: 6px;
}

.ready-desc {
  font-size: 0.85rem;
  color: #701a75;
  margin-bottom: 16px;
  max-width: 380px;
}

.btn-collect-egg {
  width: 100%;
  max-width: 280px;
  padding: 14px;
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}
</style>

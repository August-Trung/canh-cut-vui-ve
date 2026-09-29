<template>
  <aside class="neighbor-strip" aria-label="Danh sách Hàng Xóm">
    <!-- Header Badge with toggle -->
    <div
      class="neighbor-strip__header"
      role="button"
      tabindex="0"
      :title="isExpanded ? 'Thu gọn hàng xóm' : 'Xem hàng xóm đảo băng'"
      @click="isExpanded = !isExpanded"
      @keydown.enter="isExpanded = !isExpanded"
    >
      <div class="neighbor-strip__badge">
        <GameIcon name="pet" size="xs" class="neighbor-strip__badge-icon" />
        <span class="neighbor-strip__badge-text">
          Hàng Xóm Đảo Băng
        </span>
      </div>
      <button
        type="button"
        class="neighbor-strip__toggle"
        :aria-expanded="isExpanded"
        :title="isExpanded ? 'Thu gọn' : 'Mở rộng'"
        @click.stop="isExpanded = !isExpanded"
      >
        <svg
          class="neighbor-strip__toggle-icon"
          :class="{ 'is-flipped': isExpanded }"
          viewBox="0 0 16 16"
          width="12"
          height="12"
        >
          <path d="M4 6 L8 10 L12 6" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <!-- Horizontal Neighbor Cards Container (Icy Tray) -->
    <div v-show="isExpanded" class="neighbor-strip__tray" role="list">
      <!-- Frost edge cap -->
      <div class="neighbor-strip__frost-rim" aria-hidden="true"></div>

      <!-- Real Empty State -->
      <div v-if="neighbors.length === 0" class="neighbor-strip__empty" data-testid="neighbor-empty-state">
        <span class="neighbor-strip__empty-text">Chưa có hàng xóm</span>
      </div>

      <div
        v-for="neighbor in neighbors"
        :key="neighbor.id"
        class="neighbor-card"
        role="listitem"
        :title="`${neighbor.name}${neighbor.role ? ' (' + neighbor.role + ')' : ''}${neighbor.status ? ' - ' + neighbor.status : ''}`"
      >
        <!-- Avatar Frame with overlapping Level Star -->
        <div class="neighbor-card__avatar-box" :style="{ background: neighbor.avatarBg || 'linear-gradient(135deg, #BAE6FD 0%, #38BDF8 100%)' }">
          <GameIcon :name="neighbor.avatarIcon" size="sm" class="neighbor-card__avatar-icon" />
          <div class="neighbor-card__level-badge">
            <span class="neighbor-card__level-star">★</span>
            <span class="neighbor-card__level-num">{{ neighbor.level }}</span>
          </div>
        </div>

        <!-- Meta -->
        <div class="neighbor-card__info">
          <span class="neighbor-card__name">{{ neighbor.name }}</span>
          <span v-if="neighbor.status" class="neighbor-card__status">{{ neighbor.status }}</span>
        </div>

        <!-- Wave / Greeting Action Button -->
        <button
          type="button"
          class="neighbor-card__action-btn"
          :data-testid="`wave-btn-${neighbor.id}`"
          :title="`Vẫy tay chào ${neighbor.name}`"
          @click="handleWave(neighbor)"
        >
          <span class="neighbor-card__action-icon">👋</span>
          <span class="neighbor-card__action-text">Chào</span>
        </button>
      </div>

      <!-- Add Friend slot (Social feature) -->
      <div class="neighbor-card neighbor-card--add" title="Thêm hàng xóm mới">
        <div class="neighbor-card__add-icon">+</div>
        <span class="neighbor-card__add-label">Kết Bạn</span>
      </div>
    </div>

    <!-- Friendly interaction feedback toast -->
    <transition name="toast-fade">
      <div v-if="toastMessage" class="neighbor-strip__toast" role="status">
        <span class="neighbor-strip__toast-bubble">{{ toastMessage }}</span>
      </div>
    </transition>
  </aside>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import GameIcon from '../common/GameIcon.vue';

export interface NeighborData {
  id: string;
  name: string;
  role?: string;
  level: number;
  status?: string;
  avatarIcon: string;
  avatarBg?: string;
  response?: string;
}

const props = withDefaults(
  defineProps<{
    neighbors?: NeighborData[];
  }>(),
  {
    neighbors: () => [],
  }
);

const isExpanded = ref(true);
const toastMessage = ref('');
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function handleWave(neighbor: NeighborData) {
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  toastMessage.value = neighbor.response || `${neighbor.name} vẫy tay chào bạn!`;
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
    toastTimer = null;
  }, 2500);
}

onUnmounted(() => {
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
});
</script>

<style scoped>
.neighbor-strip {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  pointer-events: auto;
  user-select: none;
  max-width: 100%;
}

/* Header Badge: Zing Me style wooden/icy tab */
.neighbor-strip__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  cursor: pointer;
  background: linear-gradient(180deg, #38BDF8 0%, #0284C7 100%);
  border: 2px solid #BAE6FD;
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  padding: 3px 10px;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.15);
  transition: filter 0.15s ease;
}

.neighbor-strip__header:hover {
  filter: brightness(1.08);
}

.neighbor-strip__badge {
  display: flex;
  align-items: center;
  gap: 5px;
}

.neighbor-strip__badge-icon {
  font-size: 0.85rem;
}

.neighbor-strip__badge-text {
  font-family: 'Quicksand', 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 0.74rem;
  color: #FFFFFF;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.neighbor-strip__badge-sub {
  color: #FEF08A;
  font-weight: 700;
  font-size: 0.68rem;
}

.neighbor-strip__toggle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.neighbor-strip__toggle-icon {
  transition: transform 0.2s ease;
}

.neighbor-strip__toggle-icon.is-flipped {
  transform: rotate(180deg);
}

/* Horizontal Neighbor Tray: Cartoon Icy Shelf */
.neighbor-strip__tray {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px 6px;
  background: linear-gradient(180deg, #E0F2FE 0%, #BAE6FD 100%);
  border: 2.5px solid #38BDF8;
  border-top-color: #FFFFFF;
  border-radius: 0 16px 16px 16px;
  box-shadow:
    0 4px 12px rgba(15, 23, 42, 0.25),
    inset 0 1px 3px rgba(255, 255, 255, 0.9);
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
}

.neighbor-strip__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
}

.neighbor-strip__empty-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  color: #0369A1;
  font-style: italic;
  white-space: nowrap;
}

.neighbor-strip__tray::-webkit-scrollbar {
  height: 4px;
}

.neighbor-strip__tray::-webkit-scrollbar-thumb {
  background: #38BDF8;
  border-radius: 4px;
}

/* Neighbor Card: Cartoon portrait tile */
.neighbor-card {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #FFFFFF;
  border: 2px solid #BAE6FD;
  padding: 3px 6px 3px 3px;
  border-radius: 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.neighbor-card:hover {
  transform: translateY(-2px);
  border-color: #0284C7;
}

.neighbor-card__avatar-box {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 1.5px solid #FFFFFF;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.neighbor-card__level-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: linear-gradient(180deg, #F59E0B 0%, #D97706 100%);
  color: #FFFFFF;
  border: 1.5px solid #FFFFFF;
  font-family: 'Quicksand', sans-serif;
  font-weight: 800;
  font-size: 0.58rem;
  padding: 0 4px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  gap: 1px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.neighbor-card__level-star {
  color: #FEF08A;
  font-size: 0.55rem;
}

.neighbor-card__info {
  display: flex;
  flex-direction: column;
}

.neighbor-card__name {
  font-family: 'Quicksand', sans-serif;
  font-weight: 800;
  font-size: 0.72rem;
  color: #0F172A;
  white-space: nowrap;
}

.neighbor-card__status {
  font-size: 0.62rem;
  color: #64748B;
  white-space: nowrap;
}

/* Action button: bright cartoon blue capsule */
.neighbor-card__action-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  background: linear-gradient(180deg, #38BDF8 0%, #0284C7 100%);
  color: #FFFFFF;
  border: 1.5px solid #7DD3FC;
  padding: 3px 6px;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Quicksand', sans-serif;
  font-weight: 800;
  font-size: 0.65rem;
  box-shadow: 0 2px 4px rgba(2, 132, 199, 0.3);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.neighbor-card__action-btn:hover {
  transform: scale(1.06);
  filter: brightness(1.1);
}

.neighbor-card__action-btn:active {
  transform: scale(0.95);
}

.neighbor-card__action-icon {
  font-size: 0.65rem;
}

/* Add Friend decorative card */
.neighbor-card--add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 44px;
  background: rgba(255, 255, 255, 0.7);
  border: 2px dashed #38BDF8;
  border-radius: 12px;
  cursor: pointer;
}

.neighbor-card--add:hover {
  background: #FFFFFF;
  border-color: #0284C7;
  transform: translateY(-2px);
}

.neighbor-card__add-icon {
  font-size: 1rem;
  font-weight: 900;
  color: #0284C7;
  line-height: 1;
}

.neighbor-card__add-label {
  font-family: 'Quicksand', sans-serif;
  font-weight: 800;
  font-size: 0.58rem;
  color: #0284C7;
}

/* Toast Message */
.neighbor-strip__toast {
  position: absolute;
  top: -38px;
  left: 20px;
  z-index: 20;
  pointer-events: none;
}

.neighbor-strip__toast-bubble {
  background: #FFFFFF;
  color: #0F172A;
  padding: 5px 12px;
  border-radius: 12px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 800;
  font-size: 0.74rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  white-space: nowrap;
  border: 2px solid #0284C7;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@media (max-width: 640px) {
  .neighbor-strip {
    display: none; /* Hide friend strip on very narrow mobile to prioritize world & shelf */
  }
}
</style>

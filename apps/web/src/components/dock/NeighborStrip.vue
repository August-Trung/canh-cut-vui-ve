<template>
  <aside class="neighbor-strip" aria-label="Danh sách Hàng Xóm Mô Phỏng">
    <!-- Header Badge: explicitly labeled as simulated local NPCs -->
    <div class="neighbor-strip__header">
      <div class="neighbor-strip__badge" title="Hàng xóm NPC mô phỏng ngoại tuyến (Offline NPC)">
        <span class="neighbor-strip__badge-icon">🏘️</span>
        <span class="neighbor-strip__badge-text">Hàng Xóm Đảo Băng <small class="neighbor-strip__badge-sub">(NPC Mô Phỏng)</small></span>
      </div>
      <button
        type="button"
        class="neighbor-strip__toggle"
        :aria-expanded="isExpanded"
        :title="isExpanded ? 'Thu gọn' : 'Mở rộng'"
        @click="isExpanded = !isExpanded"
      >
        <span class="neighbor-strip__toggle-chevron" :class="{ 'is-flipped': !isExpanded }">▼</span>
      </button>
    </div>

    <!-- Horizontal Neighbor Cards Container -->
    <div v-show="isExpanded" class="neighbor-strip__carousel" role="list">
      <div
        v-for="neighbor in neighbors"
        :key="neighbor.id"
        class="neighbor-card"
        role="listitem"
        :title="`${neighbor.name} (${neighbor.role}) - ${neighbor.status}`"
      >
        <!-- Avatar Frame -->
        <div class="neighbor-card__avatar-box" :style="{ background: neighbor.avatarBg }">
          <span class="neighbor-card__emoji">{{ neighbor.avatarEmoji }}</span>
          <span class="neighbor-card__level">Lv.{{ neighbor.level }}</span>
        </div>

        <!-- Meta -->
        <div class="neighbor-card__info">
          <span class="neighbor-card__name">{{ neighbor.name }}</span>
          <span class="neighbor-card__status">{{ neighbor.status }}</span>
        </div>

        <!-- Action Button -->
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
    </div>

    <!-- Friendly interaction feedback toast -->
    <transition name="toast-fade">
      <div v-if="toastMessage" class="neighbor-strip__toast" role="status">
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </aside>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';

export interface SimulatedNeighbor {
  id: string;
  name: string;
  role: string;
  level: number;
  status: string;
  avatarEmoji: string;
  avatarBg: string;
  response: string;
}

const isExpanded = ref(true);
const toastMessage = ref('');
let toastTimer: ReturnType<typeof setTimeout> | null = null;

const neighbors: SimulatedNeighbor[] = [
  {
    id: 'npc-bear',
    name: 'Bác Gấu Tuyết',
    role: 'Ngư Dân Đảo Băng',
    level: 12,
    status: 'Đang câu cá hồi tuyết',
    avatarEmoji: '🐻‍❄️',
    avatarBg: 'linear-gradient(135deg, #BAE6FD 0%, #38BDF8 100%)',
    response: 'Bác Gấu Tuyết mỉm cười gật đầu và ném cho bạn một con cá tươi! 🐟',
  },
  {
    id: 'npc-neighbor',
    name: 'Cánh Cụt Bé Nhỏ',
    role: 'Hàng Xóm Vui Vẻ',
    level: 4,
    status: 'Đang trượt băng nghệ thuật',
    avatarEmoji: '🐧',
    avatarBg: 'linear-gradient(135deg, #DDD6FE 0%, #8B5CF6 100%)',
    response: 'Cánh Cụt Bé Nhỏ trượt một vòng số 8 tuyệt đẹp chào bạn! ✨',
  },
  {
    id: 'npc-explorer',
    name: 'Đội Thám Hiểm Băng',
    role: 'Nhà Khám Phá Nam Cực',
    level: 8,
    status: 'Đang khảo sát hang băng',
    avatarEmoji: '🧭',
    avatarBg: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)',
    response: 'Đội Thám Hiểm giơ kính viễn vọng chào bạn từ xa! 🏔️',
  },
  {
    id: 'npc-tailor',
    name: 'Thợ May Khăn Ấm',
    role: 'Nghệ Nhân Đan Len',
    level: 6,
    status: 'Đang đan mũ len đỏ',
    avatarEmoji: '🧶',
    avatarBg: 'linear-gradient(135deg, #FECDD3 0%, #F43F5E 100%)',
    response: 'Thợ May vẫy cuộn len ấm áp chúc bạn một ngày vui vẻ! 🧣',
  },
];

function handleWave(neighbor: SimulatedNeighbor) {
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  toastMessage.value = neighbor.response;
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
  align-items: center;
  pointer-events: auto;
  user-select: none;
  max-width: 100%;
}

/* Header Badge */
.neighbor-strip__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.neighbor-strip__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 3px 12px;
  border-radius: 9999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.neighbor-strip__badge-icon {
  font-size: 0.9rem;
}

.neighbor-strip__badge-text {
  font-family: 'Quicksand', 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 0.78rem;
  color: #F8FAFC;
  letter-spacing: 0.02em;
}

.neighbor-strip__badge-sub {
  color: #93C5FD;
  font-weight: 700;
  font-size: 0.7rem;
}

.neighbor-strip__toggle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.6);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
}

.neighbor-strip__toggle:hover {
  background: rgba(255, 255, 255, 0.6);
  color: #0F172A;
}

.neighbor-strip__toggle-chevron {
  font-size: 0.6rem;
  transition: transform 0.2s ease;
}

.neighbor-strip__toggle-chevron.is-flipped {
  transform: rotate(180deg);
}

/* Horizontal Carousel */
.neighbor-strip__carousel {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  border-radius: 18px;
  box-shadow:
    0 4px 16px rgba(15, 23, 42, 0.15),
    inset 0 1px 2px rgba(255, 255, 255, 0.8);
  max-width: 95vw;
  overflow-x: auto;
  scrollbar-width: thin;
}

.neighbor-strip__carousel::-webkit-scrollbar {
  height: 4px;
}

.neighbor-strip__carousel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
}

/* Neighbor Card */
.neighbor-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.9);
  padding: 4px 8px 4px 4px;
  border-radius: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.neighbor-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.neighbor-card__avatar-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.6);
}

.neighbor-card__emoji {
  font-size: 1.25rem;
}

.neighbor-card__level {
  position: absolute;
  bottom: -3px;
  right: -3px;
  background: #0284C7;
  color: #FFFFFF;
  font-family: 'Quicksand', sans-serif;
  font-weight: 800;
  font-size: 0.6rem;
  padding: 0 4px;
  border-radius: 6px;
  border: 1px solid #FFFFFF;
}

.neighbor-card__info {
  display: flex;
  flex-direction: column;
}

.neighbor-card__name {
  font-family: 'Quicksand', sans-serif;
  font-weight: 800;
  font-size: 0.78rem;
  color: #1E293B;
  white-space: nowrap;
}

.neighbor-card__status {
  font-size: 0.68rem;
  color: #64748B;
  white-space: nowrap;
}

.neighbor-card__action-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  background: linear-gradient(135deg, #38BDF8 0%, #0284C7 100%);
  color: #FFFFFF;
  border: 1px solid #7DD3FC;
  padding: 4px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Quicksand', sans-serif;
  font-weight: 700;
  font-size: 0.7rem;
  box-shadow: 0 2px 4px rgba(2, 132, 199, 0.25);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.neighbor-card__action-btn:hover {
  transform: scale(1.05);
  filter: brightness(1.1);
}

.neighbor-card__action-btn:active {
  transform: scale(0.95);
}

.neighbor-card__action-icon {
  font-size: 0.75rem;
}

/* Toast Message */
.neighbor-strip__toast {
  position: absolute;
  top: -42px;
  background: rgba(15, 23, 42, 0.9);
  color: #FEF08A;
  padding: 6px 14px;
  border-radius: 9999px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 700;
  font-size: 0.8rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  white-space: nowrap;
  border: 1px solid rgba(254, 240, 138, 0.3);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>

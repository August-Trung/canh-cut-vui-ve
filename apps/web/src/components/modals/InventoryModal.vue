<template>
  <div class="modal-backdrop" data-testid="modal-backdrop" @click.self="emit('close')">
    <div class="inventory-dialog" role="dialog" aria-modal="true" aria-label="Túi Đồ Của Bạn">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-header__title-group">
          <span class="modal-header__icon">🎒</span>
          <h2 class="modal-header__title">Túi Đồ Của Bạn</h2>
        </div>
        <button
          type="button"
          class="modal-close-btn"
          data-testid="modal-close-btn"
          aria-label="Đóng"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Feedback Toast Notification -->
      <transition name="toast-fade">
        <div v-if="feedbackMessage" class="feedback-toast" :class="`feedback-toast--${feedbackType}`">
          {{ feedbackMessage }}
        </div>
      </transition>

      <!-- Category Filter Tabs -->
      <div class="tabs-bar" role="tablist" aria-label="Phân loại túi đồ">
        <button
          type="button"
          class="tab-btn"
          :class="{ 'is-active': activeCategory === 'all' }"
          data-testid="tab-all"
          role="tab"
          :aria-selected="activeCategory === 'all'"
          @click="activeCategory = 'all'"
        >
          Tất Cả
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ 'is-active': activeCategory === 'eggs' }"
          data-testid="tab-eggs"
          role="tab"
          :aria-selected="activeCategory === 'eggs'"
          @click="activeCategory = 'eggs'"
        >
          🥚 Trứng
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ 'is-active': activeCategory === 'food' }"
          data-testid="tab-food"
          role="tab"
          :aria-selected="activeCategory === 'food'"
          @click="activeCategory = 'food'"
        >
          🐟 Thức Ăn
        </button>
      </div>

      <!-- Inventory Item Grid -->
      <div class="inventory-body">
        <div v-if="filteredItems.length === 0" class="empty-state">
          <span class="empty-icon">❄️</span>
          <p class="empty-text">Túi đồ trống trong danh mục này.</p>
        </div>

        <div v-else class="items-grid" role="list">
          <div
            v-for="item in filteredItems"
            :key="item.itemId"
            class="item-card"
            :data-testid="`inventory-item-${item.itemId}`"
            role="listitem"
          >
            <div class="item-card__icon-box">
              <!-- Item icon visual -->
              <span v-if="item.category === 'eggs'" class="item-emoji">🥚</span>
              <span v-else-if="item.category === 'food'" class="item-emoji">🐟</span>
              <span v-else class="item-emoji">📦</span>
              <span class="item-card__quantity">x{{ item.quantity }}</span>
            </div>

            <div class="item-card__info">
              <h4 class="item-card__name">{{ item.name }}</h4>
              <p class="item-card__desc">{{ item.description }}</p>
            </div>

            <!-- Actions based on Item Category -->
            <div class="item-card__actions">
              <button
                v-if="item.category === 'eggs'"
                type="button"
                class="btn-item-action btn-item-action--egg"
                :data-testid="`action-place-egg-${item.itemId}`"
                @click="handlePlaceEgg(item.itemId)"
              >
                Đặt Vào Tổ Ấp
              </button>

              <button
                v-else-if="item.category === 'food'"
                type="button"
                class="btn-item-action btn-item-action--food"
                :data-testid="`action-feed-fish-${item.itemId}`"
                @click="handleFeedPenguin(item.itemId)"
              >
                Cho Ăn
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { gameBridge } from '../../game/bridge/GameBridge';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const gameStore = useGameStore();
const invStore = useInventoryStore();

const activeCategory = ref<'all' | 'eggs' | 'food'>('all');
const feedbackMessage = ref<string | null>(null);
const feedbackType = ref<'success' | 'warning' | 'info'>('info');

const filteredItems = computed(() => {
  return invStore.itemsByCategory(activeCategory.value);
});

function showFeedback(msg: string, type: 'success' | 'warning' | 'info' = 'info') {
  feedbackMessage.value = msg;
  feedbackType.value = type;
}

function handlePlaceEgg(itemId: string) {
  const emptySlot = gameStore.incubatorSlots.find((s) => s.state === 'EMPTY');
  if (!emptySlot) {
    showFeedback('Tất cả tổ ấp đều đang bận, hãy đợi hoặc ấp nở trứng trước nhé!', 'warning');
    return;
  }

  const success = gameStore.placeEggInIncubator(emptySlot.slotId, itemId);
  if (success) {
    showFeedback(`Đã đặt trứng vào tổ ấp #${emptySlot.slotId}!`, 'success');
  } else {
    showFeedback('Không thể đặt trứng vào tổ ấp.', 'warning');
  }
}

function handleFeedPenguin(itemId: string) {
  const count = invStore.getItemCount(itemId);
  if (count <= 0) {
    showFeedback('Hết cá rồi! Hãy kiếm thêm cá nhé.', 'warning');
    return;
  }

  const targetPenguin = gameStore.selectedPenguin ?? gameStore.ownedPenguins[0];
  if (!targetPenguin) {
    showFeedback('Chưa có chim cánh cụt nào trên đảo.', 'info');
    return;
  }

  const success = gameStore.feedPenguin(targetPenguin.id);
  if (success) {
    gameBridge.emit('penguin:action', {
      ownedId: targetPenguin.id,
      action: 'feed',
    });
    showFeedback(`Đã cho ${targetPenguin.nickname} ăn 1 con cá ngon lành!`, 'success');
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

.inventory-dialog {
  width: 100%;
  max-width: 620px;
  max-height: 85vh;
  background: linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%);
  border: 3px solid #F59E0B;
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
  background: linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%);
  border-bottom: 2px solid #F59E0B;
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
  color: #92400E;
  margin: 0;
}

.modal-close-btn {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: none;
  background: #FFFFFF;
  color: #78350F;
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

/* Feedback Toast */
.feedback-toast {
  margin: 10px 16px 0;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 0.88rem;
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
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Tabs */
.tabs-bar {
  display: flex;
  gap: 8px;
  padding: 12px 16px 8px;
  border-bottom: 1px solid #E2E8F0;
}

.tab-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 14px;
  border: 2px solid transparent;
  background: #F1F5F9;
  color: #64748B;
  font-family: inherit;
  font-weight: 800;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  background: #E2E8F0;
  color: #334155;
}

.tab-btn.is-active {
  background: #FEF3C7;
  border-color: #F59E0B;
  color: #92400E;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.2);
}

/* Inventory Body & Grid */
.inventory-body {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 16px;
  color: #94A3B8;
  gap: 8px;
}

.empty-icon {
  font-size: 2.2rem;
}

.empty-text {
  font-size: 0.92rem;
  font-weight: 600;
}

.items-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: #FFFFFF;
  border: 2px solid #E2E8F0;
  border-radius: 18px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.item-card:hover {
  border-color: #F59E0B;
  transform: translateY(-2px);
}

.item-card__icon-box {
  position: relative;
  width: 52px;
  height: 52px;
  background: #FEF9C3;
  border: 2px solid #FDE047;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-emoji {
  font-size: 1.8rem;
}

.item-card__quantity {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: #0284C7;
  color: #FFFFFF;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 999px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.item-card__info {
  flex: 1;
  min-width: 0;
}

.item-card__name {
  font-size: 0.98rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 2px;
}

.item-card__desc {
  font-size: 0.82rem;
  color: #64748B;
  margin: 0;
  line-height: 1.3;
}

.item-card__actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn-item-action {
  padding: 8px 14px;
  border-radius: 12px;
  border: none;
  font-family: inherit;
  font-weight: 800;
  font-size: 0.82rem;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.btn-item-action:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
}

.btn-item-action--egg {
  background: linear-gradient(180deg, #38BDF8 0%, #0284C7 100%);
  color: #FFFFFF;
}

.btn-item-action--food {
  background: linear-gradient(180deg, #34D399 0%, #059669 100%);
  color: #FFFFFF;
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

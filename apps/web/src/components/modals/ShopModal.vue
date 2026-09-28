<template>
  <div
    class="modal-backdrop"
    data-testid="shop-modal-backdrop"
    @pointerdown.stop
    @pointerup.stop
    @mousedown.stop
    @mouseup.stop
    @click.self.stop="emit('close')"
  >
    <div
      class="shop-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Cửa Hàng Đảo Tuyết"
      @pointerdown.stop
      @pointerup.stop
      @mousedown.stop
      @mouseup.stop
      @click.stop
    >
      <!-- Header -->
      <div class="shop-header">
        <div class="shop-header__title-group">
          <span class="shop-header__icon">🛍️</span>
          <div>
            <h2 class="shop-header__title">Cửa Hàng Đảo Tuyết</h2>
            <p class="shop-header__sub">Sắm sửa thức ăn, trứng quý và đồ trang trí ấm cúng!</p>
          </div>
        </div>

        <div class="shop-header__right">
          <div class="currency-chips">
            <span class="chip chip--coin" data-testid="shop-coin-balance">🪙 {{ gameStore.currencies.coins.toLocaleString() }}</span>
            <span class="chip chip--gem" data-testid="shop-gem-balance">💎 {{ gameStore.currencies.gems.toLocaleString() }}</span>
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
      </div>

      <!-- Category Tabs -->
      <div class="shop-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'food' }"
          data-testid="tab-food"
          @click="activeTab = 'food'"
        >
          🐟 Thức Ăn
        </button>
        <button
          type="button"
          role="tab"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'eggs' }"
          data-testid="tab-eggs"
          @click="activeTab = 'eggs'"
        >
          🐣 Trứng Cánh Cụt
        </button>
        <button
          type="button"
          role="tab"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'decorations' }"
          data-testid="tab-decorations"
          @click="activeTab = 'decorations'"
        >
          🎄 Đồ Trang Trí
        </button>
      </div>

      <!-- Feedback Banner -->
      <div v-if="feedback" class="shop-feedback" :class="`shop-feedback--${feedbackType}`">
        {{ feedback }}
      </div>

      <!-- Item Grid -->
      <div class="items-grid" data-testid="shop-items-grid">
        <!-- 1. FOOD TAB -->
        <template v-if="activeTab === 'food'">
          <div
            v-for="item in foodItems"
            :key="item.id"
            class="shop-card"
            :class="{ 'shop-card--locked': gameStore.player.level < item.playerLevelRequired }"
            :data-testid="`shop-item-${item.id}`"
          >
            <div class="shop-card__badge" v-if="gameStore.player.level < item.playerLevelRequired">
              🔒 Yêu cầu Lv. {{ item.playerLevelRequired }}
            </div>
            <div class="shop-card__icon">{{ item.icon }}</div>
            <div class="shop-card__name">{{ item.name }}</div>
            <div class="shop-card__desc">{{ item.description }}</div>
            <div class="shop-card__stats">
              <span class="stat-tag">No: -{{ item.hungerReduction }}</span>
              <span class="stat-tag stat-tag--happy">Vui: +{{ item.happinessBonus }}</span>
            </div>
            <div class="shop-card__bottom">
              <span class="price-tag">🪙 {{ item.coinPrice }} Vàng</span>
              <button
                type="button"
                class="btn-buy"
                :disabled="!canBuyFood(item)"
                :data-testid="`btn-buy-${item.id}`"
                @click="buyFood(item)"
              >
                Mua (x1)
              </button>
            </div>
          </div>
        </template>

        <!-- 2. EGGS TAB -->
        <template v-else-if="activeTab === 'eggs'">
          <div
            v-for="egg in eggItems"
            :key="egg.id"
            class="shop-card"
            :class="{ 'shop-card--locked': gameStore.player.level < egg.playerLevelRequired }"
            :data-testid="`shop-item-${egg.id}`"
          >
            <div class="shop-card__badge" v-if="gameStore.player.level < egg.playerLevelRequired">
              🔒 Yêu cầu Lv. {{ egg.playerLevelRequired }}
            </div>
            <div class="shop-card__icon">{{ egg.icon }}</div>
            <div class="shop-card__name">{{ egg.name }}</div>
            <div class="shop-card__desc">{{ egg.description }}</div>
            <div class="shop-card__stats">
              <span class="stat-tag">⏱️ {{ Math.round(egg.incubationSeconds / 60) }} phút</span>
            </div>
            <div class="shop-card__bottom">
              <span class="price-tag">
                <template v-if="egg.priceGems">💎 {{ egg.priceGems }} Kim Cương</template>
                <template v-else>🪙 {{ egg.priceCoins }} Vàng</template>
              </span>
              <button
                type="button"
                class="btn-buy"
                :disabled="!canBuyEgg(egg)"
                :data-testid="`btn-buy-${egg.id}`"
                @click="buyEgg(egg)"
              >
                Mua (x1)
              </button>
            </div>
          </div>
        </template>

        <!-- 3. DECORATIONS TAB -->
        <template v-else-if="activeTab === 'decorations'">
          <div
            v-for="dec in decorItems"
            :key="dec.id"
            class="shop-card"
            :class="{ 'shop-card--locked': gameStore.player.level < dec.playerLevelRequired }"
            :data-testid="`shop-item-${dec.id}`"
          >
            <div class="shop-card__badge" v-if="gameStore.player.level < dec.playerLevelRequired">
              🔒 Yêu cầu Lv. {{ dec.playerLevelRequired }}
            </div>
            <div class="shop-card__icon">🏡</div>
            <div class="shop-card__name">{{ dec.name }}</div>
            <div class="shop-card__desc">{{ dec.description }}</div>
            <div class="shop-card__stats">
              <span class="stat-tag stat-tag--cozy">✨ +{{ dec.cozyPoints }} Điểm Ấm Cúng</span>
            </div>
            <div class="shop-card__bottom">
              <span class="price-tag">
                🪙 {{ dec.priceCoins }} Vàng
                <span v-if="dec.priceGems"> + 💎 {{ dec.priceGems }}</span>
              </span>
              <button
                type="button"
                class="btn-buy"
                :disabled="!canBuyDecor(dec)"
                :data-testid="`btn-buy-${dec.id}`"
                @click="buyDecor(dec)"
              >
                Mua (x1)
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { FoodItemDefinition, EggShopDefinition, DecorationDefinition } from '@penguin/types';
import { FOOD_CATALOG, EGG_CATALOG, DECORATION_CATALOG } from '@penguin/game-data';
import { useGameStore } from '../../stores/gameStore';
import { useShopStore } from '../../stores/shopStore';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const gameStore = useGameStore();
const shopStore = useShopStore();

type ShopTab = 'food' | 'eggs' | 'decorations';
const activeTab = ref<ShopTab>('food');
const feedback = ref<string | null>(null);
const feedbackType = ref<'success' | 'error'>('success');

const foodItems = computed(() => Object.values(FOOD_CATALOG));
const eggItems = computed(() => Object.values(EGG_CATALOG));
const decorItems = computed(() => Object.values(DECORATION_CATALOG));

function setFeedback(msg: string, type: 'success' | 'error' = 'success') {
  feedback.value = msg;
  feedbackType.value = type;
  setTimeout(() => {
    if (feedback.value === msg) {
      feedback.value = null;
    }
  }, 3000);
}

function canBuyFood(item: FoodItemDefinition): boolean {
  if (gameStore.player.level < item.playerLevelRequired) return false;
  return gameStore.currencies.coins >= item.coinPrice;
}

function buyFood(item: FoodItemDefinition) {
  const success = shopStore.buyFood(item.id, 1);
  if (success) {
    setFeedback(`Mua thành công 1 ${item.name}!`, 'success');
  } else {
    setFeedback('Không thể mua vật phẩm!', 'error');
  }
}

function canBuyEgg(egg: EggShopDefinition): boolean {
  if (gameStore.player.level < egg.playerLevelRequired) return false;
  if (egg.priceGems) {
    return gameStore.currencies.gems >= egg.priceGems;
  }
  return gameStore.currencies.coins >= egg.priceCoins;
}

function buyEgg(egg: EggShopDefinition) {
  const success = shopStore.buyEgg(egg.id, 1);
  if (success) {
    setFeedback(`Mua thành công 1 ${egg.name}!`, 'success');
  } else {
    setFeedback('Không thể mua trứng!', 'error');
  }
}

function canBuyDecor(dec: DecorationDefinition): boolean {
  if (gameStore.player.level < dec.playerLevelRequired) return false;
  if (gameStore.currencies.coins < dec.priceCoins) return false;
  if (dec.priceGems && gameStore.currencies.gems < dec.priceGems) return false;
  return true;
}

function buyDecor(dec: DecorationDefinition) {
  const success = shopStore.buyDecoration(dec.id, 1);
  if (success) {
    setFeedback(`Mua thành công 1 ${dec.name}!`, 'success');
  } else {
    setFeedback('Không thể mua đồ trang trí!', 'error');
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

.shop-dialog {
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

.shop-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shop-header__title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shop-header__icon {
  font-size: 2.2rem;
}

.shop-header__title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.shop-header__sub {
  margin: 2px 0 0 0;
  font-size: 0.85rem;
  color: #64748b;
}

.shop-header__right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.currency-chips {
  display: flex;
  gap: 8px;
}

.chip {
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.85rem;
}

.chip--coin {
  background: #fef9c3;
  color: #854d0e;
  border: 1px solid #fde047;
}

.chip--gem {
  background: #ede9fe;
  color: #6b21a8;
  border: 1px solid #ddd6fe;
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

.shop-tabs {
  display: flex;
  padding: 12px 24px;
  gap: 10px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.tab-btn {
  padding: 8px 18px;
  border: none;
  background: transparent;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.tab-btn--active {
  background: #0284c7;
  color: #ffffff;
}

.tab-btn--active:hover {
  background: #0369a1;
  color: #ffffff;
}

.shop-feedback {
  padding: 8px 24px;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
}

.shop-feedback--success {
  background: #dcfce7;
  color: #166534;
}

.shop-feedback--error {
  background: #fee2e2;
  color: #991b1b;
}

.items-grid {
  padding: 20px 24px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 16px;
}

.shop-card {
  position: relative;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  transition: transform 0.15s, box-shadow 0.15s;
}

.shop-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
}

.shop-card--locked {
  opacity: 0.65;
  background: #f1f5f9;
}

.shop-card__badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.shop-card__icon {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 8px;
}

.shop-card__name {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  text-align: center;
  margin-bottom: 4px;
}

.shop-card__desc {
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
  margin-bottom: 10px;
  flex: 1;
}

.shop-card__stats {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 12px;
}

.stat-tag {
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 6px;
}

.stat-tag--happy {
  background: #fce7f3;
  color: #be185d;
}

.stat-tag--cozy {
  background: #fef3c7;
  color: #b45309;
}

.shop-card__bottom {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
}

.price-tag {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  text-align: center;
}

.btn-buy {
  background: #0284c7;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 8px 12px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-buy:hover:not(:disabled) {
  background: #0369a1;
}

.btn-buy:disabled {
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

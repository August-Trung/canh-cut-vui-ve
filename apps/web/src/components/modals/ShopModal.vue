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
      <!-- Market Awning Canopy (Striped Scalloped Roof) -->
      <div class="shop-awning" aria-hidden="true">
        <div class="shop-awning__stripes"></div>
        <div class="shop-awning__scallop"></div>
      </div>

      <!-- Header -->
      <div class="shop-header">
        <div class="shop-header__title-group">
          <GameIcon name="shop" size="sm" class="shop-header__icon" />
          <div>
            <h2 class="shop-header__title">Cửa Hàng Đảo Băng</h2>
            <p class="shop-header__sub">Sắm sửa thức ăn, trứng quý và đồ trang trí ấm cúng!</p>
          </div>
        </div>

        <div class="shop-header__right">
          <div class="currency-chips">
            <span class="chip chip--coin" data-testid="shop-coin-balance">
              <GameIcon name="coin" size="xs" />
              <span>{{ gameStore.currencies.coins.toLocaleString() }}</span>
            </span>
            <span class="chip chip--gem" data-testid="shop-gem-balance">
              <GameIcon name="gem" size="xs" />
              <span>{{ gameStore.currencies.gems.toLocaleString() }}</span>
            </span>
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
            <span class="close-x">✕</span>
          </button>
        </div>
      </div>

      <!-- Category Tabs (Chunky Cartoon Tabs) -->
      <div class="shop-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'food' }"
          data-testid="tab-food"
          @click="activeTab = 'food'"
        >
          <GameIcon name="fish" size="xs" />
          <span>Thức Ăn</span>
        </button>
        <button
          type="button"
          role="tab"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'eggs' }"
          data-testid="tab-eggs"
          @click="activeTab = 'eggs'"
        >
          <GameIcon name="hatch" size="xs" />
          <span>Trứng Cánh Cụt</span>
        </button>
        <button
          type="button"
          role="tab"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'decorations' }"
          data-testid="tab-decorations"
          @click="activeTab = 'decorations'"
        >
          <GameIcon name="decorate" size="xs" />
          <span>Đồ Trang Trí</span>
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
              <GameIcon name="lock" size="xs" /> Yêu cầu Lv. {{ item.playerLevelRequired }}
            </div>
            <div class="shop-card__stars">★★★☆☆</div>
            <div class="shop-card__icon">
              <GameIcon :name="item.icon" size="lg" />
            </div>
            <div class="shop-card__name">{{ item.name }}</div>
            <div class="shop-card__desc">{{ item.description }}</div>
            <div class="shop-card__stats">
              <span class="stat-tag">No: -{{ item.hungerReduction }}</span>
              <span class="stat-tag stat-tag--happy">Vui: +{{ item.happinessBonus }}</span>
            </div>
            <div class="shop-card__bottom">
              <span class="price-tag">
                <GameIcon name="coin" size="xs" /> {{ item.coinPrice }} Vàng
              </span>
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
              <GameIcon name="lock" size="xs" /> Yêu cầu Lv. {{ egg.playerLevelRequired }}
            </div>
            <div class="shop-card__stars">★★★★☆</div>
            <div class="shop-card__icon">
              <GameIcon :name="egg.icon" size="lg" />
            </div>
            <div class="shop-card__name">{{ egg.name }}</div>
            <div class="shop-card__desc">{{ egg.description }}</div>
            <div class="shop-card__stats">
              <span class="stat-tag">
                <GameIcon name="calendar" size="xs" /> {{ Math.round(egg.incubationSeconds / 60) }} phút
              </span>
            </div>
            <div class="shop-card__bottom">
              <span class="price-tag">
                <template v-if="egg.priceGems">
                  <GameIcon name="gem" size="xs" /> {{ egg.priceGems }} Kim Cương
                </template>
                <template v-else>
                  <GameIcon name="coin" size="xs" /> {{ egg.priceCoins }} Vàng
                </template>
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
              <GameIcon name="lock" size="xs" /> Yêu cầu Lv. {{ dec.playerLevelRequired }}
            </div>
            <div class="shop-card__stars">★★★☆☆</div>
            <div class="shop-card__icon">
              <GameIcon name="decorate" size="lg" />
            </div>
            <div class="shop-card__name">{{ dec.name }}</div>
            <div class="shop-card__desc">{{ dec.description }}</div>
            <div class="shop-card__stats">
              <span class="stat-tag stat-tag--cozy">
                <GameIcon name="star" size="xs" /> +{{ dec.cozyPoints }} Điểm Ấm Cúng
              </span>
            </div>
            <div class="shop-card__bottom">
              <span class="price-tag">
                <GameIcon name="coin" size="xs" /> {{ dec.priceCoins }} Vàng
                <span v-if="dec.priceGems"> + <GameIcon name="gem" size="xs" /> {{ dec.priceGems }}</span>
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
import GameIcon from '../common/GameIcon.vue';

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
    feedback.value = null;
  }, 2500);
}

function canBuyFood(item: FoodItemDefinition): boolean {
  if (gameStore.player.level < item.playerLevelRequired) return false;
  return gameStore.currencies.coins >= item.coinPrice;
}

function buyFood(item: FoodItemDefinition) {
  if (!canBuyFood(item)) {
    setFeedback('Không đủ điều kiện mua!', 'error');
    return;
  }
  const ok = shopStore.buyFood(item.id, 1);
  if (ok) {
    setFeedback(`Đã mua 1x ${item.name}!`, 'success');
  } else {
    setFeedback('Không đủ tiền!', 'error');
  }
}

function canBuyEgg(egg: EggShopDefinition): boolean {
  if (gameStore.player.level < egg.playerLevelRequired) return false;
  if (egg.priceGems && gameStore.currencies.gems < egg.priceGems) return false;
  if (egg.priceCoins && gameStore.currencies.coins < egg.priceCoins) return false;
  return true;
}

function buyEgg(egg: EggShopDefinition) {
  if (!canBuyEgg(egg)) {
    setFeedback('Không đủ tiền hoặc cấp độ!', 'error');
    return;
  }
  const ok = shopStore.buyEgg(egg.id);
  if (ok) {
    setFeedback(`Đã mua ${egg.name}! Đã thêm vào túi đồ.`, 'success');
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
  if (!canBuyDecor(dec)) {
    setFeedback('Không đủ tiền hoặc cấp độ!', 'error');
    return;
  }
  const ok = shopStore.buyDecoration(dec.id);
  if (ok) {
    setFeedback(`Đã mua ${dec.name}! Đã thêm vào kho trang trí.`, 'success');
  } else {
    setFeedback('Không thể mua trang trí!', 'error');
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.15s ease-out;
}

/* Warm Beige Board with 4px Double Wooden Border (Zing Me Style) */
.shop-dialog {
  background: #FBF6EB;
  border: 4px solid #6B3E1B;
  border-radius: 20px;
  width: 100%;
  max-width: 780px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 20px 48px rgba(0, 0, 0, 0.45),
    inset 0 0 0 2px #FFF9E6,
    inset 0 -3px 6px rgba(107, 62, 27, 0.2);
  animation: slideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

/* Market Awning Canopy (Striped Scalloped Roof) */
.shop-awning {
  position: relative;
  width: 100%;
  height: 18px;
  background: repeating-linear-gradient(
    90deg,
    #F43F5E 0px,
    #F43F5E 24px,
    #FFFFFF 24px,
    #FFFFFF 48px
  );
  border-bottom: 2px solid #E11D48;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.shop-header {
  padding: 10px 16px;
  background: linear-gradient(180deg, #F5E6CA 0%, #E8D2AC 100%);
  border-bottom: 3px solid #6B3E1B;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.shop-header__title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.shop-header__icon {
  font-size: 1.8rem;
}

.shop-header__title {
  margin: 0;
  font-family: 'Quicksand', 'Nunito', sans-serif;
  font-size: 1.15rem;
  font-weight: 900;
  color: #451A03;
  letter-spacing: 0.02em;
}

.shop-header__sub {
  margin: 1px 0 0 0;
  font-size: 0.76rem;
  color: #78350F;
  font-weight: 700;
}

.shop-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.currency-chips {
  display: flex;
  gap: 6px;
}

.chip {
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.chip--coin {
  background: #FFFBEB;
  color: #B45309;
  border: 1.5px solid #F59E0B;
}

.chip--gem {
  background: #F5F3FF;
  color: #7C3AED;
  border: 1.5px solid #C4B5FD;
}

/* Wooden Close Button */
.modal-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 2px solid #451A03;
  border-top-color: #FDE68A;
  background: linear-gradient(180deg, #A16207 0%, #78350F 100%);
  color: #FFFFFF;
  font-weight: 900;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.modal-close-btn:hover {
  transform: scale(1.08);
  filter: brightness(1.15);
}

.close-x {
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

/* Chunky Cartoon Tabs */
.shop-tabs {
  display: flex;
  padding: 8px 14px;
  gap: 8px;
  background: #EFE5D0;
  border-bottom: 2px solid #E5D5BA;
}

.tab-btn {
  padding: 6px 14px;
  border: 2px solid #D5C4A1;
  background: #F5EADB;
  border-radius: 12px;
  font-family: inherit;
  font-weight: 800;
  font-size: 0.84rem;
  color: #78350F;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
}

.tab-btn:hover {
  background: #E8D8BD;
  border-color: #B45309;
}

.tab-btn--active {
  background: linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%);
  border-color: #B45309;
  color: #451A03;
  box-shadow: 0 2px 5px rgba(180, 83, 9, 0.25);
}

.shop-feedback {
  padding: 6px 14px;
  font-size: 0.82rem;
  font-weight: 800;
  text-align: center;
}

.shop-feedback--success {
  background: #DCFCE7;
  color: #15803D;
  border-bottom: 2px solid #86EFAC;
}

.shop-feedback--error {
  background: #FEE2E2;
  color: #B91C1C;
  border-bottom: 2px solid #FCA5A5;
}

.items-grid {
  padding: 14px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

/* Warm White Shop Card Tile */
.shop-card {
  position: relative;
  background: #FFFDF5;
  border: 2px solid #E2C8A2;
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.15s, border-color 0.15s;
}

.shop-card:hover {
  transform: translateY(-2px);
  border-color: #B45309;
  box-shadow: 0 6px 12px rgba(180, 83, 9, 0.15);
}

.shop-card--locked {
  opacity: 0.7;
  background: #F5EADB;
}

.shop-card__badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #FEE2E2;
  color: #B91C1C;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid #FCA5A5;
  display: flex;
  align-items: center;
  gap: 3px;
}

.shop-card__stars {
  font-size: 0.72rem;
  color: #F59E0B;
  text-align: center;
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.shop-card__icon {
  font-size: 2.2rem;
  text-align: center;
  margin-bottom: 6px;
}

.shop-card__name {
  font-size: 0.94rem;
  font-weight: 800;
  color: #451A03;
  text-align: center;
  margin-bottom: 2px;
}

.shop-card__desc {
  font-size: 0.74rem;
  color: #78350F;
  text-align: center;
  margin-bottom: 8px;
  flex: 1;
}

.shop-card__stats {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-bottom: 8px;
}

.stat-tag {
  background: #E0F2FE;
  color: #0369A1;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.stat-tag--happy {
  background: #FCE7F3;
  color: #BE185D;
}

.stat-tag--cozy {
  background: #FEF3C7;
  color: #B45309;
}

.shop-card__bottom {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: auto;
}

.price-tag {
  font-size: 0.82rem;
  font-weight: 800;
  color: #451A03;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.btn-buy {
  background: linear-gradient(180deg, #4ADE80 0%, #16A34A 100%);
  color: #FFFFFF;
  border: 1.5px solid #15803D;
  border-radius: 10px;
  padding: 7px 12px;
  font-family: inherit;
  font-weight: 800;
  font-size: 0.82rem;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s, filter 0.15s;
}

.btn-buy:hover:not(:disabled) {
  transform: scale(1.03);
  filter: brightness(1.08);
}

.btn-buy:disabled {
  background: #CBD5E1;
  border-color: #94A3B8;
  color: #64748B;
  cursor: not-allowed;
  box-shadow: none;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(12px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
</style>

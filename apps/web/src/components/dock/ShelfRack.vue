<template>
  <div class="shelf-cabinet" role="toolbar" aria-label="Thanh công cụ chính">
    <!-- Top snow/ice frosting decor on the cabinet -->
    <div class="shelf-cabinet__snow-cap" aria-hidden="true">
      <svg class="shelf-cabinet__snow-svg" viewBox="0 0 260 12" preserveAspectRatio="none">
        <path
          d="M0,0 Q15,10 30,3 Q50,11 75,2 Q100,12 130,4 Q160,11 190,3 Q215,12 240,4 Q250,9 260,0 L260,0 L0,0 Z"
          fill="#FFFFFF"
          opacity="0.95"
        />
        <path
          d="M0,0 Q18,8 35,2 Q60,9 90,3 Q120,10 150,2 Q180,9 210,2 Q235,9 260,0"
          stroke="#BAE6FD"
          stroke-width="1.5"
          fill="none"
        />
      </svg>
    </div>

    <!-- Wooden 2-Tier Cabinet Body -->
    <div class="shelf-cabinet__box">
      <!-- Tier 1: Main Gameplay Features -->
      <div class="shelf-cabinet__row shelf-cabinet__row--top">
        <!-- 1. Túi Đồ (Inventory) -->
        <button
          type="button"
          class="shelf-btn shelf-btn--inventory"
          data-testid="btn-inventory"
          title="Túi Đồ"
          aria-label="Túi Đồ"
          @click="emit('open-inventory')"
        >
          <div class="shelf-btn__icon-plate">
            <GameIcon name="inventory" size="sm" alt="Túi Đồ" />
          </div>
          <span class="shelf-btn__label">Túi Đồ</span>
        </button>

        <!-- 2. Bộ Sưu Tập (Collection Book) -->
        <button
          type="button"
          class="shelf-btn shelf-btn--collection"
          data-testid="btn-collection"
          title="Bộ Sưu Tập"
          aria-label="Bộ Sưu Tập"
          @click="emit('open-collection')"
        >
          <div class="shelf-btn__icon-plate">
            <GameIcon name="collection" size="sm" alt="Bộ Sưu Tập" />
          </div>
          <span class="shelf-btn__label">Bộ Sưu Tập</span>
        </button>

        <!-- 3. Ấp Trứng (Hatchery Nest) -->
        <button
          type="button"
          class="shelf-btn shelf-btn--hatchery"
          data-testid="btn-hatchery"
          title="Ấp Trứng"
          aria-label="Ấp Trứng"
          @click="emit('open-hatchery')"
        >
          <div class="shelf-btn__icon-plate">
            <GameIcon name="hatchery" size="sm" alt="Ấp Trứng" />
          </div>
          <span class="shelf-btn__label">Ấp Trứng</span>
        </button>

        <!-- 4. Phối Giống (Breeding) -->
        <button
          type="button"
          class="shelf-btn shelf-btn--breeding"
          data-testid="btn-breeding"
          title="Phối Giống"
          aria-label="Phối Giống"
          @click="emit('open-breeding')"
        >
          <div class="shelf-btn__icon-plate">
            <GameIcon name="pet" size="sm" alt="Phối Giống" />
          </div>
          <span class="shelf-btn__label">Phối Giống</span>
        </button>
      </div>

      <!-- Wooden Tier Divider Beam -->
      <div class="shelf-cabinet__divider" aria-hidden="true"></div>

      <!-- Tier 2: World, Shop, Quest & System -->
      <div class="shelf-cabinet__row shelf-cabinet__row--bottom">
        <!-- 5. Cửa Hàng (Shop) -->
        <button
          type="button"
          class="shelf-btn shelf-btn--shop"
          data-testid="btn-shop"
          title="Cửa Hàng"
          aria-label="Cửa Hàng"
          @click="emit('open-shop')"
        >
          <div class="shelf-btn__icon-plate">
            <GameIcon name="shop" size="sm" alt="Cửa Hàng" />
          </div>
          <span class="shelf-btn__label">Cửa Hàng</span>
        </button>

        <!-- 6. Nhiệm Vụ (Quests) -->
        <button
          type="button"
          class="shelf-btn shelf-btn--quests"
          data-testid="btn-quests"
          title="Nhiệm Vụ"
          aria-label="Nhiệm Vụ"
          @click="emit('open-quests')"
        >
          <div class="shelf-btn__icon-plate">
            <GameIcon name="quests" size="sm" alt="Nhiệm Vụ" />
          </div>
          <span class="shelf-btn__label">Nhiệm Vụ</span>
        </button>

        <!-- 7. Cài Đặt (Settings) -->
        <button
          type="button"
          class="shelf-btn shelf-btn--settings"
          data-testid="btn-settings"
          title="Cài Đặt"
          aria-label="Cài Đặt"
          @click="emit('open-settings')"
        >
          <div class="shelf-btn__icon-plate">
            <GameIcon name="settings" size="sm" alt="Cài Đặt" />
          </div>
          <span class="shelf-btn__label">Cài Đặt</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GameIcon from '../common/GameIcon.vue';

const emit = defineEmits<{
  (e: 'open-inventory'): void;
  (e: 'open-collection'): void;
  (e: 'open-hatchery'): void;
  (e: 'open-breeding'): void;
  (e: 'open-shop'): void;
  (e: 'open-quests'): void;
  (e: 'open-settings'): void;
}>();
</script>

<style scoped>
.shelf-cabinet {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
  user-select: none;
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.45));
}

/* Snow Cap on Top of Wooden Shelf */
.shelf-cabinet__snow-cap {
  width: 96%;
  height: 10px;
  position: relative;
  z-index: 2;
  margin-bottom: -4px;
  pointer-events: none;
}

.shelf-cabinet__snow-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Wooden Cabinet Box */
.shelf-cabinet__box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 10px 8px;
  background: linear-gradient(180deg, #A16207 0%, #78350F 55%, #451A03 100%);
  border: 3px solid #D97706;
  border-top-color: #FDE68A;
  border-bottom-color: #451A03;
  border-radius: 16px;
  box-shadow:
    inset 0 2px 3px rgba(254, 240, 138, 0.45),
    inset 0 -3px 6px rgba(0, 0, 0, 0.6),
    0 4px 12px rgba(0, 0, 0, 0.4);
  position: relative;
}

/* Brass Rivets in cabinet corners */
.shelf-cabinet__box::before,
.shelf-cabinet__box::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #FDE68A;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.7), inset 0 1px 1px #FFFFFF;
}

.shelf-cabinet__box::before {
  top: 5px;
  left: 6px;
}

.shelf-cabinet__box::after {
  top: 5px;
  right: 6px;
}

/* Rows */
.shelf-cabinet__row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Divider wooden beam between 2 tiers */
.shelf-cabinet__divider {
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #78350F 0%, #D97706 50%, #78350F 100%);
  border-top: 1px solid #FDE68A;
  border-bottom: 1px solid #451A03;
  border-radius: 2px;
  margin: 1px 0;
  opacity: 0.85;
}

/* Action Buttons */
.shelf-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 1px 3px;
  border-radius: 12px;
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.15s ease;
  outline: none;
}

.shelf-btn:hover {
  transform: translateY(-2px) scale(1.05);
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35));
}

.shelf-btn:active {
  transform: translateY(1px) scale(0.96);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.shelf-btn:focus-visible {
  outline: 2px solid #FDE047;
  outline-offset: 2px;
}

/* Button Icon Plate: Square warm cream tactile tile with golden-brown border */
.shelf-btn__icon-plate {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(180deg, #FFFFFF 0%, #FEF3C7 50%, #FDE68A 100%);
  border: 2px solid #D97706;
  border-top-color: #FEF9C3;
  border-bottom-color: #92400E;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 2px 5px rgba(0, 0, 0, 0.35),
    inset 0 1px 2px rgba(255, 255, 255, 0.9);
  transition: all 0.15s ease;
}

.shelf-btn--inventory:hover .shelf-btn__icon-plate {
  background: linear-gradient(180deg, #FEF9C3 0%, #FDE047 100%);
  border-color: #B45309;
}

.shelf-btn--collection:hover .shelf-btn__icon-plate {
  background: linear-gradient(180deg, #EFF6FF 0%, #BFDBFE 100%);
  border-color: #2563EB;
}

.shelf-btn--hatchery:hover .shelf-btn__icon-plate {
  background: linear-gradient(180deg, #F0FDF4 0%, #BBF7D0 100%);
  border-color: #16A34A;
}

.shelf-btn--breeding:hover .shelf-btn__icon-plate {
  background: linear-gradient(180deg, #FFF1F2 0%, #FECDD3 100%);
  border-color: #E11D48;
}

.shelf-btn--shop:hover .shelf-btn__icon-plate {
  background: linear-gradient(180deg, #FEF2F2 0%, #FED7AA 100%);
  border-color: #EA580C;
}

.shelf-btn--quests:hover .shelf-btn__icon-plate {
  background: linear-gradient(180deg, #FAF5FF 0%, #E9D5FF 100%);
  border-color: #9333EA;
}

.shelf-btn--settings:hover .shelf-btn__icon-plate {
  background: linear-gradient(180deg, #F8FAFC 0%, #CBD5E1 100%);
  border-color: #475569;
}

/* Button Label */
.shelf-btn__label {
  font-family: 'Quicksand', 'Nunito', system-ui, sans-serif;
  font-weight: 800;
  font-size: 0.72rem;
  color: #FEF3C7;
  letter-spacing: 0.01em;
  text-shadow:
    -1px -1px 0 #451A03,
    1px -1px 0 #451A03,
    -1px 1px 0 #451A03,
    1px 1px 0 #451A03,
    0 2px 3px rgba(0, 0, 0, 0.85);
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 640px) {
  .shelf-cabinet__box {
    gap: 3px;
    padding: 4px 6px 6px;
    border-radius: 14px;
  }

  .shelf-cabinet__row {
    gap: 4px;
  }

  .shelf-btn__icon-plate {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .shelf-btn__label {
    font-size: 0.64rem;
  }
}

@media (max-width: 420px) {
  .shelf-cabinet__row {
    gap: 2px;
  }

  .shelf-btn__icon-plate {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }

  .shelf-btn__label {
    font-size: 0.58rem;
  }
}
</style>

<template>
  <div class="shelf-rack" role="toolbar" aria-label="Thanh công cụ chính">
    <!-- Top snow/ice frosting decor on the shelf -->
    <div class="shelf-rack__snow-cap" aria-hidden="true">
      <svg class="shelf-rack__snow-svg" viewBox="0 0 400 12" preserveAspectRatio="none">
        <path
          d="M0,0 Q20,10 40,3 Q60,11 85,2 Q110,12 140,4 Q170,11 200,3 Q230,12 260,4 Q290,11 320,3 Q350,12 375,4 Q390,10 400,0 L400,0 L0,0 Z"
          fill="#FFFFFF"
          opacity="0.95"
        />
        <path
          d="M0,0 Q25,8 50,2 Q80,9 110,3 Q140,10 170,2 Q200,9 230,2 Q265,10 300,2 Q340,9 370,3 Q390,7 400,0"
          stroke="#BAE6FD"
          stroke-width="1.5"
          fill="none"
        />
      </svg>
    </div>

    <!-- Wooden Shelf Body -->
    <div class="shelf-rack__wood-board">
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
          <GameIcon name="inventory" size="md" alt="Túi Đồ" />
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
          <GameIcon name="collection" size="md" alt="Bộ Sưu Tập" />
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
          <GameIcon name="hatchery" size="md" alt="Ấp Trứng" />
        </div>
        <span class="shelf-btn__label">Ấp Trứng</span>
      </button>

      <!-- 4. Cửa Hàng (Shop) -->
      <button
        type="button"
        class="shelf-btn shelf-btn--shop"
        data-testid="btn-shop"
        title="Cửa Hàng"
        aria-label="Cửa Hàng"
        @click="emit('open-shop')"
      >
        <div class="shelf-btn__icon-plate">
          <GameIcon name="shop" size="md" alt="Cửa Hàng" />
        </div>
        <span class="shelf-btn__label">Cửa Hàng</span>
      </button>

      <!-- 5. Nhiệm Vụ (Quests) -->
      <button
        type="button"
        class="shelf-btn shelf-btn--quests"
        data-testid="btn-quests"
        title="Nhiệm Vụ"
        aria-label="Nhiệm Vụ"
        @click="emit('open-quests')"
      >
        <div class="shelf-btn__icon-plate">
          <GameIcon name="quests" size="md" alt="Nhiệm Vụ" />
        </div>
        <span class="shelf-btn__label">Nhiệm Vụ</span>
      </button>

      <!-- 6. Cài Đặt (Settings) -->
      <button
        type="button"
        class="shelf-btn shelf-btn--settings"
        data-testid="btn-settings"
        title="Cài Đặt"
        aria-label="Cài Đặt"
        @click="emit('open-settings')"
      >
        <div class="shelf-btn__icon-plate">
          <GameIcon name="settings" size="md" alt="Cài Đặt" />
        </div>
        <span class="shelf-btn__label">Cài Đặt</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import GameIcon from '../common/GameIcon.vue';

const emit = defineEmits<{
  (e: 'open-inventory'): void;
  (e: 'open-collection'): void;
  (e: 'open-hatchery'): void;
  (e: 'open-shop'): void;
  (e: 'open-quests'): void;
  (e: 'open-settings'): void;
}>();
</script>

<style scoped>
.shelf-rack {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
  user-select: none;
}

/* Snow Cap on Top of Wooden Shelf */
.shelf-rack__snow-cap {
  width: 100%;
  height: 12px;
  position: relative;
  z-index: 2;
  margin-bottom: -5px;
  pointer-events: none;
}

.shelf-rack__snow-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Stylized Nostalgic Wooden Shelf Board */
.shelf-rack__wood-board {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 6px 20px 8px;
  background: linear-gradient(180deg, #A16207 0%, #78350F 50%, #451A03 100%);
  border: 2px solid #D97706;
  border-top-color: #FDE68A;
  border-radius: 22px;
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.35),
    inset 0 2px 4px rgba(254, 240, 138, 0.4),
    inset 0 -3px 6px rgba(0, 0, 0, 0.5);
  position: relative;
}

/* Wood grain bottom trim */
.shelf-rack__wood-board::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 16px;
  right: 16px;
  height: 2px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
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
  padding: 2px 4px;
  border-radius: 14px;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease;
  outline: none;
}

.shelf-btn:hover {
  transform: translateY(-4px) scale(1.05);
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3));
}

.shelf-btn:active {
  transform: translateY(1px) scale(0.96);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.shelf-btn:focus-visible {
  outline: 2px solid #FDE047;
  outline-offset: 3px;
}

/* Button Icon Plate */
.shelf-btn__icon-plate {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%);
  border: 2px solid #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 3px 8px rgba(0, 0, 0, 0.2),
    inset 0 2px 3px rgba(255, 255, 255, 0.9);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.shelf-btn--inventory:hover .shelf-btn__icon-plate {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border-color: #F59E0B;
}

.shelf-btn--collection:hover .shelf-btn__icon-plate {
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
  border-color: #3B82F6;
}

.shelf-btn--hatchery:hover .shelf-btn__icon-plate {
  background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%);
  border-color: #0284C7;
}

.shelf-btn--settings:hover .shelf-btn__icon-plate {
  background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%);
  border-color: #64748B;
}

.shelf-btn__icon {
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.15));
}

/* Button Label */
.shelf-btn__label {
  font-family: 'Quicksand', 'Nunito', system-ui, sans-serif;
  font-weight: 800;
  font-size: 0.78rem;
  color: #FEF3C7;
  letter-spacing: 0.02em;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.8),
    0 0 4px rgba(69, 26, 3, 0.6);
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 640px) {
  .shelf-rack__wood-board {
    gap: 8px;
    padding: 8px 14px 10px;
    border-radius: 20px;
  }

  .shelf-btn__icon-plate {
    width: 44px;
    height: 44px;
    border-radius: 14px;
  }

  .shelf-btn__icon {
    width: 28px;
    height: 28px;
  }

  .shelf-btn__label {
    font-size: 0.72rem;
  }
}

@media (max-width: 420px) {
  .shelf-rack__wood-board {
    gap: 4px;
    padding: 6px 8px 8px;
  }

  .shelf-btn__icon-plate {
    width: 38px;
    height: 38px;
    border-radius: 12px;
  }

  .shelf-btn__label {
    font-size: 0.65rem;
  }
}
</style>

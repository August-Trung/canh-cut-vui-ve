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
          <svg class="shelf-btn__icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Backpack body -->
            <rect x="5" y="9" width="22" height="20" rx="5" fill="url(#bp-body)" stroke="#92400E" stroke-width="1.5" />
            <!-- Flap -->
            <path d="M5 14C5 11 9 9 16 9C23 9 27 11 27 14L27 19C24 21 20 21 16 21C12 21 8 21 5 19Z" fill="#D97706" />
            <!-- Straps & Buckles -->
            <line x1="10" y1="14" x2="10" y2="28" stroke="#78350F" stroke-width="2" />
            <line x1="22" y1="14" x2="22" y2="28" stroke="#78350F" stroke-width="2" />
            <rect x="8.5" y="19" width="3" height="4" rx="1" fill="#FDE68A" stroke="#78350F" stroke-width="0.8" />
            <rect x="20.5" y="19" width="3" height="4" rx="1" fill="#FDE68A" stroke="#78350F" stroke-width="0.8" />
            <!-- Top Handle -->
            <path d="M12 9V5C12 3.9 12.9 3 14 3H18C19.1 3 20 3.9 20 5V9" stroke="#78350F" stroke-width="2" fill="none" />
            <!-- Front pocket -->
            <rect x="9" y="22" width="14" height="6" rx="2" fill="#B45309" stroke="#78350F" stroke-width="1" />
            <defs>
              <linearGradient id="bp-body" x1="5" y1="9" x2="27" y2="29" gradientUnits="userSpaceOnUse">
                <stop stop-color="#F59E0B" />
                <stop offset="1" stop-color="#D97706" />
              </linearGradient>
            </defs>
          </svg>
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
          <svg class="shelf-btn__icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Book Cover -->
            <path
              d="M4 6C4 4.9 4.9 4 6 4H14.5C15.5 4 16 5 16 6V27C16 26 15.5 25 14.5 25H6C4.9 25 4 24.1 4 23V6Z"
              fill="url(#book-left)"
              stroke="#1E3A8A"
              stroke-width="1.2"
            />
            <path
              d="M28 6C28 4.9 27.1 4 26 4H17.5C16.5 4 16 5 16 6V27C16 26 16.5 25 17.5 25H26C27.1 25 28 24.1 28 23V6Z"
              fill="url(#book-right)"
              stroke="#1E3A8A"
              stroke-width="1.2"
            />
            <!-- Pages -->
            <path d="M6 7H13.5V23H6C5.5 23 5 22.5 5 22V8C5 7.5 5.5 7 6 7Z" fill="#F8FAFC" />
            <path d="M26 7H18.5V23H26C26.5 23 27 22.5 27 22V8C27 7.5 26.5 7 26 7Z" fill="#F8FAFC" />
            <!-- Star insignia on cover -->
            <polygon points="22.5,10 23.5,12.5 26,12.5 24,14 24.8,16.5 22.5,15 20.2,16.5 21,14 19,12.5 21.5,12.5" fill="#F59E0B" />
            <line x1="8" y1="10" x2="12" y2="10" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" />
            <line x1="8" y1="13" x2="12" y2="13" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" />
            <line x1="8" y1="16" x2="11" y2="16" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" />
            <defs>
              <linearGradient id="book-left" x1="4" y1="4" x2="16" y2="27" gradientUnits="userSpaceOnUse">
                <stop stop-color="#3B82F6" />
                <stop offset="1" stop-color="#1D4ED8" />
              </linearGradient>
              <linearGradient id="book-right" x1="28" y1="4" x2="16" y2="27" gradientUnits="userSpaceOnUse">
                <stop stop-color="#60A5FA" />
                <stop offset="1" stop-color="#2563EB" />
              </linearGradient>
            </defs>
          </svg>
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
          <svg class="shelf-btn__icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Nest base -->
            <ellipse cx="16" cy="24" rx="13" ry="5.5" fill="#78350F" />
            <ellipse cx="16" cy="23" rx="11" ry="4" fill="#A16207" />
            <path
              d="M4 23C7 26 12 28 16 28C20 28 25 26 28 23"
              stroke="#D97706"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <!-- Egg resting in nest -->
            <path
              d="M16 5C11 5 8.5 13 8.5 19C8.5 23.5 11.5 25.5 16 25.5C20.5 25.5 23.5 23.5 23.5 19C23.5 13 21 5 16 5Z"
              fill="url(#egg-grad)"
              stroke="#0284C7"
              stroke-width="1.2"
            />
            <!-- Egg spots -->
            <circle cx="14" cy="12" r="1.5" fill="#38BDF8" opacity="0.8" />
            <circle cx="18" cy="15" r="2" fill="#38BDF8" opacity="0.8" />
            <circle cx="13" cy="18" r="1.2" fill="#38BDF8" opacity="0.8" />
            <!-- Soft shine -->
            <ellipse cx="13.5" cy="9" rx="1.5" ry="3" transform="rotate(-25 13.5 9)" fill="#FFFFFF" opacity="0.75" />
            <defs>
              <linearGradient id="egg-grad" x1="9" y1="6" x2="23" y2="25" gradientUnits="userSpaceOnUse">
                <stop stop-color="#E0F2FE" />
                <stop offset="0.7" stop-color="#BAE6FD" />
                <stop offset="1" stop-color="#7DD3FC" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span class="shelf-btn__label">Ấp Trứng</span>
      </button>

      <!-- 4. Cài Đặt (Settings) -->
      <button
        type="button"
        class="shelf-btn shelf-btn--settings"
        data-testid="btn-settings"
        title="Cài Đặt"
        aria-label="Cài Đặt"
        @click="emit('open-settings')"
      >
        <div class="shelf-btn__icon-plate">
          <svg class="shelf-btn__icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="5" fill="url(#gear-center)" stroke="#475569" stroke-width="1.5" />
            <!-- Gear teeth -->
            <path
              d="M16 2L18 5.5H21.5L22 9.5L25.5 10.5L24.5 14.5L27 16.5L24.5 18.5L25.5 22.5L22 23.5L21.5 27.5H18L16 31L14 27.5H10.5L10 23.5L6.5 22.5L7.5 18.5L5 16.5L7.5 14.5L6.5 10.5L10 9.5L10.5 5.5H14L16 2Z"
              fill="url(#gear-body)"
              stroke="#334155"
              stroke-width="1.2"
            />
            <circle cx="16" cy="16" r="3" fill="#1E293B" />
            <defs>
              <linearGradient id="gear-body" x1="5" y1="2" x2="27" y2="31" gradientUnits="userSpaceOnUse">
                <stop stop-color="#94A3B8" />
                <stop offset="0.6" stop-color="#64748B" />
                <stop offset="1" stop-color="#475569" />
              </linearGradient>
              <linearGradient id="gear-center" x1="11" y1="11" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                <stop stop-color="#CBD5E1" />
                <stop offset="1" stop-color="#94A3B8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span class="shelf-btn__label">Cài Đặt</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'open-inventory'): void;
  (e: 'open-collection'): void;
  (e: 'open-hatchery'): void;
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
  gap: 16px;
  padding: 10px 24px 14px;
  background: linear-gradient(180deg, #A16207 0%, #78350F 50%, #451A03 100%);
  border: 2px solid #D97706;
  border-top-color: #FDE68A;
  border-radius: 24px;
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(254, 240, 138, 0.4),
    inset 0 -3px 6px rgba(0, 0, 0, 0.5);
  position: relative;
}

/* Wood grain bottom trim */
.shelf-rack__wood-board::after {
  content: '';
  position: absolute;
  bottom: 3px;
  left: 16px;
  right: 16px;
  height: 3px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
}

/* Action Buttons */
.shelf-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 16px;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease;
  outline: none;
}

.shelf-btn:hover {
  transform: translateY(-5px) scale(1.06);
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.35));
}

.shelf-btn:active {
  transform: translateY(1px) scale(0.96);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
}

.shelf-btn:focus-visible {
  outline: 2px solid #FDE047;
  outline-offset: 4px;
}

/* Button Icon Plate */
.shelf-btn__icon-plate {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  background: linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%);
  border: 2px solid #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.2),
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
  width: 36px;
  height: 36px;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.15));
}

/* Button Label */
.shelf-btn__label {
  font-family: 'Quicksand', 'Nunito', system-ui, sans-serif;
  font-weight: 800;
  font-size: 0.82rem;
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
</style>

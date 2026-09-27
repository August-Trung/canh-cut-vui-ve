<template>
  <div
    class="currency-badge"
    :class="`currency-badge--${type}`"
    :title="badgeTitle"
    :aria-label="badgeTitle"
  >
    <div class="currency-badge__icon-wrapper">
      <!-- Fish SVG Icon -->
      <svg
        v-if="type === 'fish'"
        class="currency-badge__icon"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M27 16c-3.5-3-7.5-5-12-5-6 0-11 4.5-13 7 2 2.5 7 7 13 7 4.5 0 8.5-2 12-5l4 3v-10l-4 3z"
          fill="url(#fish-grad)"
        />
        <path
          d="M14 11c-5 0-9 3.5-11 6 2 2.5 6 6 11 6 2.5 0 5-.7 7.2-2-4.2-.8-7.7-4-7.2-10z"
          fill="#E0F2FE"
          opacity="0.8"
        />
        <circle cx="8" cy="14" r="2" fill="#0F172A" />
        <circle cx="7.5" cy="13.5" r="0.8" fill="#FFFFFF" />
        <defs>
          <linearGradient id="fish-grad" x1="2" y1="11" x2="30" y2="23" gradientUnits="userSpaceOnUse">
            <stop stop-color="#38BDF8" />
            <stop offset="0.6" stop-color="#0284C7" />
            <stop offset="1" stop-color="#0369A1" />
          </linearGradient>
        </defs>
      </svg>

      <!-- Coins SVG Icon -->
      <svg
        v-else-if="type === 'coins'"
        class="currency-badge__icon"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="16" cy="16" r="14" fill="url(#coin-base)" stroke="#F59E0B" stroke-width="2" />
        <circle cx="16" cy="16" r="10.5" stroke="#FDE68A" stroke-width="1.5" stroke-dasharray="2 2" />
        <path
          d="M16 8.5l2.2 4.5 4.8.7-3.5 3.4.8 4.9-4.3-2.3-4.3 2.3.8-4.9-3.5-3.4 4.8-.7L16 8.5z"
          fill="url(#coin-star)"
        />
        <circle cx="11" cy="11" r="1.5" fill="#FFFFFF" opacity="0.8" />
        <defs>
          <linearGradient id="coin-base" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FDE047" />
            <stop offset="0.7" stop-color="#F59E0B" />
            <stop offset="1" stop-color="#D97706" />
          </linearGradient>
          <linearGradient id="coin-star" x1="10" y1="8" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FFFFFF" />
            <stop offset="1" stop-color="#FDE68A" />
          </linearGradient>
        </defs>
      </svg>

      <!-- Gems SVG Icon -->
      <svg
        v-else-if="type === 'gems'"
        class="currency-badge__icon"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <polygon
          points="8,6 24,6 30,14 16,30 2,14"
          fill="url(#gem-grad)"
          stroke="#C084FC"
          stroke-width="1.5"
        />
        <!-- Facets -->
        <polygon points="8,6 24,6 20,14 12,14" fill="#E879F9" opacity="0.6" />
        <polygon points="12,14 20,14 16,30" fill="#A855F7" opacity="0.8" />
        <polygon points="8,6 12,14 2,14" fill="#C084FC" opacity="0.7" />
        <polygon points="24,6 30,14 20,14" fill="#9333EA" opacity="0.8" />
        <polygon points="2,14 12,14 16,30" fill="#7E22CE" opacity="0.9" />
        <polygon points="30,14 20,14 16,30" fill="#6B21A8" opacity="0.95" />
        <!-- Sparkle highlight -->
        <circle cx="10" cy="10" r="1.5" fill="#FFFFFF" opacity="0.9" />
        <defs>
          <linearGradient id="gem-grad" x1="4" y1="4" x2="28" y2="30" gradientUnits="userSpaceOnUse">
            <stop stop-color="#F472B6" />
            <stop offset="0.4" stop-color="#C084FC" />
            <stop offset="1" stop-color="#7E22CE" />
          </linearGradient>
        </defs>
      </svg>
    </div>

    <span class="currency-badge__value">{{ formattedAmount }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  type: 'fish' | 'coins' | 'gems';
  amount: number;
}>();

const formattedAmount = computed(() => {
  const val = props.amount ?? 0;
  return val.toLocaleString();
});

const badgeTitle = computed(() => {
  switch (props.type) {
    case 'fish':
      return `Cá: ${formattedAmount.value}`;
    case 'coins':
      return `Xu: ${formattedAmount.value}`;
    case 'gems':
      return `Kim cương: ${formattedAmount.value}`;
    default:
      return '';
  }
});
</script>

<style scoped>
.currency-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px 4px 6px;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  box-shadow:
    0 3px 8px rgba(0, 0, 0, 0.25),
    inset 0 1px 2px rgba(255, 255, 255, 0.2);
  user-select: none;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
}

.currency-badge:hover {
  transform: translateY(-1px) scale(1.03);
  box-shadow:
    0 5px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 3px rgba(255, 255, 255, 0.4);
}

.currency-badge__icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.25));
}

.currency-badge__icon {
  width: 100%;
  height: 100%;
  display: block;
}

.currency-badge__value {
  font-family: 'Quicksand', 'Nunito', 'Segoe UI', system-ui, sans-serif;
  font-weight: 800;
  font-size: 0.95rem;
  color: #FFFFFF;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  min-width: 20px;
}

/* Modifier highlights */
.currency-badge--fish {
  border-color: rgba(56, 189, 248, 0.5);
}

.currency-badge--coins {
  border-color: rgba(251, 191, 36, 0.5);
}

.currency-badge--gems {
  border-color: rgba(192, 132, 252, 0.5);
}
</style>

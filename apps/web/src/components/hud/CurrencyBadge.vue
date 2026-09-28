<template>
  <div
    class="currency-badge"
    :class="`currency-badge--${type}`"
    :title="badgeTitle"
    :aria-label="badgeTitle"
  >
    <div class="currency-badge__icon-wrapper">
      <GameIcon :name="iconName" size="sm" :alt="type" />
    </div>

    <span class="currency-badge__value">{{ formattedAmount }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import GameIcon from '../common/GameIcon.vue';

const props = defineProps<{
  type: 'fish' | 'coins' | 'gems';
  amount: number;
}>();

const iconName = computed(() => {
  if (props.type === 'coins') return 'coin';
  if (props.type === 'gems') return 'gem';
  return 'fish';
});

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

@media (max-width: 480px) {
  .currency-badge {
    gap: 4px;
    padding: 2px 8px 2px 4px;
  }
  .currency-badge__icon-wrapper {
    width: 22px;
    height: 22px;
  }
  .currency-badge__value {
    font-size: 0.82rem;
  }
}
</style>

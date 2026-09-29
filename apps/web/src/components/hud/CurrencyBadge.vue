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

    <div class="currency-badge__plus" aria-hidden="true">+</div>
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
/* 2010s Zing Me Cartoon Resource Capsule */
.currency-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 2px 3px 2px 4px;
  border-radius: 15px;
  user-select: none;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 0.9);
  transition: transform 0.15s ease;
  cursor: pointer;
}

.currency-badge:hover {
  transform: translateY(-1px);
}

.currency-badge__icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.currency-badge__value {
  font-family: 'Nunito', 'Quicksand', system-ui, sans-serif;
  font-weight: 900;
  font-size: 0.85rem;
  letter-spacing: 0.01em;
  padding: 0 4px;
  min-width: 22px;
  text-align: right;
}

/* Iconic blue plus button on right of Zing Me capsules */
.currency-badge__plus {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  background: linear-gradient(180deg, #38BDF8 0%, #0284C7 100%);
  border: 1px solid #0369A1;
  color: #FFFFFF;
  font-family: system-ui, sans-serif;
  font-weight: 900;
  font-size: 0.82rem;
  line-height: 1;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

/* Color schemes matching Zing Me Cánh Cụt Vui Vẻ */
.currency-badge--fish {
  background: linear-gradient(180deg, #FFFFFF 0%, #ECFEFF 100%);
  border: 1.5px solid #06B6D4;
}
.currency-badge--fish .currency-badge__value {
  color: #0E7490;
}

.currency-badge--coins {
  background: linear-gradient(180deg, #FFFFFF 0%, #FEF3C7 100%);
  border: 1.5px solid #F59E0B;
}
.currency-badge--coins .currency-badge__value {
  color: #92400E;
}

.currency-badge--gems {
  background: linear-gradient(180deg, #FFFFFF 0%, #DCFCE7 100%);
  border: 1.5px solid #16A34A;
}
.currency-badge--gems .currency-badge__value {
  color: #15803D;
}

@media (max-width: 480px) {
  .currency-badge {
    height: 26px;
    gap: 3px;
    padding: 1px 2px 1px 3px;
  }
  .currency-badge__icon-wrapper {
    width: 20px;
    height: 20px;
  }
  .currency-badge__value {
    font-size: 0.75rem;
  }
  .currency-badge__plus {
    width: 15px;
    height: 15px;
    font-size: 0.72rem;
  }
}
</style>

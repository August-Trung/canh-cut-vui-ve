<script setup lang="ts">
import { computed } from 'vue';
import { GAME_ASSETS, getGameAssetUrl, type GameAssetKey } from '../../assets/game';

interface Props {
  name: GameAssetKey | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  alt?: string;
  decorative?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  alt: '',
  decorative: true
});

const assetSrc = computed(() => {
  return getGameAssetUrl(props.name) || '';
});

const sizeStyle = computed(() => {
  if (typeof props.size === 'number') {
    return {
      width: `${props.size}px`,
      height: `${props.size}px`
    };
  }

  const sizes: Record<string, number> = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48
  };

  const px = sizes[props.size] || 24;
  return {
    width: `${px}px`,
    height: `${px}px`
  };
});

const sizeClass = computed(() => {
  if (typeof props.size === 'string') {
    return `game-icon--${props.size}`;
  }
  return '';
});
</script>

<template>
  <span
    class="game-icon-wrapper"
    :class="[sizeClass, { 'game-icon-wrapper--empty': !assetSrc }]"
    :style="sizeStyle"
    :aria-hidden="decorative ? 'true' : undefined"
  >
    <img
      v-if="assetSrc"
      :src="assetSrc"
      :alt="alt"
      class="game-icon-img"
      loading="eager"
      draggable="false"
    />
    <span v-else class="game-icon-fallback" :title="alt || name"></span>
  </span>
</template>

<style scoped>
.game-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  vertical-align: middle;
  line-height: 1;
  position: relative;
}

.game-icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
  display: block;
  image-rendering: -webkit-optimize-contrast;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12));
}

.game-icon-fallback {
  width: 80%;
  height: 80%;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
}

.game-icon--xs {
  width: 16px;
  height: 16px;
}
.game-icon--sm {
  width: 20px;
  height: 20px;
}
.game-icon--md {
  width: 24px;
  height: 24px;
}
.game-icon--lg {
  width: 32px;
  height: 32px;
}
.game-icon--xl {
  width: 48px;
  height: 48px;
}
</style>

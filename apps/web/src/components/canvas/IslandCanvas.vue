<template>
  <div id="island-canvas" ref="canvasContainer" class="island-canvas"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import Phaser from 'phaser';
import { getPhaserConfig } from '../../game/PhaserConfig';

const canvasContainer = ref<HTMLDivElement | null>(null);
let gameInstance: Phaser.Game | null = null;

onMounted(() => {
  if (canvasContainer.value) {
    const config = getPhaserConfig('island-canvas');
    gameInstance = new Phaser.Game(config);
  }
});

onUnmounted(() => {
  gameInstance?.destroy(true);
  gameInstance = null;
});
</script>

<style scoped>
.island-canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  touch-action: none;
}
</style>

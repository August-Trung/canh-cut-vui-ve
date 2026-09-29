/**
 * TextureGenerator.ts
 *
 * High-Resolution 2.5D Procedural Texture Generator with Texture Caching.
 * Generates soft vector/painted styled textures using the HTML5 Canvas 2D API for:
 * - 5 unique penguin species (Snowy, Sleepy, Shy, Happy, Hungry)
 * - 3 egg types (Basic, Frozen, Golden)
 * - Environment props & effects (Ice pond, Snow ground, Pine tree, Igloo, Snowman, Shadow, Particles)
 *
 * Strict boundary rules:
 * - Zero `any` types.
 * - Always checks `scene.textures.exists(key)` before generating.
 * - Headless/Vitest-safe canvas fallback for Node test environments.
 */

export interface AnimConfigLike {
  key: string;
  frames: { key: string }[];
  frameRate?: number;
  repeat?: number;
}

export interface AnimManagerLike {
  exists(key: string): boolean;
  create(config: AnimConfigLike): unknown;
}

export interface TextureManagerLike {
  exists(key: string): boolean;
  addCanvas(key: string, canvas: HTMLCanvasElement): unknown;
}

export interface SceneLike {
  textures: TextureManagerLike;
  anims?: AnimManagerLike;
}

// ---------------------------------------------------------------------------
// Texture Key Dictionaries
// ---------------------------------------------------------------------------

/**
 * Texture key mapping dictionary for penguin species.
 * Supports both unprefixed species keys (e.g., 'snowy') and canonical prefixed keys (e.g., 'penguin_snowy')
 * to provide robust and flexible texture lookups across game data models, store items, and entity renderers.
 */
export const PENGUIN_TEXTURE_KEYS = {
  snowy: 'penguin_snowy',
  sleepy: 'penguin_sleepy',
  shy: 'penguin_shy',
  happy: 'penguin_happy',
  hungry: 'penguin_hungry',
  penguin_snowy: 'penguin_snowy',
  penguin_sleepy: 'penguin_sleepy',
  penguin_shy: 'penguin_shy',
  penguin_happy: 'penguin_happy',
  penguin_hungry: 'penguin_hungry',
} as const;

/**
 * Texture key mapping dictionary for incubator egg types.
 * Supports both legacy/unprefixed keys (e.g., 'basic_egg') and canonical prefixed keys (e.g., 'egg_basic')
 * to maintain backwards compatibility with egg item definitions and texture asset references.
 */
export const EGG_TEXTURE_KEYS = {
  basic_egg: 'egg_basic',
  frozen_egg: 'egg_frozen',
  golden_egg: 'egg_golden',
  egg_basic: 'egg_basic',
  egg_frozen: 'egg_frozen',
  egg_golden: 'egg_golden',
} as const;

export const ENVIRONMENT_TEXTURE_KEYS = {
  ice_pond: 'ice_pond',
  pond_ripple: 'pond_ripple',
  snow_ground: 'snow_ground',
  pine_tree: 'pine_tree',
  pine_tree_a: 'pine_tree_a',
  pine_tree_b: 'pine_tree_b',
  pine_tree_c: 'pine_tree_c',
  igloo: 'igloo',
  snowman: 'snowman',
  entity_shadow: 'entity_shadow',
  particle_heart: 'particle_heart',
  particle_snow: 'particle_snow',
  particle_sparkle: 'particle_sparkle',
} as const;

export const DECORATION_TEXTURE_KEYS = {
  bench_wood: 'dec_bench_wood',
  pine_crystal: 'dec_pine_crystal',
  lamp_street: 'dec_lamp_street',
  castle_snow: 'dec_castle_snow',
  lantern_igloo: 'dec_lantern_igloo',
  master_caretaker_trophy: 'dec_trophy_master',
  dec_bench_wood: 'dec_bench_wood',
  dec_pine_crystal: 'dec_pine_crystal',
  dec_lamp_street: 'dec_lamp_street',
  dec_castle_snow: 'dec_castle_snow',
  dec_lantern_igloo: 'dec_lantern_igloo',
  dec_trophy_master: 'dec_trophy_master',
} as const;

export type DecorationVisualKey =
  | 'dec_bench_wood'
  | 'dec_pine_crystal'
  | 'dec_lamp_street'
  | 'dec_castle_snow'
  | 'dec_lantern_igloo'
  | 'dec_trophy_master';


// ---------------------------------------------------------------------------
// Vitest-Safe Headless Canvas Implementation
// ---------------------------------------------------------------------------

interface MockGradient {
  addColorStop(offset: number, color: string): void;
}

class HeadlessGradient implements MockGradient {
  addColorStop(_offset: number, _color: string): void {}
}

class HeadlessContext2D {
  canvas: HTMLCanvasElement;
  fillStyle: string | CanvasGradient | CanvasPattern = '#000000';
  strokeStyle: string | CanvasGradient | CanvasPattern = '#000000';
  lineWidth = 1;
  lineCap: CanvasLineCap = 'butt';
  lineJoin: CanvasLineJoin = 'miter';
  miterLimit = 10;
  globalAlpha = 1.0;
  globalCompositeOperation: GlobalCompositeOperation = 'source-over';
  shadowColor = 'rgba(0, 0, 0, 0)';
  shadowBlur = 0;
  shadowOffsetX = 0;
  shadowOffsetY = 0;
  imageSmoothingEnabled = true;
  imageSmoothingQuality: ImageSmoothingQuality = 'high';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  save(): void {}
  restore(): void {}
  beginPath(): void {}
  closePath(): void {}
  moveTo(_x: number, _y: number): void {}
  lineTo(_x: number, _y: number): void {}
  arc(_x: number, _y: number, _radius: number, _startAngle: number, _endAngle: number, _anticlockwise?: boolean): void {}
  arcTo(_x1: number, _y1: number, _x2: number, _y2: number, _radius: number): void {}
  bezierCurveTo(_cp1x: number, _cp1y: number, _cp2x: number, _cp2y: number, _x: number, _y: number): void {}
  quadraticCurveTo(_cpx: number, _cpy: number, _x: number, _y: number): void {}
  ellipse(_x: number, _y: number, _rx: number, _ry: number, _rotation: number, _startAngle: number, _endAngle: number, _anticlockwise?: boolean): void {}
  rect(_x: number, _y: number, _w: number, _h: number): void {}
  roundRect(_x: number, _y: number, _w: number, _h: number, _radii?: number | number[]): void {}
  clearRect(_x: number, _y: number, _w: number, _h: number): void {}
  fillRect(_x: number, _y: number, _w: number, _h: number): void {}
  strokeRect(_x: number, _y: number, _w: number, _h: number): void {}
  fill(): void {}
  stroke(): void {}
  clip(): void {}
  translate(_x: number, _y: number): void {}
  rotate(_angle: number): void {}
  scale(_x: number, _y: number): void {}
  transform(_a: number, _b: number, _c: number, _d: number, _e: number, _f: number): void {}
  setTransform(_a?: unknown, _b?: unknown, _c?: unknown, _d?: unknown, _e?: unknown, _f?: unknown): void {}
  resetTransform(): void {}
  createLinearGradient(_x0: number, _y0: number, _x1: number, _y1: number): CanvasGradient {
    return new HeadlessGradient() as unknown as CanvasGradient;
  }
  createRadialGradient(_x0: number, _y0: number, _r0: number, _x1: number, _y1: number, _r1: number): CanvasGradient {
    return new HeadlessGradient() as unknown as CanvasGradient;
  }
}

/**
 * Creates a standard HTMLCanvasElement in browser environments,
 * or a fully-functional headless mock canvas in Node.js/Vitest test environments.
 */
export function createSafeCanvas(width: number, height: number): HTMLCanvasElement {
  try {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        return canvas;
      }
    }
  } catch {
    // Document is undefined or getContext('2d') is unavailable in headless mode
  }

  const mockCanvas = {
    width,
    height,
    getContext: (type: string) => {
      if (type === '2d') {
        return new HeadlessContext2D(mockCanvas as unknown as HTMLCanvasElement);
      }
      return null;
    },
    toDataURL: () => 'data:image/png;base64,',
  };

  return mockCanvas as unknown as HTMLCanvasElement;
}

// ---------------------------------------------------------------------------
// 2.5D Procedural Penguin Generator (128x128)
// ---------------------------------------------------------------------------

export type PenguinSpeciesKey = 'snowy' | 'sleepy' | 'shy' | 'happy' | 'hungry';

interface PenguinPalette {
  coatDark: string;
  coatLight: string;
  coatRim: string;
  bellyBase: string;
  bellyShadow: string;
  blushColor: string;
  eyeType: 'normal' | 'sleepy' | 'happy';
}

const PENGUIN_PALETTES: Record<PenguinSpeciesKey, PenguinPalette> = {
  snowy: {
    coatDark: '#1A2942',
    coatLight: '#354E73',
    coatRim: '#5A759E',
    bellyBase: '#FFFFFF',
    bellyShadow: '#E1E8F0',
    blushColor: 'rgba(179, 229, 252, 0.4)',
    eyeType: 'normal',
  },
  sleepy: {
    coatDark: '#564C6E',
    coatLight: '#8C80A8',
    coatRim: '#B2A8CC',
    bellyBase: '#FAF7FC',
    bellyShadow: '#E4DCED',
    blushColor: 'rgba(209, 196, 233, 0.5)',
    eyeType: 'sleepy',
  },
  shy: {
    coatDark: '#C2185B',
    coatLight: '#F06292',
    coatRim: '#F8BBD0',
    bellyBase: '#FFF5F8',
    bellyShadow: '#FCE4EC',
    blushColor: 'rgba(233, 30, 99, 0.55)',
    eyeType: 'normal',
  },
  happy: {
    coatDark: '#2E7D32',
    coatLight: '#66BB6A',
    coatRim: '#A5D6A7',
    bellyBase: '#F9FBE7',
    bellyShadow: '#DCEDC8',
    blushColor: 'rgba(255, 171, 145, 0.4)',
    eyeType: 'happy',
  },
  hungry: {
    coatDark: '#E65100',
    coatLight: '#FFA726',
    coatRim: '#FFE0B2',
    bellyBase: '#FFFDE7',
    bellyShadow: '#FFE082',
    blushColor: 'rgba(255, 138, 101, 0.4)',
    eyeType: 'normal',
  },
};

/**
 * Normalizes input key to standard species key.
 */
function resolveSpeciesKey(key: string): PenguinSpeciesKey {
  const clean = key.replace('penguin_', '');
  if (clean === 'sleepy' || clean === 'shy' || clean === 'happy' || clean === 'hungry') {
    return clean;
  }
  return 'snowy';
}

export type PenguinPoseKey = 'idle' | 'walk_0' | 'walk_1' | 'walk_2' | 'walk_3' | 'sleep' | 'eat' | 'celebrate' | 'slide';

export function generatePenguinTexture(
  species: string,
  pose: PenguinPoseKey = 'idle'
): HTMLCanvasElement {
  const canvas = createSafeCanvas(128, 128);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const sp = resolveSpeciesKey(species);
  const pal = PENGUIN_PALETTES[sp];

  ctx.save();

  // 1. Soft entity ground shadow under penguin
  ctx.save();
  ctx.beginPath();
  if (pose === 'slide') {
    ctx.ellipse(64, 116, 40, 8, 0, 0, Math.PI * 2);
  } else if (pose === 'celebrate') {
    ctx.ellipse(64, 118, 24, 5, 0, 0, Math.PI * 2);
  } else {
    ctx.ellipse(64, 116, 32, 7, 0, 0, Math.PI * 2);
  }
  const groundShadow = ctx.createRadialGradient(64, 116, 4, 64, 116, 32);
  groundShadow.addColorStop(0, pose === 'celebrate' ? 'rgba(20, 32, 50, 0.18)' : 'rgba(20, 32, 50, 0.28)');
  groundShadow.addColorStop(1, 'rgba(20, 32, 50, 0)');
  ctx.fillStyle = groundShadow;
  ctx.fill();
  ctx.restore();

  // 2. Cute chubby webbed feet
  const drawFoot = (x: number, y: number, angle: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2);
    const footGrad = ctx.createLinearGradient(-10, -7, 10, 7);
    footGrad.addColorStop(0, '#FFA726');
    footGrad.addColorStop(1, '#E65100');
    ctx.fillStyle = footGrad;
    ctx.fill();
    ctx.restore();
  };

  if (pose === 'walk_0') {
    drawFoot(44, 115, -0.15);
    drawFoot(82, 107, 0.25);
  } else if (pose === 'walk_1') {
    drawFoot(46, 115, -0.1);
    drawFoot(80, 112, 0.1);
  } else if (pose === 'walk_2') {
    drawFoot(84, 115, 0.15);
    drawFoot(46, 107, -0.25);
  } else if (pose === 'walk_3') {
    drawFoot(82, 115, 0.1);
    drawFoot(48, 112, -0.1);
  } else if (pose === 'celebrate') {
    drawFoot(48, 108, -0.3);
    drawFoot(80, 108, 0.3);
  } else if (pose === 'slide') {
    drawFoot(36, 106, -0.7);
    drawFoot(92, 106, 0.7);
  } else if (pose === 'sleep') {
    drawFoot(50, 115, -0.1);
    drawFoot(78, 115, 0.1);
  } else {
    drawFoot(48, 113, -0.15);
    drawFoot(80, 113, 0.15);
  }

  // 3. Flippers / Wings (drawn behind body or to sides)
  const drawFlipper = (x: number, y: number, angle: number, flipX: boolean) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 18, 0, 0, Math.PI * 2);
    const flipperGrad = ctx.createLinearGradient(flipX ? 8 : -8, -18, flipX ? -8 : 8, 18);
    flipperGrad.addColorStop(0, pal.coatLight);
    flipperGrad.addColorStop(1, pal.coatDark);
    ctx.fillStyle = flipperGrad;
    ctx.fill();

    // Soft specular rim on flipper
    ctx.beginPath();
    ctx.ellipse(flipX ? 3 : -3, -4, 3, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fill();
    ctx.restore();
  };

  if (pose === 'celebrate') {
    drawFlipper(20, 52, -1.2, false);
    drawFlipper(108, 52, 1.2, true);
  } else if (pose === 'walk_0') {
    drawFlipper(24, 70, 0.45, false);
    drawFlipper(104, 76, -0.05, true);
  } else if (pose === 'walk_1') {
    drawFlipper(26, 74, 0.25, false);
    drawFlipper(102, 74, -0.25, true);
  } else if (pose === 'walk_2') {
    drawFlipper(28, 76, 0.05, false);
    drawFlipper(100, 70, -0.45, true);
  } else if (pose === 'walk_3') {
    drawFlipper(26, 74, 0.25, false);
    drawFlipper(102, 74, -0.25, true);
  } else if (pose === 'eat') {
    drawFlipper(22, 68, 0.6, false);
    drawFlipper(106, 68, -0.6, true);
  } else if (pose === 'slide') {
    drawFlipper(18, 72, 0.9, false);
    drawFlipper(110, 72, -0.9, true);
  } else if (pose === 'sleep') {
    drawFlipper(30, 76, 0.1, false);
    drawFlipper(98, 76, -0.1, true);
  } else {
    drawFlipper(26, 74, 0.25, false);
    drawFlipper(102, 74, -0.25, true);
  }

  // 4. Chubby round pear-shaped body & head
  ctx.save();
  ctx.beginPath();
  // Lower chubby torso
  ctx.moveTo(30, 92);
  ctx.bezierCurveTo(24, 114, 104, 114, 98, 92);
  // Upper body tapering into cute round head
  ctx.bezierCurveTo(102, 54, 94, 28, 64, 28);
  ctx.bezierCurveTo(34, 28, 26, 54, 30, 92);
  ctx.closePath();

  // 2.5D Volumetric coat gradient
  const coatGrad = ctx.createRadialGradient(52, 52, 8, 64, 76, 50);
  coatGrad.addColorStop(0, pal.coatLight);
  coatGrad.addColorStop(0.7, pal.coatDark);
  coatGrad.addColorStop(1, pal.coatDark);
  ctx.fillStyle = coatGrad;
  ctx.fill();

  // Soft ambient vector rim highlight on upper-left
  ctx.beginPath();
  ctx.arc(64, 28, 26, Math.PI * 0.9, Math.PI * 1.8);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // 5. Chubby Belly Patch
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(64, 78, 26, 28, 0, 0, Math.PI * 2);
  const bellyGrad = ctx.createRadialGradient(64, 68, 6, 64, 80, 28);
  bellyGrad.addColorStop(0, pal.bellyBase);
  bellyGrad.addColorStop(0.85, pal.bellyBase);
  bellyGrad.addColorStop(1, pal.bellyShadow);
  ctx.fillStyle = bellyGrad;
  ctx.fill();

  // Species-specific belly patterns
  if (sp === 'snowy') {
    // Subtle snowflake dots pattern
    ctx.fillStyle = '#B2EBF2';
    const snowDots = [
      [56, 74],
      [72, 74],
      [64, 84],
      [58, 92],
      [70, 92],
    ];
    for (const [dx, dy] of snowDots) {
      ctx.beginPath();
      ctx.arc(dx, dy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (sp === 'hungry') {
    // Warm peach horizontal stripes
    ctx.strokeStyle = 'rgba(255, 171, 145, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(48, 76);
    ctx.lineTo(80, 76);
    ctx.moveTo(46, 84);
    ctx.lineTo(82, 84);
    ctx.moveTo(50, 92);
    ctx.lineTo(78, 92);
    ctx.stroke();
  }
  ctx.restore();

  // 6. Blushing cheeks
  ctx.save();
  ctx.fillStyle = pal.blushColor;
  ctx.beginPath();
  ctx.ellipse(44, 66, 6.5, 3.5, -0.1, 0, Math.PI * 2);
  ctx.ellipse(84, 66, 6.5, 3.5, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 7. Expressive Eyes
  ctx.save();
  if (pose === 'sleep' || pal.eyeType === 'sleepy') {
    // Cute curved sleepy arc eyelids ⌒ ⌒
    ctx.strokeStyle = '#2B263B';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(50, 56, 5.5, Math.PI * 1.15, Math.PI * 1.85);
    ctx.moveTo(84, 56);
    ctx.arc(78, 56, 5.5, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else if (pose === 'celebrate' || pal.eyeType === 'happy') {
    // Joyful curved smile eyes ^ ^
    ctx.strokeStyle = '#1B471F';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(50, 58, 6, Math.PI * 1.15, Math.PI * 1.85);
    ctx.moveTo(84, 58);
    ctx.arc(78, 58, 6, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else {
    // Adorable round glistening eyes with double catchlights
    const drawEye = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, 5.8, 0, Math.PI * 2);
      ctx.fillStyle = '#111827';
      ctx.fill();

      // Primary specular catchlight
      ctx.beginPath();
      ctx.arc(x - 1.8, y - 2, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Secondary specular catchlight
      ctx.beginPath();
      ctx.arc(x + 2, y + 1.8, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    };
    drawEye(50, 56);
    drawEye(78, 56);
  }
  ctx.restore();

  // 8. Cute golden-orange beak
  ctx.save();
  if (pose === 'eat') {
    // Open beak with fish morsel
    ctx.beginPath();
    ctx.moveTo(57, 59);
    ctx.quadraticCurveTo(64, 54, 71, 59);
    ctx.lineTo(64, 63);
    ctx.closePath();
    ctx.fillStyle = '#FFA726';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(59, 64);
    ctx.lineTo(69, 64);
    ctx.quadraticCurveTo(64, 71, 59, 64);
    ctx.closePath();
    ctx.fillStyle = '#E65100';
    ctx.fill();

    // Fish morsel
    ctx.beginPath();
    ctx.ellipse(64, 63, 4.5, 2.5, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#29B6F6';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(66, 62, 1, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(57, 60);
    ctx.quadraticCurveTo(64, 57, 71, 60);
    ctx.quadraticCurveTo(64, 71, 57, 60);
    const beakGrad = ctx.createLinearGradient(64, 57, 64, 70);
    beakGrad.addColorStop(0, '#FFD54F');
    beakGrad.addColorStop(0.5, '#FFA726');
    beakGrad.addColorStop(1, '#E65100');
    ctx.fillStyle = beakGrad;
    ctx.fill();

    // Beak specular sheen
    ctx.beginPath();
    ctx.ellipse(64, 61, 4, 1.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
  }
  ctx.restore();

  // 9. Distinct Accessories
  ctx.save();
  if (sp === 'snowy') {
    // Fluffy blue earmuffs
    // Headband over head
    ctx.beginPath();
    ctx.arc(64, 38, 22, Math.PI * 1.05, Math.PI * 1.95);
    ctx.strokeStyle = '#0277BD';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Fluffy earmuff ear puffs
    const drawEarmuff = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, 8.5, 0, Math.PI * 2);
      const puffGrad = ctx.createRadialGradient(x - 2, y - 2, 2, x, y, 9);
      puffGrad.addColorStop(0, '#E1F5FE');
      puffGrad.addColorStop(0.4, '#4FC3F7');
      puffGrad.addColorStop(1, '#0288D1');
      ctx.fillStyle = puffGrad;
      ctx.fill();
    };
    drawEarmuff(38, 44);
    drawEarmuff(90, 44);
  } else if (sp === 'sleepy') {
    // Cozy purple nightcap with fluffy pom-pom
    ctx.beginPath();
    ctx.moveTo(42, 34);
    ctx.bezierCurveTo(52, 14, 88, 12, 98, 28);
    ctx.bezierCurveTo(112, 38, 108, 54, 104, 58);
    ctx.bezierCurveTo(96, 46, 80, 36, 42, 34);
    const capGrad = ctx.createLinearGradient(42, 20, 104, 58);
    capGrad.addColorStop(0, '#9575CD');
    capGrad.addColorStop(0.7, '#673AB7');
    capGrad.addColorStop(1, '#512DA8');
    ctx.fillStyle = capGrad;
    ctx.fill();

    // Cap folded rim
    ctx.beginPath();
    ctx.ellipse(64, 32, 24, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#D1C4E9';
    ctx.fill();

    // Fluffy pom-pom at tip
    ctx.beginPath();
    ctx.arc(104, 58, 6.5, 0, Math.PI * 2);
    const pomGrad = ctx.createRadialGradient(103, 56, 1, 104, 58, 7);
    pomGrad.addColorStop(0, '#FFFFFF');
    pomGrad.addColorStop(0.6, '#EDE7F6');
    pomGrad.addColorStop(1, '#D1C4E9');
    ctx.fillStyle = pomGrad;
    ctx.fill();
  } else if (sp === 'shy') {
    // Warm knitted wool scarf wrapped snugly with hanging tail
    ctx.beginPath();
    ctx.ellipse(64, 70, 26, 6.5, 0, 0, Math.PI * 2);
    const scarfGrad = ctx.createLinearGradient(38, 66, 90, 74);
    scarfGrad.addColorStop(0, '#FFE082');
    scarfGrad.addColorStop(0.5, '#FFCA28');
    scarfGrad.addColorStop(1, '#FFA000');
    ctx.fillStyle = scarfGrad;
    ctx.fill();

    // Scarf knit lines
    ctx.strokeStyle = 'rgba(230, 81, 0, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(52, 66);
    ctx.lineTo(52, 74);
    ctx.moveTo(64, 65);
    ctx.lineTo(64, 75);
    ctx.moveTo(76, 66);
    ctx.lineTo(76, 74);
    ctx.stroke();

    // Scarf tail hanging down right
    ctx.beginPath();
    ctx.moveTo(76, 72);
    ctx.lineTo(86, 72);
    ctx.lineTo(88, 92);
    ctx.lineTo(78, 92);
    ctx.closePath();
    ctx.fillStyle = '#FFCA28';
    ctx.fill();

    // Scarf fringe tassels
    ctx.strokeStyle = '#E65100';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(80, 92);
    ctx.lineTo(80, 96);
    ctx.moveTo(83, 92);
    ctx.lineTo(83, 96);
    ctx.moveTo(86, 92);
    ctx.lineTo(86, 96);
    ctx.stroke();
  } else if (sp === 'happy') {
    // Cute little green seedling sprout on head
    ctx.beginPath();
    ctx.moveTo(64, 28);
    ctx.quadraticCurveTo(63, 20, 64, 15);
    ctx.strokeStyle = '#558B2F';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Left leaf
    ctx.beginPath();
    ctx.moveTo(64, 16);
    ctx.quadraticCurveTo(54, 12, 56, 18);
    ctx.quadraticCurveTo(60, 20, 64, 16);
    ctx.fillStyle = '#7CB342';
    ctx.fill();

    // Right leaf
    ctx.beginPath();
    ctx.moveTo(64, 16);
    ctx.quadraticCurveTo(74, 10, 72, 17);
    ctx.quadraticCurveTo(68, 20, 64, 16);
    ctx.fillStyle = '#8BC34A';
    ctx.fill();
  } else if (sp === 'hungry') {
    // Cheerful baby-blue & white bib with cute golden fish motif
    ctx.beginPath();
    ctx.moveTo(50, 70);
    ctx.quadraticCurveTo(64, 72, 78, 70);
    ctx.lineTo(80, 88);
    ctx.quadraticCurveTo(64, 98, 48, 88);
    ctx.closePath();
    const bibGrad = ctx.createLinearGradient(50, 70, 78, 96);
    bibGrad.addColorStop(0, '#FFFFFF');
    bibGrad.addColorStop(1, '#E1F5FE');
    ctx.fillStyle = bibGrad;
    ctx.fill();

    ctx.strokeStyle = '#0288D1';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Golden fish motif in bib center
    ctx.beginPath();
    ctx.ellipse(63, 82, 4.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFB300';
    ctx.fill();

    // Fish tail
    ctx.beginPath();
    ctx.moveTo(67, 82);
    ctx.lineTo(70, 79);
    ctx.lineTo(70, 85);
    ctx.closePath();
    ctx.fillStyle = '#FFA000';
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
  return canvas;
}

// ---------------------------------------------------------------------------
// 2.5D Procedural Egg Generator (128x128)
// ---------------------------------------------------------------------------

export type EggTypeKey = 'egg_basic' | 'egg_frozen' | 'egg_golden';

function resolveEggKey(key: string): EggTypeKey {
  if (key === 'frozen_egg' || key === 'egg_frozen') return 'egg_frozen';
  if (key === 'golden_egg' || key === 'egg_golden') return 'egg_golden';
  return 'egg_basic';
}

export function generateEggTexture(eggType: string): HTMLCanvasElement {
  const canvas = createSafeCanvas(128, 128);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const key = resolveEggKey(eggType);

  ctx.save();

  // 1. Soft egg drop shadow
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(64, 112, 30, 8, 0, 0, Math.PI * 2);
  const shadowGrad = ctx.createRadialGradient(64, 112, 4, 64, 112, 30);
  shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.32)');
  shadowGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.fill();
  ctx.restore();

  // 2. Egg silhouette path
  const createEggPath = () => {
    ctx.beginPath();
    ctx.moveTo(64, 22);
    // Smooth egg curves: narrower apex at top, wider chubby base at bottom
    ctx.bezierCurveTo(86, 22, 98, 54, 98, 80);
    ctx.bezierCurveTo(98, 102, 82, 110, 64, 110);
    ctx.bezierCurveTo(46, 110, 30, 102, 30, 80);
    ctx.bezierCurveTo(30, 54, 42, 22, 64, 22);
    ctx.closePath();
  };

  createEggPath();

  if (key === 'egg_basic') {
    // Speckled cyan & white shell with soft specular highlight
    const eggGrad = ctx.createRadialGradient(54, 48, 8, 64, 76, 44);
    eggGrad.addColorStop(0, '#FFFFFF');
    eggGrad.addColorStop(0.35, '#E0F7FA');
    eggGrad.addColorStop(0.8, '#B2EBF2');
    eggGrad.addColorStop(1, '#80DEEA');
    ctx.fillStyle = eggGrad;
    ctx.fill();

    // Speckled dots
    ctx.save();
    const speckles = [
      [50, 48, 1.8, 'rgba(0, 172, 193, 0.5)'],
      [68, 42, 2.2, 'rgba(0, 172, 193, 0.4)'],
      [42, 70, 2.5, 'rgba(0, 172, 193, 0.45)'],
      [58, 68, 1.5, 'rgba(0, 172, 193, 0.6)'],
      [78, 66, 2.0, 'rgba(0, 172, 193, 0.35)'],
      [52, 88, 2.4, 'rgba(0, 172, 193, 0.5)'],
      [72, 90, 1.9, 'rgba(0, 172, 193, 0.4)'],
      [84, 82, 1.6, 'rgba(0, 172, 193, 0.35)'],
      [62, 54, 1.2, '#FFFFFF'],
      [46, 80, 1.5, '#FFFFFF'],
      [76, 78, 1.3, '#FFFFFF'],
    ] as const;
    for (const [sx, sy, sr, sc] of speckles) {
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = sc;
      ctx.fill();
    }
    ctx.restore();

    // Specular highlight gloss
    ctx.beginPath();
    ctx.ellipse(48, 42, 10, 16, -0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fill();
  } else if (key === 'egg_frozen') {
    // Glacial translucent blue shell with frost crystal patterns
    const eggGrad = ctx.createRadialGradient(52, 50, 10, 64, 76, 44);
    eggGrad.addColorStop(0, '#E0F7FA');
    eggGrad.addColorStop(0.3, '#80DEEA');
    eggGrad.addColorStop(0.7, '#0097A7');
    eggGrad.addColorStop(1, '#006064');
    ctx.fillStyle = eggGrad;
    ctx.fill();

    // Frost crystal patterns (crystalline lattice & 6-point ice snowflake)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';

    // Central frost snowflake
    const cx = 64;
    const cy = 68;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + cos * 16, cy + sin * 16);
      // Small crystal branches
      const bx = cx + cos * 10;
      const by = cy + sin * 10;
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - sin * 4, by + cos * 4);
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + sin * 4, by - cos * 4);
      ctx.stroke();
    }

    // Secondary ice facet lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(42, 44);
    ctx.lineTo(54, 52);
    ctx.lineTo(50, 66);
    ctx.moveTo(76, 48);
    ctx.lineTo(84, 60);
    ctx.lineTo(78, 76);
    ctx.stroke();
    ctx.restore();

    // Frost rim gloss
    ctx.beginPath();
    ctx.ellipse(46, 38, 8, 14, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();
  } else {
    // egg_golden: Radiant golden metallic radial gradient with warm shimmer
    const eggGrad = ctx.createRadialGradient(50, 44, 6, 64, 74, 46);
    eggGrad.addColorStop(0, '#FFFDE7');
    eggGrad.addColorStop(0.2, '#FFF59D');
    eggGrad.addColorStop(0.5, '#FFD54F');
    eggGrad.addColorStop(0.8, '#FFA000');
    eggGrad.addColorStop(1, '#E65100');
    ctx.fillStyle = eggGrad;
    ctx.fill();

    // Metallic sheen band
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(56, 66, 18, 28, 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.fill();

    // Warm shimmer 4-point star sparkles
    const drawSparkle = (sx: number, sy: number, size: number) => {
      ctx.beginPath();
      ctx.moveTo(sx, sy - size);
      ctx.quadraticCurveTo(sx, sy, sx + size, sy);
      ctx.quadraticCurveTo(sx, sy, sx, sy + size);
      ctx.quadraticCurveTo(sx, sy, sx - size, sy);
      ctx.quadraticCurveTo(sx, sy, sx, sy - size);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    };

    drawSparkle(46, 44, 7);
    drawSparkle(78, 56, 5);
    drawSparkle(56, 86, 4);
    ctx.restore();

    // Golden specular highlight gloss
    ctx.beginPath();
    ctx.ellipse(46, 36, 9, 15, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fill();
  }

  // Soft outline stroke
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1.5;
  createEggPath();
  ctx.stroke();

  ctx.restore();
  return canvas;
}

// ---------------------------------------------------------------------------
// 2.5D Environment & Particle Generators
// ---------------------------------------------------------------------------

export function generateEnvironmentTexture(key: string): HTMLCanvasElement {
  switch (key) {
    case 'ice_pond':
      return drawIcePond();
    case 'pond_ripple':
      return drawPondRipple();
    case 'snow_ground':
      return drawSnowGround();
    case 'pine_tree':
    case 'pine_tree_a':
      return drawPineTreeA();
    case 'pine_tree_b':
      return drawPineTreeB();
    case 'pine_tree_c':
      return drawPineTreeC();
    case 'igloo':
      return drawIgloo();
    case 'snowman':
      return drawSnowman();
    case 'entity_shadow':
      return drawEntityShadow();
    case 'particle_heart':
      return drawParticleHeart();
    case 'particle_snow':
      return drawParticleSnow();
    case 'particle_sparkle':
      return drawParticleSparkle();
    default:
      return createSafeCanvas(64, 64);
  }
}

/**
 * ice_pond: Translucent cyan ice pond with soft frosted rim and subtle ice cracks (320x180).
 */
function drawIcePond(): HTMLCanvasElement {
  const canvas = createSafeCanvas(320, 180);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();

  // 1. Organic cartoon shoreline rim (snow & ice bank)
  ctx.beginPath();
  ctx.ellipse(160, 90, 154, 82, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#BAE6FD';
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(160, 90, 148, 76, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#E0F2FE';
  ctx.fill();

  // Shore pebbles
  const pebbles = [
    [24, 90, 7, 5], [42, 60, 6, 4], [70, 36, 8, 5], [120, 22, 9, 5],
    [180, 20, 8, 5], [235, 34, 7, 4], [278, 62, 8, 5], [298, 92, 7, 5],
    [282, 124, 8, 5], [240, 148, 9, 6], [185, 160, 8, 5], [125, 162, 9, 5],
    [65, 146, 8, 5], [35, 122, 7, 4]
  ];
  ctx.fillStyle = '#93C5FD';
  for (const [px, py, rx, ry] of pebbles) {
    ctx.beginPath();
    ctx.ellipse(px, py, rx, ry, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Deep vibrant blue water pool
  ctx.beginPath();
  ctx.ellipse(160, 90, 138, 68, 0, 0, Math.PI * 2);
  const pondGrad = ctx.createRadialGradient(150, 80, 15, 160, 90, 138);
  pondGrad.addColorStop(0, '#38BDF8');
  pondGrad.addColorStop(0.45, '#0284C7');
  pondGrad.addColorStop(0.85, '#0369A1');
  pondGrad.addColorStop(1, '#0C4A6E');
  ctx.fillStyle = pondGrad;
  ctx.fill();

  // 3. Gentle cartoon water ripples (rings)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(160, 90, 95, 42, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(160, 90, 55, 24, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Glossy sunlight reflection on water surface
  ctx.beginPath();
  ctx.ellipse(125, 62, 50, 18, -0.15, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
  ctx.fill();

  ctx.restore();
  return canvas;
}

/**
 * snow_ground: Layered organic snow ground (256x256).
 * Renders an elliptical snow plateau with soft radial shading, clipped dunes, and transparent margins.
 */
function drawSnowGround(): HTMLCanvasElement {
  const canvas = createSafeCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();
  ctx.clearRect(0, 0, 256, 256);

  // 1. Base elliptical snow plateau
  ctx.beginPath();
  ctx.ellipse(128, 128, 124, 124, 0, 0, Math.PI * 2);
  const baseGrad = ctx.createRadialGradient(128, 100, 20, 128, 128, 124);
  baseGrad.addColorStop(0, '#FFFFFF');
  baseGrad.addColorStop(0.65, '#F1F5F9');
  baseGrad.addColorStop(1, '#E2E8F0');
  ctx.fillStyle = baseGrad;
  ctx.fill();

  // 2. Layered organic snow dunes clipped inside the ellipse
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(128, 128, 124, 124, 0, 0, Math.PI * 2);
  ctx.clip();

  const drawSnowDune = (y: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, fillColor: string) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, 256, y);
    ctx.lineTo(256, 256);
    ctx.lineTo(0, 256);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
  };

  drawSnowDune(90, 80, 75, 180, 105, 'rgba(224, 242, 254, 0.55)');
  drawSnowDune(150, 70, 165, 190, 135, 'rgba(203, 213, 225, 0.45)');
  drawSnowDune(210, 90, 195, 170, 225, 'rgba(186, 230, 253, 0.35)');

  // Sparkling snow glints
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  const glints = [
    [40, 50],
    [120, 30],
    [210, 60],
    [70, 120],
    [170, 140],
    [90, 190],
    [200, 210],
  ];
  for (const [gx, gy] of glints) {
    ctx.beginPath();
    ctx.arc(gx, gy, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 3. Soft frosted outer rim border
  ctx.beginPath();
  ctx.ellipse(128, 128, 124, 124, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
  return canvas;
}

/**
 * pine_tree_a (or pine_tree): Classic conical evergreen pine with scalloped snow caps (128x160).
 */
function drawPineTreeA(): HTMLCanvasElement {
  const canvas = createSafeCanvas(128, 160);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();

  // 1. Trunk
  ctx.beginPath();
  ctx.roundRect(58, 126, 12, 26, [3, 3, 2, 2]);
  const trunkGrad = ctx.createLinearGradient(58, 126, 70, 152);
  trunkGrad.addColorStop(0, '#6D4C41');
  trunkGrad.addColorStop(1, '#4E342E');
  ctx.fillStyle = trunkGrad;
  ctx.fill();

  // 2. Evergreen foliage tiers & puffy snow caps
  const drawTier = (topY: number, botY: number, halfWidth: number, snowH: number) => {
    // Green foliage tier
    ctx.beginPath();
    ctx.moveTo(64, topY);
    ctx.lineTo(64 + halfWidth, botY);
    ctx.quadraticCurveTo(64, botY + 6, 64 - halfWidth, botY);
    ctx.closePath();
    const foliageGrad = ctx.createLinearGradient(64 - halfWidth, topY, 64 + halfWidth, botY);
    foliageGrad.addColorStop(0, '#43A047');
    foliageGrad.addColorStop(0.5, '#2E7D32');
    foliageGrad.addColorStop(1, '#1B5E20');
    ctx.fillStyle = foliageGrad;
    ctx.fill();

    // Puffy snow cap on top of tier
    ctx.beginPath();
    ctx.moveTo(64 - halfWidth + 4, botY - 2);
    ctx.quadraticCurveTo(64 - halfWidth / 2, botY + snowH, 64, botY - 2);
    ctx.quadraticCurveTo(64 + halfWidth / 2, botY + snowH, 64 + halfWidth - 4, botY - 2);
    ctx.quadraticCurveTo(64, botY - snowH - 4, 64 - halfWidth + 4, botY - 2);
    ctx.closePath();
    const snowGrad = ctx.createLinearGradient(64, botY - snowH, 64, botY + snowH);
    snowGrad.addColorStop(0, '#FFFFFF');
    snowGrad.addColorStop(1, '#CFD8DC');
    ctx.fillStyle = snowGrad;
    ctx.fill();
  };

  // Bottom tier
  drawTier(86, 130, 42, 6);
  // Middle tier
  drawTier(54, 98, 34, 5);
  // Top tier
  drawTier(22, 66, 24, 4);

  // Tree peak snow puff
  ctx.beginPath();
  ctx.arc(64, 20, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.restore();
  return canvas;
}

/**
 * pine_tree_b: Broad rounded pine with soft puffy cloud snow pillows (128x160).
 */
function drawPineTreeB(): HTMLCanvasElement {
  const canvas = createSafeCanvas(128, 160);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();

  // Wide stout trunk
  ctx.beginPath();
  ctx.roundRect(55, 124, 18, 28, [4, 4, 2, 2]);
  const trunkGrad = ctx.createLinearGradient(55, 124, 73, 152);
  trunkGrad.addColorStop(0, '#5D4037');
  trunkGrad.addColorStop(1, '#3E2723');
  ctx.fillStyle = trunkGrad;
  ctx.fill();

  const drawRoundedTier = (
    topY: number,
    botY: number,
    halfWidth: number,
    pillows: number
  ) => {
    // Lush rounded green tier
    ctx.beginPath();
    ctx.moveTo(64, topY);
    ctx.bezierCurveTo(64 + halfWidth * 0.7, topY + (botY - topY) * 0.4, 64 + halfWidth, botY - 6, 64 + halfWidth, botY);
    ctx.quadraticCurveTo(64, botY + 8, 64 - halfWidth, botY);
    ctx.bezierCurveTo(64 - halfWidth, botY - 6, 64 - halfWidth * 0.7, topY + (botY - topY) * 0.4, 64, topY);
    ctx.closePath();
    const foliageGrad = ctx.createRadialGradient(64, topY + 10, 8, 64, botY, halfWidth);
    foliageGrad.addColorStop(0, '#66BB6A');
    foliageGrad.addColorStop(0.6, '#388E3C');
    foliageGrad.addColorStop(1, '#1B5E20');
    ctx.fillStyle = foliageGrad;
    ctx.fill();

    // Puffy cloud snow pillows across the bough
    const step = (halfWidth * 2) / (pillows + 1);
    const startX = 64 - halfWidth + step / 2;
    for (let p = 0; p < pillows; p++) {
      const px = startX + p * step;
      const pr = step * 0.65;
      ctx.beginPath();
      ctx.arc(px, botY - 2, pr, Math.PI, 0);
      ctx.closePath();
      const snowGrad = ctx.createRadialGradient(px, botY - 6, 2, px, botY, pr);
      snowGrad.addColorStop(0, '#FFFFFF');
      snowGrad.addColorStop(0.75, '#E0F2F1');
      snowGrad.addColorStop(1, '#B2DFDB');
      ctx.fillStyle = snowGrad;
      ctx.fill();
    }
  };

  drawRoundedTier(84, 128, 48, 4);
  drawRoundedTier(52, 94, 38, 3);
  drawRoundedTier(24, 62, 26, 2);

  // Big fluffy summit snow dome
  ctx.beginPath();
  ctx.arc(64, 22, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.restore();
  return canvas;
}

/**
 * pine_tree_c: Slender crystal-frosted cedar pine with icy needle tips (128x160).
 */
function drawPineTreeC(): HTMLCanvasElement {
  const canvas = createSafeCanvas(128, 160);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();

  // Slender trunk
  ctx.beginPath();
  ctx.roundRect(60, 130, 8, 24, [2, 2, 1, 1]);
  const trunkGrad = ctx.createLinearGradient(60, 130, 68, 154);
  trunkGrad.addColorStop(0, '#4E342E');
  trunkGrad.addColorStop(1, '#3E2723');
  ctx.fillStyle = trunkGrad;
  ctx.fill();

  const drawCrispTier = (topY: number, botY: number, halfWidth: number) => {
    ctx.beginPath();
    ctx.moveTo(64, topY);
    ctx.lineTo(64 + halfWidth, botY);
    ctx.lineTo(64 + halfWidth * 0.5, botY - 3);
    ctx.lineTo(64, botY + 2);
    ctx.lineTo(64 - halfWidth * 0.5, botY - 3);
    ctx.lineTo(64 - halfWidth, botY);
    ctx.closePath();
    const grad = ctx.createLinearGradient(64 - halfWidth, topY, 64 + halfWidth, botY);
    grad.addColorStop(0, '#00897B');
    grad.addColorStop(0.5, '#00695C');
    grad.addColorStop(1, '#004D40');
    ctx.fillStyle = grad;
    ctx.fill();

    // Crystalline frosted edges
    ctx.beginPath();
    ctx.moveTo(64 - halfWidth, botY);
    ctx.lineTo(64 - halfWidth * 0.5, botY - 3);
    ctx.lineTo(64, botY + 2);
    ctx.lineTo(64 + halfWidth * 0.5, botY - 3);
    ctx.lineTo(64 + halfWidth, botY);
    ctx.strokeStyle = '#E0F7FA';
    ctx.lineWidth = 2.4;
    ctx.stroke();
  };

  drawCrispTier(96, 132, 34);
  drawCrispTier(70, 102, 28);
  drawCrispTier(46, 76, 22);
  drawCrispTier(24, 50, 15);

  // Crystal star glint at peak
  ctx.beginPath();
  ctx.arc(64, 21, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(64, 15);
  ctx.lineTo(64, 27);
  ctx.moveTo(58, 21);
  ctx.lineTo(70, 21);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.restore();
  return canvas;
}

/**
 * pond_ripple: Soft concentric water ripple rings for living pond effect (240x130).
 */
function drawPondRipple(): HTMLCanvasElement {
  const canvas = createSafeCanvas(240, 130);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();

  // Outer ripple wave
  ctx.beginPath();
  ctx.ellipse(120, 65, 100, 48, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Middle ripple wave
  ctx.beginPath();
  ctx.ellipse(120, 65, 68, 32, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.65)';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Inner ripple wave
  ctx.beginPath();
  ctx.ellipse(120, 65, 36, 17, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Soft sparkle glints on ripple crests
  const glints = [
    [75, 52],
    [165, 48],
    [105, 80],
    [145, 78],
  ];
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (const [gx, gy] of glints) {
    ctx.beginPath();
    ctx.arc(gx, gy, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  return canvas;
}

/**
 * igloo: Cute round igloo with arched doorway (160x140).
 */
function drawIgloo(): HTMLCanvasElement {
  const canvas = createSafeCanvas(160, 140);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();

  // 1. Main igloo ice dome
  ctx.beginPath();
  ctx.arc(80, 88, 54, Math.PI, 0, false);
  ctx.closePath();
  const domeGrad = ctx.createRadialGradient(68, 62, 10, 80, 88, 56);
  domeGrad.addColorStop(0, '#FFFFFF');
  domeGrad.addColorStop(0.4, '#E0F7FA');
  domeGrad.addColorStop(0.85, '#B2EBF2');
  domeGrad.addColorStop(1, '#80DEEA');
  ctx.fillStyle = domeGrad;
  ctx.fill();

  // Ice block seam lines
  ctx.strokeStyle = 'rgba(0, 151, 167, 0.28)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  // Horizontal rings
  ctx.arc(80, 88, 44, Math.PI, 0);
  ctx.moveTo(80 - 28, 88);
  ctx.arc(80, 88, 28, Math.PI, 0);
  // Vertical brick cuts
  ctx.moveTo(56, 68);
  ctx.lineTo(50, 88);
  ctx.moveTo(80, 44);
  ctx.lineTo(80, 60);
  ctx.moveTo(104, 68);
  ctx.lineTo(110, 88);
  ctx.stroke();

  // 2. Arched doorway tunnel
  ctx.beginPath();
  ctx.arc(80, 96, 20, Math.PI, 0, false);
  ctx.lineTo(100, 116);
  ctx.lineTo(60, 116);
  ctx.closePath();
  const tunnelGrad = ctx.createLinearGradient(60, 76, 100, 116);
  tunnelGrad.addColorStop(0, '#E0F7FA');
  tunnelGrad.addColorStop(1, '#B2EBF2');
  ctx.fillStyle = tunnelGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 151, 167, 0.35)';
  ctx.stroke();

  // Doorway opening (dark depth)
  ctx.beginPath();
  ctx.arc(80, 98, 14, Math.PI, 0, false);
  ctx.lineTo(94, 116);
  ctx.lineTo(66, 116);
  ctx.closePath();
  const insideGrad = ctx.createLinearGradient(80, 84, 80, 116);
  insideGrad.addColorStop(0, '#004D40');
  insideGrad.addColorStop(1, '#00251A');
  ctx.fillStyle = insideGrad;
  ctx.fill();

  ctx.restore();
  return canvas;
}

/**
 * snowman: 2-tier snowman with carrot nose and scarf (96x128).
 */
function drawSnowman(): HTMLCanvasElement {
  const canvas = createSafeCanvas(96, 128);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();

  // 1. Bottom body snowball
  ctx.beginPath();
  ctx.arc(48, 92, 28, 0, Math.PI * 2);
  const botGrad = ctx.createRadialGradient(40, 82, 6, 48, 92, 28);
  botGrad.addColorStop(0, '#FFFFFF');
  botGrad.addColorStop(0.7, '#E0F2F1');
  botGrad.addColorStop(1, '#B2DFDB');
  ctx.fillStyle = botGrad;
  ctx.fill();

  // 2. Head snowball
  ctx.beginPath();
  ctx.arc(48, 50, 20, 0, Math.PI * 2);
  const headGrad = ctx.createRadialGradient(42, 42, 4, 48, 50, 20);
  headGrad.addColorStop(0, '#FFFFFF');
  headGrad.addColorStop(0.7, '#E0F2F1');
  headGrad.addColorStop(1, '#B2DFDB');
  ctx.fillStyle = headGrad;
  ctx.fill();

  // 3. Coal eyes & pebble smile
  ctx.fillStyle = '#263238';
  // Eyes
  ctx.beginPath();
  ctx.arc(41, 46, 2.5, 0, Math.PI * 2);
  ctx.arc(55, 46, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Smile dots
  const smile = [
    [41, 56],
    [45, 59],
    [51, 59],
    [55, 56],
  ];
  for (const [sx, sy] of smile) {
    ctx.beginPath();
    ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Bright carrot nose
  ctx.beginPath();
  ctx.moveTo(48, 50);
  ctx.lineTo(64, 52);
  ctx.lineTo(48, 54);
  ctx.closePath();
  ctx.fillStyle = '#FF7043';
  ctx.fill();

  // 5. Cozy red & green striped scarf
  ctx.beginPath();
  ctx.ellipse(48, 68, 22, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#D32F2F';
  ctx.fill();

  ctx.strokeStyle = '#388E3C';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(38, 64);
  ctx.lineTo(38, 72);
  ctx.moveTo(48, 63);
  ctx.lineTo(48, 73);
  ctx.moveTo(58, 64);
  ctx.lineTo(58, 72);
  ctx.stroke();

  // Scarf tail hanging down
  ctx.beginPath();
  ctx.rect(56, 70, 8, 18);
  ctx.fillStyle = '#D32F2F';
  ctx.fill();

  // 6. Charcoal buttons on torso
  ctx.fillStyle = '#263238';
  ctx.beginPath();
  ctx.arc(48, 86, 2.8, 0, Math.PI * 2);
  ctx.arc(48, 98, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  return canvas;
}

/**
 * entity_shadow: Soft elliptical drop shadow (96x48).
 */
function drawEntityShadow(): HTMLCanvasElement {
  const canvas = createSafeCanvas(96, 48);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(48, 24, 44, 20, 0, 0, Math.PI * 2);
  const shadowGrad = ctx.createRadialGradient(48, 24, 6, 48, 24, 44);
  shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
  shadowGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.22)');
  shadowGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.fill();
  ctx.restore();

  return canvas;
}

/**
 * particle_heart: Cute rounded heart for reactions/feeding (32x32).
 */
function drawParticleHeart(): HTMLCanvasElement {
  const canvas = createSafeCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(16, 26);
  ctx.bezierCurveTo(7, 20, 4, 13, 4, 9);
  ctx.bezierCurveTo(4, 5, 8, 3, 12, 3);
  ctx.bezierCurveTo(14.5, 3, 15.5, 4.5, 16, 6);
  ctx.bezierCurveTo(16.5, 4.5, 17.5, 3, 20, 3);
  ctx.bezierCurveTo(24, 3, 28, 5, 28, 9);
  ctx.bezierCurveTo(28, 13, 25, 20, 16, 26);
  ctx.closePath();

  const heartGrad = ctx.createLinearGradient(4, 3, 28, 26);
  heartGrad.addColorStop(0, '#FF4081');
  heartGrad.addColorStop(1, '#C2185B');
  ctx.fillStyle = heartGrad;
  ctx.fill();

  // Gloss highlight on left lobe
  ctx.beginPath();
  ctx.arc(10, 7, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fill();

  ctx.restore();
  return canvas;
}

/**
 * particle_snow: Soft circular snowflake for ambient snow (32x32).
 */
function drawParticleSnow(): HTMLCanvasElement {
  const canvas = createSafeCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();
  ctx.beginPath();
  ctx.arc(16, 16, 12, 0, Math.PI * 2);
  const snowGrad = ctx.createRadialGradient(16, 16, 2, 16, 16, 12);
  snowGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  snowGrad.addColorStop(0.4, 'rgba(224, 247, 250, 0.85)');
  snowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = snowGrad;
  ctx.fill();
  ctx.restore();

  return canvas;
}

/**
 * particle_sparkle: 4-point star sparkle (32x32).
 */
function drawParticleSparkle(): HTMLCanvasElement {
  const canvas = createSafeCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(16, 2);
  ctx.quadraticCurveTo(16, 16, 30, 16);
  ctx.quadraticCurveTo(16, 16, 16, 30);
  ctx.quadraticCurveTo(16, 16, 2, 16);
  ctx.quadraticCurveTo(16, 16, 16, 2);
  ctx.closePath();

  const sparkleGrad = ctx.createRadialGradient(16, 16, 2, 16, 16, 14);
  sparkleGrad.addColorStop(0, '#FFFFFF');
  sparkleGrad.addColorStop(0.5, '#FFF9C4');
  sparkleGrad.addColorStop(1, 'rgba(255, 238, 88, 0)');
  ctx.fillStyle = sparkleGrad;
  ctx.fill();
  ctx.restore();

  return canvas;
}

/**
 * Generates 2.5D procedural vector textures for Island Decorations.
 */
export function generateDecorationTexture(key: string): HTMLCanvasElement {
  const normKey = DECORATION_TEXTURE_KEYS[key as keyof typeof DECORATION_TEXTURE_KEYS] || key;

  switch (normKey) {
    case 'dec_bench_wood': {
      const canvas = createSafeCanvas(110, 70);
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 30, 50, 0.2)';
      ctx.beginPath();
      ctx.ellipse(55, 62, 45, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4a2c11';
      ctx.fillRect(20, 38, 8, 24);
      ctx.fillRect(32, 40, 6, 22);
      ctx.fillRect(72, 40, 6, 22);
      ctx.fillRect(82, 38, 8, 24);

      ctx.fillStyle = '#5c3a1e';
      ctx.fillRect(18, 12, 6, 32);
      ctx.fillRect(86, 12, 6, 32);

      const slatGrad = ctx.createLinearGradient(0, 14, 0, 36);
      slatGrad.addColorStop(0, '#a06535');
      slatGrad.addColorStop(1, '#6d3e18');
      ctx.fillStyle = slatGrad;
      ctx.fillRect(22, 14, 66, 7);
      ctx.fillRect(22, 24, 66, 7);

      const seatGrad = ctx.createLinearGradient(0, 36, 0, 44);
      seatGrad.addColorStop(0, '#b87944');
      seatGrad.addColorStop(1, '#78431b');
      ctx.fillStyle = seatGrad;
      ctx.fillRect(14, 36, 82, 8);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(16, 11, 78, 6, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(12, 34, 86, 6, 3);
      ctx.fill();

      ctx.fillStyle = 'rgba(186, 230, 253, 0.6)';
      ctx.fillRect(16, 15, 78, 2);
      ctx.fillRect(12, 38, 86, 2);

      ctx.restore();
      return canvas;
    }

    case 'dec_pine_crystal': {
      const canvas = createSafeCanvas(90, 130);
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 30, 50, 0.25)';
      ctx.beginPath();
      ctx.ellipse(45, 122, 32, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      const trunkGrad = ctx.createLinearGradient(40, 100, 50, 122);
      trunkGrad.addColorStop(0, '#2e1c0c');
      trunkGrad.addColorStop(1, '#1a1007');
      ctx.fillStyle = trunkGrad;
      ctx.fillRect(40, 100, 10, 22);

      const tiers = [
        { yBottom: 104, yTop: 68, w: 38 },
        { yBottom: 76, yTop: 42, w: 30 },
        { yBottom: 48, yTop: 16, w: 22 },
      ];

      for (const t of tiers) {
        const pineGrad = ctx.createLinearGradient(45 - t.w, t.yBottom, 45 + t.w, t.yTop);
        pineGrad.addColorStop(0, '#0f766e');
        pineGrad.addColorStop(0.5, '#14b8a6');
        pineGrad.addColorStop(1, '#5eead4');
        ctx.fillStyle = pineGrad;

        ctx.beginPath();
        ctx.moveTo(45, t.yTop);
        ctx.lineTo(45 + t.w, t.yBottom);
        ctx.lineTo(45 + t.w * 0.5, t.yBottom - 4);
        ctx.lineTo(45, t.yBottom - 2);
        ctx.lineTo(45 - t.w * 0.5, t.yBottom - 4);
        ctx.lineTo(45 - t.w, t.yBottom);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(45 - t.w, t.yBottom);
        ctx.lineTo(45, t.yTop);
        ctx.lineTo(45 + t.w, t.yBottom);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(45, t.yTop + 6, 2, 0, Math.PI * 2);
        ctx.arc(45 - t.w * 0.4, t.yBottom - 3, 1.5, 0, Math.PI * 2);
        ctx.arc(45 + t.w * 0.4, t.yBottom - 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(45, 14, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return canvas;
    }

    case 'dec_lamp_street': {
      const canvas = createSafeCanvas(60, 130);
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 30, 50, 0.2)';
      ctx.beginPath();
      ctx.ellipse(30, 124, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(22, 124);
      ctx.lineTo(38, 124);
      ctx.lineTo(33, 112);
      ctx.lineTo(27, 112);
      ctx.closePath();
      ctx.fill();

      const postGrad = ctx.createLinearGradient(28, 0, 32, 0);
      postGrad.addColorStop(0, '#334155');
      postGrad.addColorStop(0.5, '#64748b');
      postGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = postGrad;
      ctx.fillRect(28, 42, 4, 70);

      ctx.fillStyle = '#334155';
      ctx.fillRect(23, 50, 14, 3);

      const glowGrad = ctx.createRadialGradient(30, 30, 4, 30, 30, 26);
      glowGrad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
      glowGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)');
      glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(30, 30, 26, 0, Math.PI * 2);
      ctx.fill();

      const glassGrad = ctx.createLinearGradient(20, 20, 40, 42);
      glassGrad.addColorStop(0, '#fffbeb');
      glassGrad.addColorStop(0.5, '#fef08a');
      glassGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.moveTo(23, 22);
      ctx.lineTo(37, 22);
      ctx.lineTo(34, 40);
      ctx.lineTo(26, 40);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(30, 12);
      ctx.lineTo(41, 22);
      ctx.lineTo(19, 22);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(30, 9);
      ctx.lineTo(42, 20);
      ctx.lineTo(18, 20);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      return canvas;
    }

    case 'dec_castle_snow': {
      const canvas = createSafeCanvas(120, 120);
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 30, 50, 0.25)';
      ctx.beginPath();
      ctx.ellipse(60, 112, 50, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      const castleGrad = ctx.createLinearGradient(30, 40, 90, 110);
      castleGrad.addColorStop(0, '#e0f2fe');
      castleGrad.addColorStop(0.5, '#bae6fd');
      castleGrad.addColorStop(1, '#7dd3fc');
      ctx.fillStyle = castleGrad;
      ctx.fillRect(38, 48, 44, 62);

      ctx.fillRect(18, 56, 22, 54);
      ctx.fillRect(80, 56, 22, 54);

      ctx.fillStyle = '#f0f9ff';
      ctx.fillRect(17, 50, 6, 6);
      ctx.fillRect(26, 50, 6, 6);
      ctx.fillRect(35, 50, 6, 6);
      ctx.fillRect(79, 50, 6, 6);
      ctx.fillRect(88, 50, 6, 6);
      ctx.fillRect(97, 50, 6, 6);
      ctx.fillRect(38, 42, 7, 6);
      ctx.fillRect(49, 42, 7, 6);
      ctx.fillRect(60, 42, 7, 6);
      ctx.fillRect(71, 42, 7, 6);

      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.arc(60, 96, 12, Math.PI, 0);
      ctx.lineTo(72, 110);
      ctx.lineTo(48, 110);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(25, 68, 8, 12);
      ctx.fillRect(87, 68, 8, 12);
      ctx.fillRect(56, 56, 8, 14);

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 42);
      ctx.lineTo(60, 20);
      ctx.stroke();

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(60, 20);
      ctx.lineTo(74, 26);
      ctx.lineTo(60, 32);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      return canvas;
    }

    case 'dec_lantern_igloo': {
      const canvas = createSafeCanvas(90, 90);
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 30, 50, 0.2)';
      ctx.beginPath();
      ctx.ellipse(45, 82, 38, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      const iglooGrad = ctx.createRadialGradient(45, 48, 6, 45, 52, 36);
      iglooGrad.addColorStop(0, '#e0f2fe');
      iglooGrad.addColorStop(0.6, '#bae6fd');
      iglooGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = iglooGrad;

      ctx.beginPath();
      ctx.arc(45, 78, 34, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(45, 78, 22, Math.PI, 0);
      ctx.stroke();

      const entGrad = ctx.createLinearGradient(32, 60, 58, 82);
      entGrad.addColorStop(0, '#f0f9ff');
      entGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = entGrad;
      ctx.beginPath();
      ctx.arc(45, 78, 14, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      const coreGrad = ctx.createRadialGradient(45, 74, 1, 45, 74, 10);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.4, '#a5f3fc');
      coreGrad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(45, 78, 9, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f0f9ff';
      ctx.fillRect(40, 40, 10, 6);

      ctx.restore();
      return canvas;
    }

    case 'dec_trophy_master': {
      const canvas = createSafeCanvas(90, 130);
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 30, 50, 0.25)';
      ctx.beginPath();
      ctx.ellipse(45, 122, 34, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      const marbleGrad = ctx.createLinearGradient(20, 98, 70, 122);
      marbleGrad.addColorStop(0, '#1e293b');
      marbleGrad.addColorStop(0.5, '#334155');
      marbleGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = marbleGrad;
      ctx.fillRect(24, 104, 42, 18);

      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(20, 120, 50, 3);
      ctx.fillRect(26, 102, 38, 3);

      const stemGrad = ctx.createLinearGradient(40, 80, 50, 102);
      stemGrad.addColorStop(0, '#fef08a');
      stemGrad.addColorStop(0.5, '#f59e0b');
      stemGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = stemGrad;
      ctx.fillRect(40, 82, 10, 20);

      const cupGrad = ctx.createRadialGradient(45, 52, 4, 45, 52, 28);
      cupGrad.addColorStop(0, '#fffbeb');
      cupGrad.addColorStop(0.3, '#fde047');
      cupGrad.addColorStop(0.7, '#eab308');
      cupGrad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = cupGrad;

      ctx.beginPath();
      ctx.moveTo(25, 42);
      ctx.lineTo(65, 42);
      ctx.quadraticCurveTo(64, 76, 45, 82);
      ctx.quadraticCurveTo(26, 76, 25, 42);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(23, 54, 10, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(67, 54, 10, Math.PI * 1.5, Math.PI * 0.5);
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(45, 30, 8, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(45, 17, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(45, 16);
      ctx.lineTo(53, 18);
      ctx.lineTo(45, 20);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(32, 44, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return canvas;
    }

    default: {
      const canvas = createSafeCanvas(64, 64);
      return canvas;
    }
  }
}

// ---------------------------------------------------------------------------
// Texture Caching & Orchestration
// ---------------------------------------------------------------------------

/**
 * Ensures all required game textures (5 penguins, 3 eggs, 9 environment/particles, 6 decorations)
 * are generated and registered in the scene's texture manager.
 *
 * Caching rule:
 * Before generating any texture, checks `if (scene.textures.exists(key)) return;`
 * to strictly prevent duplicate rendering across multiple entities.
 */
export function ensureGameTextures(scene: Phaser.Scene | SceneLike): void {
  // 1. Penguins (5 species, each with 9 pose frames + 1 default alias)
  const penguinSpecies: PenguinSpeciesKey[] = ['snowy', 'sleepy', 'shy', 'happy', 'hungry'];
  const poses: PenguinPoseKey[] = ['idle', 'walk_0', 'walk_1', 'walk_2', 'walk_3', 'sleep', 'eat', 'celebrate', 'slide'];

  for (const sp of penguinSpecies) {
    const defaultKey = `penguin_${sp}`;
    if (!scene.textures.exists(defaultKey)) {
      const defaultCanvas = generatePenguinTexture(sp, 'idle');
      scene.textures.addCanvas(defaultKey, defaultCanvas);
    }

    for (const pose of poses) {
      const poseKey = `penguin_${sp}_${pose}`;
      if (!scene.textures.exists(poseKey)) {
        const poseCanvas = pose === 'idle'
          ? generatePenguinTexture(sp, 'idle')
          : generatePenguinTexture(sp, pose);
        scene.textures.addCanvas(poseKey, poseCanvas);
      }
    }
  }

  // 2. Register Phaser Animations if animation manager is present
  const animMgr = (scene as { anims?: AnimManagerLike }).anims;
  if (animMgr?.create) {
    for (const sp of penguinSpecies) {
      if (!animMgr.exists(`${sp}_idle`)) {
        animMgr.create({
          key: `${sp}_idle`,
          frames: [{ key: `penguin_${sp}_idle` }],
          frameRate: 1,
          repeat: -1,
        });
      }
      if (!animMgr.exists(`${sp}_walk`)) {
        animMgr.create({
          key: `${sp}_walk`,
          frames: [
            { key: `penguin_${sp}_walk_0` },
            { key: `penguin_${sp}_walk_1` },
            { key: `penguin_${sp}_walk_2` },
            { key: `penguin_${sp}_walk_3` },
          ],
          frameRate: 6,
          repeat: -1,
        });
      }
      if (!animMgr.exists(`${sp}_sleep`)) {
        animMgr.create({
          key: `${sp}_sleep`,
          frames: [{ key: `penguin_${sp}_sleep` }],
          frameRate: 1,
          repeat: -1,
        });
      }
      if (!animMgr.exists(`${sp}_eat`)) {
        animMgr.create({
          key: `${sp}_eat`,
          frames: [
            { key: `penguin_${sp}_eat` },
            { key: `penguin_${sp}_idle` },
          ],
          frameRate: 3,
          repeat: -1,
        });
      }
      if (!animMgr.exists(`${sp}_celebrate`)) {
        animMgr.create({
          key: `${sp}_celebrate`,
          frames: [
            { key: `penguin_${sp}_celebrate` },
            { key: `penguin_${sp}_idle` },
          ],
          frameRate: 4,
          repeat: -1,
        });
      }
      if (!animMgr.exists(`${sp}_slide`)) {
        animMgr.create({
          key: `${sp}_slide`,
          frames: [{ key: `penguin_${sp}_slide` }],
          frameRate: 1,
          repeat: -1,
        });
      }
    }
  }

  // 3. Eggs (3 types)
  const eggKeys: EggTypeKey[] = ['egg_basic', 'egg_frozen', 'egg_golden'];
  for (const key of eggKeys) {
    if (scene.textures.exists(key)) {
      continue;
    }
    const canvas = generateEggTexture(key);
    scene.textures.addCanvas(key, canvas);
  }

  // 4. Environment & particles (13 textures)
  const envKeys: (keyof typeof ENVIRONMENT_TEXTURE_KEYS)[] = [
    'ice_pond',
    'pond_ripple',
    'snow_ground',
    'pine_tree',
    'pine_tree_a',
    'pine_tree_b',
    'pine_tree_c',
    'igloo',
    'snowman',
    'entity_shadow',
    'particle_heart',
    'particle_snow',
    'particle_sparkle',
  ];
  for (const key of envKeys) {
    if (scene.textures.exists(key)) {
      continue;
    }
    const canvas = generateEnvironmentTexture(key);
    scene.textures.addCanvas(key, canvas);
  }

  // 5. Island Decorations (6 items)
  const decKeys: DecorationVisualKey[] = [
    'dec_bench_wood',
    'dec_pine_crystal',
    'dec_lamp_street',
    'dec_castle_snow',
    'dec_lantern_igloo',
    'dec_trophy_master',
  ];
  for (const key of decKeys) {
    if (scene.textures.exists(key)) {
      continue;
    }
    const canvas = generateDecorationTexture(key);
    scene.textures.addCanvas(key, canvas);
  }
}



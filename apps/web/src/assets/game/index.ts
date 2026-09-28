// Currencies
import coin from './icons/currencies/coin.png';
import fish from './icons/currencies/fish.png';
import gem from './icons/currencies/gem.png';

// Navigation
import inventory from './icons/navigation/inventory.png';
import collection from './icons/navigation/collection.png';
import hatchery from './icons/navigation/hatchery.png';
import shop from './icons/navigation/shop.png';
import quests from './icons/navigation/quests.png';
import settings from './icons/navigation/settings.png';

// Actions
import pet from './icons/actions/pet.png';
import feed from './icons/actions/feed.png';
import hatch from './icons/actions/hatch.png';
import nurture from './icons/actions/nurture.png';
import decorate from './icons/actions/decorate.png';

// Status & UI
import star from './icons/status/star.png';
import crown from './icons/status/crown.png';
import close from './icons/status/close.png';
import check from './icons/status/check.png';
import lock from './icons/status/lock.png';
import gift from './icons/status/gift.png';
import calendar from './icons/status/calendar.png';
import target from './icons/status/target.png';
import snowflake from './icons/status/snowflake.png';
import sound_on from './icons/status/sound_on.png';
import sound_off from './icons/status/sound_off.png';
import exportIcon from './icons/status/export.png';
import importIcon from './icons/status/import.png';
import trash from './icons/status/trash.png';
import chevron_left from './icons/status/chevron_left.png';
import chevron_right from './icons/status/chevron_right.png';
import arrow_right from './icons/status/arrow_right.png';

// Food
import sardine from './items/food/sardine.png';
import krill from './items/food/krill.png';
import milk from './items/food/milk.png';
import berries from './items/food/berries.png';
import squid from './items/food/squid.png';
import salmon from './items/food/salmon.png';
import icecream from './items/food/icecream.png';

// Eggs
import egg_basic from './items/eggs/egg_basic.png';
import egg_frozen from './items/eggs/egg_frozen.png';
import egg_golden from './items/eggs/egg_golden.png';

// Moods
import mood_happy from './moods/mood_happy.png';
import mood_excited from './moods/mood_excited.png';
import mood_curious from './moods/mood_curious.png';
import mood_sleepy from './moods/mood_sleepy.png';
import mood_hungry from './moods/mood_hungry.png';
import mood_sad from './moods/mood_sad.png';

export const GAME_ASSETS = {
  // Currencies
  coin,
  fish,
  gem,

  // Navigation
  inventory,
  collection,
  hatchery,
  shop,
  quests,
  settings,

  // Actions
  pet,
  feed,
  hatch,
  nurture,
  decorate,

  // Status & UI
  star,
  crown,
  close,
  check,
  lock,
  gift,
  calendar,
  target,
  snowflake,
  sound_on,
  sound_off,
  audio_on: sound_on,
  audio_off: sound_off,
  export: exportIcon,
  import: importIcon,
  trash,
  chevron_left,
  chevron_right,
  arrow_right,

  // Food
  sardine,
  krill,
  milk,
  berries,
  squid,
  salmon,
  icecream,
  food_sardine: sardine,
  food_krill: krill,
  food_milk: milk,
  food_berries: berries,
  food_squid: squid,
  food_salmon: salmon,
  food_icecream: icecream,

  // Eggs
  egg_basic,
  egg_frozen,
  egg_golden,
  'egg-basic': egg_basic,
  'egg-frozen': egg_frozen,
  'egg-golden': egg_golden,

  // Moods
  mood_happy,
  mood_excited,
  mood_curious,
  mood_sleepy,
  mood_hungry,
  mood_sad,
  happy: mood_happy,
  excited: mood_excited,
  curious: mood_curious,
  sleepy: mood_sleepy,
  hungry: mood_hungry,
  sad: mood_sad
} as const;

export type GameAssetKey = keyof typeof GAME_ASSETS;

export function getGameAssetUrl(key: string): string | undefined {
  if (key in GAME_ASSETS) {
    return GAME_ASSETS[key as GameAssetKey];
  }
  return undefined;
}

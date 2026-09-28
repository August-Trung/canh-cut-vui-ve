import { PenguinTraitDefinition } from '@penguin/types';

export const TRAITS_CATALOG: Record<string, PenguinTraitDefinition> = {
  glutton: {
    id: 'glutton',
    name: 'Phàm Ăn (Glutton)',
    description: 'Nhận thêm 25% Penguin EXP khi ăn, nhưng đói nhanh hơn 10%.',
    icon: 'trait_glutton',
    effectType: 'care',
    rarity: 'common',
  },
  speedy: {
    id: 'speedy',
    name: 'Lướt Gió (Speedy)',
    description: 'Di chuyển và trượt bụng nhanh hơn 25%; tăng 15% thời gian phản xạ câu cá.',
    icon: 'trait_speedy',
    effectType: 'minigame',
    rarity: 'common',
  },
  cozy_aura: {
    id: 'cozy_aura',
    name: 'Hào Quang Ấm Áp (Cozy Aura)',
    description: 'Tỏa ra sự ấm áp giúp tăng thêm +5 Điểm Ấm Cúng cho toàn đảo.',
    icon: 'trait_cozy_aura',
    effectType: 'island',
    rarity: 'rare',
  },
  lucky: {
    id: 'lucky',
    name: 'May Mắn (Lucky)',
    description: 'Có 15% cơ hội nhân đôi số tiền vàng rơi ra khi được cho ăn.',
    icon: 'trait_lucky',
    effectType: 'care',
    rarity: 'rare',
  },
  angler: {
    id: 'angler',
    name: 'Sát Thủ Câu Cá (Master Angler)',
    description: 'Tăng 20% điểm số khi làm bạn đồng hành trong mini-game Câu Cá.',
    icon: 'trait_angler',
    effectType: 'minigame',
    rarity: 'epic',
  },
  romantic: {
    id: 'romantic',
    name: 'Đào Hoa (Romantic)',
    description: 'Giảm 25% thời gian chờ phối giống và tăng 10% tỷ lệ đột biến gen con.',
    icon: 'trait_romantic',
    effectType: 'breeding',
    rarity: 'epic',
  },
};

export const TRAIT_IDS = Object.keys(TRAITS_CATALOG);

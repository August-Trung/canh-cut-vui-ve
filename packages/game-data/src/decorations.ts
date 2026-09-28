import { DecorationPlot, DecorationDefinition } from '@penguin/types';

export const DECORATION_PLOTS: DecorationPlot[] = [
  { id: 1, x: -180, y: -90, name: 'Sườn Tuyết Tây Bắc', depthOffset: -90 },
  { id: 2, x: -210, y: 10,  name: 'Bờ Hồ Tây',         depthOffset: 10 },
  { id: 3, x: 120,  y: -80, name: 'Gần Tổ Ấp Đông Bắc', depthOffset: -80 },
  { id: 4, x: -60,  y: 95,  name: 'Bờ Hồ Nam',          depthOffset: 95 },
  { id: 5, x: 180,  y: 35,  name: 'Rừng Thông Đông Nam', depthOffset: 35 },
  { id: 6, x: 70,   y: 105, name: 'Bãi Tuyết Nam',      depthOffset: 105 },
];

export const DECORATION_CATALOG: Record<string, DecorationDefinition> = {
  bench_wood: {
    id: 'bench_wood',
    name: 'Ghế Gỗ Mùa Đông',
    description: 'Chiếc ghế gỗ phủ tuyết ấm cúng để ngắm hồ băng.',
    cozyPoints: 10,
    playerLevelRequired: 3,
    priceCoins: 150,
    visualKey: 'dec_bench_wood',
  },
  pine_crystal: {
    id: 'pine_crystal',
    name: 'Thông Pha Lê Tuyết',
    description: 'Cây thông phủ băng lấp lánh phản chiếu ánh mặt trời.',
    cozyPoints: 15,
    playerLevelRequired: 5,
    priceCoins: 300,
    visualKey: 'dec_pine_crystal',
  },
  lamp_street: {
    id: 'lamp_street',
    name: 'Đèn Đường Cổ Điển',
    description: 'Cột đèn ấm áp tỏa ánh vàng dịu dàng giữa trời tuyết.',
    cozyPoints: 20,
    playerLevelRequired: 6,
    priceCoins: 450,
    visualKey: 'dec_lamp_street',
  },
  castle_snow: {
    id: 'castle_snow',
    name: 'Lâu Đài Tuyết Mini',
    description: 'Tòa lâu đài băng thu nhỏ do chính các chú cánh cụt đắp nên.',
    cozyPoints: 35,
    playerLevelRequired: 8,
    priceCoins: 750,
    visualKey: 'dec_castle_snow',
  },
  lantern_igloo: {
    id: 'lantern_igloo',
    name: 'Đèn Băng Lều Tuyết',
    description: 'Đèn lồng chạm khắc từ khối băng tinh khiết.',
    cozyPoints: 25,
    playerLevelRequired: 9,
    priceCoins: 600,
    priceGems: 10,
    visualKey: 'dec_lantern_igloo',
  },
  master_caretaker_trophy: {
    id: 'master_caretaker_trophy',
    name: 'Cúp Người Nuôi Đại Tài',
    description: 'Chiếc cúp vàng vinh danh người chăm sóc đảo tuyết xuất sắc nhất.',
    cozyPoints: 50,
    playerLevelRequired: 10,
    priceCoins: 1500,
    priceGems: 20,
    visualKey: 'dec_trophy_master',
  },
};

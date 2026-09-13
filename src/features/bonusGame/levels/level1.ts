import type { BonusLevel, Collectible, Platform } from '../bonusGame.types';

export const gaps = [
  [1500, 1610], [1900, 2020], [2320, 2450], [3350, 3490], [3700, 3830],
  [4750, 4880], [5700, 6300], [6600, 6740], [7550, 7690], [8500, 8640],
  [9150, 9290], [9750, 9890], [10300, 11000], [11800, 11950], [12550, 12700],
  [13550, 13700], [14300, 14450], [14800, 14950], [15700, 15850], [16500, 16650], [17400, 17550],
  [18350, 18500], [19000, 19600], [20300, 20450], [21000, 21150], [21900, 22050],
  [22700, 22850], [23200, 23800], [24400, 24550], [25000, 25150],
] as const;

const ground: Platform[] = [...gaps, [26000, 26000] as const].map(([end], index) => {
  const start = index === 0 ? 0 : gaps[index - 1]![1];
  return { x: start, y: 480, width: end - start, height: 200, ground: true };
});
const ledge = (positionX: number, positionY = 395, width = 150): Platform => ({ x: positionX, y: positionY, width, height: 22 });
const ferry = (positionX: number, positionY: number, axis: 'x' | 'y', distance = 65): Platform => ({ ...ledge(positionX, positionY, 150), motion: { axis, distance, period: 4 } });
const fragile = (positionX: number, positionY = 395): Platform => ({ ...ledge(positionX, positionY, 130), crumbleAfter: 1.1 });

const platforms: Platform[] = [
  ...ground,
  ledge(650), ledge(2500), ledge(2650, 310), ledge(2800, 225, 180),
  ferry(3950, 380, 'y', 45),
  ledge(5350), ferry(5500, 330, 'y', 55), ferry(5770, 320, 'x', 85), ledge(6030, 310), ledge(6200, 395),
  ...[5810, 6020, 6210].map(positionX => ledge(positionX, 460, 110)),
  ledge(7200), ferry(7350, 310, 'y', 65), ledge(7500, 230),
  fragile(8750), ledge(9950), fragile(10120, 310),
  ...[10300, 10490, 10680, 10870].map(positionX => fragile(positionX, 310)),
  ...[10400, 10600, 10800].map(positionX => ledge(positionX, 460, 120)),
  ledge(11040, 395), ledge(12050), fragile(12210, 310), ledge(12380, 225),
  ledge(13900), ledge(14060, 310), ledge(14220, 225),
  ledge(15020), fragile(15200, 310), ferry(15400, 270, 'x', 60), ledge(15610, 350),
  ledge(16900), ferry(17060, 310, 'y', 60), ledge(17240, 225),
  ledge(18750), ferry(18930, 325, 'y', 55), fragile(19100, 300), ferry(19310, 310, 'x', 70), ledge(19540, 390),
  ...[19100, 19300, 19500].map(positionX => ledge(positionX, 460, 110)),
  ledge(20600), fragile(20780, 310), ledge(20950, 225),
  ledge(22900), fragile(23070, 310), ferry(23300, 310, 'x', 60), fragile(23510, 310), ledge(23700, 395),
  ...[23300, 23500, 23700].map(positionX => ledge(positionX, 460, 110)),
  ledge(24700), fragile(24850, 310),
];

const collectibles: Collectible[] = [
  ...ground.filter(platform => platform.width >= 420).flatMap((platform, trail) =>
    Array.from({ length: Math.min(7, Math.floor((platform.width - 260) / 90)) }, (_value, index) => ({
      id: `trail-${trail}-${index}`, kind: 'coin1' as const, x: platform.x + 180 + index * 90, y: 435, width: 28, height: 28,
    }))),
  ...platforms.filter(platform => !platform.ground).map((platform, index) => ({
    id: `high-${index}`, kind: 'coin1' as const, x: platform.x + platform.width / 2 - 14, y: platform.y - 42, width: 28, height: 28,
  })),
  ...gaps.filter(([start, end]) => end - start < 200).map(([start, end], index) => ({
    id: `jump-${index}`, kind: 'coin1' as const, x: (start + end) / 2 - 14, y: 345, width: 28, height: 28,
  })),
  { id: 'rare', kind: 'coin100', x: 2860, y: 180, width: 32, height: 32 },
  ...[[1250, 436], [7540, 186], [10900, 266], [14270, 181], [17300, 181], [21000, 181], [24880, 266]].map(([positionX = 0, positionY = 0], index) => ({
    id: `gift-${index}`, kind: 'giftChest' as const, x: positionX, y: positionY, width: 44, height: 44,
  })),
];

export const level1: BonusLevel = {
  id: 'sunny-trail', name: 'Mias Sonnenpfad', width: 26000, height: 650, spawn: { x: 80, y: 432 }, platforms, collectibles,
  enemies: [1050, 2750, 4100, 5150, 7000, 8100, 9450, 11400, 12300, 13900, 15300, 16200, 17100, 18000, 19900, 20700, 21500, 22400, 24100, 25300].map((positionX, index) => ({
    id: `enemy-${index}`, x: positionX, y: 434, width: 36, height: 46, patrolMinX: positionX - 55, patrolMaxX: positionX + 90, direction: -1, defeated: false,
  })),
  decorations: [
    ...[900, 2200, 3550, 4500, 6450, 7900, 8950, 11200, 12900, 14600, 16000, 17800, 20100, 22200, 25500].map(positionX => ({ kind: 'tree' as const, x: positionX, y: 265, width: 170, height: 215 })),
    ...[100, 650, 1300, 1900, 2700, 3400, 4100, 4900, 5700, 6500, 7500, 8500].map(positionX => ({ kind: 'cloud' as const, x: positionX, y: 45 + positionX % 65, width: 170, height: 90 })),
  ],
  sections: [
    { x: 0, title: 'Hüpfwiese', hint: 'Folge den Münzen über die Lücken!', sky: '#c4e9f5' },
    { x: 4500, title: 'Wolkenfähren', hint: 'Blau fährt mit dir. Oben warten Schätze!', sky: '#cbdafa' },
    { x: 8700, title: 'Knusperbrücken', hint: 'Orange bröckelt — spring rechtzeitig weiter!', sky: '#ffe4bb' },
    { x: 13300, title: 'Baumkronenweg', hint: 'Unten sicherer, oben mehr Schätze!', sky: '#cceacf' },
    { x: 17800, title: 'Mutige Sprünge', hint: 'Plattformen, Lücken und kleine Monster!', sky: '#e0d3f2' },
    { x: 22300, title: 'Zum Häuschen!', hint: 'Die letzte Brücke — du schaffst das!', sky: '#ffd9bf' },
  ],
  checkpoint: { x: 13000, y: 432, width: 80, height: 48 },
  checkpoints: [4300, 8900, 17700, 22200].map(positionX => ({ x: positionX, y: 432, width: 80, height: 48 })),
  finish: { x: 25740, y: 396, width: 70, height: 84 }, house: { x: 25660, y: 210, width: 230, height: 270 },
};

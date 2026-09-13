import mia from '@/assets/characters/mia/idle.png';
import houseFinish from './environment/house-finish.png';
import tree from './environment/tree.png';
import cloud from './environment/cloud.png';
import coin1 from './collectibles/coin-1.png';
import coin100 from './collectibles/coin-100.png';
import giftChest from './collectibles/gift-chest.png';
import enemy from './enemies/enemy.png';

export const bonusGameAssets = { mia, houseFinish, tree, cloud, coin1, coin100, giftChest, enemy };
export type AssetName = keyof typeof bonusGameAssets;

import { bonusGameAssets, type AssetName } from '../assets/bonusGameAssets';

export interface Sprite { image: HTMLImageElement; crop: { x: number; y: number; width: number; height: number } }
export type Sprites = Record<AssetName, Sprite | null>;
function visualCrop(image: HTMLImageElement): Sprite {
  const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  let left = canvas.width; let top = canvas.height; let right = 0; let bottom = 0;
  if (context) {
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let row = 0; row < canvas.height; row += 2) for (let column = 0; column < canvas.width; column += 2) {
      if (pixels[(row * canvas.width + column) * 4 + 3]! > 24) { left = Math.min(left, column); right = Math.max(right, column); top = Math.min(top, row); bottom = Math.max(bottom, row); }
    }
  }
  return { image, crop: right > left ? { x: left, y: top, width: right - left + 1, height: bottom - top + 1 } : { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight } };
}
export async function loadSprites(): Promise<Sprites> {
  const entries = await Promise.all(Object.entries(bonusGameAssets).map(async ([name, url]) => {
    const sprite = await new Promise<Sprite | null>(resolve => {
      const image = new Image();
      const timeout = window.setTimeout(() => resolve(null), 10_000);
      image.onload = () => { window.clearTimeout(timeout); try { resolve(visualCrop(image)); } catch { resolve(null); } };
      image.onerror = () => { window.clearTimeout(timeout); resolve(null); };
      image.src = url;
    });
    return [name, sprite];
  }));
  return Object.fromEntries(entries) as Sprites;
}

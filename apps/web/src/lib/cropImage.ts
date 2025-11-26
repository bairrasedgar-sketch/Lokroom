// apps/web/src/lib/cropImage.ts

export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CropOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
};

/**
 * Découpe une image en utilisant un canvas.
 * Retourne le Blob + les dimensions finales.
 *
 * - limite la taille max (ex: 2560px) pour éviter les énormes fichiers
 * - qualité par défaut ~0.92
 */
export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: PixelCrop,
  mime: string,
  options: CropOptions = {}
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = document.createElement("img");
  img.src = imageSrc;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (err) => reject(err);
  });

  const MAX_W = options.maxWidth ?? 2560;
  const MAX_H = options.maxHeight ?? 2560;
  const quality = options.quality ?? 0.92;

  // Dimensions de base = zone crop
  let targetWidth = pixelCrop.width;
  let targetHeight = pixelCrop.height;

  // On réduit si c’est trop grand (mais on ne grossit jamais)
  const ratio = Math.min(MAX_W / targetWidth, MAX_H / targetHeight, 1);
  targetWidth = Math.round(targetWidth * ratio);
  targetHeight = Math.round(targetHeight * ratio);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas non supporté");
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.drawImage(
    img,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) return reject(new Error("toBlob a retourné null"));
        resolve(b);
      },
      mime,
      quality
    );
  });

  return { blob, width: targetWidth, height: targetHeight };
}

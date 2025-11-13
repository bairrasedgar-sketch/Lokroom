// src/lib/cropImage.ts
export async function getCroppedImage(
  file: File,
  crop: { x: number; y: number; width: number; height: number },
): Promise<File> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = URL.createObjectURL(file);
  });

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    img,
    crop.x, crop.y, crop.width, crop.height,
    0, 0, crop.width, crop.height
  );

  return await new Promise<File>((resolve) =>
    canvas.toBlob((blob) => {
      resolve(new File([blob!], file.name, { type: file.type }));
    }, file.type),
  );
}

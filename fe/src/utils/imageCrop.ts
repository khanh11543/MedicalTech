import type { Area } from 'react-easy-crop';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (err) => reject(err));
    image.src = src;
  });
}

/**
 * Export a cropped region from an image URL (blob URL or data URL) as a JPEG File.
 */
export async function getCroppedImageFile(
  imageSrc: string,
  pixelCrop: Area,
  options?: { fileName?: string; quality?: number; maxSide?: number }
): Promise<File> {
  const { fileName = 'image.jpg', quality = 0.92, maxSide = 1024 } = options ?? {};
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  let { width, height } = pixelCrop;
  if (maxSide > 0 && (width > maxSide || height > maxSide)) {
    const scale = maxSide / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  } else {
    width = Math.round(width);
    height = Math.round(height);
  }

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Crop failed'));
          return;
        }
        resolve(new File([blob], fileName, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      quality
    );
  });
}

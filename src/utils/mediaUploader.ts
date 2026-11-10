/**
 * Client-Side Media Uploader & Compression Utility
 * Optimized for local web storage and instant visual responsiveness.
 */

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as DataURL'));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image file client-side using an HTML Canvas.
 * Automatically resizes images with dimensions exceeding maxWidth/maxHeight
 * while maintaining exact aspect ratio, reducing typical multi-megabyte photos
 * down to crisp ~150KB-400KB WebP/JPEG files.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.85
): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate proportional downscale
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl); // Fallback to raw if canvas context is unavailable
        return;
      }

      // Smooth bicubic resampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Determine format: prefer webp if supported, otherwise jpeg
      try {
        const compressedUrl = canvas.toDataURL('image/webp', quality);
        if (compressedUrl.startsWith('data:image/webp')) {
          resolve(compressedUrl);
          return;
        }
      } catch {
        // Ignore fallback
      }

      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      // If image loading fails, return original dataUrl
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Human-readable byte formatting
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

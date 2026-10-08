export function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;

    image.src = url;
  });
}

export async function getCroppedBlob(
  imageSrc,
  croppedAreaPixels,
  maxSize = 1200
) {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  let width = croppedAreaPixels.width;
  let height = croppedAreaPixels.height;

  // Resize jika terlalu besar
  const scale = Math.min(
    1,
    maxSize / Math.max(width, height)
  );

  width = Math.round(width * scale);
  height = Math.round(height * scale);

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    width,
    height
  );

  return compressToTarget(canvas);
}

async function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      "image/webp",
      quality
    );
  });
}

async function compressToTarget(canvas) {
  const MIN_SIZE = 100 * 1024;
  const MAX_SIZE = 300 * 1024;

  let quality = 0.85;

  let blob = await canvasToBlob(canvas, quality);

  // Turunkan kualitas sampai <= 300 KB
  while (
    blob.size > MAX_SIZE &&
    quality > 0.55
  ) {
    quality -= 0.05;

    blob = await canvasToBlob(
      canvas,
      quality
    );
  }

  // Jika masih lebih besar dari 300 KB,
  // resize canvas sedikit demi sedikit.
  while (
    blob.size > MAX_SIZE &&
    canvas.width > 500
  ) {
    canvas.width = Math.round(canvas.width * 0.9);
    canvas.height = Math.round(canvas.height * 0.9);

    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height
    );

    blob = await canvasToBlob(
      canvas,
      quality
    );
  }

  return {
    blob,
    size: blob.size,
    quality,
  };
}
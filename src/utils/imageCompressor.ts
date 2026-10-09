import JSZip from 'jszip';
import { CompressedImageResult } from '../types';

export interface CompressionSettings {
  mode: 'quality' | 'target-size';
  quality: number; // 0.1 to 1.0
  targetSizeKb: number; // e.g. 100, 200, 500
  format: 'jpeg' | 'webp' | 'png';
  maxDimension: number; // 0 means original, or 1920, 1280, 800
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image ${file.name}`));
    };
    img.src = url;
  });
}

function renderToCanvas(
  img: HTMLImageElement,
  maxDim: number
): { canvas: HTMLCanvasElement; width: number; height: number } {
  let w = img.width;
  let h = img.height;

  if (maxDim > 0 && (w > maxDim || h > maxDim)) {
    if (w > h) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  // Fill white for transparent conversion to jpeg
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  return { canvas, width: w, height: h };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create blob'));
      },
      mime,
      quality
    );
  });
}

export async function compressSingleImage(
  file: File,
  settings: CompressionSettings
): Promise<CompressedImageResult> {
  const img = await loadImage(file);
  const mime =
    settings.format === 'png'
      ? 'image/png'
      : settings.format === 'webp'
      ? 'image/webp'
      : 'image/jpeg';

  let currentMaxDim = settings.maxDimension;
  let { canvas, width, height } = renderToCanvas(img, currentMaxDim);

  let finalBlob: Blob;

  if (settings.mode === 'quality') {
    finalBlob = await canvasToBlob(canvas, mime, settings.quality);
  } else {
    // Target Size Mode: Binary search on quality, and step down dimensions if necessary
    const targetBytes = settings.targetSizeKb * 1024;
    let minQ = 0.05;
    let maxQ = 0.95;
    let bestBlob: Blob | null = null;

    // Up to 5 binary search iterations
    for (let iter = 0; iter < 5; iter++) {
      const midQ = (minQ + maxQ) / 2;
      const testBlob = await canvasToBlob(canvas, mime, midQ);

      if (testBlob.size <= targetBytes) {
        bestBlob = testBlob;
        minQ = midQ; // try to get better quality
      } else {
        maxQ = midQ; // need smaller
      }
    }

    // If still larger than target, downscale canvas dimensions
    if (!bestBlob || bestBlob.size > targetBytes) {
      let scale = 0.8;
      for (let scaleIter = 0; scaleIter < 3; scaleIter++) {
        const scaledDim = Math.round(Math.max(width, height) * scale);
        const { canvas: scaledCanvas, width: sw, height: sh } = renderToCanvas(img, scaledDim);
        canvas = scaledCanvas;
        width = sw;
        height = sh;
        const testBlob = await canvasToBlob(canvas, mime, 0.6);
        if (testBlob.size <= targetBytes || scaleIter === 2) {
          bestBlob = testBlob;
          break;
        }
        scale *= 0.7;
      }
    }

    finalBlob = bestBlob || (await canvasToBlob(canvas, mime, 0.5));
  }

  const originalUrl = URL.createObjectURL(file);
  const compressedUrl = URL.createObjectURL(finalBlob);

  const ext = settings.format === 'png' ? 'png' : settings.format === 'webp' ? 'webp' : 'jpg';
  const rawName = file.name.replace(/\.[^/.]+$/, '');
  const outName = `${rawName}_compressed.${ext}`;

  const savedBytes = file.size - finalBlob.size;
  const savedPercentage = Math.max(0, Math.round((savedBytes / file.size) * 100));

  return {
    id: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: outName,
    originalSize: file.size,
    compressedSize: finalBlob.size,
    originalUrl,
    compressedUrl,
    blob: finalBlob,
    width,
    height,
    format: settings.format,
    savedPercentage,
  };
}

export async function compressMultipleImages(
  files: File[],
  settings: CompressionSettings,
  onProgress?: (current: number, total: number) => void
): Promise<CompressedImageResult[]> {
  const results: CompressedImageResult[] = [];
  for (let i = 0; i < files.length; i++) {
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
    const res = await compressSingleImage(files[i], settings);
    results.push(res);
  }
  return results;
}

export async function createZipOfCompressedImages(
  items: CompressedImageResult[],
  zipName: string = 'compressed_photos.zip'
): Promise<Blob> {
  const zip = new JSZip();
  for (const it of items) {
    zip.file(it.name, it.blob);
  }
  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

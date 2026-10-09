import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { ConvertedPageImage, PdfToImageOptions } from '../types';

// Setup pdfjs worker with offline-first and CDN fallback
try {
  // Vite URL asset resolution
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (e) {
  // Fallback to CDN matching version
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface PdfDocumentInfo {
  numPages: number;
  title?: string;
  fingerprint: string;
}

export async function loadPdfDocument(file: File): Promise<{
  doc: pdfjsLib.PDFDocumentProxy;
  info: PdfDocumentInfo;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  });

  const doc = await loadingTask.promise;
  const metadata = await doc.getMetadata().catch(() => null);

  const info: PdfDocumentInfo = {
    numPages: doc.numPages,
    title: (metadata?.info as Record<string, unknown>)?.Title as string || file.name.replace(/\.pdf$/i, ''),
    fingerprint: doc.fingerprints[0] || file.name,
  };

  return { doc, info };
}

export async function renderPageToImage(
  doc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  options: PdfToImageOptions,
  baseFileName: string
): Promise<ConvertedPageImage> {
  const page = await doc.getPage(pageNumber);

  // Standard PDF resolution is 72 DPI.
  const scale = options.dpi / 72;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: options.format === 'png' });
  if (!ctx) {
    throw new Error('Canvas 2D context could not be created');
  }

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  // Fill background white for JPEG/WebP or non-transparent PNG
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: ctx,
    viewport,
    canvas,
  };

  await page.render(renderContext).promise;

  const mimeType =
    options.format === 'png'
      ? 'image/png'
      : options.format === 'webp'
      ? 'image/webp'
      : 'image/jpeg';

  const ext = options.format === 'png' ? 'png' : options.format === 'webp' ? 'webp' : 'jpg';
  const quality = options.format === 'png' ? 1.0 : 0.92;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to generate image blob from page canvas'));
      },
      mimeType,
      quality
    );
  });

  const dataUrl = URL.createObjectURL(blob);
  const padNum = String(pageNumber).padStart(2, '0');
  const fileName = `${baseFileName}_page_${padNum}.${ext}`;

  return {
    pageNumber,
    dataUrl,
    blob,
    width: canvas.width,
    height: canvas.height,
    fileName,
  };
}

export async function convertPdfToImages(
  doc: pdfjsLib.PDFDocumentProxy,
  options: PdfToImageOptions,
  baseFileName: string,
  onProgress?: (current: number, total: number) => void
): Promise<ConvertedPageImage[]> {
  const pagesToConvert =
    options.selectedPages.length > 0
      ? options.selectedPages.filter((p) => p >= 1 && p <= doc.numPages)
      : Array.from({ length: doc.numPages }, (_, i) => i + 1);

  const results: ConvertedPageImage[] = [];

  for (let i = 0; i < pagesToConvert.length; i++) {
    const pageNum = pagesToConvert[i];
    if (onProgress) {
      onProgress(i + 1, pagesToConvert.length);
    }
    const pageImage = await renderPageToImage(doc, pageNum, options, baseFileName);
    results.push(pageImage);
  }

  return results;
}

export async function createZipFromImages(
  images: ConvertedPageImage[],
  zipFileName: string = 'converted_pages.zip'
): Promise<Blob> {
  const zip = new JSZip();

  for (const img of images) {
    zip.file(img.fileName, img.blob);
  }

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

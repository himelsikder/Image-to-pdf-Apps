import { PDFDocument, degrees } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Worker resolution for pdfjs
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

/**
 * Encrypt a PDF file with User & Owner password using AES-256 or RC4
 */
export async function passwordProtectPdf(
  file: File,
  userPassword: string,
  ownerPassword?: string,
  algorithm: 'AES-256' | 'RC4' = 'AES-256'
): Promise<{ blob: Blob; size: number; fileName: string }> {
  if (!userPassword || userPassword.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }

  const arrayBuffer = await file.arrayBuffer();
  // First load with pdf-lib to ensure valid structure and sanitize
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const rawBytes = await pdfDoc.save();

  // Encrypt using @pdfsmaller/pdf-encrypt
  const encryptedBytes = await encryptPDF(rawBytes, userPassword, {
    ownerPassword: ownerPassword || userPassword,
    algorithm,
  });

  const blob = new Blob([encryptedBytes as unknown as BlobPart], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  const fileName = `${baseName}_protected.pdf`;

  return { blob, size: blob.size, fileName };
}

export interface PageOrderConfig {
  id: string;
  originalIndex: number; // 0-based index
  pageNumber: number; // 1-based display number
  rotation: number; // 0, 90, 180, 270
  thumbnailUrl?: string;
}

/**
 * Reorder and rotate specific pages of a PDF, outputting a new PDF
 */
export async function reorderAndRotatePdfPages(
  file: File,
  pageConfigs: PageOrderConfig[],
  outputTitle?: string
): Promise<{ blob: Blob; size: number; fileName: string }> {
  if (pageConfigs.length === 0) {
    throw new Error('Please include at least one page');
  }

  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const title = outputTitle || file.name.replace(/\.pdf$/i, '') + '_reordered.pdf';
  newDoc.setTitle(title);
  newDoc.setProducer('Img to Pdf Offline');

  for (const item of pageConfigs) {
    const [copiedPage] = await newDoc.copyPages(srcDoc, [item.originalIndex]);
    const currentAngle = copiedPage.getRotation().angle;
    const finalAngle = (currentAngle + item.rotation) % 360;
    copiedPage.setRotation(degrees(finalAngle));
    newDoc.addPage(copiedPage);
  }

  const newBytes = await newDoc.save();
  const blob = new Blob([newBytes as unknown as BlobPart], { type: 'application/pdf' });
  return { blob, size: blob.size, fileName: title };
}

/**
 * Split a PDF into distinct range parts
 */
export async function splitPdfByRange(
  file: File,
  startPage: number, // 1-based
  endPage: number // 1-based inclusive
): Promise<{ blob: Blob; size: number; fileName: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  const start = Math.max(1, Math.min(startPage, totalPages));
  const end = Math.max(start, Math.min(endPage, totalPages));

  const newDoc = await PDFDocument.create();
  const indices: number[] = [];
  for (let i = start; i <= end; i++) {
    indices.push(i - 1);
  }

  const copiedPages = await newDoc.copyPages(srcDoc, indices);
  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  const newBytes = await newDoc.save();
  const blob = new Blob([newBytes as unknown as BlobPart], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  const fileName = `${baseName}_pages_${start}-${end}.pdf`;

  return { blob, size: blob.size, fileName };
}

/**
 * Split every single page of a PDF into individual PDF files packaged inside a single ZIP file
 */
export async function splitPdfAllPagesToZip(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<{ zipBlob: Blob; size: number; pageCount: number; fileName: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = srcDoc.getPageCount();

  const zip = new JSZip();
  const baseName = file.name.replace(/\.pdf$/i, '');
  const folder = zip.folder(`${baseName}_split_pages`) || zip;

  for (let i = 0; i < pageCount; i++) {
    if (onProgress) {
      onProgress(i + 1, pageCount);
    }
    const singleDoc = await PDFDocument.create();
    const [page] = await singleDoc.copyPages(srcDoc, [i]);
    singleDoc.addPage(page);
    const pdfBytes = await singleDoc.save();
    const padNum = String(i + 1).padStart(String(pageCount).length, '0');
    folder.file(`${baseName}_page_${padNum}.pdf`, pdfBytes);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const fileName = `${baseName}_all_pages.zip`;

  return { zipBlob, size: zipBlob.size, pageCount, fileName };
}

/**
 * Render a lightweight thumbnail for a PDF page using pdfjs-dist
 */
export async function renderPdfThumbnail(
  file: File,
  pageNumber: number,
  scale: number = 0.5
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  });

  const doc = await loadingTask.promise;
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvas,
    canvasContext: ctx,
    viewport,
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.8);
}

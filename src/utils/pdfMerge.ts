import { PDFDocument } from 'pdf-lib';
import { PdfMergeItem } from '../types';

export async function getPdfInfo(file: File): Promise<PdfMergeItem> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return {
    id: `pdf_item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    file,
    name: file.name,
    size: file.size,
    pageCount: pdfDoc.getPageCount(),
  };
}

export async function mergePdfFiles(
  items: PdfMergeItem[],
  outputTitle: string = 'Merged_Document.pdf',
  onProgress?: (current: number, total: number) => void
): Promise<{ blob: Blob; size: number }> {
  if (items.length === 0) {
    throw new Error('Please add at least one PDF file');
  }

  const mergedDoc = await PDFDocument.create();
  mergedDoc.setTitle(outputTitle);
  mergedDoc.setProducer('Img to Pdf Offline Studio');

  for (let i = 0; i < items.length; i++) {
    if (onProgress) {
      onProgress(i + 1, items.length);
    }
    const item = items[i];
    const arrayBuffer = await item.file.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageIndices = srcDoc.getPageIndices();
    const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);

    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }
  }

  const mergedBytes = await mergedDoc.save();
  const blob = new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });
  return { blob, size: blob.size };
}

export async function removePagesFromPdf(
  file: File,
  pagesToRemove: number[], // 1-indexed
  outputTitle: string = 'Edited_Document.pdf'
): Promise<{ blob: Blob; size: number; remainingPages: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  // Create new document with remaining pages
  const newDoc = await PDFDocument.create();
  newDoc.setTitle(outputTitle);

  const keepIndices: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (!pagesToRemove.includes(i)) {
      keepIndices.push(i - 1);
    }
  }

  if (keepIndices.length === 0) {
    throw new Error('Cannot delete all pages from the document');
  }

  const copiedPages = await newDoc.copyPages(pdfDoc, keepIndices);
  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  const newBytes = await newDoc.save();
  const blob = new Blob([newBytes as unknown as BlobPart], { type: 'application/pdf' });
  return { blob, size: blob.size, remainingPages: keepIndices.length };
}

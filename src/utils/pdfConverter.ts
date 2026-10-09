import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { ImageFileItem, ImageToPdfOptions } from '../types';

const PAGE_DIMENSIONS: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  legal: [612, 1008],
};

const MARGIN_VALUES: Record<string, number> = {
  none: 0,
  small: 18,
  normal: 36,
};

const QUALITY_VALUES: Record<string, number> = {
  high: 0.95,
  medium: 0.8,
  low: 0.6,
};

// Process image on an offscreen canvas to handle rotation, filters & compression
export async function processImageCanvas(
  item: ImageFileItem,
  qualityLevel: number
): Promise<{ bytes: Uint8Array; width: number; height: number; isPng: boolean }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const rot = (item.rotation % 360 + 360) % 360;
      const is90or270 = rot === 90 || rot === 270;

      const destWidth = is90or270 ? img.height : img.width;
      const destHeight = is90or270 ? img.width : img.height;

      canvas.width = destWidth;
      canvas.height = destHeight;

      ctx.save();
      ctx.translate(destWidth / 2, destHeight / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Apply selected filter 100% on-device in Canvas
      if (item.filter && item.filter !== 'original') {
        const imgData = ctx.getImageData(0, 0, destWidth, destHeight);
        const data = imgData.data;
        const len = data.length;

        if (item.filter === 'grayscale') {
          for (let i = 0; i < len; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }
        } else if (item.filter === 'bw') {
          // Clean photocopy thresholding: crisp dark letters, clean background
          for (let i = 0; i < len; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const val = gray < 135 ? 15 : 255;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          }
        } else if (item.filter === 'magic') {
          // Magic Color / Scanner enhance: contrast stretch + whiten background
          for (let i = 0; i < len; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (lum > 175) {
              // Whitewash paper
              r = Math.min(255, r * 1.15 + 20);
              g = Math.min(255, g * 1.15 + 20);
              b = Math.min(255, b * 1.15 + 20);
            } else {
              // Deepen text contrast
              r = Math.max(0, r * 0.82);
              g = Math.max(0, g * 0.82);
              b = Math.max(0, b * 0.82);
            }

            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      // Export JPEG with desired compression ratio
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error('Failed to generate image blob'));
            return;
          }
          const arrayBuffer = await blob.arrayBuffer();
          resolve({
            bytes: new Uint8Array(arrayBuffer),
            width: destWidth,
            height: destHeight,
            isPng: false,
          });
        },
        'image/jpeg',
        qualityLevel
      );
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${item.name}`));
    img.src = item.previewUrl;
  });
}

export async function convertImagesToPdf(
  items: ImageFileItem[],
  options: ImageToPdfOptions,
  onProgress?: (current: number, total: number) => void
): Promise<{ pdfBlob: Blob; pdfBytes: Uint8Array }> {
  if (items.length === 0) {
    throw new Error('Please select at least one image');
  }

  const pdfDoc = await PDFDocument.create();
  if (options.pdfTitle) {
    pdfDoc.setTitle(options.pdfTitle);
  }
  pdfDoc.setProducer('Img to Pdf Offline Studio');
  pdfDoc.setCreator('Img to Pdf (100% Offline)');

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const quality = QUALITY_VALUES[options.quality] || 0.85;
  const margin = MARGIN_VALUES[options.margin] || 0;

  // Pre-load signature if enabled
  let embeddedSig: any = null;
  if (options.signature?.enabled && options.signature.dataUrl) {
    try {
      const sigData = options.signature.dataUrl;
      const base64Content = sigData.split(',')[1];
      const binaryString = atob(base64Content);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let j = 0; j < len; j++) {
        bytes[j] = binaryString.charCodeAt(j);
      }
      embeddedSig = await pdfDoc.embedPng(bytes);
    } catch (e) {
      console.warn('Failed to embed signature image:', e);
    }
  }

  for (let i = 0; i < items.length; i++) {
    if (onProgress) {
      onProgress(i + 1, items.length);
    }
    const item = items[i];
    const { bytes, width: imgW, height: imgH } = await processImageCanvas(item, quality);

    const embeddedImage = await pdfDoc.embedJpg(bytes);

    let pageWidth: number;
    let pageHeight: number;

    if (options.pageSize === 'fit') {
      pageWidth = imgW + margin * 2;
      pageHeight = imgH + margin * 2;
    } else {
      const baseDim = PAGE_DIMENSIONS[options.pageSize] || PAGE_DIMENSIONS.a4;
      if (options.orientation === 'landscape') {
        pageWidth = Math.max(baseDim[0], baseDim[1]);
        pageHeight = Math.min(baseDim[0], baseDim[1]);
      } else if (options.orientation === 'portrait') {
        pageWidth = Math.min(baseDim[0], baseDim[1]);
        pageHeight = Math.max(baseDim[0], baseDim[1]);
      } else {
        // Auto orientation based on image aspect ratio
        if (imgW > imgH) {
          pageWidth = Math.max(baseDim[0], baseDim[1]);
          pageHeight = Math.min(baseDim[0], baseDim[1]);
        } else {
          pageWidth = Math.min(baseDim[0], baseDim[1]);
          pageHeight = Math.max(baseDim[0], baseDim[1]);
        }
      }
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Usable drawing area
    const availableW = pageWidth - margin * 2;
    const availableH = pageHeight - margin * 2 - (options.addPageNumbers ? 20 : 0);

    // Calculate scale preserving aspect ratio
    const scale = Math.min(availableW / imgW, availableH / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;

    const x = margin + (availableW - drawW) / 2;
    const y = margin + (options.addPageNumbers ? 20 : 0) + (availableH - drawH) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawW,
      height: drawH,
    });

    // 1. Watermark Layer (if enabled)
    if (options.watermark?.enabled && options.watermark.text.trim()) {
      const wmText = options.watermark.text.trim();
      const wmSize = Math.max(18, Math.min(pageWidth, pageHeight) / 12);
      const textWidth = fontBold.widthOfTextAtSize(wmText, wmSize);

      if (options.watermark.isDiagonal) {
        page.drawText(wmText, {
          x: (pageWidth - textWidth) / 2,
          y: pageHeight / 2,
          size: wmSize,
          font: fontBold,
          color: rgb(0.35, 0.35, 0.35),
          opacity: options.watermark.opacity || 0.25,
          rotate: degrees(45),
        });
      } else {
        page.drawText(wmText, {
          x: (pageWidth - textWidth) / 2,
          y: pageHeight / 2,
          size: wmSize,
          font: fontBold,
          color: rgb(0.35, 0.35, 0.35),
          opacity: options.watermark.opacity || 0.25,
        });
      }
    }

    // 2. Digital Signature Layer (if enabled for this page)
    if (embeddedSig && options.signature?.enabled) {
      const isFirst = i === 0;
      const isLast = i === items.length - 1;
      const shouldApply =
        options.signature.applyTo === 'all' ||
        (options.signature.applyTo === 'first' && isFirst) ||
        (options.signature.applyTo === 'last' && isLast);

      if (shouldApply) {
        const sigW = 110;
        const sigH = (embeddedSig.height / embeddedSig.width) * sigW;
        let sigX = margin + 15;
        let sigY = margin + (options.addPageNumbers ? 25 : 15);

        if (options.signature.position === 'bottom-right') {
          sigX = pageWidth - margin - sigW - 15;
        } else if (options.signature.position === 'bottom-center') {
          sigX = (pageWidth - sigW) / 2;
        }

        page.drawImage(embeddedSig, {
          x: sigX,
          y: sigY,
          width: sigW,
          height: sigH,
        });
      }
    }

    // 3. Page numbering
    if (options.addPageNumbers) {
      const pageText = `Page ${i + 1} of ${items.length}`;
      const textWidth = font.widthOfTextAtSize(pageText, 9);
      page.drawText(pageText, {
        x: (pageWidth - textWidth) / 2,
        y: margin > 10 ? margin / 2 : 10,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  return { pdfBlob, pdfBytes };
}

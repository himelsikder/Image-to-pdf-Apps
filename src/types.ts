export type ImageFilter = 'original' | 'magic' | 'bw' | 'grayscale';

export interface ImageFileItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  filter: ImageFilter;
}

export type PageSize = 'a4' | 'letter' | 'legal' | 'fit';
export type PageOrientation = 'portrait' | 'landscape' | 'auto';
export type PageMargin = 'none' | 'small' | 'normal';
export type ImageQuality = 'high' | 'medium' | 'low';

export interface WatermarkOptions {
  enabled: boolean;
  text: string;
  opacity: number; // 0.1 to 0.5
  isDiagonal: boolean;
}

export interface SignatureOptions {
  enabled: boolean;
  dataUrl: string | null;
  applyTo: 'last' | 'all' | 'first';
  position: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export interface ImageToPdfOptions {
  pageSize: PageSize;
  orientation: PageOrientation;
  margin: PageMargin;
  quality: ImageQuality;
  addPageNumbers: boolean;
  pdfTitle: string;
  watermark: WatermarkOptions;
  signature: SignatureOptions;
}

export type ImageFormat = 'png' | 'jpeg' | 'webp';
export type RenderDpi = 100 | 150 | 200 | 300;

export interface PdfToImageOptions {
  format: ImageFormat;
  dpi: RenderDpi;
  selectedPages: number[]; // empty means all
}

export interface ConvertedPageImage {
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  fileName: string;
}

export interface ConversionHistoryItem {
  id: string;
  type: 'img-to-pdf' | 'pdf-to-img' | 'pdf-merge' | 'img-compress';
  title: string;
  date: number;
  itemCount: number;
  fileSize: number;
  downloadUrl?: string;
  dataBlob?: Blob;
}

export interface CompressedImageResult {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  originalUrl: string;
  compressedUrl: string;
  blob: Blob;
  width: number;
  height: number;
  format: 'jpeg' | 'webp' | 'png';
  savedPercentage: number;
}

export interface PdfMergeItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
}

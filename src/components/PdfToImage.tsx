import React, { useState, useRef } from 'react';
import {
  Upload,
  FileCheck,
  Download,
  Share2,
  Sparkles,
  Settings2,
  Archive,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  ZoomIn,
} from 'lucide-react';
import { ConvertedPageImage, ImageFormat, PdfToImageOptions, RenderDpi } from '../types';
import {
  loadPdfDocument,
  convertPdfToImages,
  createZipFromImages,
  PdfDocumentInfo,
} from '../utils/pdfToImage';
import { saveHistoryItem } from '../utils/db';
import * as pdfjsLib from 'pdfjs-dist';

interface PdfToImageProps {
  lang: 'bn' | 'en';
}

export const PdfToImage: React.FC<PdfToImageProps> = ({ lang }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PdfDocumentInfo | null>(null);

  const [options, setOptions] = useState<PdfToImageOptions>({
    format: 'jpeg',
    dpi: 150,
    selectedPages: [],
  });

  const [customRangeText, setCustomRangeText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [convertedImages, setConvertedImages] = useState<ConvertedPageImage[]>([]);
  const [zoomImage, setZoomImage] = useState<ConvertedPageImage | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে একটি বৈধ PDF ফাইল দিন।' : 'Please select a valid PDF file.');
      return;
    }

    try {
      setErrorMsg(null);
      setSelectedFile(file);
      setConvertedImages([]);

      const { doc, info } = await loadPdfDocument(file);
      setPdfDoc(doc);
      setPdfInfo(info);
      setOptions((prev) => ({ ...prev, selectedPages: [] }));
      setCustomRangeText('');
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(
        (err as Error)?.message ||
          (lang === 'bn' ? 'PDF লোড করতে ব্যর্থ হয়েছে।' : 'Failed to load PDF file.')
      );
    }
  };

  const parsePageRange = (text: string, maxPages: number): number[] => {
    if (!text.trim()) return [];
    const pages = new Set<number>();
    const parts = text.split(',');

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.max(1, start); p <= Math.min(maxPages, end); p++) {
            pages.add(p);
          }
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= maxPages) {
          pages.add(p);
        }
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleConvert = async () => {
    if (!pdfDoc || !pdfInfo || !selectedFile) return;

    try {
      setIsProcessing(true);
      setErrorMsg(null);

      const parsedPages = parsePageRange(customRangeText, pdfInfo.numPages);
      const activeOptions: PdfToImageOptions = {
        ...options,
        selectedPages: parsedPages,
      };

      const targetTotal = parsedPages.length > 0 ? parsedPages.length : pdfInfo.numPages;
      setProgress({ current: 0, total: targetTotal });

      const baseName = selectedFile.name.replace(/\.pdf$/i, '');
      const results = await convertPdfToImages(pdfDoc, activeOptions, baseName, (curr, tot) => {
        setProgress({ current: curr, total: tot });
      });

      setConvertedImages(results);

      // Save to local IndexedDB
      await saveHistoryItem({
        id: `img_${Date.now()}`,
        type: 'pdf-to-img',
        title: `${baseName} (${results.length} images)`,
        date: Date.now(),
        itemCount: results.length,
        fileSize: selectedFile.size,
      });
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(
        (err as Error)?.message ||
          (lang === 'bn' ? 'ছবি কনভার্ট করতে ত্রুটি হয়েছে।' : 'Error converting pages to images.')
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (image: ConvertedPageImage) => {
    const a = document.createElement('a');
    a.href = image.dataUrl;
    a.download = image.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareSingle = async (image: ConvertedPageImage) => {
    try {
      const file = new File([image.blob], image.fileName, { type: image.blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: image.fileName,
        });
      } else {
        handleDownloadSingle(image);
      }
    } catch (e) {
      // Ignore user abort
    }
  };

  const handleDownloadZip = async () => {
    if (convertedImages.length === 0 || !selectedFile) return;
    try {
      setIsZipping(true);
      const baseName = selectedFile.name.replace(/\.pdf$/i, '');
      const zipBlob = await createZipFromImages(convertedImages, `${baseName}_images.zip`);
      const url = URL.createObjectURL(zipBlob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}_images.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setErrorMsg(lang === 'bn' ? 'ZIP তৈরিতে সমস্যা হয়েছে।' : 'Failed to create ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="bg-white dark:bg-[#101726] border-2 border-dashed border-slate-300/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center transition-all duration-200 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 shadow-xs">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner border border-indigo-500/20">
            <ImageIcon className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'PDF ফাইল আপলোড করুন' : 'Upload PDF File'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'PDF ডকুমেন্ট থেকে পাতাগুলো হাই-কোয়ালিটি ছবিতে (JPG/PNG) রূপান্তর করুন'
                : 'Extract pages from PDF documents as high-quality images (JPG/PNG)'}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition active:scale-95"
            >
              <Upload className="w-4 h-4" />
              {lang === 'bn' ? 'PDF নির্বাচন করুন' : 'Select PDF File'}
            </button>
          </div>
        </div>
      </div>

      {/* Selected PDF Info Card */}
      {pdfInfo && selectedFile && (
        <div className="bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold">
                PDF
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {pdfInfo.numPages} {lang === 'bn' ? 'টি পাতা' : 'Pages'} • {formatSize(selectedFile.size)}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedFile(null);
                setPdfDoc(null);
                setPdfInfo(null);
                setConvertedImages([]);
              }}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium"
            >
              {lang === 'bn' ? 'পরিবর্তন করুন' : 'Change'}
            </button>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Output Format */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'ছবির ফরম্যাট (Format)' : 'Image Format'}
              </label>
              <select
                value={options.format}
                onChange={(e) => setOptions({ ...options, format: e.target.value as ImageFormat })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            {/* DPI Resolution */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'রেজোলিউশন (DPI)' : 'Resolution (DPI)'}
              </label>
              <select
                value={options.dpi}
                onChange={(e) =>
                  setOptions({ ...options, dpi: parseInt(e.target.value, 10) as RenderDpi })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={100}>100 DPI (Fast)</option>
                <option value={150}>150 DPI (Crisp)</option>
                <option value={200}>200 DPI (HD)</option>
                <option value={300}>300 DPI (Ultra)</option>
              </select>
            </div>

            {/* Page Range Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'পেজ নির্ধারণ (যেমন: 1, 3-5)' : 'Custom Pages (e.g. 1, 3-5)'}
              </label>
              <input
                type="text"
                placeholder={lang === 'bn' ? `সবগুলো পাতা (1-${pdfInfo.numPages})` : `All pages (1-${pdfInfo.numPages})`}
                value={customRangeText}
                onChange={(e) => setCustomRangeText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Convert Action Button */}
          <div className="pt-3">
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>
                    {lang === 'bn'
                      ? `ছবিতে কনভার্ট হচ্ছে (${progress.current}/${progress.total})...`
                      : `Converting Pages (${progress.current}/${progress.total})...`}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>
                    {lang === 'bn' ? 'ছবিতে কনভার্ট শুরু করুন' : 'Convert PDF to Images'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Converted Images Result Gallery */}
      {convertedImages.length > 0 && (
        <div className="bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {lang === 'bn' ? 'কনভার্ট সফল হয়েছে' : 'Conversion Complete'}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {convertedImages.length} {lang === 'bn' ? 'টি ছবি' : 'images'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === 'bn'
                  ? 'প্রতিটি ছবি আলাদা ডাউনলোড করতে পারেন অথবা এক ক্লিকে ZIP হিসেবে নামাতে পারেন'
                  : 'Download individual pages or download all together as a single ZIP file'}
              </p>
            </div>

            {/* Batch ZIP download */}
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50"
            >
              {isZipping ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{lang === 'bn' ? 'ZIP তৈরি হচ্ছে...' : 'Compressing ZIP...'}</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'সব ছবি ZIP হিসেবে ডাউনলোড' : 'Download All as ZIP'}</span>
                </>
              )}
            </button>
          </div>

          {/* Grid of Converted Pages */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {convertedImages.map((img) => (
              <div
                key={img.pageNumber}
                className="group relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow transition"
              >
                {/* Image preview */}
                <div
                  className="aspect-[3/4] w-full bg-slate-200 dark:bg-slate-900 flex items-center justify-center overflow-hidden cursor-pointer relative"
                  onClick={() => setZoomImage(img)}
                >
                  <img
                    src={img.dataUrl}
                    alt={`Page ${img.pageNumber}`}
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white gap-1 font-semibold text-xs">
                    <ZoomIn className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'বড় করে দেখুন' : 'Zoom'}</span>
                  </div>
                </div>

                {/* Page number badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold">
                  {lang === 'bn' ? `পৃষ্ঠা ${img.pageNumber}` : `Page ${img.pageNumber}`}
                </div>

                {/* Footer Controls */}
                <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {img.width}x{img.height}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleShareSingle(img)}
                      className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title={lang === 'bn' ? 'শেয়ার' : 'Share'}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDownloadSingle(img)}
                      className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition"
                      title={lang === 'bn' ? 'ডাউনলোড' : 'Download'}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zoom Preview Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {zoomImage.fileName}
                </h4>
                <p className="text-xs text-slate-500">
                  {zoomImage.width} x {zoomImage.height} px
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadSingle(zoomImage)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  {lang === 'bn' ? 'ডাউনলোড' : 'Download'}
                </button>
                <button
                  onClick={() => setZoomImage(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
              <img
                src={zoomImage.dataUrl}
                alt={zoomImage.fileName}
                className="max-h-full max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

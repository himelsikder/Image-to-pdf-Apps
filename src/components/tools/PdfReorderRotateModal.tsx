import React, { useState, useRef } from 'react';
import {
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Upload,
  Download,
  Share2,
  X,
  AlertCircle,
  FileText,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Move,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { reorderAndRotatePdfPages, PageOrderConfig } from '../../utils/advancedPdf';

interface PdfReorderRotateModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'bn' | 'en';
}

export const PdfReorderRotateModal: React.FC<PdfReorderRotateModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageOrderConfig[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    size: number;
    url: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const selected = files[0];
    if (selected.type !== 'application/pdf' && !selected.name.endsWith('.pdf')) {
      setErrorMsg(lang === 'bn' ? 'সঠিক PDF ফাইল নির্বাচন করুন' : 'Please select a valid PDF file');
      return;
    }

    setIsLoadingPages(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const arrayBuffer = await selected.arrayBuffer();
      const pdfJsDoc = await pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
      }).promise;

      const pageCount = pdfJsDoc.numPages;
      const initialConfigs: PageOrderConfig[] = [];

      for (let i = 1; i <= pageCount; i++) {
        // Render small thumbnail
        let thumbUrl: string | undefined = undefined;
        try {
          const page = await pdfJsDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.35 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvas, canvasContext: ctx, viewport }).promise;
            thumbUrl = canvas.toDataURL('image/jpeg', 0.7);
          }
        } catch {
          // fallback without thumbnail
        }

        initialConfigs.push({
          id: `page_${i}_${Date.now()}`,
          originalIndex: i - 1,
          pageNumber: i,
          rotation: 0,
          thumbnailUrl: thumbUrl,
        });
      }

      setFile(selected);
      setPages(initialConfigs);
    } catch {
      setErrorMsg(lang === 'bn' ? 'PDF ফাইলটি লোড করা সম্ভব হয়নি' : 'Failed to load PDF file');
    } finally {
      setIsLoadingPages(false);
    }
  };

  const handleRotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? { ...item, rotation: (item.rotation + 90) % 360 }
          : item
      )
    );
  };

  const handleRotateAll = () => {
    setPages((prev) =>
      prev.map((item) => ({ ...item, rotation: (item.rotation + 90) % 360 }))
    );
  };

  const handleMovePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    setPages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, item);
      return copy;
    });
  };

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
      setErrorMsg(
        lang === 'bn'
          ? 'ডকুমেন্টে কমপক্ষে ১টি পাতা থাকতে হবে'
          : 'Document must keep at least 1 page'
      );
      return;
    }
    setPages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    handleMovePage(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    if (!file || pages.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await reorderAndRotatePdfPages(file, pages);
      const url = URL.createObjectURL(res.blob);
      setResult({
        blob: res.blob,
        fileName: res.fileName,
        size: res.size,
        url,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reordering failed';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      if (navigator.share && navigator.canShare) {
        const shareFile = new File([result.blob], result.fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [shareFile] })) {
          await navigator.share({
            files: [shareFile],
            title: result.fileName,
          });
          return;
        }
      }
      handleDownload();
    } catch {
      handleDownload();
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <RotateCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {lang === 'bn' ? 'পেজ রি-অর্ডার ও রোটেট' : 'Reorder & Rotate Pages'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'bn'
                  ? 'পাতার ক্রম ড্র্যাগ করে সাজান বা যেকোনো পাতা সোজা (Rotate) করুন'
                  : 'Drag to rearrange page order or rotate upside-down pages'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!result ? (
            <div className="space-y-4">
              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {lang === 'bn' ? 'সাজানোর জন্য PDF বেছে নিন' : 'Choose a PDF to Reorder/Rotate'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {lang === 'bn'
                      ? 'যেকোনো PDF ফাইল আপলোড করে পাতার ক্রম বা কোণ পরিবর্তন করুন'
                      : 'Upload any PDF to rearrange pages or fix page orientation'}
                  </p>
                </div>
              ) : isLoadingPages ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {lang === 'bn' ? 'পাতাসমূহ প্রসেস হচ্ছে...' : 'Loading pages & thumbnails...'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Controls Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {pages.length} {lang === 'bn' ? 'টি পাতা' : 'pages'}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 text-[11px] truncate max-w-[140px] sm:max-w-xs">
                        {file.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleRotateAll}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-teal-600" />
                        <span>{lang === 'bn' ? 'সবগুলো ৯০° ঘুরান' : 'Rotate All 90°'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setPages([]);
                        }}
                        className="text-xs text-slate-500 hover:text-rose-500 font-semibold px-2 py-1"
                      >
                        {lang === 'bn' ? 'পরিবর্তন' : 'Change'}
                      </button>
                    </div>
                  </div>

                  {/* Visual Grid of Pages */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto p-1">
                    {pages.map((p, idx) => (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`relative rounded-2xl border p-2.5 flex flex-col justify-between transition-all group bg-white dark:bg-slate-900 ${
                          draggedIndex === idx
                            ? 'border-teal-500 shadow-lg scale-95 opacity-60'
                            : 'border-slate-200 dark:border-slate-800 hover:border-teal-400'
                        }`}
                      >
                        {/* Page Header Bar */}
                        <div className="flex items-center justify-between pb-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            #{idx + 1}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Orig: {p.pageNumber}
                          </span>
                        </div>

                        {/* Thumbnail or placeholder */}
                        <div className="w-full h-32 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center my-1 relative border border-slate-100 dark:border-slate-850">
                          {p.thumbnailUrl ? (
                            <img
                              src={p.thumbnailUrl}
                              alt={`Page ${p.pageNumber}`}
                              style={{ transform: `rotate(${p.rotation}deg)` }}
                              className="max-h-full max-w-full object-contain transition-transform duration-200"
                            />
                          ) : (
                            <div
                              style={{ transform: `rotate(${p.rotation}deg)` }}
                              className="flex flex-col items-center justify-center text-slate-400 transition-transform"
                            >
                              <FileText className="w-8 h-8 text-teal-600/70" />
                              <span className="text-[10px] font-bold mt-1">Page {p.pageNumber}</span>
                            </div>
                          )}

                          {p.rotation !== 0 && (
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/70 text-white">
                              {p.rotation}°
                            </span>
                          )}
                        </div>

                        {/* Page Action Toolbar */}
                        <div className="flex items-center justify-between pt-1 text-slate-500">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMovePage(idx, idx - 1)}
                              disabled={idx === 0}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20"
                              title="Move Left"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePage(idx, idx + 1)}
                              disabled={idx === pages.length - 1}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20"
                              title="Move Right"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleRotatePage(idx)}
                              className="p-1 rounded hover:bg-teal-50 dark:hover:bg-teal-950 text-teal-600 dark:text-teal-400"
                              title="Rotate 90°"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePage(idx)}
                              className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500"
                              title="Remove page"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-500 text-center pt-1">
                    💡{' '}
                    {lang === 'bn'
                      ? 'টিপস: পাতাগুলো ড্র্যাগ করেও আগে-পিছে নিতে পারেন বা তীরচিহ্ন ব্যবহার করতে পারেন।'
                      : 'Tip: You can drag cards to reorder or use the arrow buttons.'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Success State */
            <div className="p-5 sm:p-6 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-teal-100 dark:bg-teal-900/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {lang === 'bn' ? 'PDF সফলভাবে সাজানো হয়েছে!' : 'PDF Reordered & Rotated!'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {result.fileName} • {formatSize(result.size)}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleDownload}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'ডাউনলোড করুন' : 'Download Modified PDF'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'শেয়ার' : 'Share'}</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold flex items-center gap-1 mx-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'আরেকটি PDF সাজান' : 'Process Another PDF'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!result && file && pages.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c121e] flex justify-between gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              {lang === 'bn' ? 'রিসেট' : 'Cancel'}
            </button>

            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 transition active:scale-95 disabled:opacity-50 shadow-md shadow-teal-500/20"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'নতুন PDF সেভ করুন' : 'Save Modified PDF'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

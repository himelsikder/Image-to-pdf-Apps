import React, { useState, useRef } from 'react';
import {
  Scissors,
  Upload,
  Download,
  Share2,
  X,
  AlertCircle,
  FileText,
  CheckCircle2,
  Layers,
  Archive,
  RefreshCw,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { splitPdfByRange, splitPdfAllPagesToZip } from '../../utils/advancedPdf';
import { saveOrDownloadFile, shareFileNative } from '../../utils/nativeFile';

interface PdfSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'bn' | 'en';
}

export const PdfSplitModal: React.FC<PdfSplitModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [splitMode, setSplitMode] = useState<'range' | 'all' | 'custom'>('range');
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
    size: number;
    url: string;
    isZip?: boolean;
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

    try {
      const arrayBuffer = await selected.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const count = doc.getPageCount();
      if (count <= 1) {
        setErrorMsg(
          lang === 'bn'
            ? 'এই PDF-এ মাত্র ১টি পাতা আছে। স্প্লিট করার জন্য কমপক্ষে ২টি পাতা প্রয়োজন।'
            : 'This PDF has only 1 page. Splitting requires at least 2 pages.'
        );
        return;
      }
      setFile(selected);
      setTotalPages(count);
      setStartPage(1);
      setEndPage(count);
      setSelectedPages([1]);
      setErrorMsg(null);
      setResult(null);
    } catch {
      setErrorMsg(lang === 'bn' ? 'PDF ফাইলটি লোড করা সম্ভব হয়নি' : 'Failed to load PDF file');
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (splitMode === 'range') {
        if (startPage > endPage) {
          throw new Error(
            lang === 'bn'
              ? 'শুরুর পাতা শেষের পাতার চেয়ে বড় হতে পারে না'
              : 'Start page cannot be greater than end page'
          );
        }
        const res = await splitPdfByRange(file, startPage, endPage);
        const url = URL.createObjectURL(res.blob);
        setResult({
          blob: res.blob,
          fileName: res.fileName,
          size: res.size,
          url,
          isZip: false,
        });
      } else if (splitMode === 'all') {
        const res = await splitPdfAllPagesToZip(file, (current, total) => {
          setProgress({ current, total });
        });
        const url = URL.createObjectURL(res.zipBlob);
        setResult({
          blob: res.zipBlob,
          fileName: res.fileName,
          size: res.size,
          url,
          isZip: true,
        });
      } else if (splitMode === 'custom') {
        if (selectedPages.length === 0) {
          throw new Error(
            lang === 'bn' ? 'দয়া করে কমপক্ষে একটি পৃষ্ঠা বেছে নিন' : 'Please select at least one page'
          );
        }
        const arrayBuffer = await file.arrayBuffer();
        const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const newDoc = await PDFDocument.create();
        const indices = selectedPages.sort((a, b) => a - b).map((p) => p - 1);
        const copied = await newDoc.copyPages(srcDoc, indices);
        for (const p of copied) {
          newDoc.addPage(p);
        }
        const bytes = await newDoc.save();
        const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
        const baseName = file.name.replace(/\.pdf$/i, '');
        const fileName = `${baseName}_selected_pages.pdf`;
        const url = URL.createObjectURL(blob);
        setResult({
          blob,
          fileName,
          size: blob.size,
          url,
          isZip: false,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Splitting failed';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePageSelection = (p: number) => {
    if (selectedPages.includes(p)) {
      setSelectedPages(selectedPages.filter((x) => x !== p));
    } else {
      setSelectedPages([...selectedPages, p]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = () => {
    if (!result) return;
    saveOrDownloadFile(result.blob, result.fileName);
  };

  const handleShare = async () => {
    if (!result) return;
    await shareFileNative(result.blob, result.fileName);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {lang === 'bn' ? 'PDF স্প্লিট ও পৃষ্ঠা আলাদা করা' : 'Split PDF Document'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'bn'
                  ? 'বড় PDF থেকে নির্দিষ্ট পৃষ্ঠা বা রেঞ্জ আলাদা ফাইলে ভাগ করুন'
                  : 'Extract page ranges or separate all pages into individual files'}
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!result ? (
            <div className="space-y-4">
              {/* File Dropzone */}
              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {lang === 'bn' ? 'স্প্লিট করার জন্য PDF বেছে নিন' : 'Choose a PDF to Split'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {lang === 'bn'
                      ? 'একাধিক পৃষ্ঠা সম্বলিত যেকোনো PDF আপলোড করুন'
                      : 'Select any multi-page PDF document'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File card */}
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {totalPages} {lang === 'bn' ? 'টি পাতা মোট' : 'total pages'} • {formatSize(file.size)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setFile(null)}
                      className="text-xs text-slate-500 hover:text-rose-500 font-semibold px-2 py-1"
                    >
                      {lang === 'bn' ? 'পরিবর্তন' : 'Change'}
                    </button>
                  </div>

                  {/* Mode switcher tabs */}
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setSplitMode('range')}
                      className={`py-2 rounded-xl transition ${
                        splitMode === 'range'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {lang === 'bn' ? 'পেজ রেঞ্জ' : 'Page Range'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMode('custom')}
                      className={`py-2 rounded-xl transition ${
                        splitMode === 'custom'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {lang === 'bn' ? 'পৃষ্ঠা বাছাই' : 'Select Pages'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMode('all')}
                      className={`py-2 rounded-xl transition ${
                        splitMode === 'all'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {lang === 'bn' ? 'সব আলাদা (ZIP)' : 'All Pages (ZIP)'}
                    </button>
                  </div>

                  {/* Mode 1: Range Input */}
                  {splitMode === 'range' && (
                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {lang === 'bn'
                          ? 'যে পেজ থেকে যে পেজ পর্যন্ত আলাদা করতে চান:'
                          : 'Extract continuous page range:'}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-500 font-medium">
                            {lang === 'bn' ? 'শুরুর পৃষ্ঠা (Start)' : 'From Page'}
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={startPage}
                            onChange={(e) => setStartPage(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 font-medium">
                            {lang === 'bn' ? 'শেষ পৃষ্ঠা (End)' : 'To Page'}
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={endPage}
                            onChange={(e) =>
                              setEndPage(Math.min(totalPages, parseInt(e.target.value) || totalPages))
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'bn'
                          ? `তৈরি হবে পৃষ্ঠা ${startPage} থেকে ${endPage} এর একটি নতুন PDF`
                          : `Outputs a new PDF with pages ${startPage} to ${endPage}`}
                      </p>
                    </div>
                  )}

                  {/* Mode 2: Custom Selection */}
                  {splitMode === 'custom' && (
                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {lang === 'bn' ? 'পৃষ্ঠাগুলো ক্লিক করে বাছাই করুন:' : 'Click to select pages to extract:'}
                        </p>
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {selectedPages.length} {lang === 'bn' ? 'টি নির্বাচিত' : 'selected'}
                        </span>
                      </div>
                      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-48 overflow-y-auto p-1">
                        {Array.from({ length: totalPages }).map((_, idx) => {
                          const p = idx + 1;
                          const isSel = selectedPages.includes(p);
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => togglePageSelection(p)}
                              className={`py-2 rounded-xl text-xs font-bold transition border ${
                                isSel
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mode 3: All Pages ZIP */}
                  {splitMode === 'all' && (
                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2 text-center">
                      <Archive className="w-8 h-8 text-indigo-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {lang === 'bn' ? 'সবগুলো পাতা আলাদা আলাদা PDF হবে' : 'Separate each page into its own PDF'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'bn'
                          ? `মোট ${totalPages}টি পাতার প্রতিটির জন্য ১টি করে PDF তৈরি হয়ে ZIP ফাইলে ডাউনলোড হবে`
                          : `Generates ${totalPages} individual PDF files packed inside a single ZIP file`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Success View */
            <div className="p-5 sm:p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {lang === 'bn' ? 'PDF সফলভাবে আলাদা হয়েছে!' : 'PDF Split Successfully!'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {result.fileName} • {formatSize(result.size)}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleDownload}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'ডাউনলোড করুন' : 'Download Extracted File'}</span>
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
                  <span>{lang === 'bn' ? 'আরেকটি PDF স্প্লিট করুন' : 'Split Another PDF'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!result && file && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c121e] flex justify-between gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              {lang === 'bn' ? 'রিসেট' : 'Cancel'}
            </button>

            <button
              onClick={handleSplit}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 transition active:scale-95 disabled:opacity-50 shadow-md shadow-indigo-500/20"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>
                    {progress.total > 0
                      ? `${progress.current}/${progress.total}...`
                      : lang === 'bn'
                      ? 'স্প্লিট করা হচ্ছে...'
                      : 'Splitting...'}
                  </span>
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'পৃষ্ঠা আলাদা করুন' : 'Extract & Split'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  Layers,
  Scissors,
  Upload,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import { PdfMergeItem } from '../types';
import { getPdfInfo, mergePdfFiles, removePagesFromPdf } from '../utils/pdfMerge';
import { saveHistoryItem } from '../utils/db';

interface PdfToolsProps {
  lang: 'bn' | 'en';
}

export const PdfTools: React.FC<PdfToolsProps> = ({ lang }) => {
  const [activeSubTab, setActiveSubTab] = useState<'merge' | 'delete'>('merge');

  // Merge state
  const [mergeItems, setMergeItems] = useState<PdfMergeItem[]>([]);
  const [mergedPdf, setMergedPdf] = useState<{ blob: Blob; url: string; fileName: string; size: number } | null>(null);
  const [mergeTitle, setMergeTitle] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState({ current: 0, total: 0 });

  // Delete state
  const [deleteFile, setDeleteFile] = useState<PdfMergeItem | null>(null);
  const [pagesToDeleteStr, setPagesToDeleteStr] = useState('');
  const [deletedResult, setDeletedResult] = useState<{ blob: Blob; url: string; fileName: string; size: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mergeInputRef = useRef<HTMLInputElement>(null);
  const deleteInputRef = useRef<HTMLInputElement>(null);

  // Handle adding PDF files for merge
  const handleMergeFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);
    setMergedPdf(null);

    const newItems: PdfMergeItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        try {
          const item = await getPdfInfo(file);
          newItems.push(item);
        } catch (e) {
          console.warn('Could not read PDF:', file.name);
        }
      }
    }

    setMergeItems((prev) => [...prev, ...newItems]);
  };

  const handleMoveMergeItem = (index: number, dir: 'up' | 'down') => {
    setMergeItems((prev) => {
      const target = dir === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const handleRemoveMergeItem = (id: string) => {
    setMergeItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleExecuteMerge = async () => {
    if (mergeItems.length < 2) {
      setErrorMsg(
        lang === 'bn'
          ? 'মার্জ করার জন্য অন্তত ২টি PDF ফাইল নির্বাচন করুন।'
          : 'Please add at least 2 PDF files to merge.'
      );
      return;
    }

    try {
      setIsMerging(true);
      setErrorMsg(null);
      setMergeProgress({ current: 0, total: mergeItems.length });

      const safeTitle = mergeTitle.trim()
        ? `${mergeTitle.replace(/[^a-zA-Z0-9_\u0980-\u09FF-]/g, '_')}.pdf`
        : 'ImgToPdf_Merged.pdf';

      const { blob, size } = await mergePdfFiles(mergeItems, safeTitle, (curr, tot) => {
        setMergeProgress({ current: curr, total: tot });
      });

      const url = URL.createObjectURL(blob);
      setMergedPdf({ blob, url, fileName: safeTitle, size });

      // Save to local IndexedDB
      const totalPages = mergeItems.reduce((acc, it) => acc + it.pageCount, 0);
      await saveHistoryItem({
        id: `merge_${Date.now()}`,
        type: 'pdf-merge',
        title: safeTitle,
        date: Date.now(),
        itemCount: totalPages,
        fileSize: size,
      });
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to merge PDF files.');
    } finally {
      setIsMerging(false);
    }
  };

  // Handle single PDF for page deletion
  const handleDeleteFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);
    setDeletedResult(null);

    const file = files[0];
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const item = await getPdfInfo(file);
        setDeleteFile(item);
      } catch (e) {
        setErrorMsg('Could not read PDF file.');
      }
    }
  };

  const handleExecuteDeletePages = async () => {
    if (!deleteFile) return;
    if (!pagesToDeleteStr.trim()) {
      setErrorMsg(lang === 'bn' ? 'কোন কোন পাতা মুছবেন তা লিখুন।' : 'Specify pages to delete.');
      return;
    }

    try {
      setIsDeleting(true);
      setErrorMsg(null);

      const parts = pagesToDeleteStr.split(',');
      const pagesSet = new Set<number>();
      for (const p of parts) {
        const trimmed = p.trim();
        if (trimmed.includes('-')) {
          const [startStr, endStr] = trimmed.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = start; i <= end; i++) pagesSet.add(i);
          }
        } else {
          const num = parseInt(trimmed, 10);
          if (!isNaN(num)) pagesSet.add(num);
        }
      }

      const pagesList = Array.from(pagesSet);
      const safeTitle = `Cleaned_${deleteFile.name}`;
      const { blob, size } = await removePagesFromPdf(deleteFile.file, pagesList, safeTitle);
      const url = URL.createObjectURL(blob);

      setDeletedResult({ blob, url, fileName: safeTitle, size });
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to delete pages.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const triggerDownload = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const triggerShare = async (blob: Blob, name: string) => {
    try {
      const file = new File([blob], name, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
      } else {
        triggerDownload(URL.createObjectURL(blob), name);
      }
    } catch (e) {
      // User cancelled
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Tool Switcher */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('merge');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'merge'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{lang === 'bn' ? 'PDF মার্জ' : 'Merge PDFs'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('delete');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'delete'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>{lang === 'bn' ? 'পাতা বাদ দেওয়া' : 'Remove Pages'}</span>
          </button>
        </div>
      </div>

      {/* Mode 1: MERGE */}
      {activeSubTab === 'merge' && (
        <div className="space-y-5">
          {/* Upload Dropzone */}
          <div className="bg-white dark:bg-[#101726] border-2 border-dashed border-slate-300/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center transition-all duration-200 hover:border-blue-500/60 dark:hover:border-blue-500/60 shadow-xs">
            <input
              ref={mergeInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handleMergeFiles(e.target.files)}
            />
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner border border-blue-500/20">
                <Layers className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {lang === 'bn' ? 'PDF ফাইল যোগ করুন' : 'Add PDF Files'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'bn'
                    ? 'দুই বা ততোধিক PDF ফাইল একত্র করে একটি ডকুমেন্টে মার্জ করুন'
                    : 'Combine two or more PDF files into a single document'}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 pt-1">
                <button
                  onClick={() => mergeInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  {lang === 'bn' ? 'PDF ফাইল বেছে নিন' : 'Select PDF Files'}
                </button>
              </div>
            </div>
          </div>

          {/* Merge Items List */}
          {mergeItems.length > 0 && (
            <div className="bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {lang === 'bn' ? 'ফাইলের ক্রম (উপরে-নিচে সাজান)' : 'PDF Order to Combine'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {mergeItems.length} {lang === 'bn' ? 'টি ফাইল' : 'files'}
                  </span>
                </div>
                <button
                  onClick={() => setMergeItems([])}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                >
                  {lang === 'bn' ? 'সব মুছুন' : 'Clear All'}
                </button>
              </div>

              <div className="space-y-2">
                {mergeItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {item.pageCount} {lang === 'bn' ? 'টি পাতা' : 'pages'} • {formatSize(item.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveMergeItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveMergeItem(idx, 'down')}
                        disabled={idx === mergeItems.length - 1}
                        className="p-1.5 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveMergeItem(item.id)}
                        className="p-1.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Merged Title and Action */}
              <div className="pt-2 space-y-3">
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'মার্জ হওয়া ফাইলের নাম (যেমন: Combined_Docs)' : 'Merged File Name'}
                  value={mergeTitle}
                  onChange={(e) => setMergeTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                />

                <button
                  onClick={handleExecuteMerge}
                  disabled={isMerging}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
                >
                  {isMerging ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{lang === 'bn' ? 'জোড়া লাগানো হচ্ছে...' : 'Merging PDFs...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {lang === 'bn'
                          ? `সবগুলো (${mergeItems.length}টি) PDF মার্জ করুন`
                          : `Merge All ${mergeItems.length} PDFs into 1`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Merge Result */}
          {mergedPdf && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                    {lang === 'bn' ? 'PDF সফলভাবে মার্জ হয়েছে!' : 'PDF Merged Successfully!'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {mergedPdf.fileName} • {formatSize(mergedPdf.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => triggerDownload(mergedPdf.url, mergedPdf.fileName)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  {lang === 'bn' ? 'মার্জ PDF ডাউনলোড' : 'Download Merged PDF'}
                </button>
                <button
                  onClick={() => triggerShare(mergedPdf.blob, mergedPdf.fileName)}
                  className="py-2.5 px-4 rounded-xl border border-emerald-600/40 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  {lang === 'bn' ? 'শেয়ার' : 'Share'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: DELETE PAGES */}
      {activeSubTab === 'delete' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-[#101726] border-2 border-dashed border-slate-300/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center transition-all duration-200 hover:border-rose-500/60 dark:hover:border-rose-500/60 shadow-xs">
            <input
              ref={deleteInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => handleDeleteFileSelect(e.target.files)}
            />
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Scissors className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {lang === 'bn' ? 'পাতা বাদ দেওয়ার জন্য PDF বেছে নিন' : 'Select PDF to Remove Pages'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'bn'
                    ? 'যেসব পৃষ্ঠা বাদ দিতে চান সেগুলো নির্বাচন করে নতুন PDF তৈরি করুন'
                    : 'Select pages you want to remove and download the modified PDF'}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 pt-1">
                <button
                  onClick={() => deleteInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  {lang === 'bn' ? 'PDF বেছে নিন' : 'Select PDF File'}
                </button>
              </div>
            </div>
          </div>

          {deleteFile && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {deleteFile.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {deleteFile.pageCount} {lang === 'bn' ? 'টি পাতা মোট' : 'total pages'} • {formatSize(deleteFile.size)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDeleteFile(null);
                    setDeletedResult(null);
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600"
                >
                  {lang === 'bn' ? 'পরিবর্তন' : 'Change'}
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'যে যে পাতা মুছতে চান (যেমন: 2, 4-6)' : 'Pages to delete (e.g. 2, 4-6)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2, 4-5"
                  value={pagesToDeleteStr}
                  onChange={(e) => setPagesToDeleteStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              <button
                onClick={handleExecuteDeletePages}
                disabled={isDeleting}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50"
              >
                {isDeleting
                  ? (lang === 'bn' ? 'পাতা মোছা হচ্ছে...' : 'Deleting Pages...')
                  : (lang === 'bn' ? 'নির্দিষ্ট পাতাগুলো মুছে ফেলুন' : 'Delete Specified Pages')}
              </button>
            </div>
          )}

          {deletedResult && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                    {lang === 'bn' ? 'পাতা সফলভাবে বাদ দেওয়া হয়েছে!' : 'Pages Removed Successfully!'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {deletedResult.fileName} • {formatSize(deletedResult.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => triggerDownload(deletedResult.url, deletedResult.fileName)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  {lang === 'bn' ? 'নতুন PDF ডাউনলোড' : 'Download Cleaned PDF'}
                </button>
                <button
                  onClick={() => triggerShare(deletedResult.blob, deletedResult.fileName)}
                  className="py-2.5 px-4 rounded-xl border border-emerald-600/40 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  {lang === 'bn' ? 'শেয়ার' : 'Share'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

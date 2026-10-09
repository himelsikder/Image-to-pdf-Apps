import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  Sliders,
  Download,
  Share2,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Archive,
  Eye,
  X,
  Zap,
  TrendingDown,
  Image as ImageIcon,
} from 'lucide-react';
import { CompressedImageResult } from '../types';
import {
  compressMultipleImages,
  createZipOfCompressedImages,
  CompressionSettings,
} from '../utils/imageCompressor';
import { saveHistoryItem } from '../utils/db';

interface ImageCompressorProps {
  lang: 'bn' | 'en';
}

export const ImageCompressor: React.FC<ImageCompressorProps> = ({ lang }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [settings, setSettings] = useState<CompressionSettings>({
    mode: 'quality',
    quality: 0.75,
    targetSizeKb: 100,
    format: 'jpeg',
    maxDimension: 0,
  });

  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<CompressedImageResult[]>([]);
  const [zoomItem, setZoomItem] = useState<CompressedImageResult | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);
    setResults([]);

    const validFiles: File[] = [];
    Array.from(files).forEach((f) => {
      if (f.type.startsWith('image/')) {
        validFiles.push(f);
      }
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveSelected = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    results.forEach((r) => {
      URL.revokeObjectURL(r.originalUrl);
      URL.revokeObjectURL(r.compressedUrl);
    });
    setSelectedFiles([]);
    setResults([]);
  };

  const handleCompress = async () => {
    if (selectedFiles.length === 0) {
      setErrorMsg(
        lang === 'bn' ? 'অনুগ্রহ করে অন্তত ১টি ছবি বেছে নিন।' : 'Please select at least 1 image.'
      );
      return;
    }

    try {
      setIsCompressing(true);
      setErrorMsg(null);
      setProgress({ current: 0, total: selectedFiles.length });

      const compressedList = await compressMultipleImages(
        selectedFiles,
        settings,
        (curr, tot) => {
          setProgress({ current: curr, total: tot });
        }
      );

      setResults(compressedList);

      // Save to local IndexedDB
      const totalOriginal = compressedList.reduce((acc, c) => acc + c.originalSize, 0);
      const totalCompressed = compressedList.reduce((acc, c) => acc + c.compressedSize, 0);

      await saveHistoryItem({
        id: `comp_${Date.now()}`,
        type: 'img-compress',
        title: `${compressedList.length} photos compressed (${formatSize(totalCompressed)})`,
        date: Date.now(),
        itemCount: compressedList.length,
        fileSize: totalCompressed,
      });
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Compression failed');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownloadSingle = (item: CompressedImageResult) => {
    const a = document.createElement('a');
    a.href = item.compressedUrl;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareSingle = async (item: CompressedImageResult) => {
    try {
      const file = new File([item.blob], item.name, { type: item.blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: item.name });
      } else {
        handleDownloadSingle(item);
      }
    } catch (e) {
      // User cancelled
    }
  };

  const handleDownloadZip = async () => {
    if (results.length === 0) return;
    try {
      setIsZipping(true);
      const zipBlob = await createZipOfCompressedImages(results, 'compressed_images.zip');
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'compressed_images.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMsg('Failed to create ZIP');
    } finally {
      setIsZipping(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Stats calculation
  const totalOriginalBytes = results.reduce((a, b) => a + b.originalSize, 0);
  const totalCompressedBytes = results.reduce((a, b) => a + b.compressedSize, 0);
  const totalSavedBytes = Math.max(0, totalOriginalBytes - totalCompressedBytes);
  const overallSavedPercent =
    totalOriginalBytes > 0 ? Math.round((totalSavedBytes / totalOriginalBytes) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="bg-white dark:bg-[#101726] border-2 border-dashed border-slate-300/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center transition-all duration-200 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner border border-emerald-500/20">
            <TrendingDown className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'ছবি কম্প্রেস করুন' : 'Compress Images'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'ছবির স্পষ্টতা ঠিক রেখে ফাইল সাইজ (KB/MB) কমান'
                : 'Reduce image file size (KB/MB) while preserving visual quality'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition active:scale-95"
            >
              <Upload className="w-4 h-4" />
              {lang === 'bn' ? 'ছবি নির্বাচন করুন' : 'Select Photos'}
            </button>

            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition active:scale-95"
            >
              <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {lang === 'bn' ? 'ক্যামেরা স্ন্যাপ' : 'Camera Snap'}
            </button>
          </div>
        </div>
      </div>

      {/* Selected Files Count & Settings */}
      {selectedFiles.length > 0 && (
        <div className="bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {lang === 'bn' ? 'কম্প্রেশন সেটিংস' : 'Compression Settings'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {selectedFiles.length} {lang === 'bn' ? 'টি ছবি' : 'photos'}
              </span>
            </div>
            <button
              onClick={handleClearAll}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {lang === 'bn' ? 'সব মুছুন' : 'Clear All'}
            </button>
          </div>

          {/* Mode Switch: Quality vs Target Size */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-md">
            <button
              onClick={() => setSettings({ ...settings, mode: 'quality' })}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition ${
                settings.mode === 'quality'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {lang === 'bn' ? 'কোয়ালিটি স্লাইডার (Quality %)' : 'Quality Slider'}
            </button>
            <button
              onClick={() => setSettings({ ...settings, mode: 'target-size' })}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition ${
                settings.mode === 'target-size'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {lang === 'bn' ? 'নির্দিষ্ট সাইজ (যেমন < 100 KB)' : 'Target File Size (KB)'}
            </button>
          </div>

          {/* Mode Details */}
          {settings.mode === 'quality' ? (
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>{lang === 'bn' ? 'কম্প্রেশন মান (Quality):' : 'Compression Quality:'}</span>
                <span className="text-emerald-600 font-bold font-mono">
                  {Math.round(settings.quality * 100)}%{' '}
                  {settings.quality >= 0.75 ? '(Best)' : settings.quality >= 0.5 ? '(Good)' : '(Smallest)'}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.95"
                step="0.05"
                value={settings.quality}
                onChange={(e) =>
                  setSettings({ ...settings, quality: parseFloat(e.target.value) })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{lang === 'bn' ? 'ক্ষুদ্রতম সাইজ (10%)' : 'Smallest Size (10%)'}</span>
                <span>{lang === 'bn' ? 'প্রস্তাবিত (75%)' : 'Recommended (75%)'}</span>
                <span>{lang === 'bn' ? 'সর্বোচ্চ মান (95%)' : 'Max Quality (95%)'}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>{lang === 'bn' ? 'টার্গেট সাইজ নির্ধারণ করুন:' : 'Set Target File Size:'}</span>
                <span className="text-emerald-600 font-bold font-mono">
                  &lt; {settings.targetSizeKb} KB
                </span>
              </div>

              {/* Quick Presets for Target Size */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {[50, 100, 200, 300, 500].map((kb) => (
                  <button
                    key={kb}
                    onClick={() => setSettings({ ...settings, targetSizeKb: kb })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      settings.targetSizeKb === kb
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    &lt; {kb} KB
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="20"
                max="5000"
                value={settings.targetSizeKb}
                onChange={(e) =>
                  setSettings({ ...settings, targetSizeKb: parseInt(e.target.value, 10) || 100 })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                placeholder={lang === 'bn' ? 'কাস্টম সাইজ KB-তে লিখুন' : 'Custom size in KB'}
              />
            </div>
          )}

          {/* Format and Resolution grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'আউটপুট ফরম্যাট' : 'Output Format'}
              </label>
              <select
                value={settings.format}
                onChange={(e) =>
                  setSettings({ ...settings, format: e.target.value as 'jpeg' | 'webp' | 'png' })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              >
                <option value="jpeg">JPG (Most Compatible)</option>
                <option value="webp">WebP (Modern Maximum Compression)</option>
                <option value="png">PNG (Lossless)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'রেজোলিউশন স্কেলিং' : 'Resolution Resize'}
              </label>
              <select
                value={settings.maxDimension}
                onChange={(e) =>
                  setSettings({ ...settings, maxDimension: parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              >
                <option value={0}>{lang === 'bn' ? 'মূল রেজোলিউশন (১০০%)' : 'Original Resolution (100%)'}</option>
                <option value={1920}>Full HD (Max 1920px)</option>
                <option value={1280}>HD (Max 1280px)</option>
                <option value={800}>{lang === 'bn' ? 'ছোট রেজোলিউশন (Max 800px)' : 'Compact (Max 800px)'}</option>
              </select>
            </div>
          </div>

          {/* Compress Action Button */}
          <button
            onClick={handleCompress}
            disabled={isCompressing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
          >
            {isCompressing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>
                  {lang === 'bn'
                    ? `কম্প্রেস হচ্ছে (${progress.current}/${progress.total})...`
                    : `Compressing (${progress.current}/${progress.total})...`}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>
                  {lang === 'bn'
                    ? `${selectedFiles.length}টি ছবি কম্প্রেস করুন`
                    : `Compress ${selectedFiles.length} Images Now`}
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Compressed Results Card */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          {/* Summary Banner */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm sm:text-base">
                  {lang === 'bn' ? 'কম্প্রেশন সফল হয়েছে!' : 'Compression Completed!'}
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {lang === 'bn' ? 'মোট সাইজ' : 'Total size'}:{' '}
                <span className="line-through text-slate-400">{formatSize(totalOriginalBytes)}</span>{' '}
                ➔ <span className="font-bold text-emerald-600">{formatSize(totalCompressedBytes)}</span>{' '}
                (<span className="font-bold text-emerald-700">{overallSavedPercent}% Saved</span>)
              </p>
            </div>

            {/* ZIP Download button */}
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 disabled:opacity-50"
            >
              {isZipping ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>ZIP তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'সব ছবি ZIP ডাউনলোড' : 'Download All (ZIP)'}</span>
                </>
              )}
            </button>
          </div>

          {/* Grid of Results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {results.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs hover:shadow transition"
              >
                {/* Thumbnail */}
                <div
                  className="aspect-[4/3] w-full bg-slate-200 dark:bg-slate-900 flex items-center justify-center overflow-hidden cursor-pointer relative group"
                  onClick={() => setZoomItem(item)}
                >
                  <img
                    src={item.compressedUrl}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-bold shadow">
                    -{item.savedPercentage}%
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold gap-1 transition">
                    <Eye className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'তুলনা দেখুন' : 'Compare'}</span>
                  </div>
                </div>

                {/* Info & Size Comparison */}
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="line-through">{formatSize(item.originalSize)}</span>
                    <span className="font-bold text-emerald-600">{formatSize(item.compressedSize)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => handleDownloadSingle(item)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {lang === 'bn' ? 'ডাউনলোড' : 'Download'}
                    </button>
                    <button
                      onClick={() => handleShareSingle(item)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Share"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-Side Zoom Modal */}
      {zoomItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  {lang === 'bn' ? 'আসল বনাম কম্প্রেসড তুলনা' : 'Original vs Compressed Comparison'}
                </h4>
                <p className="text-xs text-slate-500">
                  {formatSize(zoomItem.originalSize)} ➔ {formatSize(zoomItem.compressedSize)} ({zoomItem.savedPercentage}% Saved)
                </p>
              </div>
              <button
                onClick={() => setZoomItem(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-100 dark:bg-slate-950">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500">
                  {lang === 'bn' ? 'আসল ছবি' : 'Original Photo'} ({formatSize(zoomItem.originalSize)})
                </span>
                <div className="aspect-[4/3] bg-black/10 rounded-xl overflow-hidden flex items-center justify-center">
                  <img
                    src={zoomItem.originalUrl}
                    alt="Original"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-600">
                  {lang === 'bn' ? 'কম্প্রেসড ছবি' : 'Compressed Photo'} ({formatSize(zoomItem.compressedSize)})
                </span>
                <div className="aspect-[4/3] bg-black/10 rounded-xl overflow-hidden flex items-center justify-center">
                  <img
                    src={zoomItem.compressedUrl}
                    alt="Compressed"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <button
                onClick={() => handleDownloadSingle(zoomItem)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                {lang === 'bn' ? 'কম্প্রেসড ছবি ডাউনলোড' : 'Download Compressed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

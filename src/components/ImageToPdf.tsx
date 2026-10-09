import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  RotateCw,
  ArrowUp,
  ArrowDown,
  Trash2,
  FileText,
  Download,
  Share2,
  Sparkles,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  PenTool,
  Shield,
  Sliders,
  Wand2,
} from 'lucide-react';
import {
  ImageFileItem,
  ImageToPdfOptions,
  PageSize,
  PageOrientation,
  PageMargin,
  ImageQuality,
  ImageFilter,
} from '../types';
import { convertImagesToPdf } from '../utils/pdfConverter';
import { saveHistoryItem } from '../utils/db';
import { SignaturePadModal } from './SignaturePadModal';
import { saveOrDownloadFile, shareFileNative } from '../utils/nativeFile';

interface ImageToPdfProps {
  lang: 'bn' | 'en';
}

export const ImageToPdf: React.FC<ImageToPdfProps> = ({ lang }) => {
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [globalFilter, setGlobalFilter] = useState<ImageFilter>('original');
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);

  const [options, setOptions] = useState<ImageToPdfOptions>({
    pageSize: 'a4',
    orientation: 'auto',
    margin: 'none',
    quality: 'high',
    addPageNumbers: false,
    pdfTitle: '',
    watermark: {
      enabled: false,
      text: '',
      opacity: 0.25,
      isDiagonal: true,
    },
    signature: {
      enabled: false,
      dataUrl: null,
      applyTo: 'last',
      position: 'bottom-right',
    },
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [convertedPdf, setConvertedPdf] = useState<{
    blob: Blob;
    url: string;
    fileName: string;
    size: number;
  } | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    const newItems: ImageFileItem[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const previewUrl = URL.createObjectURL(file);
      const newId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const img = new Image();
      img.src = previewUrl;
      img.onload = () => {
        setImages((prev) =>
          prev.map((item) =>
            item.id === newId ? { ...item, width: img.width, height: img.height } : item
          )
        );
      };

      newItems.push({
        id: newId,
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        width: 1000,
        height: 1000,
        rotation: 0,
        filter: globalFilter,
      });
    });

    setImages((prev) => [...prev, ...newItems]);
    setConvertedPdf(null);
  };

  const handleApplyGlobalFilter = (filter: ImageFilter) => {
    setGlobalFilter(filter);
    setImages((prev) => prev.map((img) => ({ ...img, filter })));
  };

  const handlePerImageFilter = (id: string, filter: ImageFilter) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, filter } : img)));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    setImages((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleRotate = (id: string) => {
    setImages((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    );
  };

  const handleRemove = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return filtered;
    });
  };

  const handleClearAll = () => {
    images.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setImages([]);
    setConvertedPdf(null);
  };

  const handleSaveSignature = (dataUrl: string) => {
    setOptions((prev) => ({
      ...prev,
      signature: {
        ...prev.signature,
        enabled: true,
        dataUrl,
      },
    }));
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setErrorMsg(
        lang === 'bn' ? 'অনুগ্রহ করে অন্তত ১টি ছবি সিলেক্ট করুন।' : 'Please select at least 1 image.'
      );
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      setProgress({ current: 0, total: images.length });

      const { pdfBlob } = await convertImagesToPdf(images, options, (current, total) => {
        setProgress({ current, total });
      });

      const url = URL.createObjectURL(pdfBlob);
      const safeTitle = options.pdfTitle.trim()
        ? options.pdfTitle.replace(/[^a-zA-Z0-9_\u0980-\u09FF-]/g, '_')
        : 'ImgToPdf_Document';
      const fileName = `${safeTitle}.pdf`;

      const result = {
        blob: pdfBlob,
        url,
        fileName,
        size: pdfBlob.size,
      };

      setConvertedPdf(result);

      // Save to local offline database
      await saveHistoryItem({
        id: `pdf_${Date.now()}`,
        type: 'img-to-pdf',
        title: fileName,
        date: Date.now(),
        itemCount: images.length,
        fileSize: pdfBlob.size,
      });
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(
        (err as Error)?.message ||
          (lang === 'bn' ? 'PDF তৈরিতে সমস্যা হয়েছে।' : 'Error creating PDF.')
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!convertedPdf) return;
    saveOrDownloadFile(convertedPdf.blob, convertedPdf.fileName);
  };

  const handleShare = async () => {
    if (!convertedPdf) return;
    await shareFileNative(convertedPdf.blob, convertedPdf.fileName);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="bg-white dark:bg-[#101726] border-2 border-dashed border-slate-300/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center transition-all duration-200 hover:border-blue-500/60 dark:hover:border-blue-500/60 shadow-xs">
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
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner border border-blue-500/20">
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Images'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'একাধিক ছবি (JPG, PNG, WebP) বেছে নিয়ে একসাথে PDF তৈরি করুন'
                : 'Select single or multiple photos (JPG, PNG, WebP) to combine into PDF'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition active:scale-95"
            >
              <Upload className="w-4 h-4" />
              {lang === 'bn' ? 'গ্যালারি থেকে বেছে নিন' : 'Choose Photos'}
            </button>

            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition active:scale-95"
            >
              <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {lang === 'bn' ? 'ক্যামেরা তুলুন' : 'Camera Snap'}
            </button>
          </div>
        </div>
      </div>

      {/* Selected Images List */}
      {images.length > 0 && (
        <div className="bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {lang === 'bn' ? 'বাছাইকৃত ছবিসমূহ' : 'Selected Images'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {images.length} {lang === 'bn' ? 'টি' : 'items'}
              </span>
            </div>

            {/* Smart Document Filter Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
              <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
                <Wand2 className="w-3 h-3 text-blue-600" />
                {lang === 'bn' ? 'ফিল্টার:' : 'Filter:'}
              </span>
              {(['original', 'magic', 'bw', 'grayscale'] as ImageFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => handleApplyGlobalFilter(f)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    globalFilter === f
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {f === 'original' && (lang === 'bn' ? 'আসল' : 'Original')}
                  {f === 'magic' && (lang === 'bn' ? 'ম্যাজিক স্ক্যানার' : 'Magic Color')}
                  {f === 'bw' && (lang === 'bn' ? 'ফটোকপি (B&W)' : 'B&W')}
                  {f === 'grayscale' && (lang === 'bn' ? 'গ্রে' : 'Gray')}
                </button>
              ))}
            </div>

            <button
              onClick={handleClearAll}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {lang === 'bn' ? 'সব মুছুন' : 'Clear All'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {images.map((item, index) => (
              <div
                key={item.id}
                className="group relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow transition"
              >
                {/* Image preview with rotation */}
                <div className="aspect-[3/4] w-full bg-slate-200 dark:bg-slate-900 flex items-center justify-center overflow-hidden p-1.5 relative">
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className={`max-h-full max-w-full object-contain transition-transform duration-200 ${
                      item.filter === 'grayscale'
                        ? 'grayscale'
                        : item.filter === 'bw'
                        ? 'contrast-200 grayscale'
                        : item.filter === 'magic'
                        ? 'contrast-125 saturate-125'
                        : ''
                    }`}
                    style={{ transform: `rotate(${item.rotation}deg)` }}
                  />
                  {item.filter !== 'original' && (
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600/80 text-white">
                      {item.filter.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Badge Number */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold">
                  #{index + 1}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleRemove(item.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600/90 text-white hover:bg-rose-700 transition"
                  title={lang === 'bn' ? 'মুছুন' : 'Remove'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Footer Controls */}
                <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => handleRotate(item.id)}
                    className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title={lang === 'bn' ? 'ঘোরান (90°)' : 'Rotate 90°'}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
                      title={lang === 'bn' ? 'উপরে নিন' : 'Move Up'}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === images.length - 1}
                      className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
                      title={lang === 'bn' ? 'নিচে নিন' : 'Move Down'}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PDF Generation Settings */}
      {images.length > 0 && (
        <div className="bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Settings2 className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {lang === 'bn' ? 'PDF পেজ ও কোয়ালিটি সেটিংস' : 'PDF Layout & Quality Settings'}
              </h4>
              <p className="text-[11px] text-slate-500">
                {lang === 'bn'
                  ? 'পেজের মাপ, ওরিয়েন্টেশন, মার্জিন ও কম্প্রেশন নির্ধারণ করুন'
                  : 'Customize page size, orientation, margin and compression'}
              </p>
            </div>
          </div>

          {/* Core Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Page Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'পেজের মাপ' : 'Page Size'}
              </label>
              <select
                value={options.pageSize}
                onChange={(e) => setOptions({ ...options, pageSize: e.target.value as PageSize })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="a4">A4 (Standard)</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
                <option value="fit">{lang === 'bn' ? 'ছবির মাপে পেজ' : 'Fit to Image'}</option>
              </select>
            </div>

            {/* Orientation */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'ওরিয়েন্টেশন' : 'Orientation'}
              </label>
              <select
                value={options.orientation}
                onChange={(e) =>
                  setOptions({ ...options, orientation: e.target.value as PageOrientation })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">{lang === 'bn' ? 'অটো ডিটেক্ট' : 'Auto Detect'}</option>
                <option value="portrait">{lang === 'bn' ? 'লম্বালম্বি' : 'Portrait'}</option>
                <option value="landscape">{lang === 'bn' ? 'আড়াআড়ি' : 'Landscape'}</option>
              </select>
            </div>

            {/* Quality / Compression */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'কোয়ালিটি কম্প্রেশন' : 'Compression'}
              </label>
              <select
                value={options.quality}
                onChange={(e) =>
                  setOptions({ ...options, quality: e.target.value as ImageQuality })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="high">{lang === 'bn' ? 'হাই (95%)' : 'High (95%)'}</option>
                <option value="medium">{lang === 'bn' ? 'মিডিয়াম (80%)' : 'Medium (80%)'}</option>
                <option value="low">{lang === 'bn' ? 'কম্প্যাক্ট (60%)' : 'Compact (60%)'}</option>
              </select>
            </div>

            {/* Margin */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'মার্জিন' : 'Margin'}
              </label>
              <select
                value={options.margin}
                onChange={(e) =>
                  setOptions({ ...options, margin: e.target.value as PageMargin })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">{lang === 'bn' ? 'মার্জিন নেই' : 'None'}</option>
                <option value="small">{lang === 'bn' ? 'ছোট মার্জিন' : 'Small'}</option>
                <option value="normal">{lang === 'bn' ? 'সাধারণ মার্জিন' : 'Normal'}</option>
              </select>
            </div>
          </div>

          {/* Premium Watermark & Digital Signature Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* 1. Watermark Box */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'কাস্টম ওয়াটারমার্ক (Watermark)' : 'Watermark Protection'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="wmToggle"
                  checked={options.watermark.enabled}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      watermark: { ...options.watermark, enabled: e.target.checked },
                    })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
              </div>

              {options.watermark.enabled && (
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'যেমন: CONFIDENTIAL বা নাম' : 'e.g. CONFIDENTIAL'}
                    value={options.watermark.text}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        watermark: { ...options.watermark, text: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.watermark.isDiagonal}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            watermark: { ...options.watermark, isDiagonal: e.target.checked },
                          })
                        }
                        className="rounded text-blue-600 h-3.5 w-3.5"
                      />
                      <span>{lang === 'bn' ? 'কোণাকুণি (45° Diagonal)' : 'Diagonal (45°)'}</span>
                    </label>
                    <span>
                      {lang === 'bn' ? 'স্বচ্ছতা:' : 'Opacity:'} {Math.round(options.watermark.opacity * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Signature Box */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'ডিজিটাল স্বাক্ষর (E-Signature)' : 'Digital Signature'}
                  </span>
                </div>
                <button
                  onClick={() => setIsSigModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] flex items-center gap-1 transition"
                >
                  <PenTool className="w-3 h-3" />
                  {options.signature.dataUrl
                    ? (lang === 'bn' ? 'স্বাক্ষর পরিবর্তন' : 'Change')
                    : (lang === 'bn' ? 'স্বাক্ষর আঁকুন' : 'Draw Sign')}
                </button>
              </div>

              {options.signature.dataUrl ? (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="h-10 w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 flex items-center justify-center">
                    <img
                      src={options.signature.dataUrl}
                      alt="Signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <select
                    value={options.signature.applyTo}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        signature: {
                          ...options.signature,
                          applyTo: e.target.value as 'last' | 'all' | 'first',
                        },
                      })
                    }
                    className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  >
                    <option value="last">{lang === 'bn' ? 'শেষ পাতায়' : 'Last Page'}</option>
                    <option value="all">{lang === 'bn' ? 'সব পাতায়' : 'All Pages'}</option>
                    <option value="first">{lang === 'bn' ? 'প্রথম পাতায়' : 'First Page'}</option>
                  </select>
                  <button
                    onClick={() =>
                      setOptions({
                        ...options,
                        signature: { ...options.signature, dataUrl: null, enabled: false },
                      })
                    }
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Title and Page Numbering */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder={lang === 'bn' ? 'ফাইলের নাম (যেমন: My_Documents)' : 'File Name (e.g. My_Document)'}
                value={options.pdfTitle}
                onChange={(e) => setOptions({ ...options, pdfTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pageNumbers"
                checked={options.addPageNumbers}
                onChange={(e) => setOptions({ ...options, addPageNumbers: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="pageNumbers" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                {lang === 'bn' ? 'পাতার নম্বর (Page 1 of N)' : 'Page numbering'}
              </label>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>
                    {lang === 'bn'
                      ? `PDF তৈরি হচ্ছে (${progress.current}/${progress.total})...`
                      : `Building PDF (${progress.current}/${progress.total})...`}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>
                    {lang === 'bn'
                      ? `${images.length}টি ছবি দিয়ে PDF তৈরি করুন`
                      : `Convert ${images.length} Images to PDF`}
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

      {/* Conversion Success Result Card */}
      {convertedPdf && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-base">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {lang === 'bn' ? 'PDF সফলভাবে তৈরি হয়েছে!' : 'PDF Created Successfully!'}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {convertedPdf.fileName} • {formatSize(convertedPdf.size)} • {images.length} {lang === 'bn' ? 'টি পাতা' : 'pages'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleDownload}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              {lang === 'bn' ? 'PDF ডাউনলোড করুন' : 'Download PDF'}
            </button>

            <button
              onClick={handleShare}
              className="py-3 px-4 rounded-xl border border-emerald-600/40 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/50 dark:hover:bg-slate-800 font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              {lang === 'bn' ? 'শেয়ার' : 'Share'}
            </button>

            <button
              onClick={() => setPreviewPdfUrl(convertedPdf.url)}
              className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <Eye className="w-4 h-4" />
              {lang === 'bn' ? 'প্রিভিউ' : 'Preview'}
            </button>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'PDF প্রিভিউ' : 'PDF Preview'}
              </h3>
              <button
                onClick={() => setPreviewPdfUrl(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2">
              <iframe src={previewPdfUrl} className="w-full h-full rounded-xl border-none" title="PDF Preview" />
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad Modal */}
      <SignaturePadModal
        isOpen={isSigModalOpen}
        onClose={() => setIsSigModalOpen(false)}
        onSave={handleSaveSignature}
        lang={lang}
      />
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  Lock,
  Upload,
  Eye,
  EyeOff,
  Shield,
  Key,
  CheckCircle2,
  Download,
  Share2,
  X,
  AlertCircle,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { passwordProtectPdf } from '../../utils/advancedPdf';
import { PDFDocument } from 'pdf-lib';

interface PdfPasswordProtectModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'bn' | 'en';
  onOpenInViewer?: (file: File) => void;
}

export const PdfPasswordProtectModal: React.FC<PdfPasswordProtectModalProps> = ({
  isOpen,
  onClose,
  lang,
  onOpenInViewer,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [algorithm, setAlgorithm] = useState<'AES-256' | 'RC4'>('AES-256');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
      setErrorMsg(lang === 'bn' ? 'দয়া করে একটি সঠিক PDF ফাইল নির্বাচন করুন' : 'Please select a valid PDF file');
      return;
    }

    try {
      const arrayBuffer = await selected.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setFile(selected);
      setPageCount(doc.getPageCount());
      setErrorMsg(null);
      setResult(null);
    } catch {
      setErrorMsg(lang === 'bn' ? 'PDF ফাইলটি লোড করা সম্ভব হয়নি' : 'Failed to load PDF file');
    }
  };

  const handleProtect = async () => {
    if (!file) {
      setErrorMsg(lang === 'bn' ? 'দয়া করে একটি PDF ফাইল আপলোড করুন' : 'Please upload a PDF file');
      return;
    }
    if (!password || password.length < 3) {
      setErrorMsg(
        lang === 'bn'
          ? 'পাসওয়ার্ড কমপক্ষে ৩ অক্ষরের হতে হবে'
          : 'Password must be at least 3 characters long'
      );
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(
        lang === 'bn'
          ? 'পাসওয়ার্ড দুটি মেলেনি, পুনরায় টাইপ করুন'
          : 'Passwords do not match. Please re-enter.'
      );
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await passwordProtectPdf(file, password, password, algorithm);
      const url = URL.createObjectURL(res.blob);
      setResult({
        blob: res.blob,
        fileName: res.fileName,
        size: res.size,
        url,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Encryption failed';
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
    setPassword('');
    setConfirmPassword('');
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {lang === 'bn' ? 'PDF পাসওয়ার্ড প্রটেকশন' : 'Password Protect PDF'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'bn'
                  ? 'সামরিক মানের AES-256 এনক্রিপশনে ফাইল লক করুন'
                  : 'Lock documents with military-grade AES-256 encryption'}
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
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-400 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {lang === 'bn' ? 'PDF ফাইল বেছে নিন' : 'Choose a PDF to Protect'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {lang === 'bn'
                      ? 'ডিভাইস থেকে যেকোনো আনলকড PDF সিলেক্ট করুন'
                      : 'Select any PDF file from your device'}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm truncate">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {pageCount} {lang === 'bn' ? 'টি পাতা' : 'pages'} • {formatSize(file.size)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs text-slate-500 hover:text-rose-500 font-semibold px-2 py-1 rounded-lg"
                  >
                    {lang === 'bn' ? 'পরিবর্তন' : 'Change'}
                  </button>
                </div>
              )}

              {/* Password Inputs */}
              {file && (
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      <span>{lang === 'bn' ? 'লক পাসওয়ার্ড দিন' : 'Set Password'}</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={lang === 'bn' ? 'কমপক্ষে ৩ সংখ্যার পাসওয়ার্ড' : 'Enter strong password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'পুনরায় পাসওয়ার্ড দিন (Confirm)' : 'Confirm Password'}
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={lang === 'bn' ? 'একই পাসওয়ার্ড আবার লিখুন' : 'Confirm password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Encryption standard */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-500" />
                      <span>{lang === 'bn' ? 'এনক্রিপশন অ্যালগরিদম' : 'Encryption Standard'}</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAlgorithm('AES-256')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                          algorithm === 'AES-256'
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <p className="font-bold">AES-256 (PDF 2.0)</p>
                        <p className="text-[10px] text-slate-500">
                          {lang === 'bn' ? 'সর্বোচ্চ নিরাপত্তা' : 'Maximum Security'}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAlgorithm('RC4')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                          algorithm === 'RC4'
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <p className="font-bold">RC4 (128-bit)</p>
                        <p className="text-[10px] text-slate-500">
                          {lang === 'bn' ? 'পুরাতন ভিউয়ার সাপোর্ট' : 'Legacy Compatibility'}
                        </p>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 leading-relaxed">
                    ℹ️{' '}
                    {lang === 'bn'
                      ? 'মনে রাখবেন: অফলাইন এনক্রিপশন হওয়ায় পাসওয়ার্ড ভুলে গেলে ফাইল রিকভার করা সম্ভব নয়। পাসওয়ার্ডটি নিরাপদ কোথাও লিখে রাখুন।'
                      : 'Notice: Because encryption is 100% on-device, this password cannot be recovered if forgotten. Keep it safe.'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Success State */
            <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {lang === 'bn' ? 'PDF সফলভাবে সুরক্ষিত হয়েছে!' : 'PDF Protected Successfully!'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {result.fileName} • {formatSize(result.size)}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                  {lang === 'bn' ? 'পাসওয়ার্ড দিয়ে যেকোনো PDF রিডারে খোলা যাবে' : 'Locked with password • Ready to download'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleDownload}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'ডাউনলোড করুন' : 'Download Protected PDF'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'শেয়ার' : 'Share'}</span>
                </button>

                {onOpenInViewer && (
                  <button
                    onClick={() => {
                      const newFile = new File([result.blob], result.fileName, { type: 'application/pdf' });
                      onOpenInViewer(newFile);
                      onClose();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'ভিউয়ারে টেস্ট করুন' : 'Test in Viewer'}</span>
                  </button>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold flex items-center gap-1 mx-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'আরেকটি PDF লক করুন' : 'Protect Another PDF'}</span>
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
              onClick={handleProtect}
              disabled={isProcessing || !password}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 transition active:scale-95 disabled:opacity-50 shadow-md shadow-amber-500/20"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{lang === 'bn' ? 'লক করা হচ্ছে...' : 'Encrypting...'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'পাসওয়ার্ড দিয়ে লক করুন' : 'Lock with Password'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

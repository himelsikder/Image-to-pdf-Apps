import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  Upload,
  Download,
  Lock,
  Eye,
  FileText,
  AlertCircle,
  Columns,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'bn' | 'en';
  initialFile?: File | null;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  lang,
  initialFile = null,
}) => {
  const [file, setFile] = useState<File | null>(initialFile);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password state for encrypted PDFs
  const [isPasswordRequired, setIsPasswordRequired] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [pendingPasswordCallback, setPendingPasswordCallback] = useState<
    ((password: string) => void) | null
  >(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  useEffect(() => {
    if (initialFile) {
      setFile(initialFile);
    }
  }, [initialFile]);

  const loadPdf = useCallback(
    async (fileToLoad: File) => {
      setIsLoading(true);
      setErrorMsg(null);
      setIsPasswordRequired(false);

      try {
        const arrayBuffer = await fileToLoad.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        // Handle password protected PDFs
        loadingTask.onPassword = (callback: (password: string) => void, reason: number) => {
          setIsPasswordRequired(true);
          setPendingPasswordCallback(() => callback);
          if (reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD) {
            setErrorMsg(
              lang === 'bn'
                ? 'ভুল পাসওয়ার্ড। দয়া করে সঠিক পাসওয়ার্ড দিন।'
                : 'Incorrect password. Please try again.'
            );
          }
        };

        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setIsPasswordRequired(false);
      } catch (err: unknown) {
        if (!isPasswordRequired) {
          const msg = err instanceof Error ? err.message : 'Failed to load PDF';
          setErrorMsg(msg);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [lang, isPasswordRequired]
  );

  useEffect(() => {
    if (isOpen && file) {
      loadPdf(file);
    }
  }, [isOpen, file, loadPdf]);

  // Render current page onto canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || currentPage < 1 || currentPage > numPages) return;

    let isCancelled = false;

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvas,
          canvasContext: ctx,
          viewport,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'name' in err && err.name === 'RenderingCancelledException') {
          // Ignore cancelled render
          return;
        }
        console.error('Error rendering page:', err);
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale, rotation, numPages]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingPasswordCallback && passwordInput) {
      pendingPasswordCallback(passwordInput);
      setPasswordInput('');
    }
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFile(files[0]);
  };

  const handleDownload = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
    >
      <div
        className={`bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800 flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? 'w-screen h-screen rounded-none'
            : 'w-full max-w-5xl h-[92vh] rounded-3xl'
        }`}
      >
        {/* Top Toolbar */}
        <div className="p-3 sm:px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/80 dark:bg-[#111726]/90">
          {/* Left: Title & File name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                {file ? file.name : lang === 'bn' ? 'PDF ভিউয়ার' : 'PDF Viewer'}
              </p>
              {numPages > 0 && (
                <p className="text-[11px] text-slate-500">
                  {lang === 'bn' ? 'পৃষ্ঠা' : 'Page'} {currentPage} / {numPages}
                </p>
              )}
            </div>
          </div>

          {/* Center: Controls (hidden on very small screens, visible on sm+) */}
          {numPages > 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Previous page */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
                {currentPage} / {numPages}
              </span>

              {/* Next page */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

              {/* Zoom Out */}
              <button
                onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hidden sm:inline-flex"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                {Math.round(scale * 100)}%
              </span>

              {/* Zoom In */}
              <button
                onClick={() => setScale((s) => Math.min(3.0, s + 0.2))}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hidden sm:inline-flex"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Rotate view */}
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                title="Rotate Clockwise"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Toggle Thumbnails */}
              <button
                onClick={() => setShowThumbnails(!showThumbnails)}
                className={`p-1.5 rounded-lg transition hidden md:inline-flex ${
                  showThumbnails
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Thumbnails sidebar"
              >
                <Columns className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {file && (
              <button
                onClick={handleDownload}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden relative bg-slate-200/60 dark:bg-[#070b13]">
          {/* Thumbnails Sidebar */}
          {showThumbnails && numPages > 0 && (
            <div className="w-36 sm:w-44 border-r border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0d1424] overflow-y-auto p-2 space-y-2 shrink-0">
              {Array.from({ length: numPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-full p-2 rounded-xl text-left transition flex flex-col items-center gap-1 border ${
                    currentPage === idx + 1
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="w-full h-24 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-mono">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="text-[11px]">
                    {lang === 'bn' ? 'পাতা' : 'Page'} {idx + 1}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Main Viewer canvas scroll area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="max-w-md w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-8 text-center cursor-pointer bg-white/70 dark:bg-slate-900/50 backdrop-blur-xs transition"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files)}
                />
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {lang === 'bn' ? 'PDF ফাইল ওপেন করুন' : 'Open a PDF Document'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'bn'
                    ? 'ফুল-স্ক্রিনে পড়ার জন্য যেকোনো PDF সিলেক্ট করুন'
                    : 'Select any PDF file to view inside the app offline'}
                </p>
              </div>
            ) : isPasswordRequired ? (
              <div className="max-w-sm w-full p-6 rounded-3xl bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {lang === 'bn' ? 'পাসওয়ার্ড সুরক্ষিত PDF' : 'Password Protected Document'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {lang === 'bn'
                      ? 'এই PDF টি খুলতে পাসওয়ার্ড প্রয়োজন'
                      : 'Please enter the password to open this document'}
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <input
                    type="password"
                    placeholder={lang === 'bn' ? 'পাসওয়ার্ড লিখুন' : 'Enter password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition active:scale-95"
                  >
                    {lang === 'bn' ? 'ডকুমেন্ট খুলুন' : 'Unlock Document'}
                  </button>
                </form>
              </div>
            ) : isLoading ? (
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {lang === 'bn' ? 'PDF লোড হচ্ছে...' : 'Loading PDF...'}
                </p>
              </div>
            ) : errorMsg ? (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            ) : (
              <div className="shadow-2xl rounded-lg overflow-hidden bg-white max-w-full">
                <canvas ref={canvasRef} className="block max-w-full h-auto mx-auto" />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Quick Switcher Bar (Mobile friendly) */}
        {numPages > 1 && (
          <div className="p-2 sm:p-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] flex items-center justify-between px-4 text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-40 font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'পূর্ববর্তী' : 'Previous'}</span>
            </button>

            <span className="font-semibold text-slate-600 dark:text-slate-400">
              {currentPage} / {numPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-40 font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
            >
              <span>{lang === 'bn' ? 'পরবর্তী' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

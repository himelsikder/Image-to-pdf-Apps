import React, { useEffect, useState } from 'react';
import { History, X, Trash2, Calendar, FileText, Image as ImageIcon, HardDrive, TrendingDown, Layers } from 'lucide-react';
import { ConversionHistoryItem } from '../types';
import { getHistoryItems, deleteHistoryItem, clearAllHistory } from '../utils/db';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'bn' | 'en';
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, lang }) => {
  const [items, setItems] = useState<ConversionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await getHistoryItems();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      setConfirmClear(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async (id: string) => {
    await deleteHistoryItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = async () => {
    await clearAllHistory();
    setItems([]);
    setConfirmClear(false);
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {lang === 'bn' ? 'হিস্টোরি' : 'History'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading...</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <HardDrive className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {lang === 'bn'
                  ? 'এখনো কোনো কনভার্শন হিস্টোরি নেই।'
                  : 'No conversion history recorded yet.'}
              </p>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? 'ছবি বা PDF কনভার্ট করলে এখানে রেকর্ড সংরক্ষিত থাকবে।'
                  : 'Files processed will show up here.'}
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      item.type === 'img-to-pdf'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                        : item.type === 'pdf-to-img'
                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600'
                        : item.type === 'img-compress'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                        : 'bg-purple-100 dark:bg-purple-950 text-purple-600'
                    }`}
                  >
                    {item.type === 'img-to-pdf' ? (
                      <FileText className="w-4 h-4" />
                    ) : item.type === 'pdf-to-img' ? (
                      <ImageIcon className="w-4 h-4" />
                    ) : item.type === 'img-compress' ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <Layers className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>{formatDate(item.date)}</span>
                      <span>•</span>
                      <span>
                        {item.itemCount} {lang === 'bn' ? 'টি আইটেম' : 'items'}
                      </span>
                      {item.fileSize > 0 && (
                        <>
                          <span>•</span>
                          <span>{formatSize(item.fileSize)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title={lang === 'bn' ? 'মুছুন' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {items.length} {lang === 'bn' ? 'টি রেকর্ড সংরক্ষিত' : 'records stored'}
            </span>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-500 font-medium">
                  {lang === 'bn' ? 'মুছে ফেলবেন?' : 'Confirm delete?'}
                </span>
                <button
                  onClick={handleClearAll}
                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition"
                >
                  {lang === 'bn' ? 'হ্যাঁ' : 'Yes'}
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
                >
                  {lang === 'bn' ? 'না' : 'No'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {lang === 'bn' ? 'সব হিস্টোরি ক্লিয়ার করুন' : 'Clear All History'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

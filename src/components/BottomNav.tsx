import React from 'react';
import { FileText, Image as ImageIcon, TrendingDown, Layers, Settings } from 'lucide-react';

export type ActiveTab = 'img-to-pdf' | 'pdf-to-img' | 'img-compress' | 'pdf-tools' | 'settings';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  lang: 'bn' | 'en';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, lang }) => {
  const tabs = [
    {
      id: 'img-to-pdf' as ActiveTab,
      labelBn: 'ছবি ➔ PDF',
      labelEn: 'Img to PDF',
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
      activeBg: 'bg-blue-100/80 dark:bg-blue-900/50',
    },
    {
      id: 'pdf-to-img' as ActiveTab,
      labelBn: 'PDF ➔ ছবি',
      labelEn: 'PDF to Img',
      icon: ImageIcon,
      color: 'text-indigo-600 dark:text-indigo-400',
      activeBg: 'bg-indigo-100/80 dark:bg-indigo-900/50',
    },
    {
      id: 'img-compress' as ActiveTab,
      labelBn: 'কম্প্রেশ',
      labelEn: 'Compress',
      icon: TrendingDown,
      color: 'text-emerald-600 dark:text-emerald-400',
      activeBg: 'bg-emerald-100/80 dark:bg-emerald-900/50',
    },
    {
      id: 'pdf-tools' as ActiveTab,
      labelBn: 'মার্জ ও এডিট',
      labelEn: 'PDF Tools',
      icon: Layers,
      color: 'text-purple-600 dark:text-purple-400',
      activeBg: 'bg-purple-100/80 dark:bg-purple-900/50',
    },
    {
      id: 'settings' as ActiveTab,
      labelBn: 'সেটিংস',
      labelEn: 'Settings',
      icon: Settings,
      color: 'text-slate-800 dark:text-slate-200',
      activeBg: 'bg-slate-200/90 dark:bg-slate-800/90',
    },
  ];

  return (
    <nav
      aria-label="App Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-lg transition-colors pb-safe sm:max-w-xl sm:mx-auto sm:bottom-4 sm:rounded-3xl sm:border sm:shadow-2xl sm:p-1.5"
    >
      <div className="grid grid-cols-5 w-full items-center justify-items-center py-1 px-1 sm:px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              type="button"
              aria-label={lang === 'bn' ? tab.labelBn : tab.labelEn}
              aria-current={isActive ? 'page' : undefined}
              className="w-full flex flex-col items-center justify-center py-1 px-0.5 select-none focus:outline-none transition-all duration-150 active:scale-95 group touch-manipulation cursor-pointer"
            >
              {/* Material 3 active pill around icon */}
              <div
                className={`flex items-center justify-center px-3 sm:px-4 py-1 rounded-full transition-all duration-200 ${
                  isActive
                    ? `${tab.activeBg} ${tab.color} scale-105 shadow-xs`
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform duration-200" />
              </div>

              {/* Responsive Label - never truncates awkwardly or wraps */}
              <span
                className={`mt-0.5 w-full text-center tracking-tight leading-tight truncate px-0.5 transition-colors duration-150 text-[9px] min-[360px]:text-[10px] sm:text-[11px] ${
                  isActive
                    ? `${tab.color} font-bold`
                    : 'text-slate-500 dark:text-slate-400 font-medium group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}
              >
                {lang === 'bn' ? tab.labelBn : tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

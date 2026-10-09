import React from 'react';
import { Globe, History, Moon, Sun, Settings } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { AppLogo } from './AppLogo';

interface HeaderProps {
  lang: 'bn' | 'en';
  onToggleLang: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  isSettingsActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  onOpenHistory,
  onOpenSettings,
  darkMode,
  onToggleTheme,
  isSettingsActive = false,
}) => {
  const isOnline = useOnlineStatus();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/70 bg-white/85 dark:bg-[#090d16]/85 backdrop-blur-xl transition-colors">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand Wordmark & Logo */}
        <button
          onClick={onOpenSettings}
          className="text-left focus:outline-hidden hover:opacity-95 transition min-w-0 shrink"
          title={lang === 'bn' ? 'Img to Pdf সেটিংস ও তথ্য' : 'Img to Pdf Settings & Info'}
        >
          <AppLogo size={36} showText={true} />
        </button>

        {/* Right Action buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Offline badge */}
          {!isOnline && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="hidden min-[420px]:inline">{lang === 'bn' ? 'অফলাইন' : 'Offline'}</span>
            </span>
          )}

          {/* History button */}
          <button
            onClick={onOpenHistory}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition flex items-center gap-1 text-xs font-semibold"
            title={lang === 'bn' ? 'হিস্টোরি' : 'History'}
            aria-label="History"
          >
            <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden md:inline">{lang === 'bn' ? 'হিস্টোরি' : 'History'}</span>
          </button>

          {/* Settings button (desktop/tablet header) */}
          <button
            onClick={onOpenSettings}
            className={`hidden sm:flex p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl transition items-center gap-1.5 text-xs font-semibold ${
              isSettingsActive
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
            title={lang === 'bn' ? 'সেটিংস ও পলিসি' : 'Settings & Policies'}
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden md:inline">{lang === 'bn' ? 'সেটিংস' : 'Settings'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1"
            title={lang === 'bn' ? 'Switch to English' : 'বাংলা করুন'}
            aria-label="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-[11px] sm:text-xs">{lang === 'bn' ? 'EN' : 'বাং'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition border border-slate-200/80 dark:border-slate-800"
            title={darkMode ? (lang === 'bn' ? 'ডে মোড' : 'Light Mode') : (lang === 'bn' ? 'ডার্ক মোড' : 'Dark Mode')}
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageToPdf } from './components/ImageToPdf';
import { PdfToImage } from './components/PdfToImage';
import { PdfTools } from './components/PdfTools';
import { ImageCompressor } from './components/ImageCompressor';
import { SettingsView } from './components/SettingsView';
import { HistoryModal } from './components/HistoryModal';
import { BottomNav, ActiveTab } from './components/BottomNav';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('img-to-pdf');
  // Default language is English ('en'), user can toggle to Bengali ('bn')
  const [lang, setLang] = useState<'bn' | 'en'>(() => {
    try {
      if (typeof window === 'undefined') return 'en';
      const saved = localStorage.getItem('img_to_pdf_lang');
      if (saved === 'bn' || saved === 'en') return saved;
      return 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('img_to_pdf_lang', lang);
    } catch {
      // Storage unavailable in sandbox
    }
  }, [lang]);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Initialize theme from localStorage or system preference safely
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return true;
      const saved = localStorage.getItem('docmorph_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return true;
    }
  });

  // Dark mode side effect
  useEffect(() => {
    try {
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('docmorph_theme', 'dark');
        if (metaTheme) metaTheme.setAttribute('content', '#090d16');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('docmorph_theme', 'light');
        if (metaTheme) metaTheme.setAttribute('content', '#f8fafc');
      }
    } catch {
      // Storage unavailable in sandbox iframe
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300 antialiased selection:bg-blue-500/20 selection:text-blue-600 dark:selection:text-blue-300">
      {/* Header Bar */}
      <Header
        lang={lang}
        onToggleLang={() => setLang(lang === 'bn' ? 'en' : 'bn')}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setActiveTab('settings')}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
        isSettingsActive={activeTab === 'settings'}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6 pb-28 sm:pb-24 space-y-5">
        {/* Active Tool View */}
        <div className="animate-fadeIn transition-all">
          {activeTab === 'img-to-pdf' && <ImageToPdf lang={lang} />}
          {activeTab === 'pdf-to-img' && <PdfToImage lang={lang} />}
          {activeTab === 'img-compress' && <ImageCompressor lang={lang} />}
          {activeTab === 'pdf-tools' && <PdfTools lang={lang} />}
          {activeTab === 'settings' && (
            <SettingsView
              lang={lang}
              onToggleLang={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              darkMode={darkMode}
              onToggleTheme={() => setDarkMode(!darkMode)}
            />
          )}
        </div>
      </main>

      {/* Sticky Bottom Navigation for Mobile */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        lang={lang}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lang={lang}
      />
    </div>
  );
}

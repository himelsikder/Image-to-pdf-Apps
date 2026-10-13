/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { PdfToImage } from './components/PdfToImage';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { ToastContainer } from './components/Toast';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

// Lazy load heavy tabs so initial app startup is instant
const ImageToPdf = lazy(() => import('./components/ImageToPdf').then((m) => ({ default: m.ImageToPdf })));
const ImageCompressor = lazy(() => import('./components/ImageCompressor').then((m) => ({ default: m.ImageCompressor })));
const PdfTools = lazy(() => import('./components/PdfTools').then((m) => ({ default: m.PdfTools })));
const SettingsView = lazy(() => import('./components/SettingsView').then((m) => ({ default: m.SettingsView })));
const HistoryModal = lazy(() => import('./components/HistoryModal').then((m) => ({ default: m.HistoryModal })));

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pdf-to-img');
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

  // Capacitor native status bar styling
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      StatusBar.setStyle({ style: darkMode ? Style.Dark : Style.Light });
      StatusBar.setBackgroundColor({ color: darkMode ? '#090d16' : '#f8fafc' });
    } catch {
      // Ignore if not supported
    }
  }, [darkMode]);

  // Capacitor native Android hardware Back Button listener
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const subPromise = CapApp.addListener('backButton', () => {
      if (isHistoryOpen) {
        setIsHistoryOpen(false);
      } else if (activeTab !== 'pdf-to-img') {
        setActiveTab('pdf-to-img');
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      subPromise.then((sub) => sub.remove()).catch(() => {});
    };
  }, [isHistoryOpen, activeTab]);

  // Prefetch other modules after initial render when device is idle
  useEffect(() => {
    const timer = setTimeout(() => {
      import('./components/ImageToPdf');
      import('./components/ImageCompressor');
      import('./components/PdfTools');
      import('./components/SettingsView');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

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
          <Suspense
            fallback={
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400 font-medium animate-pulse">
                  {lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading module...'}
                </span>
              </div>
            }
          >
            {activeTab === 'pdf-to-img' && <PdfToImage lang={lang} />}
            {activeTab === 'img-to-pdf' && <ImageToPdf lang={lang} />}
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
          </Suspense>
        </div>
      </main>

      {/* Sticky Bottom Navigation for Mobile */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        lang={lang}
      />

      {/* Toast Notification Container */}
      <ToastContainer />

      {/* History Modal */}
      {isHistoryOpen && (
        <Suspense fallback={null}>
          <HistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            lang={lang}
          />
        </Suspense>
      )}
    </div>
  );
}

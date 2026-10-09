import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  Globe,
  Moon,
  Sun,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  X,
  FileCheck,
  Eye,
  Scissors,
  RotateCw,
} from 'lucide-react';
import { clearHistory } from '../utils/db';
import { PdfPasswordProtectModal } from './tools/PdfPasswordProtectModal';
import { PdfViewerModal } from './tools/PdfViewerModal';
import { PdfSplitModal } from './tools/PdfSplitModal';
import { PdfReorderRotateModal } from './tools/PdfReorderRotateModal';

interface SettingsViewProps {
  lang: 'bn' | 'en';
  onToggleLang: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

type ModalType = 'privacy' | 'datasafety' | 'permissions' | 'terms' | null;

export const SettingsView: React.FC<SettingsViewProps> = ({
  lang,
  onToggleLang,
  darkMode,
  onToggleTheme,
}) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await clearHistory();
      setCacheCleared(true);
      setShowClearConfirm(false);
      setTimeout(() => setCacheCleared(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setClearingCache(false);
    }
  };

  const copyText = (text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const privacyTextEn = `PRIVACY POLICY FOR IMG TO PDF (GOOGLE PLAY: IMG TO PDF OFFLINE)

Effective Date: October 2026
Developer / Publisher: Himel Sikder
Contact Email: himelsikder16@gmail.com
Package Identifier: com.imgtopdf.offline

1. INTRODUCTION & PRINCIPLE OF ZERO-KNOWLEDGE
Img to Pdf (listed on Google Play Store as "Img to Pdf Offline") is built with privacy-by-design as a 100% offline document and image processing utility. We believe your personal documents, certificates, bills, and photos are strictly your private property.
We do NOT collect, transmit, store, monetize, or share any personal user data, device identifiers, IP addresses, photos, or documents.

2. LOCAL ON-DEVICE PROCESSING
Every single operation—including:
• Converting images (JPG, PNG, WebP) to PDF
• Converting PDF pages into images
• Compressing and resizing images
• Merging multiple PDF documents
• Removing specific pages from a PDF
• Applying watermarks, page numbers, and digital signatures
takes place strictly within your device's local memory and browser sandbox runtime. No file is ever transmitted to any cloud server, backend API, or external database.

3. DEVICE PERMISSIONS & ACCESS JUSTIFICATION
In accordance with Google Play Developer Policies:
• Read Photos & Media (READ_MEDIA_IMAGES / READ_EXTERNAL_STORAGE): Requested only when you intentionally select images or PDF files from your device storage to process.
• Camera (CAMERA): Requested solely if you tap the "Camera Snap" button to take a physical picture of a document. No camera stream is saved remotely or shared.
• Storage Download: Used to save your generated PDF or image files to your device's local Downloads folder.

4. NO THIRD-PARTY ADVERTISING & ZERO TRACKING SDKs
• Advertising: Img to Pdf contains ZERO advertising SDKs (No Google AdMob, Unity Ads, AppLovin, or Meta Audience Network).
• Analytics & Telemetry: Img to Pdf contains ZERO tracking or diagnostic SDKs (No Firebase Analytics, Google Analytics, Mixpanel, or AppsFlyer).

5. GOOGLE PLAY DATA SAFETY DECLARATION
• Data Collected: None
• Data Shared with Third Parties: None
• Ephemeral Processing: Yes (All files reside in temporary volatile RAM while active)
• Data Deletion: Not Applicable (No user data exists on external servers; local cache can be wiped anytime via the Clear Cache button in Settings)

6. SECURITY PRACTICES
• 100% Client-Side Processing prevents network interceptions.
• Optional Password Protection encrypts generated PDFs with standard AES document encryption.
• Instant Local Cache Clear button allows you to wipe all local conversion history with a single tap.

7. CHILDREN'S PRIVACY (COPPA & FAMILIES POLICY)
Img to Pdf does not target or collect information from children under 13 (or under 16 in certain jurisdictions). Because zero data is collected from any user, this app is fully compliant with COPPA and Google Play Families Policies.

8. DEVELOPER CONTACT
If you have any questions or feedback regarding this Privacy Policy, please contact:
Himel Sikder
Email: himelsikder16@gmail.com`;

  const privacyTextBn = `গোপনীয়তা নীতি (PRIVACY POLICY) — IMG TO PDF

কার্যকর তারিখ: অক্টোবর ২০২৬
ডেভেলপার: হিমেল সিকদার (Himel Sikder)
যোগাযোগ ইমেইল: himelsikder16@gmail.com
প্যাকেজ আইডি: com.imgtopdf.offline

১. ভূমিকা ও ১০০% অফলাইন প্রতিশ্রুতি
"Img to Pdf" (গুগল প্লে-স্টোরে "Img to Pdf Offline" নামে তালিকাভুক্ত) ব্যবহারকারীর ব্যক্তিগত তথ্যের সর্বোচ্চ গোপনীয়তা রক্ষায় ডিজাইন করা হয়েছে। এটি সম্পূর্ণ একটি অফলাইন ইউটিলিটি অ্যাপ।
আমরা ব্যবহারকারীর কোনো ব্যক্তিগত তথ্য, ছবি, ডকুমেন্ট, ডিভাইস আইডি, বা অবস্থান সংক্রান্ত ডাটা সংগ্রহ, সংরক্ষণ কিংবা শেয়ার করি না।

২. সম্পূর্ণ ডিভাইসে লোকাল প্রসেসিং (On-Device Processing)
অ্যাপের সকল কার্যক্রম যেমন:
• ছবি থেকে PDF তৈরি করা
• PDF থেকে ছবি এক্সট্র্যাক্ট করা
• ছবির ফাইল সাইজ কমানো (কম্প্রেশন)
• একাধিক PDF ফাইল মার্জ বা একত্রিত করা
• নির্দিষ্ট পৃষ্ঠা বাদ দেওয়া
• ওয়াটারমার্ক ও ডিজিটাল স্বাক্ষর যুক্ত করা
সবকিছু আপনার নিজের ফোনের র‍্যাম (RAM) এবং লোকাল মেমোরির ভেতরে সম্পন্ন হয়। কোনো ফাইল কখনোই কোনো রিমোট সার্ভার বা ক্লাউডে আপলোড করা হয় না।

৩. ডিভাইস পারমিশন ব্যবহারের কারণ (Google Play Compliance)
• মিডিয়া ও ফটো এক্সেস: আপনি যখন নিজে গ্যালারি থেকে ছবি বা PDF বেছে নেন, শুধুমাত্র তখনই ফাইলগুলো লোড করার সাময়িক অনুমতি নেওয়া হয়।
• ক্যামেরা (Camera): আপনি যখন সরাসরি ডকুমেন্ট স্ক্যান করার জন্য "ক্যামেরা স্ন্যাপ" বোতাম চাপেন, শুধুমাত্র তখনই ক্যামেরা চালু হয়। কোনো ছবি রিমোট সার্ভারে যায় না।
• ফাইল ডাউনলোড: কনভার্ট করা ফাইলটি আপনার ডিভাইসের ডাউনলোড ফোল্ডারে সেভ করার জন্য ব্যবহৃত হয়।

৪. কোনো বিজ্ঞাপন বা ট্র্যাকিং নেই
• বিজ্ঞাপন নেটওয়ার্ক: অ্যাপে কোনো প্রকার অ্যাড নেটওয়ার্ক (Google AdMob ইত্যাদি) নেই।
• অ্যানালিটিক্স / ট্র্যাকার: কোনো প্রকার থার্ড-পার্টি অ্যানালিটিক্স SDK (Firebase Analytics ইত্যাদি) নেই।

৫. গুগল প্লে কনসোল ডাটা সেফটি (Data Safety)
• ডাটা কালেকশন: নেই (None)
• ডাটা শেয়ারিং: নেই (None)
• প্রসেসিং: সম্পূর্ণ লোকাল ডিভাইসে (Ephemeral local processing)
• ডাটা মুছে ফেলা: অ্যাপে যেকোনো সময় "ক্যাশ মুছুন" বোতাম চেপে সকল হিস্টোরি সাথে সাথে মুছে ফেলা যায়।

৬. যোগাযোগ
গোপনীয়তা নীতি সম্পর্কিত যেকোনো তথ্যের জন্য যোগাযোগ করুন:
হিমেল সিকদার
ইমেইল: himelsikder16@gmail.com`;

  const dataSafetyTextEn = `GOOGLE PLAY CONSOLE DATA SAFETY DECLARATION GUIDE
App Name: Img to Pdf Offline
Package Name: com.imgtopdf.offline

When filling out the Google Play Console "Data Safety" questionnaire, use the following exact responses:

1. Data Collection & Sharing
Q: Does your app collect or share any of the required user data types?
👉 Select: NO (Does not collect or share user data)

Q: Is all of the user data collected by your app encrypted in transit?
👉 Select: NOT APPLICABLE (No data is transmitted over the internet)

Q: Do you provide a way for users to request that their data is deleted?
👉 Select: NOT APPLICABLE (No user data is stored on remote servers; all data is ephemeral on the local device)

2. Handling Practices
• Ephemeral Processing: YES (All files reside only in memory during the active conversion session)
• Location Data: NO (Never accessed)
• Personal Information: NO (No names, emails, user IDs collected)
• Photos and Videos: Processed locally in memory upon user selection only; NEVER uploaded or shared
• Financial Information: NO
• Health & Fitness: NO
• App Activity / Analytics: NO (No analytics or diagnostic telemetry collected)`;

  const dataSafetyTextBn = `গুগল প্লে কনসোল ডাটা সেফটি (DATA SAFETY) ফরম পূরণের গাইড
অ্যাপের নাম: Img to Pdf Offline
প্যাকেজ আইডি: com.imgtopdf.offline

গুগল প্লে কনসোলে "Data Safety" ফরম পূরণের সময় নিচের উত্তরগুলো দিন:

১. ডাটা কালেকশন ও শেয়ারিং
প্রশ্ন: Does your app collect or share any of the required user data types?
👉 উত্তর দিন: NO (কোনো ডাটা কালেকশন বা শেয়ার হয় না)

প্রশ্ন: Is all of the user data collected by your app encrypted in transit?
👉 উত্তর দিন: NOT APPLICABLE (ইন্টারনেটে কোনো ডাটা ট্রান্সমিট করা হয় না)

প্রশ্ন: Do you provide a way for users to request that their data is deleted?
👉 উত্তর দিন: NOT APPLICABLE (সার্ভারে কোনো ডাটা থাকে না; ফোনের সাময়িক ক্যাশ যেকোনো সময় ইউজার নিজেই মুছতে পারেন)

২. নিরাপত্তা ও হ্যান্ডলিং
• লোকাল প্রসেসিং: YES (সব কনভার্সন লোকাল মেমোরিতে হয়)
• লোকেশন বা জিপিএস: NO
• ছবি বা ফাইল: ইউজার নিজে সিলেক্ট করলে কেবল কনভার্ট হয়, কোনো সার্ভারে যায় না
• অ্যানালিটিক্স বা ট্র্যাকিং: NO`;

  const permissionsTextEn = `GOOGLE PLAY PERMISSIONS TRANSPARENCY DECLARATION
App Name: Img to Pdf Offline

1. READ_MEDIA_IMAGES / READ_EXTERNAL_STORAGE
• Purpose: Allows users to pick photos from their gallery to convert into PDF documents or compress.
• Execution: Triggered exclusively upon user tap on "Choose Photos".
• Security: Files are loaded into local memory only; zero server transmission.

2. CAMERA
• Purpose: Allows users to capture physical documents using their device camera.
• Execution: Triggered exclusively upon user tap on "Camera Snap".
• Security: Snapped photo is immediately handed to the local image pipeline; no remote transmission.

3. WRITE_EXTERNAL_STORAGE / DOWNLOADS
• Purpose: Saves the finalized PDF document or extracted images into the device's public Downloads directory.
• Execution: Triggered when the user taps "Download PDF" or "Save Images".`;

  const permissionsTextBn = `গুগল প্লে পারমিশন ব্যবহারের বিবরণী (PERMISSIONS DECLARATION)
অ্যাপের নাম: Img to Pdf Offline

১. গ্যালারি ও ফটো এক্সেস (READ_MEDIA_IMAGES)
• উদ্দেশ্য: ইউজার যাতে ফোন থেকে ছবি সিলেক্ট করে PDF বানাতে বা কম্প্রেশন করতে পারেন।
• কার্যপ্রণালী: ইউজার নিজে যখন "গ্যালারি থেকে বেছে নিন" চাপেন কেবল তখনই ফাইল ওপেন হয়।

২. ক্যামেরা (CAMERA)
• উদ্দেশ্য: ইউজার যাতে সরাসরি কোনো কাগজ বা ডকুমেন্টের ছবি তুলে PDF বানাতে পারেন।
• কার্যপ্রণালী: "ক্যামেরা স্ন্যাপ" বোতাম চাপলেই কেবল ক্যামেরা খোলে। কোনো ছবি বাইরে পাঠানো হয় না।

৩. ডাউনলোড ও সেভ (DOWNLOADS)
• উদ্দেশ্য: তৈরিকৃত PDF ফাইলটি ইউজারের ফোনে সেভ করার জন্য।`;

  const termsTextEn = `TERMS OF SERVICE FOR IMG TO PDF
Effective Date: October 2026

1. LICENSE & USAGE
Img to Pdf is provided as a free, offline standalone utility for document creation, PDF conversions, and image compression.

2. 100% USER OWNERSHIP
You retain complete, exclusive copyright and ownership of all images, documents, texts, and digital signatures processed within this application. We claim zero ownership or rights over your files.

3. DISCLAIMER OF WARRANTIES
The software is provided "as is", without warranty of any kind, express or implied. All operations are carried out on your local device hardware.

4. CONTACT
Developer: Himel Sikder
Email: himelsikder16@gmail.com`;

  const termsTextBn = `ব্যবহারের শর্তাবলী (TERMS OF SERVICE) — IMG TO PDF
কার্যকর তারিখ: অক্টোবর ২০২৬

১. ব্যবহার লাইসেন্স
Img to Pdf সম্পূর্ণ বিনামূল্যে ব্যবহারের জন্য একটি অফলাইন ডকুমেন্ট ও ইমেজ কনভার্সন ইউটিলিটি।

২. ডকুমেন্টের পূর্ণ স্বত্বাধিকার (১০০% User Ownership)
আপনার কনভার্ট করা সকল ছবি, ডকুমেন্ট, স্বাক্ষর এবং PDF এর ১০০% স্বত্ব আপনার নিজের। আমরা আপনার কোনো ফাইলের ওপর কোনো অধিকার দাবি করি না।

৩. দায়মুক্তি (Disclaimer)
অ্যাপ্লিকেশনটি "যেমন আছে" সেভাবে কোনো ওয়ারেন্টি ছাড়াই প্রদান করা হয়েছে। সমস্ত কনভার্সন লোকাল ডিভাইসে সম্পন্ন হয়।

৪. যোগাযোগ
ডেভেলপার: হিমেল সিকদার
ইমেইল: himelsikder16@gmail.com`;

  const getCurrentText = (type: ModalType) => {
    if (type === 'privacy') return lang === 'bn' ? privacyTextBn : privacyTextEn;
    if (type === 'datasafety') return lang === 'bn' ? dataSafetyTextBn : dataSafetyTextEn;
    if (type === 'permissions') return lang === 'bn' ? permissionsTextBn : permissionsTextEn;
    if (type === 'terms') return lang === 'bn' ? termsTextBn : termsTextEn;
    return '';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16 animate-fadeIn">
      {/* Title */}
      <div className="px-1">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {lang === 'bn' ? 'সেটিংস' : 'Settings'}
        </h2>
        <p className="text-xs text-slate-500">
          {lang === 'bn' ? 'অ্যাপ প্রিফারেন্স ও আইনি নীতিমালা' : 'Preferences, policies & app details'}
        </p>
      </div>

      {/* Section 1: সাধারণ সেটিংস (Preferences) */}
      <div className="space-y-1.5">
        <span className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {lang === 'bn' ? 'সাধারণ সেটিংস' : 'General'}
        </span>
        <div className="rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/70 overflow-hidden">
          {/* Theme Row */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'bn' ? 'অ্যাপ থিম' : 'App Theme'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {darkMode
                    ? lang === 'bn' ? 'ডার্ক মোড সক্রিয়' : 'Dark mode enabled'
                    : lang === 'bn' ? 'লাইট মোড সক্রিয়' : 'Light mode enabled'}
                </p>
              </div>
            </div>
            <button
              onClick={onToggleTheme}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
            >
              {darkMode ? (lang === 'bn' ? 'লাইট করুন' : 'Light') : (lang === 'bn' ? 'ডার্ক করুন' : 'Dark')}
            </button>
          </div>

          {/* Language Row */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'bn' ? 'ভাষা' : 'Language'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {lang === 'bn' ? 'বাংলা (Bengali)' : 'English'}
                </p>
              </div>
            </div>
            <button
              onClick={onToggleLang}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
            >
              {lang === 'bn' ? 'English' : 'বাংলা'}
            </button>
          </div>

          {/* Clear Cache Row */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'bn' ? 'লোকাল হিস্টোরি ও ক্যাশ ক্লিয়ার' : 'Clear Cache & History'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'ডিভাইসে সংরক্ষিত সাময়িক কনভার্সন হিস্টোরি মুছে ফেলুন'
                    : 'Remove locally saved conversion history from phone'}
                </p>
              </div>
            </div>

            {showClearConfirm ? (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={handleClearCache}
                  disabled={clearingCache}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition active:scale-95"
                >
                  {clearingCache
                    ? (lang === 'bn' ? 'মুছে ফেলা হচ্ছে...' : 'Clearing...')
                    : (lang === 'bn' ? 'হ্যাঁ, মুছুন' : 'Yes, Clear')}
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={clearingCache}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 self-end sm:self-auto shrink-0 ${
                  cacheCleared
                    ? 'bg-emerald-600 text-white'
                    : 'bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/80 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/60'
                }`}
              >
                {cacheCleared ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'মুছে ফেলা হয়েছে' : 'Cleared'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'ক্যাশ মুছুন' : 'Clear Cache'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section: উন্নত PDF টুলস (Advanced PDF Utilities) */}
      <div className="space-y-1.5">
        <span className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {lang === 'bn' ? 'উন্নত PDF টুলস' : 'Advanced PDF Tools'}
        </span>
        <div className="rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/70 overflow-hidden">
          {/* 1. PDF পাসওয়ার্ড প্রটেকশন (Password Protect PDF) */}
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#151d30] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                  {lang === 'bn' ? 'PDF পাসওয়ার্ড প্রটেকশন' : 'Password Protect PDF'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'ব্যক্তিগত বা অফিসিয়াল নথিপত্রে AES-256 পাসওয়ার্ড লক সেট করুন'
                    : 'Lock documents with military-grade AES-256 encryption'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition shrink-0" />
          </button>

          {/* 2. ইন-অ্যাপ PDF ভিউয়ার ও ফুল-স্ক্রিন রিডার (Built-in PDF Viewer) */}
          <button
            onClick={() => {
              setViewerFile(null);
              setIsViewerModalOpen(true);
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#151d30] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {lang === 'bn' ? 'ইন-অ্যাপ PDF ভিউয়ার ও রিডার' : 'Built-in PDF Viewer & Reader'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'যেকোনো PDF ডকুমেন্ট ফুল-স্ক্রিনে পড়ুন ও জুম করে দেখুন'
                    : 'Read, zoom, and inspect any PDF offline in full-screen'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition shrink-0" />
          </button>

          {/* 3. PDF স্প্লিট / পৃষ্ঠা আলাদা করা (Split PDF) */}
          <button
            onClick={() => setIsSplitModalOpen(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#151d30] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                  {lang === 'bn' ? 'PDF স্প্লিট / পৃষ্ঠা আলাদা করা' : 'Split PDF Document'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'বড় PDF থেকে নির্দিষ্ট পৃষ্ঠা বা রেঞ্জ আলাদা ফাইলে ভাগ করুন'
                    : 'Extract page ranges or separate all pages into a ZIP'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition shrink-0" />
          </button>

          {/* 4. মার্জ পেজ রি-অর্ডার ও রোটেট (Drag-to-Reorder & Page Rotate) */}
          <button
            onClick={() => setIsReorderModalOpen(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#151d30] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <RotateCw className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                  {lang === 'bn' ? 'মার্জ পেজ রি-অর্ডার ও রোটেট' : 'Reorder & Rotate Pages'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'পাতার ক্রম ড্র্যাগ করে সাজান বা উল্টো পাতা সোজা করুন'
                    : 'Drag to reorder pages or rotate upside-down pages 90°/180°'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition shrink-0" />
          </button>
        </div>
      </div>

      {/* Section 2: আইনি ও নীতিমালা লিস্ট (Legal & Policies) */}
      <div className="space-y-1.5">
        <span className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {lang === 'bn' ? 'আইনি ও নীতিমালা' : 'Legal & Policies'}
        </span>
        <div className="rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/70 overflow-hidden">
          {/* Privacy Policy Item */}
          <button
            onClick={() => setActiveModal('privacy')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#151d30] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {lang === 'bn' ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? '১০০% অফলাইন ও জিরো ডাটা কালেকশন গ্যারান্টি'
                    : '100% on-device & zero data collection guarantee'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition shrink-0" />
          </button>

          {/* Data Safety Item */}
          <button
            onClick={() => setActiveModal('datasafety')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#151d30] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                  {lang === 'bn' ? 'ডাটা সেফটি (Data Safety Guide)' : 'Data Safety (Play Console Guide)'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'প্লে-স্টোর ফর্ম পূরণের জন্য নির্ধারিত ডাটা সেফটি গাইড'
                    : 'Exact Play Console questionnaire responses'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition shrink-0" />
          </button>

          {/* Permissions Transparency Item */}
          <button
            onClick={() => setActiveModal('permissions')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#151d30] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                  {lang === 'bn' ? 'পারমিশন ঘোষণা (Permissions Disclosure)' : 'Permissions Disclosure'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'ক্যামেরা, গ্যালারি ও স্টোরেজ পারমিশনের সুনির্দিষ্ট ব্যবহার'
                    : 'Clear camera & photo storage access declarations'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition shrink-0" />
          </button>

          {/* Terms of Service Item */}
          <button
            onClick={() => setActiveModal('terms')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#151d30] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                  {lang === 'bn' ? 'ব্যবহারের শর্তাবলী (Terms of Service)' : 'Terms of Service'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'ব্যবহারের নিয়ম ও ফাইল স্বত্বাধিকার তথ্য'
                    : 'Terms of use and document ownership info'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition shrink-0" />
          </button>
        </div>
      </div>

      {/* Clean Modal for Policy / Terms / Data Safety */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  {activeModal === 'privacy' && <ShieldCheck className="w-4 h-4" />}
                  {activeModal === 'datasafety' && <Lock className="w-4 h-4" />}
                  {activeModal === 'permissions' && <FileCheck className="w-4 h-4" />}
                  {activeModal === 'terms' && <FileText className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                  {activeModal === 'privacy' && (lang === 'bn' ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy')}
                  {activeModal === 'datasafety' && (lang === 'bn' ? 'ডাটা সেফটি (Data Safety Guide)' : 'Data Safety (Play Console Guide)')}
                  {activeModal === 'permissions' && (lang === 'bn' ? 'পারমিশন ঘোষণা (Permissions Disclosure)' : 'Permissions Disclosure')}
                  {activeModal === 'terms' && (lang === 'bn' ? 'ব্যবহারের শর্তাবলী (Terms of Service)' : 'Terms of Service')}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => copyText(getCurrentText(activeModal))}
                  className="p-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition"
                  title="Copy text"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold text-[11px]">{lang === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px]">{lang === 'bn' ? 'কপি' : 'Copy'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              {getCurrentText(activeModal)}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c121e] flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition active:scale-95 shadow-xs"
              >
                {lang === 'bn' ? 'ঠিক আছে / বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Advanced Tools Modals */}
      <PdfPasswordProtectModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        lang={lang}
        onOpenInViewer={(f) => {
          setViewerFile(f);
          setIsViewerModalOpen(true);
        }}
      />

      <PdfViewerModal
        isOpen={isViewerModalOpen}
        onClose={() => {
          setIsViewerModalOpen(false);
          setViewerFile(null);
        }}
        lang={lang}
        initialFile={viewerFile}
      />

      <PdfSplitModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        lang={lang}
      />

      <PdfReorderRotateModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        lang={lang}
      />
    </div>
  );
};

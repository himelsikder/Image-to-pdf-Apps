# Img to Pdf Offline 📄⚡

> **100% Offline, Ads-Free, Privacy-First Image & PDF Utility for Android & Web**  
> Developed & Published by **Himel Sikder** (`himelsikder16@gmail.com`)  
> Android Package ID: `com.imgtopdf.offline`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Privacy: 100% Offline](https://img.shields.io/badge/Privacy-100%25%20On--Device-success.svg)](./public/privacy.html)
[![Zero Ads](https://img.shields.io/badge/Ads-Zero%20Ads-brightgreen.svg)](#)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](#)
[![Framework](https://img.shields.io/badge/Framework-React%20%2B%20Vite%20%2B%20Tailwind-61dafb.svg)](#)
[![Capacitor](https://img.shields.io/badge/Mobile-Capacitor%20Android-1192d3.svg)](#)

---

## 🌟 Overview

**Img to Pdf Offline** is a high-performance, mobile-optimized document tool designed with a strict **Zero-Knowledge Architecture**. All image compression, PDF synthesis, PDF page extraction, page re-ordering, splitting, and password protection happen **locally on the user's device** inside WebAssembly and JavaScript sandboxes.

- 🔒 **Zero Data Collection:** No telemetry, no tracker SDKs, no cloud uploads.
- 📱 **Clean Mobile Experience:** Native status-bar safe padding, haptic feedback, dark mode, dual language (English & Bengali).
- 🚀 **Play Store Ready:** Pre-configured with Capacitor Android wrapper, valid App Icons, Splash Screens, Privacy Policy, and Data Safety documentation.

---

## 🔗 Official Play Store Legal & Web Links

| Item | Live Web Link | Alternative (GitHub Pages) |
|---|---|---|
| **Privacy Policy (বাধ্যতামূলক)** | [Live Privacy Policy](https://ais-pre-m5mupijs4prkf2srdl36be-825525924316.asia-southeast1.run.app/privacy.html) | `https://[username].github.io/[repo]/privacy.html` |
| **Terms of Service** | [Live Terms](https://ais-pre-m5mupijs4prkf2srdl36be-825525924316.asia-southeast1.run.app/terms.html) | `https://[username].github.io/[repo]/terms.html` |
| **App Support Email** | `himelsikder16@gmail.com` | `himelsikder16@gmail.com` |
| **App Support Website** | [DocMorph Live App](https://ais-pre-m5mupijs4prkf2srdl36be-825525924316.asia-southeast1.run.app) | `https://[username].github.io/[repo]` |

> 💡 **Tip:** Both `privacy.html` and `terms.html` are located directly in the `/public` folder of this repository, making them 100% ready for instant hosting with **GitHub Pages**!

---

## ✨ Features

1. **PDF to Image (Home Screen Feature):**
   - High-fidelity PDF rendering to JPG/PNG images at customizable DPI.
   - Batch extraction and instant zip download or gallery save notification.

2. **Image to PDF (Batch Conversion):**
   - Import multiple photos (JPG, PNG, WebP) from Camera or Gallery.
   - Adjust margins, orientation (Portrait/Landscape), and page compression (Original, Good, Compact).

3. **Reorder & Rotate Pages:**
   - Visual drag-and-drop page sorting.
   - 90°, 180°, and 270° orientation fixes for rotated scans.

4. **Split & Extract PDF:**
   - Split by page ranges (e.g., `1-3, 5`) or extract individual pages.

5. **Password Encryption & Protection:**
   - Encrypt documents using standard PDF encryption.

6. **History & Offline DB:**
   - Local IndexedDB storage for past conversions with one-click cache clearing.

---

## 🛡️ Open Source & Google Play Store Protection

This repository is **publicly open-sourced** under the [MIT License](./LICENSE) for developers to learn from, study, and reference in portfolios.

### ⚠️ Protection for Himel Sikder's Google Play Store App:
- **Package ID:** The package identifier `com.imgtopdf.offline` is exclusively registered for Himel Sikder. Google Play strictly prevents duplicate package ID submissions worldwide.
- **Trademark & Brand Protection:** As stated in the [LICENSE](./LICENSE), re-uploading the exact same app assets, logos, and developer name to Google Play or Apple App Store is prohibited under Google's Impersonation Policies.
- **Your Safety as the Original Developer:** You can safely keep this repo 100% public without risking your Play Store app status.

---

## 🛠️ Local Development & Build

### 1. Prerequisites
- Node.js (v18+)
- Android Studio (for generating `.aab` / `.apk` release bundle)

### 2. Install & Run Web
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

### 3. Build & Sync with Android
```bash
# Build the production web bundle
npm run build

# Sync assets to Capacitor Android project
npx cap sync android

# Open project in Android Studio
npx cap open android
```

### 4. Build Release Bundle in Android Studio
1. In Android Studio, go to **Build > Generate Signed Bundle / APK**.
2. Select **Android App Bundle (.aab)**.
3. Choose your Keystore file and enter your password.
4. Select `release` build variant and click **Finish**.
5. Upload the resulting `.aab` file to **Google Play Console**.

---

## 📄 Google Play Console Submission Checklist

- [x] App Name: `Img to Pdf Offline - Converter` (or `Img to Pdf Offline`)
- [x] Short Description: `100% offline Image to PDF and PDF to Image converter. Fast, secure & zero ads.`
- [x] Privacy Policy URL provided (pointing to `privacy.html`)
- [x] Data Safety Questionnaire: Zero user data collected, zero user data shared.
- [x] Target Audience: Everyone (13+) or General Public.
- [x] Contact Email: `himelsikder16@gmail.com`

---

## 👨‍💻 Author & Contact

**Himel Sikder**  
- Email: [himelsikder16@gmail.com](mailto:himelsikder16@gmail.com)  
- Project Repository: Public on GitHub  

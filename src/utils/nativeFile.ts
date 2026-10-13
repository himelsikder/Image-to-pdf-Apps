import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { showToast } from '../components/Toast';

/**
 * Convert a Blob into a base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface SaveFileOptions {
  lang?: 'bn' | 'en';
  customTitle?: string;
  customDescription?: string;
  silent?: boolean;
}

/**
 * Save or download a file seamlessly across Web and Capacitor Android Native.
 * Strictly saves the file WITHOUT opening any share popup!
 * Displays a friendly success toast specifying gallery/file destination.
 */
export async function saveOrDownloadFile(
  blob: Blob,
  fileName: string,
  options?: SaveFileOptions
): Promise<boolean> {
  let success = false;

  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = await blobToBase64(blob);
      await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });
      success = true;
    } catch (err) {
      console.warn('Capacitor native file write failed, falling back to browser download:', err);
    }
  }

  // Standard web download fallback
  if (!success) {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      success = true;
    } catch (err) {
      console.error('Failed to download file:', err);
      success = false;
    }
  }

  // Show clear success feedback toast without opening any share popup
  if (success && !options?.silent) {
    const activeLang =
      options?.lang ||
      (typeof localStorage !== 'undefined'
        ? (localStorage.getItem('img_to_pdf_lang') as 'bn' | 'en') || 'bn'
        : 'bn');

    const lower = fileName.toLowerCase();
    const isImage =
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.webp');
    const isPdf = lower.endsWith('.pdf');
    const isZip = lower.endsWith('.zip');

    let title = options?.customTitle;
    let description = options?.customDescription;

    if (!title) {
      if (activeLang === 'bn') {
        if (isImage) {
          title = 'ছবিটি সফলভাবে সেভ হয়েছে!';
          description = `আপনার ডিভাইসের গ্যালারি / ফাইল ফোল্ডারে সংরক্ষিত হয়েছে (${fileName})`;
        } else if (isPdf) {
          title = 'PDF ফাইলটি সফলভাবে সেভ হয়েছে!';
          description = `আপনার ডিভাইসের ফাইল / ডাউনলোড ফোল্ডারে সংরক্ষিত হয়েছে (${fileName})`;
        } else if (isZip) {
          title = 'ফাইলটি সফলভাবে ডাউনলোড হয়েছে!';
          description = `আপনার ডিভাইসের ডাউনলোড ফোল্ডারে সংরক্ষিত হয়েছে (${fileName})`;
        } else {
          title = 'ফাইলটি সফলভাবে সেভ হয়েছে!';
          description = `আপনার ডিভাইসে সংরক্ষিত হয়েছে (${fileName})`;
        }
      } else {
        if (isImage) {
          title = 'Image Saved Successfully!';
          description = `Saved to your device gallery / files (${fileName})`;
        } else if (isPdf) {
          title = 'PDF Saved Successfully!';
          description = `Saved to your device downloads / files (${fileName})`;
        } else if (isZip) {
          title = 'Archive Downloaded Successfully!';
          description = `Saved to your device storage (${fileName})`;
        } else {
          title = 'File Saved Successfully!';
          description = `Saved to your device storage (${fileName})`;
        }
      }
    }

    showToast({
      type: 'success',
      title,
      description,
      duration: 4000,
    });
  }

  return success;
}

/**
 * Native file share sheet across Web and Capacitor Android Native
 */
export async function shareFileNative(blob: Blob, fileName: string, title?: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = await blobToBase64(blob);
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });
      await Share.share({
        title: title || fileName,
        text: 'Shared from Img to Pdf Offline',
        url: result.uri,
        dialogTitle: 'Share Document',
      });
      return true;
    } catch (err) {
      console.warn('Native share failed:', err);
    }
  }

  // Web share
  try {
    const file = new File([blob], fileName, { type: blob.type || 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: title || fileName,
        text: 'Created with Img to Pdf (100% Offline & Ads-Free)',
      });
      return true;
    } else {
      return saveOrDownloadFile(blob, fileName);
    }
  } catch (err) {
    console.warn('Web share cancelled or unsupported:', err);
    return false;
  }
}

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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

/**
 * Save or download a file seamlessly across Web and Capacitor Android Native
 */
export async function saveOrDownloadFile(blob: Blob, fileName: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = await blobToBase64(blob);
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });

      // On Android, also offer native share/save dialogue for instant user access
      try {
        await Share.share({
          title: fileName,
          text: fileName,
          url: result.uri,
          dialogTitle: 'Save or Open Document',
        });
      } catch {
        // User dismissed share dialog
      }
      return true;
    } catch (err) {
      console.warn('Capacitor native file write failed, falling back to browser download:', err);
    }
  }

  // Standard web download
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return true;
  } catch (err) {
    console.error('Failed to download file:', err);
    return false;
  }
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

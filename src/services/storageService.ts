import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

export interface UploadedFileResult {
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  storagePath: string;
  downloadUrl: string;
  uploadedAt: string;
}

const ALLOWED_DIGITAL_EXTENSIONS = ['.pdf', '.epub', '.zip', '.doc', '.docx', '.mp4', '.mp3', '.xlsx', '.json', '.txt'];
const MAX_DIGITAL_FILE_SIZE = 150 * 1024 * 1024; // 150 MB

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Validates and uploads digital file assets (ebooks, guides, documents, code templates) to Firebase Storage.
 */
export async function uploadDigitalProductAsset(
  file: File,
  productId: string,
  onProgress?: UploadProgressCallback
): Promise<UploadedFileResult> {
  if (!file) {
    throw new Error('Please select a file to upload.');
  }

  // 1. File size check
  if (file.size > MAX_DIGITAL_FILE_SIZE) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 150MB.`);
  }

  // 2. Extension check
  const originalName = file.name || 'document.pdf';
  const lastDot = originalName.lastIndexOf('.');
  const ext = lastDot !== -1 ? originalName.slice(lastDot).toLowerCase() : '';

  if (!ALLOWED_DIGITAL_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported file type (${ext || 'unknown'}). Allowed formats: PDF, EPUB, ZIP, DOCX, MP3, MP4.`);
  }

  const cleanFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeId = (productId || `dp-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const storagePath = `protected/digital-products/${safeId}/${Date.now()}_${cleanFileName}`;

  const storageRef = ref(storage, storagePath);
  const metadata = {
    contentType: file.type || 'application/octet-stream',
    customMetadata: {
      originalName,
      productId: safeId,
      uploadedAt: new Date().toISOString(),
    },
  };

  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise<UploadedFileResult>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0 && onProgress) {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(percent);
        }
      },
      (error) => {
        console.error('Firebase Storage Upload Failure:', error);
        reject(new Error(`File upload failed: ${error.message || 'Storage error'}`));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const fileType = ext.replace('.', '') || 'pdf';
          resolve({
            fileName: originalName,
            fileSize: file.size,
            fileType,
            mimeType: file.type || 'application/octet-stream',
            storagePath,
            downloadUrl,
            uploadedAt: new Date().toISOString(),
          });
        } catch (err: unknown) {
          reject(new Error(`Failed to retrieve download URL: ${err instanceof Error ? err.message : 'Unknown error'}`));
        }
      }
    );
  });
}

/**
 * Validates and uploads product images to Firebase Storage.
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  onProgress?: UploadProgressCallback
): Promise<{ downloadUrl: string; storagePath: string }> {
  if (!file) {
    throw new Error('Please select an image to upload.');
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    throw new Error(`Image size exceeds 10MB limit.`);
  }

  const originalName = file.name || 'product.jpg';
  const ext = originalName.slice(originalName.lastIndexOf('.')).toLowerCase();

  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    throw new Error('Please provide an image in JPG, PNG, WEBP, GIF, or SVG format.');
  }

  const safeId = (productId || `prod-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const storagePath = `public/products/${safeId}/${Date.now()}_${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  const storageRef = ref(storage, storagePath);
  const metadata = {
    contentType: file.type || 'image/jpeg',
  };

  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise<{ downloadUrl: string; storagePath: string }>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0 && onProgress) {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(percent);
        }
      },
      (error) => {
        console.error('Image Storage Upload Error:', error);
        reject(new Error(`Image upload failed: ${error.message}`));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadUrl, storagePath });
        } catch (err: unknown) {
          reject(new Error(`Failed to obtain image URL: ${err instanceof Error ? err.message : 'Unknown error'}`));
        }
      }
    );
  });
}

/**
 * Safely deletes a file from Firebase Storage.
 */
export async function deleteStorageFile(storagePath: string): Promise<boolean> {
  if (!storagePath) return false;
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
    return true;
  } catch (err) {
    console.warn('Firebase Storage deletion note:', err);
    return false;
  }
}

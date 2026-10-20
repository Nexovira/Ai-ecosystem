/**
 * Authoritative Image and Media URL Validator for NEXOVIRA
 * Validates HTTPS formats, rejects malicious/unsafe schemes,
 * and handles external image hostings including Cloudinary.
 */

export const MAX_PRODUCT_IMAGES = 8;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  isCloudinary?: boolean;
}

/**
 * Validates an image URL for marketplace catalog submission.
 */
export function validateProductImageUrl(url: string): ValidationResult {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'URL cannot be empty' };
  }

  const trimmed = url.trim();

  // Allow trusted internal local assets
  if (trimmed.startsWith('/assets/')) {
    return { isValid: true };
  }

  // Reject malicious schemes immediately
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:')
  ) {
    return {
      isValid: false,
      error: 'Unsafe URL scheme detected. Only secure HTTPS URLs are permitted.',
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return {
        isValid: false,
        error: 'Only HTTP/HTTPS protocols are permitted for remote images.',
      };
    }

    const hostname = parsed.hostname.toLowerCase();
    const isCloudinary = hostname.includes('cloudinary.com') || hostname.includes('res.cloudinary.com');

    return {
      isValid: true,
      isCloudinary,
    };
  } catch {
    return {
      isValid: false,
      error: 'Malformed URL format. Please provide a valid web address starting with https://',
    };
  }
}

/**
 * Validates a digital deliverable URL (e.g. Google Drive, Cloudinary Raw, Dropbox, HTTPS PDF/EPUB)
 */
export function validateDeliverableUrl(url: string): ValidationResult {
  if (!url || !url.trim()) {
    return { isValid: true }; // optional if internal generation is used
  }

  const trimmed = url.trim();

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return {
      isValid: false,
      error: 'Unsafe URL scheme detected. Only secure HTTPS links are allowed.',
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'Digital deliverable files must use secure HTTPS links.',
      };
    }
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'Malformed URL format. Please paste a valid web address.',
    };
  }
}

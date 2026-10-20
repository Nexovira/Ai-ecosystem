/**
 * Robust Clipboard, Share, and Canonical Referral URL Utilities
 * Handles iframe restrictions, clipboard permissions, fallback textarea copying,
 * native device sharing, and canonical absolute URL generation.
 */

export interface CopyResult {
  success: boolean;
  methodUsed: 'clipboard-api' | 'execCommand' | 'manual';
  error?: string;
}

/**
 * Copies a link to clipboard with multi-tiered fallback:
 * 1. navigator.clipboard.writeText
 * 2. Invisible textarea with document.execCommand('copy')
 * 3. Graceful failure reporting so UI can present a manual select/copy dialog
 */
export async function copyTextToClipboard(text: string): Promise<CopyResult> {
  const cleanText = text.trim();
  if (!cleanText) {
    return { success: false, methodUsed: 'manual', error: 'No text provided to copy.' };
  }

  // Tier 1: Modern Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(cleanText);
      return { success: true, methodUsed: 'clipboard-api' };
    } catch {
      // Proceed to Tier 2 fallback
    }
  }

  // Tier 2: Fallback textarea execCommand
  if (typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = cleanText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999);

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        return { success: true, methodUsed: 'execCommand' };
      }
    } catch (execErr) {
      console.warn('execCommand copy fallback failed:', execErr);
    }
  }

  // Tier 3: Manual selection required
  return {
    success: false,
    methodUsed: 'manual',
    error: 'Clipboard access was blocked by your browser environment. Please highlight and copy the link manually.',
  };
}

/**
 * Shares via device native share sheet if supported
 */
export async function shareLinkNatively(params: {
  title: string;
  text?: string;
  url: string;
}): Promise<{ shared: boolean; supported: boolean; error?: string }> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: params.title,
        text: params.text || params.title,
        url: params.url,
      });
      return { shared: true, supported: true };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User closed the share sheet
        return { shared: false, supported: true };
      }
      return { shared: false, supported: true, error: (err as Error).message };
    }
  }
  return { shared: false, supported: false };
}

/**
 * Generates canonical absolute public URLs for products and referral links
 */
export function getCanonicalDomain(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return 'https://nexovira.com';
}

export function buildPublicProductUrl(targetSlug: string, isAcademy: boolean = false): string {
  const base = getCanonicalDomain();
  const path = isAcademy ? `/academy/courses/${targetSlug}` : `/marketplace/product/${targetSlug}`;
  return `${base}${path}`;
}

export function buildReferralUrl(targetSlug: string, affiliateCode: string, isAcademy: boolean = false): string {
  const publicUrl = buildPublicProductUrl(targetSlug, isAcademy);
  return `${publicUrl}?ref=${encodeURIComponent(affiliateCode.toUpperCase().trim())}`;
}

export function buildShortReferralUrl(targetSlug: string, affiliateCode: string): string {
  const base = getCanonicalDomain();
  return `${base}/r/${encodeURIComponent(affiliateCode.toUpperCase().trim())}/${targetSlug}`;
}

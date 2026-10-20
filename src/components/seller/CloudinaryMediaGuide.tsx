import React, { useState } from 'react';
import {
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Image as ImageIcon,
  BookOpen,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CloudinaryMediaGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultExpanded?: boolean;
}

export const CloudinaryMediaGuide: React.FC<CloudinaryMediaGuideProps> = ({
  isOpen = true,
  onClose,
  defaultExpanded = true,
}) => {
  const [copiedExample, setCopiedExample] = useState(false);
  const [activeTab, setActiveTab] = useState<'images' | 'ebooks'>('images');
  const [troubleshootingOpen, setTroubleshootingOpen] = useState(true);

  const exampleImageUrl = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/YOUR_IMAGE_PATH';
  const exampleDriveUrl = 'https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing';

  const handleCopyExample = (text: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedExample(true);
      setTimeout(() => setCopiedExample(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-[#011B33] border border-[#0682F4]/30 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6 text-[#CCD2D9]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-[#0682F4]/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#0682F4]/10 border border-[#0682F4]/30 text-[#08E6F9]">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-base sm:text-lg text-white">
              How to Upload Product Images and Get Image URLs
            </h2>
            <p className="text-xs text-[#CCD2D9]/80 mt-0.5">
              Official merchant guide for hosting external image and digital ebook assets via Cloudinary or Google Drive.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#CCD2D9]/70 hover:text-white hover:bg-[#01213D] transition cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Media Type Switcher */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('images')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'images'
              ? 'bg-[#0682F4] text-white shadow-md'
              : 'bg-[#01213D] text-[#CCD2D9] hover:text-white border border-[#0682F4]/20'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Product Images (Cloudinary)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ebooks')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'ebooks'
              ? 'bg-[#0682F4] text-white shadow-md'
              : 'bg-[#01213D] text-[#CCD2D9] hover:text-white border border-[#0682F4]/20'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Digital Ebooks &amp; PDFs</span>
        </button>
      </div>

      {/* TAB 1: PRODUCT IMAGES ON CLOUDINARY */}
      {activeTab === 'images' && (
        <div className="space-y-6 text-xs leading-relaxed">
          {/* Step by Step instructions */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#0682F4]/30 text-[#08E6F9] inline-flex items-center justify-center text-[11px] font-mono">
                1-9
              </span>
              <span>Step-by-Step Instructions</span>
            </h3>

            <ol className="list-decimal list-outside ml-4 space-y-2.5 text-[#CCD2D9]">
              <li>
                Visit{' '}
                <a
                  href="https://cloudinary.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#08E6F9] hover:underline font-semibold inline-flex items-center gap-1"
                >
                  https://cloudinary.com/
                  <ExternalLink className="w-3 h-3 inline" />
                </a>{' '}
                and create a free account or sign in.
              </li>
              <li>Open the <strong>Cloudinary Media Library</strong> from your Cloudinary console.</li>
              <li>Upload the product image from your computer or mobile device.</li>
              <li>Select the uploaded image in your media library.</li>
              <li>
                Find and copy its secure <strong>HTTPS delivery URL</strong>. Depending on the Cloudinary interface, this may be labelled as the <em>Secure URL</em>, <em>Direct Link</em>, or appear in the asset details panel.
              </li>
              <li>Return to the <strong>NEXOVIRA seller dashboard</strong>.</li>
              <li>Paste the URL into the <strong>Primary Product Image URL</strong> field.</li>
              <li>Click <strong>Add Another Image</strong> to include up to 8 gallery views per product.</li>
              <li>Preview the images, choose the primary image, arrange the order using the controls, and save your product.</li>
            </ol>
          </div>

          {/* Example URL format */}
          <div className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/30 space-y-2">
            <span className="text-[11px] font-mono text-[#08E6F9] uppercase font-bold block">
              Example URL Format (Illustrative Placeholder)
            </span>
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#011629] border border-[#0682F4]/20 font-mono text-xs text-white overflow-x-auto">
              <span className="truncate">{exampleImageUrl}</span>
              <button
                type="button"
                onClick={() => handleCopyExample(exampleImageUrl)}
                className="shrink-0 p-1.5 rounded hover:bg-[#01213D] text-[#08E6F9] transition cursor-pointer"
                title="Copy example pattern"
              >
                {copiedExample ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-[#CCD2D9]/70">
              <strong>Note:</strong> You must replace <code className="text-[#08E6F9]">YOUR_CLOUD_NAME</code> and <code className="text-[#08E6F9]">YOUR_IMAGE_PATH</code> with your actual Cloudinary asset URL. Do not use this example string directly.
            </p>
          </div>

          {/* Troubleshooting Section */}
          <div className="border border-[#0682F4]/20 rounded-xl overflow-hidden bg-[#01213D]/50">
            <button
              type="button"
              onClick={() => setTroubleshootingOpen(!troubleshootingOpen)}
              className="w-full p-3.5 text-left flex items-center justify-between font-bold text-white hover:bg-[#01213D] transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#08E6F9]" />
                <span>Common Troubleshooting</span>
              </span>
              {troubleshootingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {troubleshootingOpen && (
              <div className="p-4 pt-1 border-t border-[#0682F4]/20 space-y-3 text-xs">
                <div>
                  <h4 className="font-semibold text-white">URL does not load or displays an error:</h4>
                  <p className="text-[#CCD2D9]/80 mt-0.5">
                    Ensure the URL starts with <code className="text-[#08E6F9]">https://</code> and is accessible in a private/incognito browser window without requiring you to log in to Cloudinary.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Image is private or inaccessible:</h4>
                  <p className="text-[#CCD2D9]/80 mt-0.5">
                    In Cloudinary, verify the asset's access control mode is set to <strong>Public</strong> or <em>upload</em> (not authenticated or private).
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Copying the wrong URL:</h4>
                  <p className="text-[#CCD2D9]/80 mt-0.5">
                    Make sure you copied the image delivery URL (ending with your asset name or extension), not the Cloudinary management console URL (e.g. <code>cloudinary.com/console/...</code>).
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Image is too large or unsuitable:</h4>
                  <p className="text-[#CCD2D9]/80 mt-0.5">
                    Cloudinary allows on-the-fly transformations. You can add <code className="text-[#08E6F9]">/w_1200,c_limit,q_auto,f_auto/</code> in the URL path to optimize speed and quality automatically.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Deleted or replaced Cloudinary asset:</h4>
                  <p className="text-[#CCD2D9]/80 mt-0.5">
                    If you delete or overwrite an asset on Cloudinary, update the product image URL in your NEXOVIRA seller dashboard to ensure customers always see the latest photo.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Important Security Rules */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Important Cloudinary Security Rules</span>
            </div>
            <ul className="list-disc list-outside ml-4 space-y-1 text-[11px] text-[#CCD2D9]">
              <li>
                <strong>Never enter your Cloudinary API Secret:</strong> NEXOVIRA only needs the public HTTPS image delivery URL. Never paste API keys, secrets, or account credentials.
              </li>
              <li>
                <strong>Authorized Assets Only:</strong> Sellers must only submit product photos and assets they own or are legally authorized to publish.
              </li>
              <li>
                <strong>Public Accessibility:</strong> Product images displayed publicly must use a URL accessible to anyone without requiring seller login credentials.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 2: DIGITAL EBOOKS & PDF FILES */}
      {activeTab === 'ebooks' && (
        <div className="space-y-6 text-xs leading-relaxed">
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#08E6F9]" />
              <span>Hosting Ebooks &amp; Downloadable Digital Files</span>
            </h3>
            <p className="text-[#CCD2D9]">
              Authors, creators, and digital sellers can host their ebook PDFs, EPUBs, blueprints, and templates on <strong>Google Drive</strong>, <strong>Dropbox</strong>, or <strong>Cloudinary Raw</strong>.
            </p>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-1.5">
                <h4 className="font-bold text-white text-xs">Option A: Google Drive (Recommended for large PDFs &amp; Ebooks)</h4>
                <ol className="list-decimal list-outside ml-4 space-y-1 text-[#CCD2D9]">
                  <li>Upload your ebook PDF or EPUB to your Google Drive account.</li>
                  <li>Right-click the file and click <strong>Share</strong> &rarr; <strong>Copy link</strong>.</li>
                  <li>Set General Access to <strong>"Anyone with the link can view"</strong>.</li>
                  <li>Paste the shareable link into the <strong>Deliverable File URL</strong> field in NEXOVIRA.</li>
                </ol>
              </div>

              <div className="p-3.5 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-1.5">
                <h4 className="font-bold text-white text-xs">Option B: Cloudinary Raw Assets</h4>
                <ol className="list-decimal list-outside ml-4 space-y-1 text-[#CCD2D9]">
                  <li>In Cloudinary Media Library, upload your document with resource type set to <em>Raw</em>.</li>
                  <li>Copy the secure delivery URL.</li>
                  <li>Paste into the <strong>Deliverable File URL</strong> field.</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#01213D] border border-[#0682F4]/30 space-y-2">
            <span className="text-[11px] font-mono text-[#08E6F9] uppercase font-bold block">
              Example Google Drive Shareable Link
            </span>
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#011629] border border-[#0682F4]/20 font-mono text-xs text-white overflow-x-auto">
              <span className="truncate">{exampleDriveUrl}</span>
              <button
                type="button"
                onClick={() => handleCopyExample(exampleDriveUrl)}
                className="shrink-0 p-1.5 rounded hover:bg-[#01213D] text-[#08E6F9] transition cursor-pointer"
                title="Copy example pattern"
              >
                {copiedExample ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

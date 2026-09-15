import React, { useState } from 'react';
import {
  Smartphone,
  Package,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  X,
  Shield,
  Terminal,
  Download,
  Globe,
  QrCode,
  Sparkles,
  Share2,
  FileDown,
  AlertTriangle,
  Rocket,
  Info
} from 'lucide-react';

interface PlayStoreGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayStoreGuideModal: React.FC<PlayStoreGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'deploy' | 'apk' | 'pwa' | 'playstore'>('deploy');
  
  // Allow user to test with the current preview URL or input their deployed public URL
  const [customPublicUrl, setCustomPublicUrl] = useState('');

  if (!isOpen) return null;

  const defaultStagingUrl = window.location.origin;
  const activeUrl = customPublicUrl.trim() || defaultStagingUrl;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(activeUrl)}`;
  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(activeUrl)}`;

  const copyToClipboard = (text: string, type: 'url' | 'cmd', id?: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } else if (id) {
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2500);
    }
  };

  const bubblewrapCmd = `npm install -g @bubblewrap/cli
bubblewrap init --manifest=${activeUrl}/manifest.webmanifest
bubblewrap build`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Hosting &amp; Android APK Guide
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wide border border-emerald-500/30">
                  Ready to Deploy
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Wing-C Lakeview Apartment • Step-by-Step Hosting &amp; APK Testing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Access Notice: Explains why staging preview needs Deploy */}
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Why did external APK tools or mobile links show an access error?</span>
          </div>
          <p className="text-slate-300 leading-relaxed pl-6">
            The temporary development URL (<code>*.run.app</code>) is protected by Google AI Studio security and only accessible to your authenticated session. Third-party bots (like PWABuilder) and outside mobile devices cannot bypass Google's login wall until you click <strong>Deploy</strong> in AI Studio.
          </p>
        </div>

        {/* Nav Tabs */}
        <div className="flex border-b border-slate-800 mb-4 gap-2 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('deploy')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'deploy'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>1. Host Online (Deploy)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'apk'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>2. Generate .APK File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'pwa'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>3. Instant Phone Test</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('playstore')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'playstore'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Google Play Store</span>
          </button>
        </div>

        {/* Tab 1: How to Host & Deploy */}
        {activeTab === 'deploy' && (
          <div className="space-y-4 text-xs">
            {/* Free Hosting Highlight */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-emerald-400" />
                  <span>100% Free Hosting Options (No Billing / No Credit Card)</span>
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                  ₹0 Cost Forever
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Because this application stores its ledger in browser storage and runs entirely in modern React/Vite, it requires <strong>zero database servers and zero paid infrastructure</strong>. You can host it 100% free without adding any billing card:
              </p>

              <div className="space-y-3 pt-1">
                {/* Method 1: AI Studio Share */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-emerald-300 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5" /> Option 1: AI Studio "Share" Button (Easiest)
                    </strong>
                    <span className="text-[10px] text-slate-400">Instant</span>
                  </div>
                  <p className="text-slate-300">
                    Instead of "Publish" (which asks for Cloud Run billing), click the <strong>"Share"</strong> button located in the top-right toolbar or Settings menu. It creates a shared web link that anyone can open without setting up billing!
                  </p>
                </div>

                {/* Method 2: Netlify Drop */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-emerald-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Option 2: Netlify Drop (Fastest Drag-and-Drop)
                    </strong>
                    <span className="text-[10px] text-emerald-400 font-mono">100% Free Forever</span>
                  </div>
                  <ol className="list-decimal list-inside text-slate-300 space-y-1 pl-0.5 mt-1">
                    <li>In AI Studio, click the top-right menu (three dots <strong>⋮</strong>) &gt; select <strong>Export as ZIP</strong>.</li>
                    <li>Unzip the downloaded file on your computer.</li>
                    <li>Open <a href="https://app.netlify.com/drop" target="_blank" rel="noreferrer" className="text-sky-400 underline font-semibold">app.netlify.com/drop</a> in your browser.</li>
                    <li>Drag and drop the folder into Netlify — you will instantly get a permanent free live URL (e.g. <code>wing-c-lakeview.netlify.app</code>) with zero credit card or billing!</li>
                  </ol>
                </div>

                {/* Method 3: Vercel */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-emerald-300 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" /> Option 3: Vercel / GitHub Pages
                    </strong>
                    <span className="text-[10px] text-slate-400">Free Hobby Tier</span>
                  </div>
                  <p className="text-slate-300">
                    In AI Studio, click <strong>⋮</strong> &gt; <strong>Export to GitHub</strong>. In <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-sky-400 underline font-semibold">Vercel.com</a>, log in with GitHub and click "Import" &gt; "Deploy". It deploys automatically for free forever.
                  </p>
                </div>
              </div>
            </div>

            {/* Test in New Tab right now */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">Test right now on your computer</p>
                <p className="text-[11px] text-slate-400">Open in a separate browser tab to test full-screen without the editor framing.</p>
              </div>
              <a
                href={defaultStagingUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Tab 2: Download APK */}
        {activeTab === 'apk' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-800/80 border border-emerald-500/40 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Generating the APK File</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                PWABuilder is Microsoft's open-source tool that converts modern web applications into signed Android <code>.apk</code> and <code>.aab</code> packages.
              </p>

              {/* Public URL Input for PWABuilder */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
                <label className="block text-slate-300 font-medium">
                  Enter your Deployed Public URL (or keep staging link to test):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customPublicUrl}
                    onChange={(e) => setCustomPublicUrl(e.target.value)}
                    placeholder={defaultStagingUrl}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                  {customPublicUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomPublicUrl('')}
                      className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-300"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Target: <span className="font-mono text-emerald-400">{activeUrl}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-1.5">
                <span className="font-semibold text-white block">Steps to download:</span>
                <ol className="list-decimal list-inside text-slate-300 space-y-1 pl-1 leading-relaxed">
                  <li>Deploy the app to get a public URL, then paste it above (or use directly).</li>
                  <li>Click the button below to launch PWABuilder.</li>
                  <li>Click <strong>"Package for Android"</strong> &gt; Choose <strong>"Testing APK"</strong>.</li>
                  <li>Save the <code>.apk</code> file to your phone and tap to test!</li>
                </ol>
              </div>

              <div className="pt-1">
                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Open PWABuilder with Active URL</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Offline CLI Option */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" /> CLI Option: Bubblewrap (Official Google TWA)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bubblewrapCmd, 'cmd', 'bubblewrap')}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                >
                  {copiedCmd === 'bubblewrap' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === 'bubblewrap' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                {bubblewrapCmd}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Phone Test */}
        {activeTab === 'pwa' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row items-center gap-5">
              <div className="bg-white p-2.5 rounded-2xl shadow-lg shrink-0">
                <img
                  src={qrCodeUrl}
                  alt="Scan QR Code"
                  className="w-32 h-32"
                />
                <p className="text-[9px] font-bold text-center text-slate-800 mt-1 uppercase tracking-wider">
                  Scan With Phone Camera
                </p>
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Direct Smartphone Testing</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Once your app is deployed publicly, scanning this QR code in Google Chrome on Android allows 1-tap installation directly to your phone's home screen with full offline caching and native app drawer integration!
                </p>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <p>1. Deploy the app from the top-right menu in AI Studio.</p>
                  <p>2. Scan this QR code using your phone camera.</p>
                  <p>3. Tap <strong>"Install App"</strong> in Chrome to install it onto your Android device.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Google Play Store */}
        {activeTab === 'playstore' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2.5">
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Google Play Console Submission</span>
              </h4>
              <p className="text-slate-300 leading-relaxed">
                When you are ready to publish on the official Google Play Store:
              </p>
              <ol className="list-decimal list-inside text-slate-300 space-y-2 pl-1 leading-relaxed">
                <li>
                  <strong>Developer Account:</strong> Sign in to <a href="https://play.google.com/console" target="_blank" rel="noreferrer" className="text-sky-400 underline">play.google.com/console</a> (one-time fee ~₹2,100 INR).
                </li>
                <li>
                  <strong>Create App:</strong> App name: <em>Wing-C Lakeview Apartment</em>, Category: Finance / Productivity.
                </li>
                <li>
                  <strong>Graphics:</strong> Upload the 512x512 icon (included in <code>public/pwa-512x512.png</code>).
                </li>
                <li>
                  <strong>Upload AAB:</strong> In PWABuilder or Bubblewrap, choose <strong>"Google Play .AAB"</strong> and upload the signed bundle.
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Current version: <strong className="text-emerald-400">v1.0.0 (Production Ready)</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

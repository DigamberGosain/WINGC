import React, { useState } from 'react';
import { X, Download, FileArchive, Smartphone, CheckCircle, ExternalLink, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { downloadFileAsBlob } from '../utils/fileDownloader';

interface DownloadProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadProjectModal: React.FC<DownloadProjectModalProps> = ({ isOpen, onClose }) => {
  const [downloadingFull, setDownloadingFull] = useState(false);
  const [downloadingAndroid, setDownloadingAndroid] = useState(false);
  const [fullSuccess, setFullSuccess] = useState(false);
  const [androidSuccess, setAndroidSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const fullZipUrl = `${currentOrigin}/wing-c-lakeview-complete-project.zip`;
  const androidZipUrl = `${currentOrigin}/wing-c-lakeview-android-studio.zip`;

  const handleDownloadFull = async () => {
    setDownloadingFull(true);
    setErrorMessage(null);
    setFullSuccess(false);

    const success = await downloadFileAsBlob(
      '/wing-c-lakeview-complete-project.zip',
      'wing-c-lakeview-complete-project.zip',
      (status, msg) => {
        if (status === 'error') {
          setErrorMessage(msg || 'Failed to download archive');
        }
      }
    );

    setDownloadingFull(false);
    if (success) {
      setFullSuccess(true);
      setTimeout(() => setFullSuccess(false), 5000);
    }
  };

  const handleDownloadAndroid = async () => {
    setDownloadingAndroid(true);
    setErrorMessage(null);
    setAndroidSuccess(false);

    const success = await downloadFileAsBlob(
      '/wing-c-lakeview-android-studio.zip',
      'wing-c-lakeview-android-studio.zip',
      (status, msg) => {
        if (status === 'error') {
          setErrorMessage(msg || 'Failed to download archive');
        }
      }
    );

    setDownloadingAndroid(false);
    if (success) {
      setAndroidSuccess(true);
      setTimeout(() => setAndroidSuccess(false), 5000);
    }
  };

  const handleOpenStandaloneTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Download Project Codebase</h2>
              <p className="text-[11px] text-slate-400">Wing-C Lakeview Apartment • Complete ZIP Archives</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{errorMessage}</p>
                <p className="text-[11px] text-rose-300">
                  Click the button below to open the application in a standalone browser tab and download directly.
                </p>
                <button
                  type="button"
                  onClick={handleOpenStandaloneTab}
                  className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open in New Tab</span>
                </button>
              </div>
            </div>
          )}

          {/* Option 1: Complete Full-Stack Web + Android Project */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2.5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FileArchive className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-white text-xs sm:text-sm">Complete Project (All Files)</h3>
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Recommended • ~650 KB</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-[10px] font-bold text-emerald-300">
                Full Code
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed text-[11px]">
              Contains the entire application: React components, TypeScript files, Tailwind setup, Firestore database rules, PWA manifests, icons, and the full Android Studio project.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <button
                type="button"
                id="btn-download-full-project-blob"
                onClick={handleDownloadFull}
                disabled={downloadingFull}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-md"
              >
                {downloadingFull ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing ZIP Download...</span>
                  </>
                ) : fullSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-200" />
                    <span>Downloaded Successfully!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Complete Project (ZIP)</span>
                  </>
                )}
              </button>

              <a
                href={fullZipUrl}
                download="wing-c-lakeview-complete-project.zip"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition"
                title="Direct Browser Link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Direct Link</span>
              </a>
            </div>
          </div>

          {/* Option 2: Android Studio Native Project */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2.5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-teal-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-white text-xs sm:text-sm">Native Android Studio Project</h3>
                  <span className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider">Mobile Build • ~335 KB</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-teal-950/80 border border-teal-800/60 text-[10px] font-bold text-teal-300">
                Android
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed text-[11px]">
              Ready to open directly in Android Studio. Includes <code className="text-teal-300">build.gradle</code>, <code className="text-teal-300">AndroidManifest.xml</code>, Gradle wrapper (<code className="text-teal-300">gradlew</code>), app assets, and Java source for building a signed APK or Google Play Store AAB.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <button
                type="button"
                id="btn-download-android-project-blob"
                onClick={handleDownloadAndroid}
                disabled={downloadingAndroid}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 active:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-md"
              >
                {downloadingAndroid ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing ZIP Download...</span>
                  </>
                ) : androidSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-teal-200" />
                    <span>Downloaded Successfully!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Android Studio (ZIP)</span>
                  </>
                )}
              </button>

              <a
                href={androidZipUrl}
                download="wing-c-lakeview-android-studio.zip"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition"
                title="Direct Browser Link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Direct Link</span>
              </a>
            </div>
          </div>

          {/* Quick instructions & AI Studio native export */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Two Quick Ways to Run Locally:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-300">
              <li>
                <strong>Web App</strong>: Unzip <code className="text-emerald-400">wing-c-lakeview-complete-project.zip</code>, run <code className="text-emerald-400">npm install</code>, then <code className="text-emerald-400">npm run dev</code>.
              </li>
              <li>
                <strong>Android App</strong>: Unzip <code className="text-teal-400">wing-c-lakeview-android-studio.zip</code>, open Android Studio, click <em>Open Project</em>, select the unzipped folder, and click <em>Run (Shift+F10)</em> or <em>Build &gt; Generate Signed Bundle / APK</em>.
              </li>
            </ol>
            <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[10px]">
              <span>Also available in AI Studio top-right: <strong>Settings (⋮) &gt; Export to ZIP</strong></span>
              <button
                type="button"
                onClick={handleOpenStandaloneTab}
                className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>Open in Tab</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-800/60 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

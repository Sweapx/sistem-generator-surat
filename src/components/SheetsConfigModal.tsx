import React, { useState, useEffect } from 'react';
import {
  X,
  Wifi,
  WifiOff,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getSheetsWebAppUrl,
  setSheetsWebAppUrl,
  isSheetsConfigured,
  pingSheets,
  testDriveConnection,
  SyncStatus,
  DriveTestResult,
} from '../services/sheetsService';
import codeGsRaw from '../../google-apps-script/Code.gs?raw';

interface SheetsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export const SheetsConfigModal: React.FC<SheetsConfigModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const [url, setUrl] = useState(getSheetsWebAppUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<SyncStatus | null>(null);
  const [isTestingDrive, setIsTestingDrive] = useState(false);
  const [driveTestResult, setDriveTestResult] = useState<DriveTestResult | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrl(getSheetsWebAppUrl());
      setTestResult(null);
      setDriveTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setSheetsWebAppUrl(url);
    if (testResult?.ok) {
      onConnected();
      onClose();
    }
  };

  const handleTest = async () => {
    if (!url.trim()) {
      setTestResult({ ok: false, message: 'Masukkan URL Apps Script terlebih dahulu.' });
      return;
    }
    setSheetsWebAppUrl(url);
    setIsTesting(true);
    setTestResult(null);
    const result = await pingSheets();
    setTestResult(result);
    setIsTesting(false);
    if (result.ok) {
      onConnected();
    }
  };

  const handleTestDrive = async () => {
    if (!url.trim()) {
      setDriveTestResult({ ok: false, message: 'Masukkan URL Apps Script terlebih dahulu.' });
      return;
    }
    setSheetsWebAppUrl(url);
    setIsTestingDrive(true);
    setDriveTestResult(null);
    const result = await testDriveConnection();
    setDriveTestResult(result);
    setIsTestingDrive(false);
  };

  const handleCopyCodeGs = async () => {
    try {
      await navigator.clipboard.writeText(codeGsRaw);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      /* ignore */
    }
  };

  const STEPS = [
    {
      num: '1',
      title: 'Buka Google Sheets database',
      desc: 'Buka spreadsheet yang berisi (atau akan berisi) database nomor surat, pegawai, dan pejabat.',
    },
    {
      num: '2',
      title: 'Buka Apps Script',
      desc: 'Klik menu Extensions → Apps Script. Tab baru akan terbuka.',
    },
    {
      num: '3',
      title: 'Paste kode Code.gs',
      desc: 'Hapus kode default, lalu paste seluruh isi file google-apps-script/Code.gs yang sudah disiapkan.',
    },
    {
      num: '4',
      title: 'Isi SPREADSHEET_ID di Code.gs',
      desc: 'Ganti teks GANTI_DENGAN_ID_SPREADSHEET_ANDA dengan ID spreadsheet Anda (ada di URL spreadsheet, antara /d/ dan /edit).',
    },
    {
      num: '5',
      title: 'Deploy sebagai Web App',
      desc: 'Klik Deploy → New Deployment → pilih tipe "Web App". Atur Execute as: Me, Who has access: Anyone. Klik Deploy.',
    },
    {
      num: '6',
      title: 'Copy URL deployment',
      desc: 'Copy URL yang muncul (dimulai dengan https://script.google.com/macros/s/...) dan paste di kolom di bawah.',
    },
    {
      num: '7',
      title: '⭐ Aktifkan Izin Google Drive (WAJIB untuk fitur arsip Word / Google Docs)',
      desc: 'Di editor Apps Script, pilih fungsi "testDriveOtorisasi" dari dropdown, lalu klik ▶ Run. Setujui semua permintaan akses (popup Google). Setelah selesai, kembali ke aplikasi dan klik tombol "Test Google Drive" di bawah untuk memverifikasi.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2A27]/45 backdrop-blur-sm">
      <div className="bg-[#FCFBF8] rounded-2xl border border-[#E6E2D8] shadow-[0_20px_50px_-10px_rgba(43,42,39,0.18)] w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E6E2D8] bg-[#F6F4EF]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#EBF2EE] border border-[#CDE0D6] flex items-center justify-center">
              {isSheetsConfigured() ? (
                <Wifi className="w-4.5 h-4.5 text-[#3D6356]" />
              ) : (
                <WifiOff className="w-4.5 h-4.5 text-[#9A6B3B]" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#2B2A27]">
                Konfigurasi Google Sheets
              </h2>
              <p className="text-xs text-[#66625B]">Sinkronisasi nomor surat &amp; database pegawai</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#FCFBF8] hover:bg-[#EAE6DD] text-[#66625B] hover:text-[#2B2A27] border border-[#E2DDD2] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Status Banner */}
          <div
            className={`flex items-start space-x-3 p-3 rounded-lg border text-xs ${
              isSheetsConfigured()
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {isSheetsConfigured() ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div>
              {isSheetsConfigured() ? (
                <>
                  <strong>URL tersimpan.</strong> Klik "Uji Koneksi" untuk memastikan Apps Script masih aktif.
                </>
              ) : (
                <>
                  <strong>Belum terhubung.</strong> Ikuti panduan di bawah untuk setup Google Apps Script,
                  lalu paste URL deployment di sini.
                </>
              )}
            </div>
          </div>

          {/* Box Pembaruan Code.gs untuk Arsip Word / Google Docs */}
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 space-y-2.5 text-xs text-blue-950">
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-blue-900">
                📄 Pembaruan Script: Arsip Word (.docx) / Link Google Docs
              </div>
              <button
                type="button"
                onClick={handleCopyCodeGs}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? '✓ Code.gs Tersalin!' : 'Salin Kode Code.gs Terbaru'}</span>
              </button>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Agar hasil upload di Google Drive berformat <strong>Word / Google Docs</strong> (bukan PDF) dan hanya mengisi kolom <strong>Link Berkas Word</strong>:
              <br />
              1. Klik tombol <strong>&quot;Salin Kode Code.gs Terbaru&quot;</strong> di atas.
              <br />
              2. Buka Google Spreadsheet &rarr; <strong>Extensions &rarr; Apps Script</strong> &rarr; hapus kode lama, Paste (Ctrl+V), lalu Simpan (Ctrl+S).
              <br />
              3. <strong>WAJIB:</strong> Klik tombol biru <strong>Deploy</strong> (kanan atas) &rarr; <strong>Manage deployments</strong> &rarr; klik ikon <strong>Pensil (Edit)</strong> &rarr; pada <strong>Version</strong> pilih <strong>&quot;New version&quot;</strong> &rarr; klik <strong>Deploy</strong>.
            </p>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              URL Google Apps Script Web App:
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setTestResult(null);
                }}
                placeholder="https://script.google.com/macros/s/AKfyc.../exec"
                className="flex-1 text-xs p-2.5 font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white"
              />
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`flex items-start space-x-2 p-3 rounded-lg border text-xs ${
                testResult.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div>
                <strong>{testResult.ok ? 'Berhasil terhubung!' : 'Gagal terhubung.'}</strong>{' '}
                {testResult.message}
                {testResult.lastSync && (
                  <span className="block text-emerald-600 mt-0.5">
                    Server time: {testResult.lastSync}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="flex space-x-2">
              <button
                onClick={handleTest}
                disabled={isTesting}
                className="flex-1 flex items-center justify-center space-x-1.5 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wifi className="w-3.5 h-3.5" />
                )}
                <span>{isTesting ? 'Menguji koneksi...' : 'Uji Koneksi Sheets'}</span>
              </button>
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simpan Konfigurasi</span>
              </button>
            </div>

            {/* Drive Test Button */}
            <button
              onClick={handleTestDrive}
              disabled={isTestingDrive}
              className="w-full flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              {isTestingDrive ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
              <span>{isTestingDrive ? 'Menguji Google Drive...' : '☁️ Test Google Drive (Arsip Word / GDocs)'}</span>
            </button>

            {/* Drive Test Result */}
            {driveTestResult && (
              <div
                className={`p-3 rounded-lg border text-xs ${
                  driveTestResult.ok
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {driveTestResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <strong>{driveTestResult.ok ? '✅ Google Drive terhubung!' : '❌ Google Drive gagal'}</strong>
                    <p>{driveTestResult.message}</p>
                    {driveTestResult.monthFolder && (
                      <p className="text-blue-700">📁 Folder bulan: <strong>{driveTestResult.monthFolder}</strong></p>
                    )}
                    {driveTestResult.monthFolderUrl && (
                      <a
                        href={driveTestResult.monthFolderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 font-medium text-blue-700 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Buka Folder di Google Drive</span>
                      </a>
                    )}
                    {!driveTestResult.ok && (
                      <p className="text-red-700 font-medium">💡 Buka Apps Script Editor → pilih fungsi "testDriveOtorisasi" → klik ▶ Run → setujui izin akses → coba lagi.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Guide */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>📋 Panduan Setup Google Apps Script</span>
              {showGuide ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showGuide && (
              <div className="border-t border-slate-200 px-4 py-4 space-y-3 bg-slate-50">
                {STEPS.map((step) => (
                  <div key={step.num} className="flex space-x-3">
                    <span className="w-5 h-5 rounded-full bg-teal-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step.num}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{step.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-200">
                  <a
                    href="https://docs.google.com/spreadsheets"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-teal-700 font-medium hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Buka Google Sheets</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Note about local storage */}
          <p className="text-[11px] text-slate-400 leading-relaxed">
            ℹ️ Selama belum terhubung ke Google Sheets, data disimpan sementara di <code>localStorage</code> browser.
            Data tidak akan hilang saat refresh, tapi tidak tersinkronisasi antar perangkat.
          </p>
        </div>
      </div>
    </div>
  );
};

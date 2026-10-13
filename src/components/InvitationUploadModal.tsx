import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  X,
  FileCheck2,
  ScanLine,
  Key,
  Calendar,
  MapPin,
  Clock,
  Building,
  Hash,
  Loader2,
} from 'lucide-react';
import { EkstraksiUndangan, SampleInvitation } from '../types';
import { SAMPLE_INVITATIONS } from '../data/initialData';
import {
  extractInvitationWithGemini,
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  FileAttachment,
} from '../services/geminiService';
import {
  extractTextFromPdfBuffer,
  extractTextFromDocxBuffer,
} from '../services/documentExtractor';

interface InvitationUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExtraction: (extracted: EkstraksiUndangan) => void;
}

export const InvitationUploadModal: React.FC<InvitationUploadModalProps> = ({
  isOpen,
  onClose,
  onApplyExtraction,
}) => {
  const [selectedSample, setSelectedSample] = useState<SampleInvitation | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<FileAttachment | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isExtractingText, setIsExtractingText] = useState<boolean>(false);
  const [textExtractionMsg, setTextExtractionMsg] = useState<string>('');
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [extractedData, setExtractedData] = useState<EkstraksiUndangan | null>(null);

  // API Key State
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>(getStoredGeminiApiKey());

  if (!isOpen) return null;

  const handleSelectSample = (sample: SampleInvitation) => {
    setSelectedSample(sample);
    setInputText(sample.rawText);
    setUploadedFile(null);
    setUploadedFileName('');
    setTextExtractionMsg('Menggunakan data sampel simulasi');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setUploadedFileSize((file.size / 1024).toFixed(1) + ' KB');
    setSelectedSample(null);
    setIsExtractingText(true);
    setTextExtractionMsg('Mengekstrak teks isi dokumen secara mendalam...');

    try {
      const fileNameLower = file.name.toLowerCase();

      if (fileNameLower.endsWith('.pdf') || file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();

        // Also prepare base64 for multimodal Gemini
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          const base64Data = result.split(',')[1] || result;
          setUploadedFile({
            base64: base64Data,
            mimeType: 'application/pdf',
            name: file.name,
          });
        };
        reader.readAsDataURL(file);

        // Extract real text from PDF
        const { text, pageCount } = await extractTextFromPdfBuffer(arrayBuffer);
        if (text && text.trim()) {
          setInputText(text);
          setTextExtractionMsg(`✓ Berhasil membaca ${pageCount} halaman teks (${text.length} karakter)`);
        } else {
          setInputText(`[Dokumen terlampir: ${file.name}]\nCatatan: Teks PDF tidak dapat diekstrak langsung (kemungkinan hasil scan gambar). Gunakan API Key Gemini untuk membaca scan.`);
          setTextExtractionMsg('PDF terdeteksi sebagai dokumen hasil scan gambar');
        }
      } else if (fileNameLower.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const { text } = await extractTextFromDocxBuffer(arrayBuffer);
        if (text && text.trim()) {
          setInputText(text);
          setTextExtractionMsg(`✓ Berhasil membaca teks Word (.docx) (${text.length} karakter)`);
        } else {
          setInputText(`[Dokumen terlampir: ${file.name}]`);
        }
        setUploadedFile(null);
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          const base64Data = result.split(',')[1] || result;
          setUploadedFile({
            base64: base64Data,
            mimeType: file.type || 'image/png',
            name: file.name,
          });
          setInputText(`[Dokumen gambar/foto terlampir: ${file.name}]\nSiap dianalisis dengan AI Multimodal Gemini.`);
          setTextExtractionMsg('✓ Berkas foto/scan terlampir untuk analisa AI');
        };
        reader.readAsDataURL(file);
      } else {
        // Plain text
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setInputText(content || '');
          setTextExtractionMsg(`✓ Teks dimuat (${(content || '').length} karakter)`);
          setUploadedFile(null);
        };
        reader.readAsText(file);
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setTextExtractionMsg(`Peringatan: ${err.message || 'Gagal mengekstrak teks otomatis'}`);
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleSaveApiKey = () => {
    setStoredGeminiApiKey(apiKey);
    setShowApiKeyInput(false);
  };

  const handleRunExtraction = async () => {
    if (!inputText.trim() && !uploadedFile) {
      alert('Silakan upload file dokumen undangan atau tempelkan teks undangan terlebih dahulu.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await extractInvitationWithGemini(
        inputText,
        apiKey || undefined,
        uploadedFile || undefined
      );
      setExtractedData(result);
      setStep('review');
    } catch (err) {
      console.error(err);
      alert('Gagal mengekstraksi dokumen. Silakan periksa isi teks dokumen.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndApply = () => {
    if (extractedData) {
      onApplyExtraction(extractedData);
      onClose();
      setStep('input');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Screening &amp; Ekstraksi AI Dokumen Undangan
              </h2>
              <p className="text-xs text-slate-500">
                Pindai undangan resmi untuk mengambil informasi inti secara otomatis ke Surat Tugas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {step === 'input' && (
            <div className="space-y-4">
              {/* Upload Custom File Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  1. Upload Berkas Surat Undangan (PDF / Scan Gambar / Word / TXT):
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-5 bg-slate-50/70 hover:bg-teal-50/20 transition-all text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <label className="cursor-pointer text-xs font-bold text-teal-800 hover:text-teal-900 bg-white px-3 py-1.5 rounded-md border border-slate-300 shadow-xs inline-block">
                        Pilih Berkas Undangan
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Mendukung format PDF resmi, Foto scan kamera, Dokumen Word, dan Teks
                    </p>
                  </div>

                  {isExtractingText && (
                    <div className="mt-2.5 inline-flex items-center space-x-2 text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-md text-xs font-medium animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                      <span>Membaca dan mengekstrak teks seluruh halaman dokumen...</span>
                    </div>
                  )}

                  {!isExtractingText && uploadedFileName && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center space-x-1.5 bg-teal-100 text-teal-900 px-2.5 py-1 rounded-md text-xs font-medium">
                        <FileCheck2 className="w-3.5 h-3.5 text-teal-700" />
                        <span><strong>{uploadedFileName}</strong> ({uploadedFileSize})</span>
                      </div>
                      {textExtractionMsg && (
                        <div className="text-[11.5px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          {textExtractionMsg}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sample Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Atau Gunakan Contoh Naskah Undangan Cepat:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_INVITATIONS.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSelectSample(sample)}
                      className={`text-left p-2.5 rounded-lg border transition-all text-xs cursor-pointer ${
                        selectedSample?.id === sample.id
                          ? 'border-teal-600 bg-teal-50 text-slate-900 ring-1 ring-teal-600'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      <div className="font-semibold text-slate-900 line-clamp-1">
                        {sample.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {sample.instansi}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Isi Teks / Transkrip Surat Undangan:
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Bisa diedit atau ditempel langsung
                  </span>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setSelectedSample(null);
                  }}
                  rows={5}
                  placeholder="Tempelkan isi surat undangan resmi di sini jika tidak mengupload file (misal: Nomor surat, Hal, Tanggal, Waktu, Tempat, dsb)..."
                  className="w-full text-xs font-mono p-3 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Opsional API Key Gemini */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  className="text-[11px] text-slate-500 hover:text-teal-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Key className="w-3 h-3" />
                  <span>
                    {apiKey ? 'API Key Gemini: Tersimpan ✓' : 'Pengaturan API Key Gemini (Opsional)'}
                  </span>
                </button>

                {showApiKeyInput && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center space-x-2">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Masukkan Gemini API Key..."
                      className="text-xs flex-1 p-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveApiKey}
                      className="text-xs bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded font-medium cursor-pointer"
                    >
                      Simpan
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW & PENYESUAIAN HASIL SCREENING */}
          {step === 'review' && extractedData && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start space-x-2 text-xs text-emerald-900">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Analisa Dokumen Berhasil!</div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    Informasi inti telah diekstrak dan dipetakan sesuai struktur resmi Surat Tugas Pusaka Komdigi. Anda dapat menyesuaikan nilai sebelum menerapkannya.
                  </div>
                </div>
              </div>

              {/* Grid 7 Elemen Ekstraksi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* 1. Instansi atau Pejabat Pengirim Undangan */}
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <Building className="w-3.5 h-3.5 text-teal-700" />
                      <span>1. Instansi / Pejabat Pengirim Undangan:</span>
                    </label>
                    <span className="text-[10px] font-semibold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                      Masuk ke: Bagian Dasar
                    </span>
                  </div>
                  <input
                    type="text"
                    value={extractedData.instansi_pengundang}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, instansi_pengundang: e.target.value })
                    }
                    placeholder="Misal: Menteri PPN / Kepala Bappenas"
                    className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-900 font-medium focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="text-[10.5px] text-slate-500">Pihak penyelenggara kegiatan penugasan</p>
                </div>

                {/* 2. Nomor Surat Undangan */}
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <Hash className="w-3.5 h-3.5 text-teal-700" />
                      <span>2. Nomor Surat Undangan:</span>
                    </label>
                    <span className="text-[10px] font-semibold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                      Masuk ke: Bagian Dasar
                    </span>
                  </div>
                  <input
                    type="text"
                    value={extractedData.nomor_surat_undangan}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, nomor_surat_undangan: e.target.value })
                    }
                    placeholder="Misal: B-723/D.3/HM.01.01/07/2026"
                    className="w-full p-2 bg-white border border-slate-300 rounded-md font-mono text-slate-900 font-medium focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="text-[10.5px] text-slate-500">Referensi hukum formal penugasan pegawai</p>
                </div>

                {/* 3. Tanggal Surat Undangan Diterbitkan */}
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-700" />
                      <span>3. Tanggal Surat Undangan Diterbitkan:</span>
                    </label>
                    <span className="text-[10px] font-semibold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                      Masuk ke: Bagian Dasar
                    </span>
                  </div>
                  <input
                    type="date"
                    value={extractedData.tanggal_surat_undangan || ''}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, tanggal_surat_undangan: e.target.value })
                    }
                    className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-900 font-medium focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="text-[10.5px] text-slate-500">Melengkapi referensi hukum formal penugasan</p>
                </div>

                {/* 4. Perihal / Nama Kegiatan */}
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-teal-700" />
                      <span>4. Perihal / Nama Kegiatan:</span>
                    </label>
                    <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                      Masuk ke: Menimbang &amp; Untuk
                    </span>
                  </div>
                  <input
                    type="text"
                    value={extractedData.nama_acara}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, nama_acara: e.target.value, topik: e.target.value })
                    }
                    placeholder="Misal: Rapat Pembahasan Pemetaan Kebijakan..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-900 font-semibold focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="text-[10.5px] text-slate-500">Menjelaskan urgensi dan bentuk penugasan dinas</p>
                </div>

                {/* 5. Waktu Pelaksanaan (Hari, Tanggal, Jam) */}
                <div className="md:col-span-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-700" />
                      <span>5. Waktu Pelaksanaan (Hari, Tanggal, dan Jam):</span>
                    </label>
                    <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                      Masuk ke: Bagian Untuk
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[11px] font-medium text-slate-600 block mb-0.5">Teks Hari &amp; Tanggal:</span>
                      <input
                        type="text"
                        value={extractedData.hari_tanggal_pelaksanaan || ''}
                        onChange={(e) =>
                          setExtractedData({ ...extractedData, hari_tanggal_pelaksanaan: e.target.value })
                        }
                        placeholder="Misal: Rabu - Jumat, 23 - 25 September 2026"
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-600 block mb-0.5">Waktu / Pukul:</span>
                      <input
                        type="text"
                        value={extractedData.waktu_pelaksanaan || ''}
                        onChange={(e) =>
                          setExtractedData({ ...extractedData, waktu_pelaksanaan: e.target.value })
                        }
                        placeholder="Misal: 09.00 WIB s.d. 17.00 WIB"
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <span className="text-[11px] font-medium text-slate-600 block mb-0.5">Mulai:</span>
                        <input
                          type="date"
                          value={extractedData.tanggal_mulai}
                          onChange={(e) =>
                            setExtractedData({ ...extractedData, tanggal_mulai: e.target.value })
                          }
                          className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-teal-500 text-[11px]"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-slate-600 block mb-0.5">Selesai:</span>
                        <input
                          type="date"
                          value={extractedData.tanggal_selesai}
                          onChange={(e) =>
                            setExtractedData({ ...extractedData, tanggal_selesai: e.target.value })
                          }
                          className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-teal-500 text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10.5px] text-slate-500">Memberikan kejelasan durasi penugasan kepada pegawai</p>
                </div>

                {/* 6. Tempat / Lokasi Kegiatan */}
                <div className="md:col-span-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-700" />
                      <span>6. Tempat / Lokasi Kegiatan:</span>
                    </label>
                    <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                      Masuk ke: Bagian Untuk
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <span className="text-[11px] font-medium text-slate-600 block mb-0.5">Nama Gedung / Hotel &amp; Alamat:</span>
                      <input
                        type="text"
                        value={extractedData.lokasi}
                        onChange={(e) =>
                          setExtractedData({ ...extractedData, lokasi: e.target.value })
                        }
                        placeholder="Misal: Mercure Bandung Nexa Supratman, Jl. Supratman No. 66-68"
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-slate-900 font-medium focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-600 block mb-0.5">Kota Kegiatan:</span>
                      <input
                        type="text"
                        value={extractedData.kota_kegiatan}
                        onChange={(e) =>
                          setExtractedData({ ...extractedData, kota_kegiatan: e.target.value })
                        }
                        placeholder="Misal: Kota Bandung"
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-slate-900 font-medium focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10.5px] text-slate-500">Menentukan penugasan dalam/luar kota untuk pembebanan anggaran perjalanan dinas</p>
                </div>

                {/* 7. Kriteria atau Target Peserta yang Diminta */}
                <div className="md:col-span-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>7. Kriteria atau Target Peserta yang Diminta:</span>
                    </label>
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      Dasar Penentuan Bagian Kepada
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={extractedData.kriteria_peserta || ''}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, kriteria_peserta: e.target.value })
                    }
                    placeholder="Misal: Pejabat Administrator/Pengawas dan Analis Kebijakan yang membidangi regulasi dan arsitektur digital..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="text-[10.5px] text-slate-500">Menjadi acuan pemilihan nama-nama pegawai pada bagian Kepada (1-3 orang atau format lampiran)</p>
                </div>
              </div>

              {/* Pratinjau Klausul Formulasi Naskah Dinas */}
              <div className="mt-3 p-3 bg-teal-50/70 border border-teal-200 rounded-lg space-y-2 text-xs">
                <div className="font-bold text-teal-950 flex items-center space-x-1.5">
                  <FileCheck2 className="w-4 h-4 text-teal-700" />
                  <span>Pratinjau Redaksi Naskah Dinas Otomatis:</span>
                </div>
                <div className="grid grid-cols-1 gap-2 text-[11px] text-slate-700">
                  <div className="bg-white p-2 rounded border border-teal-100">
                    <strong className="text-teal-900">Menimbang:</strong> {extractedData.narasi_menimbang || `Bahwa dalam rangka mendukung kelancaran pelaksanaan ${extractedData.nama_acara}, perlu menugaskan pegawai untuk mengikuti kegiatan dimaksud.`}
                  </div>
                  <div className="bg-white p-2 rounded border border-teal-100">
                    <strong className="text-teal-900">Dasar:</strong> {extractedData.narasi_dasar || `Surat Undangan ${extractedData.instansi_pengundang} Nomor : ${extractedData.nomor_surat_undangan} tanggal ${extractedData.tanggal_surat_undangan}.`}
                  </div>
                  <div className="bg-white p-2 rounded border border-teal-100">
                    <strong className="text-teal-900">Untuk:</strong> {extractedData.narasi_untuk || `Mengikuti kegiatan ${extractedData.nama_acara} yang dilaksanakan pada ${extractedData.waktu_pelaksanaan} di ${extractedData.lokasi}, ${extractedData.kota_kegiatan}.`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {step === 'review' ? (
            <button
              type="button"
              onClick={() => setStep('input')}
              className="text-xs text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded font-medium cursor-pointer"
            >
              &larr; Pindai Ulang Dokumen
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 font-medium flex items-center space-x-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>
                {apiKey ? 'Mode: Gemini AI Deep Extraction' : 'Mode: Analisis Heuristik Cerdas Pusaka Komdigi'}
              </span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-600 hover:bg-slate-200 px-3.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer"
            >
              Batal
            </button>

            {step === 'input' ? (
              <button
                type="button"
                onClick={handleRunExtraction}
                disabled={isProcessing}
                className="flex items-center space-x-1.5 text-xs font-semibold bg-teal-800 hover:bg-teal-900 text-white px-4 py-2 rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>{isProcessing ? 'Menganalisa Dokumen...' : 'Analisa &amp; Screening Inti Dokumen'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmAndApply}
                className="flex items-center space-x-1.5 text-xs font-semibold bg-teal-800 hover:bg-teal-900 text-white px-4 py-2 rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span>Terapkan ke Surat Tugas</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

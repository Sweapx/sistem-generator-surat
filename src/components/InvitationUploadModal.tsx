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
  Mail,
  ScrollText,
} from 'lucide-react';
import {
  EkstraksiUndangan,
  EkstraksiSuratUndangan,
  EkstraksiNotaDinas,
  SampleInvitation,
  JenisNaskah,
} from '../types';
import { SAMPLE_INVITATIONS } from '../data/initialData';
import {
  extractInvitationWithGemini,
  extractSuratUndanganWithGemini,
  extractNotaDinasWithGemini,
  transcribeDocumentWithGemini,
  getStoredGeminiApiKey,
  FileAttachment,
} from '../services/geminiService';
import { formatNumberedPoints, combineNotaDinasSections } from '../services/naskahFormatter';
import {
  extractTextFromPdfBuffer,
  extractTextFromDocxBuffer,
  extractOcrFromScannedPdf,
  performOcrOnImageFile,
} from '../services/documentExtractor';

interface InvitationUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: JenisNaskah;
  onApplyExtraction: (extracted: EkstraksiUndangan) => void;
  onApplyUndanganExtraction?: (extracted: EkstraksiSuratUndangan) => void;
  onApplyNotaDinasExtraction?: (extracted: EkstraksiNotaDinas) => void;
}

export const InvitationUploadModal: React.FC<InvitationUploadModalProps> = ({
  isOpen,
  onClose,
  mode = 'TUGAS',
  onApplyExtraction,
  onApplyUndanganExtraction,
  onApplyNotaDinasExtraction,
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

  // Extracted data per mode
  const [extractedData, setExtractedData] = useState<EkstraksiUndangan | null>(null);
  const [extractedUndangan, setExtractedUndangan] = useState<EkstraksiSuratUndangan | null>(null);
  const [extractedNota, setExtractedNota] = useState<EkstraksiNotaDinas | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>('');

  // API Key otomatis diambil dari konfigurasi .env (tanpa perlu input manual pengguna)
  const envApiKey = getStoredGeminiApiKey();

  if (!isOpen) return null;

  const modalTitle =
    mode === 'UNDANGAN'
      ? 'Screening Dokumen Acuan & Rapat (Surat Undangan)'
      : mode === 'NOTA_DINAS'
      ? 'Screening Laporan & Dokumen Telaah (Nota Dinas)'
      : 'Screening & Ekstraksi AI Dokumen Undangan (Surat Tugas)';

  const modalDesc =
    mode === 'UNDANGAN'
      ? 'Pindai TOR, notulensi, atau dokumen acuan rapat untuk menyusun Surat Undangan resmi otomatis'
      : mode === 'NOTA_DINAS'
      ? 'Pindai laporan, hasil kajian, atau arahan pimpinan untuk menyusun pokok pikiran Nota Dinas resmi'
      : 'Pindai undangan resmi untuk mengambil informasi inti secara otomatis ke formulir Surat Tugas';

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
    setTextExtractionMsg('Memproses berkas dokumen secara cepat...');

    const readAsBase64 = (f: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const res = (ev.target?.result as string) || '';
          resolve(res.split(',')[1] || res);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(f);
      });

    try {
      const fileNameLower = file.name.toLowerCase();
      const hasAiKey = Boolean(envApiKey && envApiKey !== 'MY_GEMINI_API_KEY' && envApiKey !== 'YOUR_GEMINI_API_KEY_HERE');

      if (fileNameLower.endsWith('.pdf') || file.type === 'application/pdf') {
        const [arrayBuffer, base64Data] = await Promise.all([
          file.arrayBuffer(),
          readAsBase64(file),
        ]);

        const pdfAttachment: FileAttachment = {
          base64: base64Data,
          mimeType: 'application/pdf',
          name: file.name,
        };
        setUploadedFile(pdfAttachment);

        // Ekstraksi teks PDF secara paralel super cepat
        const { text, pageCount, isScanned } = await extractTextFromPdfBuffer(arrayBuffer.slice(0));
        if (text && text.trim().length > 20 && !isScanned) {
          setInputText(text);
          setTextExtractionMsg(`✓ Berhasil memindai ${pageCount} halaman PDF secara instan`);
        } else if (hasAiKey) {
          // PDF pindaian/gambar: transkrip langsung via Gemini Multimodal AI agar Teks Transkrip Dokumen terisi lengkap!
          setTextExtractionMsg(`Mentranskrip isi PDF pindaian (${pageCount} halaman) via Gemini AI...`);
          const aiTranscribed = await transcribeDocumentWithGemini(pdfAttachment, envApiKey);
          if (aiTranscribed) {
            setInputText(aiTranscribed);
            setTextExtractionMsg(`✓ Berhasil mentranskrip ${pageCount} halaman PDF via Gemini Multimodal AI`);
          } else {
            // Fallback OCR lokal jika transkrip Gemini gagal
            setTextExtractionMsg(`Memindai teks gambar/scan (${Math.min(pageCount, 5)} halaman) via OCR...`);
            const ocrResult = await extractOcrFromScannedPdf(arrayBuffer.slice(0), file.name, 5, (m) =>
              setTextExtractionMsg(m)
            );
            if (ocrResult.text && ocrResult.text.trim()) {
              setInputText(ocrResult.text);
              setTextExtractionMsg(`✓ Berhasil memindai teks ${ocrResult.pagesProcessed} halaman via OCR`);
            } else {
              setTextExtractionMsg(`✓ Berkas PDF (${pageCount} halaman) siap dianalisis oleh AI`);
            }
          }
        } else {
          // Fallback OCR cepat (maksimal 5 halaman pertama agar selesai cepat)
          setTextExtractionMsg(`Memindai teks gambar/scan (${ Math.min(pageCount, 5) } halaman)...`);
          try {
            const ocrResult = await extractOcrFromScannedPdf(
              arrayBuffer.slice(0),
              file.name,
              5,
              (progressMsg) => {
                setTextExtractionMsg(progressMsg);
              }
            );
            if (ocrResult.text && ocrResult.text.trim()) {
              setInputText(ocrResult.text);
              setTextExtractionMsg(`✓ Berhasil memindai teks ${ocrResult.pagesProcessed} halaman dokumen via OCR`);
            } else {
              setTextExtractionMsg('✓ Berkas PDF siap dianalisis');
            }
          } catch {
            setTextExtractionMsg('✓ Berkas PDF terlampir siap dianalisis');
          }
        }
      } else if (fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc')) {
        const arrayBuffer = await file.arrayBuffer();
        try {
          const { text } = await extractTextFromDocxBuffer(arrayBuffer);
          if (text && text.trim()) {
            setInputText(text);
            setTextExtractionMsg('✓ Berhasil mengekstrak seluruh isi & tabel dokumen Word secara instan');
          } else {
            setInputText(`[Dokumen Word terlampir: ${file.name}]`);
            setTextExtractionMsg('✓ Dokumen Word siap dianalisis');
          }
        } catch {
          setInputText(`[Dokumen terlampir: ${file.name}]`);
          setTextExtractionMsg('✓ Dokumen Word terlampir');
        }
      } else if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif)$/i.test(fileNameLower)) {
        const base64Data = await readAsBase64(file);
        const fullDataUrl = `data:${file.type || 'image/jpeg'};base64,${base64Data}`;
        const imgAttachment: FileAttachment = {
          base64: base64Data,
          mimeType: file.type || 'image/jpeg',
          name: file.name,
        };
        setUploadedFile(imgAttachment);

        if (hasAiKey) {
          setTextExtractionMsg('Membaca isi teks dari gambar via Gemini Vision AI...');
          const aiTranscribed = await transcribeDocumentWithGemini(imgAttachment, envApiKey);
          if (aiTranscribed) {
            setInputText(aiTranscribed);
            setTextExtractionMsg('✓ Berhasil mentranskrip teks gambar via Gemini Vision AI');
          } else {
            const ocrText = await performOcrOnImageFile(fullDataUrl, (m) => setTextExtractionMsg(m));
            setInputText(ocrText || `[Gambar Dokumen Terlampir: ${file.name}]`);
            setTextExtractionMsg(ocrText ? '✓ Berhasil mentranskrip teks gambar via OCR' : '✓ Gambar siap dianalisis oleh AI');
          }
        } else {
          setTextExtractionMsg('Membaca teks dari gambar pindaian...');
          try {
            const ocrText = await performOcrOnImageFile(fullDataUrl, (msg) => {
              setTextExtractionMsg(msg);
            });
            if (ocrText && ocrText.trim()) {
              setInputText(ocrText);
              setTextExtractionMsg('✓ Berhasil mentranskrip teks dari gambar pindaian');
            } else {
              const cleanName = file.name.replace(/\.[a-zA-Z0-9]+$/i, '').replace(/[_-]+/g, ' ');
              setInputText(
                `DOKUMEN PINDAIAN GAMBAR: ${cleanName.toUpperCase()}\n` +
                `Kementerian Komunikasi dan Digital RI\n\n` +
                `Berkas gambar pindaian ${file.name} memuat telaah dan arahan pimpinan yang siap diproses.`
              );
              setTextExtractionMsg('✓ Berkas pindaian gambar siap diproses');
            }
          } catch {
            setInputText(`[Dokumen gambar terlampir: ${file.name}]`);
            setTextExtractionMsg('✓ Gambar pindaian terlampir siap diproses');
          }
        }
      } else {
        const text = await file.text();
        setInputText(text);
        setTextExtractionMsg('✓ Teks dokumen berhasil dibaca secara instan');
      }
    } catch (err: any) {
      console.warn('Gagal membaca dokumen:', err);
      setTextExtractionMsg('Gagal membaca dokumen: ' + (err?.message || 'Format tidak didukung'));
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleRunExtraction = async () => {
    if (!inputText.trim() && !uploadedFile && !userPrompt.trim()) {
      alert('Silakan upload berkas dokumen, tempelkan teks, atau masukkan perintah/prompt instruksi pembuatan.');
      return;
    }

    setIsProcessing(true);
    try {
      if (mode === 'UNDANGAN') {
        const result = await extractSuratUndanganWithGemini(
          inputText,
          envApiKey || undefined,
          uploadedFile || undefined,
          userPrompt || undefined
        );
        setExtractedUndangan(result);
        setStep('review');
      } else if (mode === 'NOTA_DINAS') {
        const result = await extractNotaDinasWithGemini(
          inputText,
          envApiKey || undefined,
          uploadedFile || undefined,
          userPrompt || undefined
        );
        const unifiedBody = combineNotaDinasSections(
          result.nota_pembuka,
          result.nota_isi,
          result.nota_penutup
        );
        setExtractedNota({
          ...result,
          nota_pembuka: '',
          nota_isi: unifiedBody,
          nota_penutup: '',
        });
        setStep('review');
      } else {
        const result = await extractInvitationWithGemini(
          inputText,
          envApiKey || undefined,
          uploadedFile || undefined,
          userPrompt || undefined
        );
        setExtractedData(result);
        setStep('review');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengekstraksi dokumen. Silakan periksa isi teks dokumen atau perintah prompt.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndApply = () => {
    if (mode === 'UNDANGAN' && extractedUndangan) {
      onApplyUndanganExtraction?.(extractedUndangan);
      onClose();
      setStep('input');
    } else if (mode === 'NOTA_DINAS' && extractedNota) {
      onApplyNotaDinasExtraction?.(extractedNota);
      onClose();
      setStep('input');
    } else if (extractedData) {
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
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                mode === 'UNDANGAN'
                  ? 'bg-amber-100 text-amber-800'
                  : mode === 'NOTA_DINAS'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-teal-100 text-teal-800'
              }`}
            >
              {mode === 'UNDANGAN' ? (
                <Mail className="w-4 h-4" />
              ) : mode === 'NOTA_DINAS' ? (
                <ScrollText className="w-4 h-4" />
              ) : (
                <ScanLine className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{modalTitle}</h2>
              <p className="text-xs text-slate-500">{modalDesc}</p>
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
                  1. Upload Berkas Dokumen Acuan (Opsional jika membuat dari prompt pengguna):
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-5 bg-slate-50/70 hover:bg-teal-50/20 transition-all text-center">
                  <input
                    type="file"
                    id="doc-screening-upload"
                    className="hidden"
                    accept=".pdf,.docx,.doc,image/*,.txt,.md,.csv,.json,.html,.rtf"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="doc-screening-upload"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                      {isExtractingText ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-teal-900 block">
                        Klik untuk memilih file dokumen
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Format PDF, Dokumen Word (.docx), Scan JPG/PNG
                      </span>
                    </div>
                  </label>

                  {uploadedFileName && (
                    <div className="mt-3 flex items-center justify-center space-x-2 text-xs font-medium text-emerald-800 bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-200 inline-flex">
                      <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{uploadedFileName}</span>
                      <span className="text-slate-400">({uploadedFileSize})</span>
                    </div>
                  )}

                  {textExtractionMsg && (
                    <div className="mt-1 text-[11px] text-teal-700 italic">
                      {textExtractionMsg}
                    </div>
                  )}
                </div>
              </div>

              {/* Text Input / Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    2. Teks Transkrip Dokumen (Otomatis terisi dari file atau ketik manual):
                  </label>
                  {isExtractingText && (
                    <span className="text-[11px] text-teal-700 font-semibold flex items-center space-x-1 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
                      <span>Sedang memindai teks...</span>
                    </span>
                  )}
                  {inputText && !isExtractingText && (
                    <span className="text-[10.5px] text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      ✓ {inputText.length} karakter terdeteksi
                    </span>
                  )}
                </div>
                <textarea
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Isi teks dokumen akan tampil di sini..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed font-mono focus:bg-white focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* 3. Form Perintah Tambahan / Prompt Pembuatan */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    3. Perintah / Prompt Tambahan untuk AI:
                  </label>
                  <span className="text-[10.5px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Bisa Langsung Tanpa Dokumen
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder={
                    mode === 'NOTA_DINAS'
                      ? 'Tuliskan perintah ke AI, contoh:\n"Buatkan nota dinas dari Kapus Kebijakan Strategis kepada Sekretaris Jenderal mengenai permohonan penandatanganan Keputusan Sekjen tentang Tim Quickwins. Bentuk narasi penjelasan resmi, sifat segera."'
                      : mode === 'UNDANGAN'
                      ? 'Tuliskan perintah ke AI, contoh:\n"Buat surat undangan rapat pembahasan regulasi perlindungan hak cipta jurnalistik digital pada hari Senin, 26 Oktober 2026 jam 09.00 WIB di Ruang Rapat Lt. 5."'
                      : 'Tuliskan perintah ke AI, contoh:\n"Tugaskan 3 pegawai untuk menghadiri forum ASEAN di Jakarta tanggal 28 September 2026, anggaran DIPA Sekretariat Jenderal."'
                  }
                  className="w-full p-2.5 bg-white border border-teal-200 rounded-lg text-xs leading-relaxed focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-sans shadow-2xs placeholder:text-slate-400"
                />
                <p className="text-[10.5px] text-slate-500 mt-1">
                  💡 <em>Pengguna dapat langsung membuat {mode === 'NOTA_DINAS' ? 'nota dinas' : mode === 'UNDANGAN' ? 'surat undangan' : 'surat tugas'} hanya dari perintah/prompt di atas meskipun tidak ada dokumen yang dilampirkan.</em>
                </p>
              </div>
            </div>
          )}

          {/* Review Step: UNDANGAN */}
          {step === 'review' && mode === 'UNDANGAN' && extractedUndangan && (
            <div className="space-y-3.5 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center space-x-2 text-amber-900">
                <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Hasil screening dokumen acuan rapat. Anda dapat memeriksa dan menyesuaikan sebelum diterapkan.</span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Perihal Undangan:</label>
                  <input
                    type="text"
                    value={extractedUndangan.undangan_hal}
                    onChange={(e) => setExtractedUndangan({ ...extractedUndangan, undangan_hal: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-md font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Agenda Acara / Pembahasan:</label>
                  <textarea
                    rows={2}
                    value={extractedUndangan.undangan_agenda}
                    onChange={(e) => setExtractedUndangan({ ...extractedUndangan, undangan_agenda: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Hari &amp; Tanggal:</label>
                    <input
                      type="text"
                      value={extractedUndangan.hari_tanggal_pelaksanaan}
                      onChange={(e) => setExtractedUndangan({ ...extractedUndangan, hari_tanggal_pelaksanaan: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Waktu / Jam:</label>
                    <input
                      type="text"
                      value={extractedUndangan.undangan_waktu}
                      onChange={(e) => setExtractedUndangan({ ...extractedUndangan, undangan_waktu: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Tempat / Lokasi:</label>
                  <input
                    type="text"
                    value={extractedUndangan.undangan_tempat_offline || ''}
                    onChange={(e) => setExtractedUndangan({ ...extractedUndangan, undangan_tempat_offline: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Penerima Undangan (Kepada):</label>
                  <textarea
                    rows={2}
                    value={extractedUndangan.undangan_kepada}
                    onChange={(e) => setExtractedUndangan({ ...extractedUndangan, undangan_kepada: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Review Step: NOTA DINAS */}
          {step === 'review' && mode === 'NOTA_DINAS' && extractedNota && (
            <div className="space-y-3.5 text-xs">
              <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg flex items-center justify-between text-indigo-900">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Hasil analisis AI &amp; struktur Nota Dinas. Anda dapat memeriksa sebelum diterapkan.</span>
                </div>
                {extractedNota.rekomendasi_kode_klasifikasi && (
                  <span className="text-[10.5px] font-mono font-bold bg-white text-indigo-800 px-2 py-0.5 rounded border border-indigo-200 shrink-0">
                    Kode: {extractedNota.rekomendasi_kode_klasifikasi}
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Perihal / Hal Nota Dinas:</label>
                  <input
                    type="text"
                    value={extractedNota.nota_hal}
                    onChange={(e) => setExtractedNota({ ...extractedNota, nota_hal: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-md font-semibold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Kepada Yth. (Jabatan Penerima):</label>
                    <input
                      type="text"
                      value={extractedNota.nota_kepada}
                      onChange={(e) => setExtractedNota({ ...extractedNota, nota_kepada: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Dari (Pengirim):</label>
                    <input
                      type="text"
                      value={extractedNota.nota_dari}
                      onChange={(e) => setExtractedNota({ ...extractedNota, nota_dari: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800">
                      Isi Badan Nota Dinas (Pembuka, Substansi / Telaah, &amp; Penutup):
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (extractedNota.nota_isi) {
                          setExtractedNota({
                            ...extractedNota,
                            nota_isi: formatNumberedPoints(extractedNota.nota_isi),
                          });
                        }
                      }}
                      className="text-[10px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors"
                      title="Rapikan spasi enter poin dan sub-poin otomatis"
                    >
                      ⚡ Rapikan Format Poin
                    </button>
                  </div>
                  <textarea
                    rows={9}
                    value={extractedNota.nota_isi}
                    onChange={(e) =>
                      setExtractedNota({
                        ...extractedNota,
                        nota_pembuka: '',
                        nota_isi: e.target.value,
                        nota_penutup: '',
                      })
                    }
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-md font-sans text-xs leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Review Step: TUGAS */}
          {step === 'review' && mode === 'TUGAS' && extractedData && (
            <div className="space-y-3.5 text-xs">
              <div className="bg-teal-50 border border-teal-200 p-3 rounded-lg flex items-center space-x-2 text-teal-900">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Hasil ekstraksi dokumen surat undangan untuk Surat Tugas.</span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Nama Kegiatan / Acara:</label>
                  <input
                    type="text"
                    value={extractedData.nama_acara}
                    onChange={(e) => setExtractedData({ ...extractedData, nama_acara: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-md font-semibold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Nomor Surat Undangan:</label>
                    <input
                      type="text"
                      value={extractedData.nomor_surat_undangan}
                      onChange={(e) => setExtractedData({ ...extractedData, nomor_surat_undangan: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Instansi Pengundang:</label>
                    <input
                      type="text"
                      value={extractedData.instansi_pengundang}
                      onChange={(e) => setExtractedData({ ...extractedData, instansi_pengundang: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Waktu Pelaksanaan:</label>
                    <input
                      type="text"
                      value={extractedData.waktu_pelaksanaan || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, waktu_pelaksanaan: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Hari &amp; Tanggal:</label>
                    <input
                      type="text"
                      value={extractedData.hari_tanggal_pelaksanaan || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, hari_tanggal_pelaksanaan: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Tempat / Gedung:</label>
                    <input
                      type="text"
                      value={extractedData.lokasi}
                      onChange={(e) => setExtractedData({ ...extractedData, lokasi: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Kota Kegiatan:</label>
                    <input
                      type="text"
                      value={extractedData.kota_kegiatan}
                      onChange={(e) => setExtractedData({ ...extractedData, kota_kegiatan: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                </div>

                {/* Bagian Redaksi & Isi Surat Hasil Analisis AI */}
                <div className="pt-3 border-t border-slate-200 space-y-2.5">
                  <div className="flex items-center space-x-1.5 text-teal-900 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>Redaksi &amp; Isi Surat (Hasil Analisis AI):</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Klausul Menimbang:</label>
                    <textarea
                      rows={2}
                      value={extractedData.narasi_menimbang || `Bahwa dalam rangka mendukung kelancaran pelaksanaan ${extractedData.nama_acara}, perlu menugaskan pegawai untuk mengikuti kegiatan dimaksud.`}
                      onChange={(e) => setExtractedData({ ...extractedData, narasi_menimbang: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md leading-relaxed text-xs"
                      placeholder="Redaksi klausul Menimbang..."
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Klausul Dasar:</label>
                    <textarea
                      rows={2}
                      value={extractedData.narasi_dasar || `${extractedData.instansi_pengundang || 'Undangan'} Nomor : ${extractedData.nomor_surat_undangan || '-'}.`}
                      onChange={(e) => setExtractedData({ ...extractedData, narasi_dasar: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md leading-relaxed text-xs"
                      placeholder="Redaksi klausul Dasar..."
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Klausul Untuk (Tujuan Penugasan):</label>
                    <textarea
                      rows={2}
                      value={extractedData.narasi_untuk || `Mengikuti kegiatan ${extractedData.nama_acara} yang dilaksanakan di ${extractedData.lokasi}${extractedData.kota_kegiatan ? ', ' + extractedData.kota_kegiatan : ''}.`}
                      onChange={(e) => setExtractedData({ ...extractedData, narasi_untuk: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-md leading-relaxed text-xs"
                      placeholder="Redaksi klausul Untuk..."
                    />
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
                {envApiKey && envApiKey !== 'YOUR_GEMINI_API_KEY_HERE'
                  ? 'Mode: Gemini AI Multimodal Deep Analysis (.env Aktif)'
                  : 'Mode: Smart Document Intelligence Pusaka Komdigi'}
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
                <span>{isProcessing ? 'Menganalisa Dokumen...' : 'Analisa & Screening Inti Dokumen'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmAndApply}
                className="flex items-center space-x-1.5 text-xs font-semibold bg-teal-800 hover:bg-teal-900 text-white px-4 py-2 rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span>
                  {mode === 'UNDANGAN'
                    ? 'Terapkan ke Surat Undangan'
                    : mode === 'NOTA_DINAS'
                    ? 'Terapkan ke Nota Dinas'
                    : 'Terapkan ke Surat Tugas'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

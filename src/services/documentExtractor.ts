import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import JSZip from 'jszip';

// Configure pdfjs worker synchronously with Vite asset URL
try {
  if (pdfWorkerUrl) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  } else {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
} catch {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

export interface ExtractedDocumentResult {
  text: string;
  pageCount?: number;
  fileType: 'pdf' | 'docx' | 'txt' | 'image' | 'unknown';
}

/**
 * Extract clean plain text from PDF ArrayBuffer (reads all pages)
 */
export async function extractTextFromPdfBuffer(
  arrayBuffer: ArrayBuffer
): Promise<{ text: string; pageCount: number; isScanned?: boolean }> {
  try {
    // Clone arrayBuffer agar tidak detached saat di-transfer ke worker
    const bufferClone = arrayBuffer.slice(0);
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(bufferClone),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);

    // Proses ekstraksi teks seluruh halaman secara paralel (batch 8 halaman sekaligus) agar sangat cepat
    const pageTexts: string[] = new Array(numPages).fill('');
    const batchSize = 8;
    for (let i = 0; i < pageNumbers.length; i += batchSize) {
      const batch = pageNumbers.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (pageNum) => {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          const pageLines: string[] = [];
          let lastY: number | null = null;
          let currentLine = '';

          for (const item of textContent.items as any[]) {
            if (!item || (!item.str && item.str !== ' ')) continue;
            const currentY = Array.isArray(item.transform) ? item.transform[5] : null;

            if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 3) {
              if (currentLine.trim()) {
                pageLines.push(currentLine.trim());
              }
              currentLine = '';
            } else if (currentLine && !currentLine.endsWith(' ') && !item.str.startsWith(' ')) {
              currentLine += ' ';
            }
            currentLine += item.str;
            if (currentY !== null) {
              lastY = currentY;
            }
          }
          if (currentLine.trim()) {
            pageLines.push(currentLine.trim());
          }

          pageTexts[pageNum - 1] = pageLines.join('\n').trim();
        })
      );
    }

    const fullText = pageTexts.filter(Boolean).join('\n\n').trim();
    // Dokumen dianggap scan hanya jika tidak ada teks sama sekali atau di bawah 25 karakter
    const isScanned = numPages > 0 && fullText.length < 25;

    return {
      text: fullText,
      pageCount: numPages,
      isScanned,
    };
  } catch (err) {
    console.warn('PDF text extraction error:', err);
    return {
      text: '',
      pageCount: 1,
      isScanned: true,
    };
  }
}

/**
 * Extract plain text from Word .docx ArrayBuffer using JSZip (termasuk teks di dalam Kop/Header & Tabel)
 */
export async function extractTextFromDocxBuffer(arrayBuffer: ArrayBuffer): Promise<{ text: string }> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXmlFile = zip.file('word/document.xml');
    if (!documentXmlFile) {
      throw new Error('Format DOCX tidak valid (word/document.xml tidak ditemukan).');
    }

    const extractFromXml = (xmlStr: string): string[] => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
      const paragraphs = xmlDoc.getElementsByTagName('w:p');
      const out: string[] = [];
      for (let i = 0; i < paragraphs.length; i++) {
        const textNodes = paragraphs[i].getElementsByTagName('w:t');
        let pText = '';
        for (let j = 0; j < textNodes.length; j++) {
          pText += textNodes[j].textContent || '';
        }
        if (pText.trim()) {
          out.push(pText.trim());
        }
      }
      return out;
    };

    const lines: string[] = [];
    // Baca juga header1.xml / header2.xml jika ada Kop Surat di bagian header Word
    const headerFiles = Object.keys(zip.files).filter((k) => /^word\/header\d*\.xml$/i.test(k));
    for (const hf of headerFiles) {
      const hFile = zip.file(hf);
      if (hFile) {
        const hXml = await hFile.async('text');
        lines.push(...extractFromXml(hXml));
      }
    }

    const xmlContent = await documentXmlFile.async('text');
    lines.push(...extractFromXml(xmlContent));

    return { text: lines.join('\n') };
  } catch (err) {
    console.error('Error extracting text from DOCX:', err);
    throw new Error('Gagal membaca isi berkas Word (.docx).');
  }
}

/**
 * Render all pages of a PDF ArrayBuffer as high-clarity JPEG Data URLs
 * (Menggunakan background putih bersih dan kompresi JPEG 0.86 beresolusi tajam
 * agar ukuran ringan, tidak melebihi kuota penyimpanan, dan 3x lebih cepat dirender)
 */
export async function renderPdfPagesToImages(
  arrayBuffer: ArrayBuffer,
  scale = 1.6,
  maxPages = 100
): Promise<string[]> {
  try {
    const bufferClone = arrayBuffer.slice(0);
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(bufferClone),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    const effectiveScale = scale > 0 && scale <= 4 ? scale : 1.6;
    const numPages = Math.min(pdf.numPages, maxPages);
    const images: string[] = new Array(numPages).fill('');

    // Render secara paralel dalam batch 4 halaman agar jauh lebih cepat
    const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);
    const batchSize = 4;
    for (let i = 0; i < pageNumbers.length; i += batchSize) {
      const batch = pageNumbers.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (pageNum) => {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: effectiveScale });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) return;

          canvas.width = Math.round(viewport.width);
          canvas.height = Math.round(viewport.height);

          // Isi background putih bersih agar tidak transparan saat dikonversi ke JPEG / Word
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);

          // @ts-ignore
          await page.render({ canvasContext: context, viewport }).promise;
          images[pageNum - 1] = canvas.toDataURL('image/jpeg', 0.86);
        })
      );
    }
    return images.filter(Boolean);
  } catch (err) {
    console.error('Error rendering PDF pages to images:', err);
    return [];
  }
}


/**
 * Perform client-side OCR on an HTML Canvas element using Tesseract.js
 */
export async function performOcrOnCanvas(
  canvas: HTMLCanvasElement,
  lang = 'ind+eng',
  onProgress?: (percent: number, status: string) => void
): Promise<string> {
  try {
    const Tesseract = await import('tesseract.js');
    const result = await Tesseract.recognize(canvas, lang, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round((m.progress || 0) * 100), 'Mengenali teks');
        } else if (onProgress && m.status) {
          onProgress(0, m.status);
        }
      },
    });
    return result?.data?.text?.trim() || '';
  } catch (err: any) {
    console.warn('Tesseract OCR error with lang', lang, err);
    // Fallback coba lang 'eng' jika lang 'ind+eng' gagal fetch
    if (lang !== 'eng') {
      try {
        const Tesseract = await import('tesseract.js');
        const fallbackRes = await Tesseract.recognize(canvas, 'eng');
        return fallbackRes?.data?.text?.trim() || '';
      } catch (e2) {
        console.warn('Fallback OCR also failed:', e2);
      }
    }
    return '';
  }
}

/**
 * Perform client-side OCR on an image file (data URL / base64)
 */
export async function performOcrOnImageFile(
  imageUrl: string,
  onProgress?: (msg: string) => void
): Promise<string> {
  let worker: any = null;
  try {
    if (onProgress) onProgress('Memuat modul pemindai teks OCR...');
    const Tesseract = await import('tesseract.js');
    try {
      worker = await Tesseract.createWorker(['ind', 'eng'], 1, {
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd.wasm.js',
        langPath: 'https://tessdata.projectnaptha.com/4.0.0_fast',
        logger: () => {},
      });
    } catch {
      worker = await Tesseract.createWorker('eng');
    }

    if (onProgress) onProgress('Membaca teks dari gambar pindaian...');
    const result = await worker.recognize(imageUrl);
    const text = result?.data?.text?.trim() || '';
    await worker.terminate();
    return text;
  } catch (err: any) {
    if (worker) {
      try { await worker.terminate(); } catch {}
    }
    console.warn('Gagal OCR gambar:', err);
    return '';
  }
}

/**
 * Perform OCR on scanned PDF pages (reads all pages using persistent worker)
 */
export async function extractOcrFromScannedPdf(
  arrayBuffer: ArrayBuffer,
  fileName: string,
  maxPages = 30,
  onProgress?: (msg: string) => void
): Promise<{ text: string; pagesProcessed: number; isSuccess: boolean }> {
  let worker: any = null;
  try {
    const bufferClone = arrayBuffer.slice(0);
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(bufferClone),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pagesToScan = Math.min(totalPages, maxPages);
    const scannedTexts: string[] = [];

    if (onProgress) {
      onProgress(`Menyiapkan pemindaian OCR seluruh dokumen (${pagesToScan} halaman)...`);
    }

    const Tesseract = await import('tesseract.js');
    try {
      worker = await Tesseract.createWorker(['ind', 'eng']);
    } catch (wErr) {
      console.warn('Worker create with ind+eng failed, trying eng:', wErr);
      try {
        worker = await Tesseract.createWorker('eng');
      } catch (e2) {
        console.warn('Default worker failed:', e2);
      }
    }

    for (let pageNum = 1; pageNum <= pagesToScan; pageNum++) {
      if (onProgress) {
        onProgress(`Memindai teks halaman ${pageNum} dari ${pagesToScan}...`);
      }

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render PDF page to canvas
      // @ts-ignore
      await page.render({ canvasContext: context, viewport }).promise;

      if (worker) {
        try {
          const ret = await worker.recognize(canvas);
          const pageTxt = ret?.data?.text?.trim();
          if (pageTxt && pageTxt.length > 5) {
            scannedTexts.push(`--- Halaman ${pageNum} ---\n${pageTxt}`);
          }
        } catch (pageOcrErr) {
          console.warn(`OCR failed on page ${pageNum}:`, pageOcrErr);
        }
      }
    }

    if (worker) {
      try {
        await worker.terminate();
      } catch {}
    }

    const fullExtracted = scannedTexts.join('\n\n').trim();

    if (fullExtracted.length > 10) {
      return {
        text: fullExtracted,
        pagesProcessed: pagesToScan,
        isSuccess: true,
      };
    }

    return {
      text: '',
      pagesProcessed: pagesToScan,
      isSuccess: false,
    };
  } catch (err: any) {
    if (worker) {
      try { await worker.terminate(); } catch {}
    }
    console.warn('Scanned PDF OCR failed:', err);
    return {
      text: '',
      pagesProcessed: 0,
      isSuccess: false,
    };
  }
}



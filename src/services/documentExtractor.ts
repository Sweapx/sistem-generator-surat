import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Configure pdfjs worker safely for Vite browser environment
try {
  // Use official CDN worker matching installed pdfjs-dist version (3.11.174)
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
} catch (e) {
  console.warn('PDF.js worker initialization notice:', e);
}

export interface ExtractedDocumentResult {
  text: string;
  pageCount?: number;
  fileType: 'pdf' | 'docx' | 'txt' | 'image' | 'unknown';
}

/**
 * Extract clean plain text from PDF ArrayBuffer
 */
export async function extractTextFromPdfBuffer(arrayBuffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Group items with newline awareness
      let lastY: number | null = null;
      let pageStr = '';

      for (const item of textContent.items as any[]) {
        if (!item.str) continue;
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          pageStr += '\n';
        } else if (pageStr && !pageStr.endsWith(' ') && !pageStr.endsWith('\n')) {
          pageStr += ' ';
        }
        pageStr += item.str;
        lastY = item.transform[5];
      }

      const trimmed = pageStr.trim();
      if (trimmed) {
        pageTexts.push(trimmed);
      }
    }

    return {
      text: pageTexts.join('\n\n--- Halaman Berikutnya ---\n\n'),
      pageCount: numPages,
    };
  } catch (err) {
    console.error('Error extracting text from PDF:', err);
    throw new Error('Gagal mengekstrak teks dari berkas PDF. Pastikan berkas PDF bukan hasil scan gambar murni tanpa OCR.');
  }
}

/**
 * Extract plain text from Word .docx ArrayBuffer using JSZip
 */
export async function extractTextFromDocxBuffer(arrayBuffer: ArrayBuffer): Promise<{ text: string }> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXmlFile = zip.file('word/document.xml');
    if (!documentXmlFile) {
      throw new Error('Format DOCX tidak valid (word/document.xml tidak ditemukan).');
    }

    const xmlContent = await documentXmlFile.async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    // Extract paragraphs <w:p>
    const paragraphs = xmlDoc.getElementsByTagName('w:p');
    const lines: string[] = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const textNodes = paragraphs[i].getElementsByTagName('w:t');
      let pText = '';
      for (let j = 0; j < textNodes.length; j++) {
        pText += textNodes[j].textContent || '';
      }
      if (pText.trim()) {
        lines.push(pText.trim());
      }
    }

    return { text: lines.join('\n') };
  } catch (err) {
    console.error('Error extracting text from DOCX:', err);
    throw new Error('Gagal membaca isi berkas Word (.docx).');
  }
}

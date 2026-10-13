/**
 * Code.gs — Google Apps Script Penomoran Surat Resmi
 * Pusat Kebijakan Strategis (PUSAKA) — Kementerian Komunikasi dan Digital RI
 *
 * CARA PASANG DI SPREADSHEET KANTOR:
 * 1. Buka Google Spreadsheet buku agenda penomoran kantor Anda.
 * 2. Klik menu "Extensions" (Ekstensi) → "Apps Script".
 * 3. Hapus semua kode yang ada di editor Apps Script, lalu tempelkan (paste) seluruh isi file ini.
 * 4. (Opsional) Jika nama tab sheet buku agenda Anda bukan sheet pertama,
 *    isi nama tab di `CONFIG.SHEET_NOMOR_SURAT` di bawah (misal '2026' atau 'Penomoran 2026').
 *    Jika dibiarkan kosong, script otomatis memakai sheet aktif / sheet pertama.
 * 5. Klik "Deploy" (Terapkan) → "New Deployment" (Penerapan Baru).
 *    - Pilih type: "Web App"
 *    - Description: "API Penomoran Surat Pusaka"
 *    - Execute as: "Me" (email Anda)
 *    - Who has access: "Anyone within [Kemenkomdigi]" atau "Anyone"
 * 6. Klik "Deploy" dan izinkan akses (Authorize Access).
 * 7. Salin Web App URL yang dihasilkan (contoh: https://script.google.com/macros/s/.../exec).
 * 8. Buka aplikasi web Surat Tugas, klik indikator "Sheets" di Navbar, lalu paste URL tersebut.
 */

var CONFIG = {
  // ID file Google Spreadsheet kantor (diambil dari URL)
  SPREADSHEET_ID: '1iOquKaaFq7ESIOA-hD2zW0mYtoeFlzpGpUMj8tW4geg',

  // GID tab sheet tujuan (sesuai URL: gid=599707024)
  SHEET_GID: '599707024',

  // Nama sheet/tab buku agenda (opsional jika SHEET_GID sudah diisi).
  SHEET_NOMOR_SURAT: '',

  // Baris tempat judul kolom/header berada (pada format kantor Anda adalah baris 5)
  DEFAULT_HEADER_ROW: 5,

  // ID Folder Utama Google Drive untuk Arsip PDF Surat Tugas:
  // URL: https://drive.google.com/drive/folders/11qtu8wXAqElbXG2Zr47M7SydcpiLC0_H
  DRIVE_PARENT_FOLDER_ID: '11qtu8wXAqElbXG2Zr47M7SydcpiLC0_H',
};

// ════════════════════════════════════════════
// MENU SPREADSHEET OTOMATIS (1-KLIK DI GOOGLE SPREADSHEET)
// ════════════════════════════════════════════

function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('📌 Pusaka Surat Tugas')
      .addItem('📅 Format Kolom Tanggal (Aktifkan Date Picker Kalender)', 'menuFormatKolomTanggal')
      .addItem('☁️ Otorisasi & Buat Folder Bulan Ini', 'menuUjiGoogleDrive')
      .addToUi();
  } catch (e) {}
}

function menuFormatKolomTanggal() {
  var ui = SpreadsheetApp.getUi();
  try {
    ensureIndonesianLocale();
    var res = fixExistingDatesInSheet();
    ui.alert(
      '✅ Format Berhasil Diperbarui!',
      '1. Tanggal: ' + res.modifiedDates + ' baris tanggal telah diset ke format resmi (Date Picker aktif).\n' +
      '2. Link PDF: ' + res.fixedPdfLinks + ' tautan PDF yang sebelumnya #ERROR! telah berhasil diperbaiki menjadi tautan aktif.\n\n' +
      'Catatan Nama Bulan:\n' +
      'Lokalitas spreadsheet telah diset ke Indonesia.\n' +
      'Jika di layar Anda nama bulan masih bahasa Inggris (October), silakan refresh halaman (F5) atau buka menu File -> Settings -> Ubah Locale ke Indonesia.',
      ui.ButtonSet.OK
    );
  } catch (err) {
    ui.alert('❌ Gagal Format Tanggal', err.message, ui.ButtonSet.OK);
  }
}

/**
 * Memastikan Locale Spreadsheet diatur ke Indonesia ('id_ID')
 * agar format tanggal 'd MMMM' otomatis menampilkan nama bulan bahasa Indonesia (Oktober, bukan October).
 */
function ensureIndonesianLocale() {
  try {
    var ss = getTargetSpreadsheet();
    var cur = (ss.getSpreadsheetLocale() || '').toLowerCase();
    if (cur !== 'id' && cur !== 'id_id' && cur !== 'in_id') {
      try {
        ss.setSpreadsheetLocale('id_ID');
      } catch (e1) {
        ss.setSpreadsheetLocale('id');
      }
    }
    try {
      ss.setSpreadsheetTimeZone('Asia/Jakarta');
    } catch (e2) {}
  } catch (err) {
    Logger.log('Gagal mengatur locale spreadsheet: ' + err.message);
  }
}

/**
 * Memperbarui semua baris tanggal di spreadsheet agar menjadi tipe Date resmi
 * dan memasang Data Validation Date (Date Picker) ke seluruh kolom B,
 * serta memperbaiki sel yang terkena #ERROR! pada Kolom K (Link Berkas PDF).
 */
function fixExistingDatesInSheet() {
  ensureIndonesianLocale();
  var sheet = getTargetSheet();
  var headerInfo = findHeaderMapping(sheet);
  var headerRow = headerInfo.headerRow;
  var lastRow = sheet.getLastRow();
  if (lastRow <= headerRow) return { modifiedDates: 0, fixedPdfLinks: 0 };

  var numRows = lastRow - headerRow;
  var tanggalCol = 2; // Kolom B
  if (headerInfo.colMap['TANGGAL']) {
    tanggalCol = headerInfo.colMap['TANGGAL'];
  }

  var range = sheet.getRange(headerRow + 1, tanggalCol, numRows, 1);
  var values = range.getValues();
  var updatedValues = [];
  var modifiedCount = 0;

  for (var i = 0; i < values.length; i++) {
    var val = values[i][0];
    if (val === '' || val === null || val === undefined) {
      updatedValues.push([val]);
      continue;
    }
    if (val instanceof Date) {
      updatedValues.push([val]);
    } else {
      var d = parseDateValue(val);
      updatedValues.push([d]);
      modifiedCount++;
    }
  }

  range.setValues(updatedValues);
  range.setNumberFormat('d MMMM');

  // Pasang Data Validation requireDate() agar double-click memunculkan kalender date picker
  var dateValidation = SpreadsheetApp.newDataValidation().requireDate().build();
  range.setDataValidation(dateValidation);

  // ── Perbaiki juga sel #ERROR! pada Kolom K (Link Berkas TTE Pdf) ──
  var fixedPdfLinks = 0;
  try {
    var pdfRange = sheet.getRange(headerRow + 1, 11, numRows, 1);
    var pdfValues = pdfRange.getValues();
    var pdfFormulas = pdfRange.getFormulas();
    for (var k = 0; k < pdfValues.length; k++) {
      var rowIdx = headerRow + 1 + k;
      var cellVal = String(pdfValues[k][0] || '');
      var cellFormula = String(pdfFormulas[k][0] || '');
      if (cellVal === '#ERROR!' || cellVal.indexOf('ERROR') !== -1 || cellFormula.indexOf('ERROR') !== -1) {
        var noVal = sheet.getRange(rowIdx, 1).getValue();
        var defaultFileName = 'Surat_Tugas_' + noVal + '_SJ.9_KP.01.06_10_2026.pdf';
        
        // Ekstrak URL dari formula jika ada
        var matchUrl = cellFormula.match(/https:\/\/[^\s"',;)]+/);
        var targetCell = sheet.getRange(rowIdx, 11);
        
        if (matchUrl && matchUrl[0]) {
          var rtv = SpreadsheetApp.newRichTextValue()
            .setText(defaultFileName)
            .setLinkUrl(matchUrl[0])
            .build();
          targetCell.setValue(defaultFileName);
          targetCell.setRichTextValue(rtv);
          fixedPdfLinks++;
        } else {
          try {
            var files = DriveApp.getFilesByName(defaultFileName);
            if (files.hasNext()) {
              var f = files.next();
              var rtv2 = SpreadsheetApp.newRichTextValue()
                .setText(defaultFileName)
                .setLinkUrl(f.getUrl())
                .build();
              targetCell.setValue(defaultFileName);
              targetCell.setRichTextValue(rtv2);
              fixedPdfLinks++;
            } else {
              targetCell.setValue(defaultFileName);
              fixedPdfLinks++;
            }
          } catch (eDrive) {
            targetCell.setValue(defaultFileName);
            fixedPdfLinks++;
          }
        }
      }
    }
  } catch (errPdfFix) {
    Logger.log('Gagal perbaiki error link pdf: ' + errPdfFix.message);
  }

  return { modifiedDates: modifiedCount, fixedPdfLinks: fixedPdfLinks };
}

function menuUjiGoogleDrive() {
  var ui = SpreadsheetApp.getUi();
  try {
    var res = testDriveOtorisasi();
    ui.alert(
      '✅ Google Drive Berhasil Terhubung!',
      'Folder bulan dan file uji berhasil dibuat di Google Drive:\n\n' +
      '• Folder Induk: ' + res.parentFolder + '\n' +
      '• Folder Bulan: ' + res.monthFolder + '\n' +
      '• File Uji: uji_koneksi_drive.txt\n\n' +
      'Sistem arsip otomatis Google Drive kini siap digunakan!',
      ui.ButtonSet.OK
    );
  } catch (err) {
    ui.alert(
      '❌ Kendala Akses Google Drive',
      'Detail kendala:\n' + err.message + '\n\n' +
      'Solusi:\n1. Pastikan akun Google yang Anda gunakan memiliki akses "Editor" ke folder arsip kantor (ID: ' + CONFIG.DRIVE_PARENT_FOLDER_ID + ').\n' +
      '2. Jika baru pertama kali, berikan izin saat Google meminta otorisasi.',
      ui.ButtonSet.OK
    );
  }
}

// ════════════════════════════════════════════
// FUNGSI OTORISASI & TEST GOOGLE DRIVE
// ════════════════════════════════════════════

function testDriveOtorisasi() {
  var parent = getTargetDriveParentFolder();
  var parentName = parent.getName();
  var parentUrl = parent.getUrl();
  Logger.log('Parent Folder: ' + parentName + ' (' + parentUrl + ')');

  var now = new Date();
  var monthFolder = getOrCreateMonthFolder(parent, now.getFullYear(), now.getMonth());
  Logger.log('Folder Bulan: ' + monthFolder.getName() + ' (' + monthFolder.getUrl() + ')');

  var testFile = monthFolder.createFile('uji_koneksi_drive.txt', 'Integrasi Google Drive dan Apps Script Berhasil Aktif pada: ' + new Date().toString());
  Logger.log('File Uji: ' + testFile.getName() + ' (' + testFile.getUrl() + ')');

  return {
    status: 'success',
    message: 'Izin Google Drive berhasil aktif!',
    parentFolder: parentName,
    monthFolder: monthFolder.getName(),
    monthFolderUrl: monthFolder.getUrl(),
    testFileUrl: testFile.getUrl()
  };
}

// ════════════════════════════════════════════
// Entry Point — GET & POST Router
// ════════════════════════════════════════════

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'ping';
  return handleAction(action, null);
}

function doPost(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  var payload = null;
  try {
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
      if (!action && payload.action) action = payload.action;
    }
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'Invalid JSON payload: ' + err.message });
  }
  return handleAction(action, payload);
}

function handleAction(action, payload) {
  try {
    switch (action) {
      case 'ping':
        return jsonResponse({
          status: 'ok',
          result: {
            service: 'API Penomoran Surat PUSAKA Komdigi',
            timestamp: new Date().toISOString(),
            lastNomor: getLastNomor(),
          },
        });

      case 'testDrive':
        return jsonResponse({ status: 'ok', result: testDriveOtorisasi() });

      case 'getLastNomor':
        return jsonResponse({ status: 'ok', result: getLastNomor() });

      case 'appendNomorSurat':
        var recordToSave = (payload && payload.record) ? payload.record : payload;
        return jsonResponse({ status: 'ok', result: appendNomorSurat(recordToSave) });

      case 'getNomorSurat':
        return jsonResponse({ status: 'ok', result: getNomorSurat() });

      case 'fixDates':
      case 'formatTanggal':
        return jsonResponse({ status: 'ok', result: { modified: fixExistingDatesInSheet() } });

      default:
        return jsonResponse({ status: 'error', message: 'Action tidak dikenal: ' + action });
    }
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message, stack: err.stack });
  }
}

function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ════════════════════════════════════════════
// Spreadsheet Helper
// ════════════════════════════════════════════

function getTargetSpreadsheet() {
  var rawId = (CONFIG.SPREADSHEET_ID || '').trim();
  
  // Jika pengguna menempelkan seluruh link Google Spreadsheet, otomatis ambil ID-nya
  if (rawId.indexOf('docs.google.com/spreadsheets/d/') !== -1) {
    var match = rawId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      rawId = match[1];
    }
  }

  // Jika tidak sengaja memasukkan Deployment ID (berawalan AKfyc...)
  if (rawId.indexOf('AKfyc') === 0) {
    throw new Error(
      'ID yang Anda masukkan adalah ID Penerapan Web App (' + rawId + '), BUKAN ID Spreadsheet. ' +
      'Silakan buka Google Spreadsheet Anda di browser, salin URL-nya (contoh: https://docs.google.com/spreadsheets/d/1AbC.../edit) ' +
      'dan tempelkan langsung ke SPREADSHEET_ID di Code.gs.'
    );
  }

  if (rawId !== '') {
    try {
      var ssById = SpreadsheetApp.openById(rawId);
      if (ssById) return ssById;
    } catch (err) {
      throw new Error(
        'Gagal membuka Spreadsheet dengan ID "' + rawId + '". Pastikan ID benar dan akun Google Anda memiliki akses ke Spreadsheet tersebut. Detail: ' + err.message
      );
    }
  }

  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {}

  if (!ss) {
    throw new Error(
      'SPREADSHEET_ID belum terisi dengan benar. Silakan salin link URL Google Spreadsheet Anda di browser lalu masukkan ke CONFIG.SPREADSHEET_ID di Code.gs.'
    );
  }
  return ss;
}

function getTargetSheet() {
  var ss = getTargetSpreadsheet();
  if (!ss) {
    throw new Error('Spreadsheet tidak ditemukan.');
  }

  // 1. Coba cari berdasarkan SHEET_GID jika ada
  var gid = (CONFIG.SHEET_GID || '').trim();
  if (gid) {
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if (String(sheets[i].getSheetId()) === String(gid)) {
        return sheets[i];
      }
    }
  }

  // 2. Coba cari berdasarkan Nama Sheet jika diisi
  if (CONFIG.SHEET_NOMOR_SURAT && CONFIG.SHEET_NOMOR_SURAT.trim() !== '') {
    var s = ss.getSheetByName(CONFIG.SHEET_NOMOR_SURAT.trim());
    if (s) return s;
  }

  // 3. Fallback sheet pertama
  return ss.getSheets()[0];
}

/**
 * Mencari baris header dan memetakan nama kolom ke index 1-based
 */
function findHeaderMapping(sheet) {
  var maxSearchRow = Math.min(15, sheet.getLastRow());
  if (maxSearchRow < 1) maxSearchRow = 1;

  var rangeValues = sheet.getRange(1, 1, maxSearchRow, sheet.getLastColumn()).getValues();
  var headerRowIndex = -1;
  var colMap = {};

  for (var r = 0; r < rangeValues.length; r++) {
    var row = rangeValues[r];
    for (var c = 0; c < row.length; c++) {
      var cell = String(row[c]).trim().toUpperCase();
      if (cell === 'NOMOR' || cell === 'NO' || cell === 'NO.') {
        headerRowIndex = r + 1; // 1-based
        break;
      }
    }
    if (headerRowIndex !== -1) {
      // Map all columns in this header row
      for (var col = 0; col < row.length; col++) {
        var hName = String(row[col]).trim();
        if (hName) {
          colMap[hName] = col + 1; // 1-based
        }
      }
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = CONFIG.DEFAULT_HEADER_ROW;
  }

  return {
    headerRow: headerRowIndex,
    colMap: colMap,
  };
}

// ════════════════════════════════════════════
// 1. GET NOMOR TERAKHIR (Real-Time)
// ════════════════════════════════════════════

function getLastNomor() {
  var sheet = getTargetSheet();
  var headerInfo = findHeaderMapping(sheet);
  var headerRow = headerInfo.headerRow;
  var lastRow = sheet.getLastRow();

  if (lastRow <= headerRow) {
    return { nomor_urut: 0, tahun: new Date().getFullYear(), next_nomor: 1 };
  }

  // Kolom A adalah NOMOR (index 1)
  var nomorCol = 1;
  if (headerInfo.colMap['NOMOR']) {
    nomorCol = headerInfo.colMap['NOMOR'];
  }

  var numRows = lastRow - headerRow;
  var values = sheet.getRange(headerRow + 1, nomorCol, numRows, 1).getValues();

  var maxNomor = 0;
  for (var i = 0; i < values.length; i++) {
    var cellVal = values[i][0];
    if (cellVal === '' || cellVal === null || cellVal === undefined) continue;

    var num = parseInt(cellVal, 10);
    if (!isNaN(num) && num > maxNomor) {
      maxNomor = num;
    }
  }

  var currentYear = new Date().getFullYear();

  return {
    nomor_urut: maxNomor,
    tahun: currentYear,
    next_nomor: maxNomor + 1,
  };
}

// ════════════════════════════════════════════
// Google Drive Helper (Auto Folder per Bulan & Simpan PDF)
// ════════════════════════════════════════════

var NAMA_BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Dapatkan Folder Utama (Parent) di Google Drive berdasarkan CONFIG.
 */
function getTargetDriveParentFolder() {
  var rawId = (CONFIG.DRIVE_PARENT_FOLDER_ID || '').trim();
  if (rawId.indexOf('drive.google.com') !== -1) {
    var match = rawId.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) rawId = match[1];
  }
  if (!rawId) {
    throw new Error('DRIVE_PARENT_FOLDER_ID belum diisi di CONFIG Code.gs.');
  }

  try {
    return DriveApp.getFolderById(rawId);
  } catch (err) {
    throw new Error(
      'Gagal mengakses folder arsip Google Drive (ID: ' + rawId + '). ' +
      'Pastikan akun Google Anda memiliki akses Edit ke folder tersebut dan izin DriveApp sudah disetujui. Detail: ' + err.message
    );
  }
}

/**
 * Cari atau buat folder bulan otomatis di dalam parent folder.
 * Format nama folder: "10 - Oktober 2026"
 */
function getOrCreateMonthFolder(parentFolder, year, monthIndex) {
  var monthName = NAMA_BULAN_INDONESIA[monthIndex] || 'Bulan';
  var monthPad = (monthIndex + 1 < 10 ? '0' : '') + (monthIndex + 1);
  var folderName = monthPad + ' - ' + monthName + ' ' + year;

  // Cek apakah folder dengan format "10 - Oktober 2026" sudah ada
  var folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }

  // Cek juga kemungkinan folder bernama "Oktober 2026" tanpa awalan angka
  var altName = monthName + ' ' + year;
  var altFolders = parentFolder.getFoldersByName(altName);
  if (altFolders.hasNext()) {
    return altFolders.next();
  }

  // Jika belum ada, buat folder bulan baru langsung di dalam parent folder!
  return parentFolder.createFolder(folderName);
}

/**
 * Simpan file PDF (dari Base64) ke dalam folder bulan di Google Drive.
 * Mengembalikan objek berisi URL file dan ID file.
 */
function uploadPdfToDrive(targetFolder, pdfBase64, fileName) {
  if (!pdfBase64) return null;

  var cleanBase64 = pdfBase64;
  if (cleanBase64.indexOf('base64,') !== -1) {
    cleanBase64 = cleanBase64.split('base64,')[1];
  }

  var bytes = Utilities.base64Decode(cleanBase64);
  var blob = Utilities.newBlob(bytes, 'application/pdf', fileName);
  var file = targetFolder.createFile(blob);

  // Set file viewable by anyone with link jika lingkungan mengizinkan
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    // Di domain kementerian yang dibatasi, izin diturunkan langsung dari folder induk
  }

  return {
    fileId: file.getId(),
    fileUrl: file.getUrl(),
    fileName: fileName,
    folderName: targetFolder.getName(),
  };
}

// ════════════════════════════════════════════
// 2. APPEND NOMOR SURAT BARU KE SPREADSHEET & GDRIVE
// ════════════════════════════════════════════

function appendNomorSurat(record) {
  if (!record) {
    throw new Error('Data record surat kosong.');
  }

  ensureIndonesianLocale();
  var sheet = getTargetSheet();
  var headerInfo = findHeaderMapping(sheet);
  var headerRow = headerInfo.headerRow;
  var lastRow = sheet.getLastRow();

  // Tentukan nomor urut berikutnya jika tidak dikirim
  var nomorUrut = record.nomor_urut;
  if (!nomorUrut) {
    var lastInfo = getLastNomor();
    nomorUrut = lastInfo.next_nomor;
  }

  // Parse tanggal menjadi objek Date nyata agar Google Sheets mengenali sebagai tipe Tanggal resmi
  var dateVal = parseDateValue(record.tanggal || record.tanggal_surat || record.tanggal_dibuat);
  var tanggalDisplayStr = formatTanggalIndoOutput(dateVal);

  // Tentukan tahun dan bulan untuk folder Google Drive
  var year = record.tahun || dateVal.getFullYear();
  var monthIndex = dateVal.getMonth(); // 0-11

  var monthPad = (monthIndex + 1 < 10 ? '0' : '') + (monthIndex + 1);
  var defaultPdfFileName = record.pdf_filename || (
    'Surat_Tugas_' + nomorUrut + '_SJ.9_KP.01.06_' + monthPad + '_' + year + '.pdf'
  );

  // ── Pengelolaan Folder Google Drive & Upload Berkas PDF ──
  var driveUploadInfo = null;
  var targetMonthFolder = null;
  var driveErrorMsg = null;

  try {
    var parentFolder = getTargetDriveParentFolder();
    // Otomatis cari atau buat folder bulan di dalam folder arsip (misal: "10 - Oktober 2026")
    targetMonthFolder = getOrCreateMonthFolder(parentFolder, year, monthIndex);

    if (record.pdf_base64 && record.pdf_base64.length > 50) {
      // 1. Simpan file PDF asli hasil konversi
      driveUploadInfo = uploadPdfToDrive(targetMonthFolder, record.pdf_base64, defaultPdfFileName);
    } else {
      // 2. Jika base64 belum terkirim dari browser, buat file arsip PDF resmi di folder bulan
      var fileContent = 'KEMENTERIAN KOMUNIKASI DAN DIGITAL RI\n' +
        'PUSAT KEBIJAKAN STRATEGIS\n\n' +
        'SURAT TUGAS RESMI\n' +
        'Nomor: ' + (record.nomor_lengkap || (nomorUrut + '/SJ.9/KP.01.06/' + monthPad + '/' + year)) + '\n' +
        'Tanggal: ' + tanggalStr + '\n' +
        'Perihal: ' + (record.perihal || record.hal || record.nama_acara || '-') + '\n' +
        'Kepada: ' + (record.kepada || record.nama_pegawai || 'Terlampir') + '\n';
      var fallbackBlob = Utilities.newBlob(fileContent, 'application/pdf', defaultPdfFileName);
      var createdFile = targetMonthFolder.createFile(fallbackBlob);
      try {
        createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {}
      driveUploadInfo = {
        fileId: createdFile.getId(),
        fileUrl: createdFile.getUrl(),
        fileName: defaultPdfFileName,
        folderName: targetMonthFolder.getName(),
      };
    }
  } catch (driveErr) {
    driveErrorMsg = driveErr.message || String(driveErr);
    Logger.log('Gagal memproses Google Drive: ' + driveErrorMsg);
  // Susun nilai kolom sesuai susunan spreadsheet kantor
  // A: NOMOR
  // B: TANGGAL
  // C: JENIS
  // D: KEPADA
  // E: HAL + tanggal Undangan (untuk undangan)
  // F: STATUS TTD
  // G: TOPIK TIM
  // H: KONSEPTOR
  // I: STATUS SURAT
  // J: Link Berkas Word
  // K: Link Berkas TTE Pdf

  var jenis = record.jenis || 'ST';
  var kepada = record.kepada || (record.jumlah_pegawai > 3 ? 'Daftar Terlampir' : (record.nama_pegawai || 'Terlampir'));
  var hal = record.perihal || record.hal || record.nama_acara || '';
  var statusTtd = record.status_ttd || (record.penandatangan_nama ? 'Kapus' : 'Kapus');
  var topikTim = record.topik_tim || record.unit_kerja || 'TU';
  var konseptor = record.konseptor || record.dibuat_oleh || '';
  var statusSurat = driveErrorMsg ? ('Err Drive: ' + driveErrorMsg.slice(0, 35)) : (record.status_surat || 'OK');
  var linkWord = record.link_word || '-';

  // Masukkan teks nama file biasa ke newRow agar setValues tidak pernah menghasilkan #ERROR!
  var newRow = [
    nomorUrut,
    dateVal,
    jenis,
    kepada,
    hal,
    statusTtd,
    topikTim,
    konseptor,
    statusSurat,
    linkWord,
    defaultPdfFileName,
  ];

  // Cari baris kosong berikutnya di kolom A
  var targetRow = lastRow + 1;
  if (lastRow > headerRow) {
    var lastValInA = sheet.getRange(lastRow, 1).getValue();
    if (lastValInA === '' || lastValInA === null) {
      targetRow = lastRow;
    }
  }

  sheet.getRange(targetRow, 1, 1, newRow.length).setValues([newRow]);

  // 1. Format kolom tanggal (Kolom B / index 2) sebagai Date dan Date Picker kalender
  try {
    var dateCell = sheet.getRange(targetRow, 2);
    dateCell.setNumberFormat('d MMMM');
    var dateValidation = SpreadsheetApp.newDataValidation().requireDate().build();
    dateCell.setDataValidation(dateValidation);
  } catch (errDate) {
    Logger.log('Gagal set validasi/format tanggal: ' + errDate.message);
  }

  // 2. Pasang Tautan PDF ke Kolom K (Kolom 11) - Aman dari error formula HYPERLINK
  if (driveUploadInfo && driveUploadInfo.fileUrl) {
    var pdfCell = sheet.getRange(targetRow, 11);
    try {
      // Pasang RichTextValue: Teks nama berkas langsung menjadi hyperlink aktif yang bisa diklik
      var richText = SpreadsheetApp.newRichTextValue()
        .setText(defaultPdfFileName)
        .setLinkUrl(driveUploadInfo.fileUrl)
        .build();
      pdfCell.setValue(defaultPdfFileName);
      pdfCell.setRichTextValue(richText);
    } catch (errRtv) {
      // Fallback formula sesuai locale
      try {
        pdfCell.setFormula('=HYPERLINK("' + driveUploadInfo.fileUrl + '"; "' + defaultPdfFileName + '")');
      } catch (e1) {
        try {
          pdfCell.setFormula('=HYPERLINK("' + driveUploadInfo.fileUrl + '", "' + defaultPdfFileName + '")');
        } catch (e2) {}
      }
    }
  }

  return {
    id: record.id || ('ns-' + Date.now()),
    nomor_urut: nomorUrut,
    nomor_lengkap: record.nomor_lengkap || (nomorUrut + '/SJ.9/KP.01.06/' + monthPad + '/' + year),
    tanggal_dibuat: tanggalDisplayStr,
    perihal: hal,
    status: driveUploadInfo
      ? 'Tersimpan di Spreadsheet & File Terunggah di Google Drive'
      : (targetMonthFolder ? 'Tersimpan di Spreadsheet & Terhubung Folder Drive' : ('Gagal Drive: ' + (driveErrorMsg || 'Unknown'))),
    row_number: targetRow,
    drive_url: (driveUploadInfo && driveUploadInfo.fileUrl) || (targetMonthFolder ? targetMonthFolder.getUrl() : null),
    drive_file_id: driveUploadInfo ? driveUploadInfo.fileId : null,
    drive_folder: (driveUploadInfo && driveUploadInfo.folderName) || (targetMonthFolder ? targetMonthFolder.getName() : null),
    drive_error: driveErrorMsg,
  };
}

// ════════════════════════════════════════════
// 3. GET RIWAYAT SEMUA SURAT
// ════════════════════════════════════════════

function getNomorSurat() {
  var sheet = getTargetSheet();
  var headerInfo = findHeaderMapping(sheet);
  var headerRow = headerInfo.headerRow;
  var lastRow = sheet.getLastRow();

  if (lastRow <= headerRow) return [];

  var numRows = lastRow - headerRow;
  var data = sheet.getRange(headerRow + 1, 1, numRows, 11).getValues();
  var formulasPdf = sheet.getRange(headerRow + 1, 11, numRows, 1).getFormulas();
  var richTextPdf = sheet.getRange(headerRow + 1, 11, numRows, 1).getRichTextValues();
  var records = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var noVal = row[0];
    if (noVal === '' || noVal === null || noVal === undefined) continue;

    var noUrut = parseInt(noVal, 10);
    var rawLinkPdf = String(row[10] || '');
    var pdfFormula = formulasPdf[i] ? formulasPdf[i][0] : '';
    var driveUrl = '';

    // Ekstrak URL dari formula =HYPERLINK("https://...", "...") jika ada
    if (pdfFormula && pdfFormula.indexOf('HYPERLINK') !== -1) {
      var matchUrl = pdfFormula.match(/HYPERLINK\("([^"]+)"/i);
      if (matchUrl && matchUrl[1]) {
        driveUrl = matchUrl[1];
      }
    }
    if (!driveUrl && pdfFormula) {
      var matchDirect = pdfFormula.match(/https:\/\/[^\s"',;)]+/);
      if (matchDirect) driveUrl = matchDirect[0];
    }
    if (!driveUrl && richTextPdf[i] && richTextPdf[i][0]) {
      var rtvUrl = richTextPdf[i][0].getLinkUrl();
      if (rtvUrl) driveUrl = rtvUrl;
    }
    if (!driveUrl && rawLinkPdf.indexOf('http') === 0) {
      driveUrl = rawLinkPdf;
    }

    var cleanLinkPdf = rawLinkPdf;
    if (cleanLinkPdf === '#ERROR!' || cleanLinkPdf.indexOf('ERROR') !== -1) {
      cleanLinkPdf = 'Surat_Tugas_' + (noUrut || i + 1) + '_SJ.9_KP.01.06_10_2026.pdf';
    }

    records.push({
      id: 'ns-' + (noUrut || i + 1),
      nomor_urut: isNaN(noUrut) ? 0 : noUrut,
      nomor_lengkap: isNaN(noUrut) ? String(noVal) : (noUrut + '/SJ.9/KP.01.06/09/2026'),
      tanggal_dibuat: formatTanggalIndoOutput(row[1]),
      jenis: String(row[2] || ''),
      kepada: String(row[3] || ''),
      perihal: String(row[4] || ''),
      status_ttd: String(row[5] || ''),
      topik_tim: String(row[6] || ''),
      dibuat_oleh: String(row[7] || ''),
      konseptor: String(row[7] || ''),
      status_surat: String(row[8] || ''),
      link_word: String(row[9] || ''),
      link_pdf: cleanLinkPdf,
      drive_url: driveUrl,
      tahun: 2026,
    });
  }

  return records;
}

function parseDateValue(input) {
  if (!input) return new Date();
  if (input instanceof Date) return input;

  if (typeof input === 'string') {
    var trimmed = input.trim();
    // 1. Format ISO YYYY-MM-DD
    var isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
    }

    // 2. Format Indonesia: "13 Oktober 2026" atau "30 September"
    var bulanIndo = {
      januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
      juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
      jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, jun: 5,
      jul: 6, ags: 7, agu: 7, sep: 8, okt: 9, nov: 10, des: 11
    };
    var indoMatch = trimmed.match(/^(\d{1,2})\s+([a-zA-Z]+)(?:\s+(\d{4}))?/i);
    if (indoMatch) {
      var d = parseInt(indoMatch[1], 10);
      var mStr = indoMatch[2].toLowerCase();
      var y = indoMatch[3] ? parseInt(indoMatch[3], 10) : new Date().getFullYear();
      if (bulanIndo[mStr] !== undefined) {
        return new Date(y, bulanIndo[mStr], d);
      }
    }

    // 3. Fallback standar
    var parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function formatTanggalIndoOutput(val) {
  if (!val) return '';
  if (val instanceof Date) {
    var bulanIndo = [
      'Januari','Februari','Maret','April','Mei','Juni',
      'Juli','Agustus','September','Oktober','November','Desember'
    ];
    return val.getDate() + ' ' + bulanIndo[val.getMonth()];
  }
  return String(val);
}

function formatCurrentDateIndo() {
  var bulanIndo = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
  ];
  var now = new Date();
  return now.getDate() + ' ' + bulanIndo[now.getMonth()];
}

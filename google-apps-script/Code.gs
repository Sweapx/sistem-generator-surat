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

  // ID Folder Utama Google Drive untuk Arsip Surat:
  // URL: https://drive.google.com/drive/folders/11qtu8wXAqElbXG2Zr47M7SydcpiLC0_H
  DRIVE_PARENT_FOLDER_ID: '11qtu8wXAqElbXG2Zr47M7SydcpiLC0_H',

  // Nama sheet untuk akun pengguna (Login)
  SHEET_PENGGUNA: 'Pengguna'
};

// ════════════════════════════════════════════
// MENU SPREADSHEET OTOMATIS (1-KLIK DI GOOGLE SPREADSHEET)
// ════════════════════════════════════════════

function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('📌 Pusaka Surat Tugas')
      .addItem('🔗 Perbaiki Sel Link PDF yang #ERROR!', 'menuPerbaikiLinkPdf')
      .addItem('📅 Format Kolom Tanggal (Aktifkan Date Picker Kalender)', 'menuFormatKolomTanggal')
      .addItem('☁️ Otorisasi & Buat Folder Bulan Ini', 'menuUjiGoogleDrive')
      .addItem('👥 Inisialisasi Sheet Pengguna (Login Akun)', 'menuInisialisasiPengguna')
      .addToUi();
  } catch (e) {}
}

function menuPerbaikiLinkPdf() {
  var ui = SpreadsheetApp.getUi();
  try {
    var res = fixExistingDatesInSheet();
    ui.alert(
      '✅ Link PDF Berhasil Diperbaiki!',
      'Sebanyak ' + res.fixedPdfLinks + ' tautan PDF yang sebelumnya #ERROR! telah dipulihkan menjadi tautan aktif Google Drive yang bisa langsung diklik.',
      ui.ButtonSet.OK
    );
  } catch (err) {
    ui.alert('❌ Gagal Memperbaiki Link PDF', err.message, ui.ButtonSet.OK);
  }
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

  // ── Perbaiki juga sel #ERROR! pada Kolom J (Kolom 10) & Kolom K (Kolom 11) ──
  var fixedPdfLinks = 0;
  try {
    var checkCols = [10, 11]; // Periksa Kolom J dan Kolom K
    for (var cIdx = 0; cIdx < checkCols.length; cIdx++) {
      var colNum = checkCols[cIdx];
      var pdfRange = sheet.getRange(headerRow + 1, colNum, numRows, 1);
      var pdfValues = pdfRange.getValues();
      var pdfFormulas = pdfRange.getFormulas();
      for (var k = 0; k < pdfValues.length; k++) {
        var rowIdx = headerRow + 1 + k;
        var cellVal = String(pdfValues[k][0] || '');
        var cellFormula = String(pdfFormulas[k][0] || '');
        if (cellVal === '#ERROR!' || cellVal.indexOf('ERROR') !== -1 || cellFormula.indexOf('ERROR') !== -1) {
          var targetCell = sheet.getRange(rowIdx, colNum);
          var noVal = sheet.getRange(rowIdx, 1).getValue();
          var defaultFileName = 'Surat_Tugas_' + noVal + '_SJ.9_KP.01.06_10_2026.pdf';
          
          // Ekstrak URL dari formula jika ada
          var matchUrl = cellFormula.match(/https:\/\/[^\s"',;)]+/);
          if (matchUrl && matchUrl[0]) {
            var targetUrl = matchUrl[0];
            var mFileName = cellFormula.match(/[",;]\s*"([^"]+\.pdf)"/i);
            var actualFileName = (mFileName && mFileName[1]) ? mFileName[1] : defaultFileName;

            var fixedOk = false;
            try {
              targetCell.setValue('=HYPERLINK("' + targetUrl + '"; "' + actualFileName + '")');
              if (String(targetCell.getValue()).indexOf('ERROR') === -1) {
                fixedOk = true;
              }
            } catch (eSemi) {}

            if (!fixedOk || String(targetCell.getValue()).indexOf('ERROR') !== -1) {
              var rtv = SpreadsheetApp.newRichTextValue()
                .setText(actualFileName)
                .setLinkUrl(targetUrl)
                .build();
              targetCell.setValue(actualFileName);
              targetCell.setRichTextValue(rtv);
            }
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
            lastNomor: getLastNomor()
          }
        });

      case 'testDrive':
        return jsonResponse({ status: 'ok', result: testDriveOtorisasi() });

      case 'getLastNomor':
        return jsonResponse({ status: 'ok', result: getLastNomor() });

      case 'appendNomorSurat':
        var recordToSave = (payload && payload.record) ? payload.record : payload;
        return jsonResponse({ status: 'ok', result: appendNomorSurat(recordToSave) });

      case 'updateNomorSurat':
        var recordToUpdate = (payload && payload.record) ? payload.record : payload;
        return jsonResponse({ status: 'ok', result: updateNomorSurat(recordToUpdate) });

      case 'getNomorSurat':
        return jsonResponse({ status: 'ok', result: getNomorSurat() });

      case 'login':
        var u = (payload && payload.username) || '';
        var p = (payload && payload.password) || '';
        return jsonResponse({ status: 'ok', result: loginUser(u, p) });

      case 'getUsers':
        return jsonResponse({ status: 'ok', result: getUsers() });

      case 'saveUser':
        var userToSave = (payload && payload.user) ? payload.user : payload;
        return jsonResponse({ status: 'ok', result: saveUser(userToSave) });

      case 'deleteUser':
        var idToDelete = (payload && payload.id) ? payload.id : payload;
        return jsonResponse({ status: 'ok', result: deleteUser(idToDelete) });

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
    colMap: colMap
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
    next_nomor: maxNomor + 1
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
 * Simpan file Word (.docx) / Google Docs (dari Base64) ke dalam folder bulan di Google Drive.
 * Mengembalikan objek berisi URL Google Docs (agar langsung terbuka di Google Docs / Word dengan format 100% utuh) dan ID file.
 */
function uploadPdfToDrive(targetFolder, fileBase64, fileName, mimeType) {
  if (!fileBase64) return null;

  var cleanBase64 = fileBase64;
  if (cleanBase64.indexOf('base64,') !== -1) {
    cleanBase64 = cleanBase64.split('base64,')[1];
  }

  var bytes = Utilities.base64Decode(cleanBase64);
  var DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  // Deteksi apakah file adalah Word (.docx) berdasarkan ekstensi, mimeType, atau magic bytes PK (80, 75)
  var isZipHeader = bytes && bytes.length > 4 && bytes[0] === 80 && bytes[1] === 75;
  var isDocxName = /\.docx$/i.test(fileName || '');
  var isDocxMime = mimeType && mimeType.indexOf('wordprocessingml') !== -1;
  var isDocx = isDocxName || isDocxMime || isZipHeader;

  var effectiveMime = isDocx ? DOCX_MIME : (mimeType || 'application/pdf');
  var finalFileName = fileName || 'Dokumen_Surat.docx';
  if (isDocx && !/\.docx$/i.test(finalFileName)) {
    finalFileName = finalFileName.replace(/\.pdf$/i, '') + '.docx';
  }

  // Hapus berkas lama dengan nama yang sama di folder bulan ini (terutama jika sebelumnya terunggah sebagai PDF)
  try {
    var existingFiles = targetFolder.getFilesByName(finalFileName);
    while (existingFiles.hasNext()) {
      var oldF = existingFiles.next();
      oldF.setTrashed(true);
    }
  } catch (eClean) {}

  var blob = Utilities.newBlob(bytes, effectiveMime, finalFileName);
  var file = targetFolder.createFile(blob);

  // Set file viewable/editable by anyone with link jika lingkungan mengizinkan
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
  } catch (eEdit) {
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      // Di domain kementerian yang dibatasi, izin diturunkan langsung dari folder induk
    }
  }

  var fileId = file.getId();
  // Untuk berkas .docx, gunakan URL Google Docs Editor agar saat diklik langsung terbuka sebagai Google Docs / Word dengan format 100% tetap utuh
  var directUrl = isDocx
    ? ('https://docs.google.com/document/d/' + fileId + '/edit')
    : file.getUrl();

  return {
    fileId: fileId,
    fileUrl: directUrl,
    driveViewUrl: file.getUrl(),
    fileName: finalFileName,
    folderName: targetFolder.getName(),
    isDocx: isDocx
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
  var defaultPdfFileName = record.docx_filename || record.pdf_filename || (
    'Surat_Tugas_' + nomorUrut + '_SJ.9_KP.01.06_' + monthPad + '_' + year + '.docx'
  );
  var payloadBase64 = record.docx_base64 || record.pdf_base64;
  var payloadMime = record.file_mime_type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  // ── Pengelolaan Folder Google Drive & Upload Berkas Word (.docx) / Google Docs ──
  var driveUploadInfo = null;
  var targetMonthFolder = null;
  var driveErrorMsg = null;

  try {
    var parentFolder = getTargetDriveParentFolder();
    // Otomatis cari atau buat folder bulan di dalam folder arsip (misal: "10 - Oktober 2026")
    targetMonthFolder = getOrCreateMonthFolder(parentFolder, year, monthIndex);

    if (payloadBase64 && payloadBase64.length > 50) {
      // 1. Simpan file Word (.docx) asli dengan tata letak resmi 100% utuh
      driveUploadInfo = uploadPdfToDrive(targetMonthFolder, payloadBase64, defaultPdfFileName, payloadMime);
      if (driveUploadInfo && driveUploadInfo.fileName) {
        defaultPdfFileName = driveUploadInfo.fileName;
      }
    } else {
      // 2. Jika base64 belum terkirim dari browser, buat file arsip di folder bulan
      var fileContent = 'KEMENTERIAN KOMUNIKASI DAN DIGITAL RI\n' +
        'PUSAT KEBIJAKAN STRATEGIS\n\n' +
        'SURAT TUGAS RESMI\n' +
        'Nomor: ' + (record.nomor_lengkap || (nomorUrut + '/SJ.9/KP.01.06/' + monthPad + '/' + year)) + '\n' +
        'Tanggal: ' + tanggalDisplayStr + '\n' +
        'Perihal: ' + (record.perihal || record.hal || record.nama_acara || '-') + '\n' +
        'Kepada: ' + (record.kepada || record.nama_pegawai || 'Terlampir') + '\n';
      var fallbackBlob = Utilities.newBlob(fileContent, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', defaultPdfFileName);
      var createdFile = targetMonthFolder.createFile(fallbackBlob);
      try {
        createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {}
      driveUploadInfo = {
        fileId: createdFile.getId(),
        fileUrl: 'https://docs.google.com/document/d/' + createdFile.getId() + '/edit',
        fileName: defaultPdfFileName,
        folderName: targetMonthFolder.getName()
      };
    }
  } catch (driveErr) {
    driveErrorMsg = driveErr.message || String(driveErr);
    Logger.log('Gagal memproses Google Drive: ' + driveErrorMsg);
  }

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
  // J: Link Berkas Word (Diisi dengan tautan Google Docs hasil upload)
  // K: Link Berkas TTE Pdf (TIDAK diisi link saat penerbitan surat, dikosongkan)

  var jenis = record.jenis || 'ST';
  var kepada = record.kepada || (record.jumlah_pegawai > 3 ? 'Daftar Terlampir' : (record.nama_pegawai || 'Terlampir'));
  var hal = record.perihal || record.hal || record.nama_acara || '';
  var statusTtd = record.status_ttd || (record.penandatangan_nama ? 'Kapus' : 'Kapus');
  var topikTim = record.topik_tim || record.unit_kerja || 'TU';
  var konseptor = record.konseptor || record.dibuat_oleh || '';
  var statusSurat = driveErrorMsg ? ('Err Drive: ' + driveErrorMsg.slice(0, 35)) : (record.status_surat || 'OK');
  var linkTte = ''; // Kolom K (Link Berkas TTE Pdf) dikosongkan sesuai instruksi

  // Masukkan teks nama file biasa ke newRow agar setValues tidak pernah menghasilkan #ERROR!
  // Kolom 10 (J - Link Berkas Word): defaultPdfFileName
  // Kolom 11 (K - Link Berkas TTE Pdf): kosong ('')
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
    defaultPdfFileName,
    linkTte
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

  // Pastikan Kolom K (Link Berkas TTE Pdf) benar-benar bersih
  try {
    sheet.getRange(targetRow, 11).clearContent();
  } catch (eClearK) {}

  // 1. Format kolom tanggal (Kolom B / index 2) sebagai Date dan Date Picker kalender
  try {
    var dateCell = sheet.getRange(targetRow, 2);
    dateCell.setNumberFormat('d MMMM');
    var dateValidation = SpreadsheetApp.newDataValidation().requireDate().build();
    dateCell.setDataValidation(dateValidation);
  } catch (errDate) {
    Logger.log('Gagal set validasi/format tanggal: ' + errDate.message);
  }

  // 2. Pasang Tautan Google Docs / Word ke Kolom J (Kolom 10 - Link Berkas Word)
  if (driveUploadInfo && driveUploadInfo.fileUrl) {
    var wordCell = sheet.getRange(targetRow, 10);
    try {
      // Pasang RichTextValue: Teks nama berkas langsung menjadi hyperlink Google Docs aktif yang bisa diklik
      var richText = SpreadsheetApp.newRichTextValue()
        .setText(defaultPdfFileName)
        .setLinkUrl(driveUploadInfo.fileUrl)
        .build();
      wordCell.setValue(defaultPdfFileName);
      wordCell.setRichTextValue(richText);
    } catch (errRtv) {
      // Fallback formula sesuai locale
      try {
        wordCell.setFormula('=HYPERLINK("' + driveUploadInfo.fileUrl + '"; "' + defaultPdfFileName + '")');
      } catch (e1) {
        try {
          wordCell.setFormula('=HYPERLINK("' + driveUploadInfo.fileUrl + '", "' + defaultPdfFileName + '")');
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
      ? 'Tersimpan di Spreadsheet & Dokumen Word/GDocs Terunggah di Google Drive'
      : (targetMonthFolder ? 'Tersimpan di Spreadsheet & Terhubung Folder Drive' : ('Gagal Drive: ' + (driveErrorMsg || 'Unknown'))),
    row_number: targetRow,
    drive_url: (driveUploadInfo && driveUploadInfo.fileUrl) || (targetMonthFolder ? targetMonthFolder.getUrl() : null),
    drive_file_id: driveUploadInfo ? driveUploadInfo.fileId : null,
    drive_folder: (driveUploadInfo && driveUploadInfo.folderName) || (targetMonthFolder ? targetMonthFolder.getName() : null),
    drive_error: driveErrorMsg,
    code_version: 'v2_docx'
  };
}

// ════════════════════════════════════════════
// 2b. UPDATE NOMOR SURAT YANG SUDAH ADA
// ════════════════════════════════════════════

function updateNomorSurat(record) {
  if (!record) {
    throw new Error('Data record surat untuk update kosong.');
  }

  ensureIndonesianLocale();
  var sheet = getTargetSheet();
  var headerInfo = findHeaderMapping(sheet);
  var headerRow = headerInfo.headerRow;
  var lastRow = sheet.getLastRow();

  if (lastRow <= headerRow) {
    return appendNomorSurat(record);
  }

  var nomorUrut = parseInt(record.nomor_urut, 10);
  var targetRow = -1;

  // Cari baris berdasarkan Nomor Urut di Kolom A
  var numRows = lastRow - headerRow;
  var colAValues = sheet.getRange(headerRow + 1, 1, numRows, 1).getValues();
  for (var i = 0; i < colAValues.length; i++) {
    var val = colAValues[i][0];
    if (val !== '' && !isNaN(val) && parseInt(val, 10) === nomorUrut) {
      targetRow = headerRow + 1 + i;
      break;
    }
  }

  // Jika tidak ditemukan barisnya, panggil appendNomorSurat
  if (targetRow === -1) {
    return appendNomorSurat(record);
  }

  // Parse tanggal
  var dateVal = parseDateValue(record.tanggal || record.tanggal_surat || record.tanggal_dibuat);
  var tanggalDisplayStr = formatTanggalIndoOutput(dateVal);

  var year = record.tahun || dateVal.getFullYear();
  var monthIndex = dateVal.getMonth();
  var monthPad = (monthIndex + 1 < 10 ? '0' : '') + (monthIndex + 1);
  var defaultPdfFileName = record.docx_filename || record.pdf_filename || (
    'Surat_Tugas_' + nomorUrut + '_SJ.9_KP.01.06_' + monthPad + '_' + year + '.docx'
  );
  var payloadBase64 = record.docx_base64 || record.pdf_base64;
  var payloadMime = record.file_mime_type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  // Upload/Perbarui Word (.docx) / Google Docs di Google Drive jika ada data Base64 baru
  var driveUploadInfo = null;
  var driveErrorMsg = null;
  var targetMonthFolder = null;

  try {
    var parentFolder = getTargetDriveParentFolder();
    targetMonthFolder = getOrCreateMonthFolder(parentFolder, year, monthIndex);

    if (payloadBase64 && payloadBase64.length > 50) {
      driveUploadInfo = uploadPdfToDrive(targetMonthFolder, payloadBase64, defaultPdfFileName, payloadMime);
      if (driveUploadInfo && driveUploadInfo.fileName) {
        defaultPdfFileName = driveUploadInfo.fileName;
      }
    }
  } catch (driveErr) {
    driveErrorMsg = driveErr.message || String(driveErr);
    Logger.log('Gagal upload update dokumen ke Google Drive: ' + driveErrorMsg);
  }

  var jenis = record.jenis || 'ST';
  var kepada = record.kepada || (record.jumlah_pegawai > 3 ? 'Daftar Terlampir' : (record.nama_pegawai || 'Terlampir'));
  var hal = record.perihal || record.hal || record.nama_acara || '';
  var statusTtd = record.status_ttd || (record.penandatangan_nama ? 'Kapus' : 'Kapus');
  var topikTim = record.topik_tim || record.unit_kerja || 'TU';
  var konseptor = record.konseptor || record.dibuat_oleh || '';
  var statusSurat = driveErrorMsg ? ('Err Drive: ' + driveErrorMsg.slice(0, 35)) : (record.status_surat || 'OK');
  var linkTte = ''; // Kolom K (Link Berkas TTE Pdf) dikosongkan

  var updatedRow = [
    nomorUrut,
    dateVal,
    jenis,
    kepada,
    hal,
    statusTtd,
    topikTim,
    konseptor,
    statusSurat,
    defaultPdfFileName,
    linkTte
  ];

  sheet.getRange(targetRow, 1, 1, updatedRow.length).setValues([updatedRow]);

  try {
    sheet.getRange(targetRow, 11).clearContent();
  } catch (eClearK) {}

  // Format kolom tanggal (Kolom B / index 2)
  try {
    var dateCell = sheet.getRange(targetRow, 2);
    dateCell.setNumberFormat('d MMMM');
    var dateValidation = SpreadsheetApp.newDataValidation().requireDate().build();
    dateCell.setDataValidation(dateValidation);
  } catch (errDate) {}

  // Pasang Tautan Google Docs / Word ke Kolom J (Kolom 10 - Link Berkas Word)
  var fileUrlToUse = (driveUploadInfo && driveUploadInfo.fileUrl) || record.drive_url;
  if (fileUrlToUse) {
    var wordCell = sheet.getRange(targetRow, 10);
    try {
      var richText = SpreadsheetApp.newRichTextValue()
        .setText(defaultPdfFileName)
        .setLinkUrl(fileUrlToUse)
        .build();
      wordCell.setValue(defaultPdfFileName);
      wordCell.setRichTextValue(richText);
    } catch (eRtv) {
      try {
        wordCell.setFormula('=HYPERLINK("' + fileUrlToUse + '"; "' + defaultPdfFileName + '")');
      } catch (e1) {
        try {
          wordCell.setFormula('=HYPERLINK("' + fileUrlToUse + '", "' + defaultPdfFileName + '")');
        } catch (e2) {}
      }
    }
  }

  return {
    id: record.id || ('ns-' + nomorUrut),
    nomor_urut: nomorUrut,
    nomor_lengkap: record.nomor_lengkap || (nomorUrut + '/SJ.9/KP.01.06/' + monthPad + '/' + year),
    tanggal_dibuat: tanggalDisplayStr,
    perihal: hal,
    status: 'Surat berhasil diperbarui di Spreadsheet & Google Drive',
    row_number: targetRow,
    drive_url: fileUrlToUse || (targetMonthFolder ? targetMonthFolder.getUrl() : null),
    drive_file_id: driveUploadInfo ? driveUploadInfo.fileId : null,
    drive_folder: (driveUploadInfo && driveUploadInfo.folderName) || (targetMonthFolder ? targetMonthFolder.getName() : null),
    drive_error: driveErrorMsg,
    code_version: 'v2_docx'
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
  // Ambil formula dan rich text dari Kolom J (10) dan Kolom K (11)
  var formulasJ = sheet.getRange(headerRow + 1, 10, numRows, 1).getFormulas();
  var richTextJ = sheet.getRange(headerRow + 1, 10, numRows, 1).getRichTextValues();
  var formulasK = sheet.getRange(headerRow + 1, 11, numRows, 1).getFormulas();
  var richTextK = sheet.getRange(headerRow + 1, 11, numRows, 1).getRichTextValues();
  var records = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var noVal = row[0];
    if (noVal === '' || noVal === null || noVal === undefined) continue;

    var noUrut = parseInt(noVal, 10);
    var rawLinkJ = String(row[9] || '');
    var rawLinkK = String(row[10] || '');
    var fJ = formulasJ[i] ? formulasJ[i][0] : '';
    var fK = formulasK[i] ? formulasK[i][0] : '';
    var rtJ = richTextJ[i] ? richTextJ[i][0] : null;
    var rtK = richTextK[i] ? richTextK[i][0] : null;

    var driveUrl = '';

    // 1. Cek URL di Kolom J (Kolom 10) terlebih dahulu
    if (fJ && fJ.indexOf('HYPERLINK') !== -1) {
      var matchJ = fJ.match(/HYPERLINK\("([^"]+)"/i);
      if (matchJ && matchJ[1]) driveUrl = matchJ[1];
    }
    if (!driveUrl && fJ) {
      var matchDirectJ = fJ.match(/https:\/\/[^\s"',;)]+/);
      if (matchDirectJ) driveUrl = matchDirectJ[0];
    }
    if (!driveUrl && rtJ) {
      var rtvUrlJ = rtJ.getLinkUrl();
      if (rtvUrlJ) driveUrl = rtvUrlJ;
    }
    if (!driveUrl && rawLinkJ.indexOf('http') === 0) {
      driveUrl = rawLinkJ;
    }

    // 2. Fallback cek URL di Kolom K (Kolom 11) jika di Kolom J belum ada
    if (!driveUrl) {
      if (fK && fK.indexOf('HYPERLINK') !== -1) {
        var matchK = fK.match(/HYPERLINK\("([^"]+)"/i);
        if (matchK && matchK[1]) driveUrl = matchK[1];
      }
      if (!driveUrl && fK) {
        var matchDirectK = fK.match(/https:\/\/[^\s"',;)]+/);
        if (matchDirectK) driveUrl = matchDirectK[0];
      }
      if (!driveUrl && rtK) {
        var rtvUrlK = rtK.getLinkUrl();
        if (rtvUrlK) driveUrl = rtvUrlK;
      }
      if (!driveUrl && rawLinkK.indexOf('http') === 0) {
        driveUrl = rawLinkK;
      }
    }

    // Tentukan nama berkas link PDF
    var cleanLinkPdf = rawLinkJ;
    if (!cleanLinkPdf || cleanLinkPdf === '-' || cleanLinkPdf.trim() === '') {
      cleanLinkPdf = rawLinkK;
    }
    if (cleanLinkPdf === '#ERROR!' || cleanLinkPdf.indexOf('ERROR') !== -1 || !cleanLinkPdf || cleanLinkPdf === '-') {
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
      link_word: String(row[10] || ''),
      link_pdf: cleanLinkPdf,
      drive_url: driveUrl,
      tahun: 2026
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

// ════════════════════════════════════════════
// 4. AUTENTIKASI & MANAJEMEN AKUN PENGGUNA
// ════════════════════════════════════════════

function menuInisialisasiPengguna() {
  var ui = SpreadsheetApp.getUi();
  try {
    var sheet = getOrCreateUsersSheet();
    ui.alert(
      '✅ Sheet Pengguna Siap!',
      'Sheet "' + sheet.getName() + '" telah dibuat dan diisi dengan akun awal:\n\n' +
      '• Admin TU: admin_tu (Sandi: pusaka2026)\n' +
      '• Yuliano: yuliano (Sandi: pusaka2026)\n' +
      '• Staf: staf_pusaka (Sandi: pusaka2026)\n\n' +
      'Anda dapat menambah atau mengubah akun langsung di sheet tersebut.',
      ui.ButtonSet.OK
    );
  } catch (err) {
    ui.alert('Gagal inisialisasi sheet pengguna: ' + err.message);
  }
}

function getOrCreateUsersSheet() {
  var ss = getTargetSpreadsheet();
  var sheetName = CONFIG.SHEET_PENGGUNA || 'Pengguna';
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var headers = ['ID', 'USERNAME', 'PASSWORD', 'NAMA', 'NIP', 'ROLE', 'UNIT KERJA', 'STATUS'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
    
    // Seed akun bawaan kantor
    var initialUsers = [
      ['user-admin', 'admin_tu', 'pusaka2026', 'Admin Tata Usaha PUSAKA', '198204142008032002', 'admin', 'Bagian Tata Usaha PUSAKA', 'Aktif'],
      ['user-yuliano', 'yuliano', 'pusaka2026', 'Yuliano Christoper', '199501012022011001', 'admin', 'Pusat Kebijakan Strategis', 'Aktif'],
      ['user-staff', 'staf_pusaka', 'pusaka2026', 'Staf Konseptor PUSAKA', '199205122019031005', 'staff', 'Pusat Kebijakan Strategis', 'Aktif']
    ];
    sheet.getRange(2, 1, initialUsers.length, headers.length).setValues(initialUsers);
    try {
      sheet.autoResizeColumns(1, headers.length);
    } catch (eResize) {}
  }
  return sheet;
}

function loginUser(username, password) {
  if (!username || !password) {
    throw new Error('Username dan kata sandi wajib diisi.');
  }

  var sheet = getOrCreateUsersSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    throw new Error('Tidak ada data pengguna di sheet.');
  }

  var data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  var uClean = String(username).trim().toLowerCase();
  var pClean = String(password).trim();

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var rowUser = String(row[1] || '').trim().toLowerCase();
    var rowPass = String(row[2] || '').trim();
    var rowStatus = String(row[7] || 'Aktif').trim();

    if (rowUser === uClean && rowPass === pClean) {
      if (rowStatus.toLowerCase() !== 'aktif') {
        throw new Error('Akun Anda dinonaktifkan. Hubungi Admin Tata Usaha.');
      }

      return {
        id: String(row[0] || ('user-' + (i + 1))),
        username: String(row[1]),
        nama: String(row[3] || row[1]),
        nip: String(row[4] || ''),
        role: String(row[5] || 'staff').toLowerCase(),
        unit_kerja: String(row[6] || 'Pusat Kebijakan Strategis'),
        status: rowStatus,
        token: 'auth-' + Utilities.getUuid()
      };
    }
  }

  throw new Error('Username atau kata sandi tidak sesuai.');
}

function getUsers() {
  var sheet = getOrCreateUsersSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  var users = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    if (!row[1]) continue;
    users.push({
      id: String(row[0] || ('user-' + (i + 1))),
      username: String(row[1]),
      password: String(row[2] || ''),
      nama: String(row[3] || row[1]),
      nip: String(row[4] || ''),
      role: String(row[5] || 'staff').toLowerCase(),
      unit_kerja: String(row[6] || 'Pusat Kebijakan Strategis'),
      status: String(row[7] || 'Aktif')
    });
  }
  return users;
}

function saveUser(userData) {
  if (!userData || !userData.username) {
    throw new Error('Username wajib diisi.');
  }

  var sheet = getOrCreateUsersSheet();
  var lastRow = sheet.getLastRow();
  var targetRow = -1;
  var uClean = String(userData.username).trim().toLowerCase();
  var userId = userData.id || ('user-' + Date.now());

  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
    for (var i = 0; i < data.length; i++) {
      var rowId = String(data[i][0]);
      var rowUser = String(data[i][1]).trim().toLowerCase();
      if ((userData.id && rowId === userData.id) || rowUser === uClean) {
        targetRow = i + 2;
        userId = rowId || userId;
        break;
      }
    }
  }

  var rowVals = [
    userId,
    String(userData.username).trim(),
    String(userData.password || 'pusaka2026').trim(),
    String(userData.nama || userData.username).trim(),
    String(userData.nip || '').trim(),
    String(userData.role || 'staff').toLowerCase(),
    String(userData.unit_kerja || 'Pusat Kebijakan Strategis').trim(),
    String(userData.status || 'Aktif').trim()
  ];

  if (targetRow > 1) {
    sheet.getRange(targetRow, 1, 1, rowVals.length).setValues([rowVals]);
  } else {
    sheet.appendRow(rowVals);
  }

  return {
    id: userId,
    username: rowVals[1],
    nama: rowVals[3],
    nip: rowVals[4],
    role: rowVals[5],
    unit_kerja: rowVals[6],
    status: rowVals[7]
  };
}

function deleteUser(userId) {
  if (!userId) throw new Error('ID pengguna wajib diisi.');
  var sheet = getOrCreateUsersSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false };

  var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(userId)) {
      sheet.deleteRow(i + 2);
      return { success: true, deletedId: userId };
    }
  }
  return { success: false, message: 'Pengguna tidak ditemukan' };
}

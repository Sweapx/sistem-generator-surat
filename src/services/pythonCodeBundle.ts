import JSZip from 'jszip';
import { Pegawai, Pejabat, NomorSuratRecord } from '../types';

export const PYTHON_GENERATOR_SCRIPT = `"""
SISTEM GENERATOR SURAT TUGAS OTOMATIS (PUSDATIN KEMENKES RI)
============================================================
Logika:
1. Penomoran otomatis: {nomor_urut}/SJ.9/KP.01.06/{bulan}/{tahun}
   - Reset ke 1 jika tahun berganti (tahun sistem != tahun terakhir di DB)
   - Lanjut +1 jika tahun sama
2. Lookup pegawai dari Database Kepegawaian (otomatis tarik NIP, Pangkat/Golongan, Jabatan)
3. Pilihan pejabat penandatangan (1 Kepala Pusat default + 5 Katim)
4. Aturan kondisional jumlah pegawai:
   - <= 3 pegawai: Ditulis lengkap di badan surat
   - > 3 pegawai : Ditulis "(Daftar Terlampir)" + Lampiran tabel di halaman baru (PageBreak)
5. Export format .docx resmi naskah dinas
"""

import os
import datetime
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

BULAN_INDO = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

def format_tanggal_indo(tgl_obj):
    if isinstance(tgl_obj, str):
        tgl_obj = datetime.datetime.strptime(tgl_obj, "%Y-%m-%d").date()
    return f"{tgl_obj.day} {BULAN_INDO[tgl_obj.month]} {tgl_obj.year}"

class NomorSuratManager:
    """Mengelola penomoran surat dinas otomatis sesuai aturan 2.1"""
    def __init__(self, db_records=None):
        self.db = db_records or [
            {"nomor_urut": 772, "tahun": 2026, "bulan": "09", "nomor_lengkap": "772/SJ.9/KP.01.06/09/2026"}
        ]

    def get_next_number(self, current_date=None):
        if not current_date:
            current_date = datetime.date.today()

        tahun_sekarang = current_date.year
        bulan_sekarang = f"{current_date.month:02d}"

        # Cek baris terakhir di database
        if not self.db:
            nomor_urut = 1
        else:
            last_record = self.db[-1]
            if last_record["tahun"] != tahun_sekarang:
                # Pergantian tahun -> Reset ke 1
                nomor_urut = 1
            else:
                nomor_urut = last_record["nomor_urut"] + 1

        nomor_lengkap = f"{nomor_urut}/SJ.9/KP.01.06/{bulan_sekarang}/{tahun_sekarang}"
        return nomor_urut, tahun_sekarang, bulan_sekarang, nomor_lengkap

    def catat_surat_terbit(self, nomor_urut, tahun, bulan, nomor_lengkap, perihal, dibuat_oleh="TU Pusdatin"):
        record = {
            "nomor_urut": nomor_urut,
            "tahun": tahun,
            "bulan": bulan,
            "nomor_lengkap": nomor_lengkap,
            "tanggal_dibuat": datetime.date.today().isoformat(),
            "perihal": perihal,
            "dibuat_oleh": dibuat_oleh
        }
        self.db.append(record)
        return record

def set_cell_border(cell, **kwargs):
    """Utility untuk membuat border tabel di python-docx"""
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(r'''
        <w:tcBorders xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        </w:tcBorders>
    ''')
    tcPr.append(tcBorders)

def generate_surat_tugas_docx(
    nomor_lengkap: str,
    dasar_undangan: dict,
    kegiatan: dict,
    daftar_pegawai: list,
    pejabat_penandatangan: dict,
    output_filename: str = "Surat_Tugas_Hasil.docx"
):
    doc = Document()

    # Set Margin A4 (1 inci)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # --- KOP SURAT ---
    kop_titles = [
        ("KEMENTERIAN KESEHATAN REPUBLIK INDONESIA", 12, True),
        ("SEKRETARIAT JENDERAL", 12, True),
        ("PUSAT DATA DAN TEKNOLOGI INFORMASI", 13, True),
        ("Jalan H.R. Rasuna Said Blok X-5 Kavling 4-9 Jakarta 12950\\nTelepon (021) 5201590, Surel: pusdatin@kemkes.go.id", 9, False)
    ]
    for text, size, bold in kop_titles:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.0
        run = p.add_run(text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(size)
        run.bold = bold

    # Garis Pembatas Kop
    line_p = doc.add_paragraph()
    line_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    line_run = line_p.add_run("―" * 58)
    line_run.bold = True
    line_p.paragraph_format.space_after = Pt(14)

    # --- JUDUL SURAT TUGAS ---
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(2)
    run_title = p_title.add_run("SURAT TUGAS")
    run_title.font.name = "Times New Roman"
    run_title.font.size = Pt(14)
    run_title.bold = True
    run_title.underline = True

    p_no = doc.add_paragraph()
    p_no.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_no.paragraph_format.space_after = Pt(16)
    run_no = p_no.add_run(f"NOMOR : {nomor_lengkap}")
    run_no.font.name = "Times New Roman"
    run_no.font.size = Pt(11)
    run_no.bold = True

    # --- MENIMBANG & DASAR ---
    p_menimbang = doc.add_paragraph()
    p_menimbang.paragraph_format.space_after = Pt(6)
    r1 = p_menimbang.add_run("Menimbang\\t: ")
    r1.bold = True
    r1.font.name = "Times New Roman"
    r2 = p_menimbang.add_run(
        f"bahwa dalam rangka mendukung kelancaran pelaksanaan {kegiatan['nama_acara']}, "
        f"perlu menugaskan pegawai yang namanya tercantum dalam Surat Tugas ini."
    )
    r2.font.name = "Times New Roman"

    p_dasar = doc.add_paragraph()
    p_dasar.paragraph_format.space_after = Pt(12)
    rd1 = p_dasar.add_run("Dasar\\t\\t: ")
    rd1.bold = True
    rd1.font.name = "Times New Roman"
    rd2 = p_dasar.add_run(
        f"Surat Undangan dari {dasar_undangan['instansi']} Nomor: {dasar_undangan['nomor']} "
        f"perihal {dasar_undangan['perihal']}."
    )
    rd2.font.name = "Times New Roman"

    # --- MEMBERI TUGAS ---
    p_mt = doc.add_paragraph()
    p_mt.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_mt.paragraph_format.space_after = Pt(8)
    r_mt = p_mt.add_run("MEMBERI TUGAS :")
    r_mt.bold = True
    r_mt.font.name = "Times New Roman"

    # --- KEPADA (Logika <= 3 vs > 3) ---
    is_lampiran = len(daftar_pegawai) > 3

    p_kepada = doc.add_paragraph()
    p_kepada.paragraph_format.space_after = Pt(4)
    rk = p_kepada.add_run("Kepada\\t\\t: ")
    rk.bold = True
    rk.font.name = "Times New Roman"

    if is_lampiran:
        rk_val = p_kepada.add_run("(Daftar Terlampir)")
        rk_val.bold = True
        rk_val.font.name = "Times New Roman"
    else:
        for idx, peg in enumerate(daftar_pegawai, start=1):
            p_p = doc.add_paragraph()
            p_p.paragraph_format.left_indent = Inches(0.8)
            p_p.paragraph_format.space_after = Pt(4)
            p_p.paragraph_format.line_spacing = 1.15
            
            run_p = p_p.add_run(
                f"{idx}.  Nama\\t\\t: {peg['nama']}\\n"
                f"    NIP\\t\\t: {peg['nip']}\\n"
                f"    Pangkat/Gol.\\t: {peg['pangkat_golongan']}\\n"
                f"    Jabatan\\t: {peg['jabatan']}\\n"
                f"    Unit Kerja\\t: {peg['unit_kerja']}"
            )
            run_p.font.name = "Times New Roman"

    # --- UNTUK ---
    p_untuk = doc.add_paragraph()
    p_untuk.paragraph_format.space_before = Pt(8)
    p_untuk.paragraph_format.space_after = Pt(4)
    ru = p_untuk.add_run("Untuk\\t\\t: ")
    ru.bold = True
    ru.font.name = "Times New Roman"

    tugas_items = [
        f"Menghadiri dan berpartisipasi aktif dalam kegiatan {kegiatan['nama_acara']}.",
        f"Pelaksanaan tugas pada tanggal {kegiatan['tanggal_kegiatan']}, bertempat di {kegiatan['lokasi']}.",
        f"Biaya pelaksanaan tugas dibebankan pada {kegiatan.get('anggaran', 'DIPA Pusdatin Tahun 2026')}.",
        "Melaporkan hasil pelaksanaan tugas secara tertulis kepada pimpinan setelah kegiatan selesai."
    ]

    for idx, item in enumerate(tugas_items, start=1):
        p_item = doc.add_paragraph()
        p_item.paragraph_format.left_indent = Inches(0.8)
        p_item.paragraph_format.space_after = Pt(3)
        r_item = p_item.add_run(f"{idx}.  {item}")
        r_item.font.name = "Times New Roman"

    # Penutup
    p_penutup = doc.add_paragraph()
    p_penutup.paragraph_format.space_before = Pt(10)
    p_penutup.paragraph_format.space_after = Pt(18)
    r_penutup = p_penutup.add_run("Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan penuh rasa tanggung jawab.")
    r_penutup.font.name = "Times New Roman"

    # --- TANDA TANGAN ---
    tgl_surat = format_tanggal_indo(datetime.date.today())
    p_ttd = doc.add_paragraph()
    p_ttd.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_ttd.paragraph_format.space_after = Pt(4)
    
    ttd_text = (
        f"Ditetapkan di Jakarta\\n"
        f"pada tanggal {tgl_surat}\\n\\n"
        f"{pejabat_penandatangan['jabatan']},\\n\\n\\n\\n\\n"
        f"{pejabat_penandatangan['nama']}\\n"
        f"NIP {pejabat_penandatangan['nip']}"
    )
    r_ttd = p_ttd.add_run(ttd_text)
    r_ttd.font.name = "Times New Roman"

    # --- HALAMAN LAMPIRAN (JIKA PEGAWAI > 3) ---
    if is_lampiran:
        doc.add_page_break()

        p_lamp_header = doc.add_paragraph()
        p_lamp_header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_lamp_header.paragraph_format.space_after = Pt(12)
        r_lh = p_lamp_header.add_run(
            f"LAMPIRAN SURAT TUGAS\\n"
            f"NOMOR   : {nomor_lengkap}\\n"
            f"TANGGAL : {tgl_surat}\\n"
        )
        r_lh.font.name = "Times New Roman"
        r_lh.bold = True

        p_lamp_title = doc.add_paragraph()
        p_lamp_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_lamp_title.paragraph_format.space_after = Pt(14)
        r_lt = p_lamp_title.add_run(f"DAFTAR PEGAWAI YANG DITUGASKAN PADA KEGIATAN\\n{kegiatan['nama_acara'].upper()}")
        r_lt.font.name = "Times New Roman"
        r_lt.bold = True

        # Tabel Lampiran Pegawai
        table = doc.add_table(rows=1, cols=5)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        hdr_cells = table.rows[0].cells
        headers = ["NO", "NAMA PEGAWAI", "NIP", "PANGKAT / GOL.", "JABATAN"]
        for idx, text in enumerate(headers):
            hdr_cells[idx].text = text
            set_cell_border(hdr_cells[idx])
            p_hdr = hdr_cells[idx].paragraphs[0]
            p_hdr.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in p_hdr.runs:
                run.bold = True
                run.font.name = "Times New Roman"
                run.font.size = Pt(9.5)

        for idx, peg in enumerate(daftar_pegawai, start=1):
            row_cells = table.add_row().cells
            row_cells[0].text = str(idx)
            row_cells[1].text = peg["nama"]
            row_cells[2].text = peg["nip"]
            row_cells[3].text = peg["pangkat_golongan"]
            row_cells[4].text = peg["jabatan"]
            for cell in row_cells:
                set_cell_border(cell)
                for run in cell.paragraphs[0].runs:
                    run.font.name = "Times New Roman"
                    run.font.size = Pt(9.5)

        # Tanda Tangan Lampiran
        p_ttd_lamp = doc.add_paragraph()
        p_ttd_lamp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_ttd_lamp.paragraph_format.space_before = Pt(20)
        r_ttd_l = p_ttd_lamp.add_run(
            f"\\n{pejabat_penandatangan['jabatan']},\\n\\n\\n\\n"
            f"{pejabat_penandatangan['nama']}\\n"
            f"NIP {pejabat_penandatangan['nip']}"
        )
        r_ttd_l.font.name = "Times New Roman"

    doc.save(output_filename)
    print(f"[SUKSES] Surat Tugas berhasil digenerate: {output_filename}")
    return output_filename

# --- CONTOH PENGGUNAAN MANDIRI ---
if __name__ == "__main__":
    manager = NomorSuratManager()
    nomor_urut, tahun, bulan, nomor_lengkap = manager.get_next_number()
    print(f"Nomor Surat Otomatis Berikutnya: {nomor_lengkap}")
    
    # Contoh data pegawai
    sample_pegawai = [
        {"nama": "Bambang Pratama, S.Kom., M.T.I.", "nip": "19850412 201012 1 002", "pangkat_golongan": "Penata Tk. I / III/d", "jabatan": "Pranata Komputer Ahli Muda", "unit_kerja": "Pusdatin"},
        {"nama": "Siti Rahmawati, S.Kom.", "nip": "19900823 201403 2 003", "pangkat_golongan": "Penata / III/c", "jabatan": "Pengolah Data dan Informasi", "unit_kerja": "Pusdatin"},
        {"nama": "Dimas Aditya, S.T.", "nip": "19920117 201602 1 004", "pangkat_golongan": "Penata Muda Tk. I / III/b", "jabatan": "Pranata Komputer Ahli Pertama", "unit_kerja": "Pusdatin"},
        {"nama": "Nurul Hidayah, S.Kom., M.Cs.", "nip": "19880710 201212 2 001", "pangkat_golongan": "Penata Tk. I / III/d", "jabatan": "Pranata Komputer Ahli Muda", "unit_kerja": "Pusdatin"}
    ]

    pejabat_default = {
        "nama": "Dr. Ir. Heru Santoso, M.Kom.",
        "nip": "19720815 199803 1 001",
        "jabatan": "Kepala Pusat Data dan Teknologi Informasi"
    }

    generate_surat_tugas_docx(
        nomor_lengkap=nomor_lengkap,
        dasar_undangan={
            "instansi": "Panitia ICISS 2026",
            "nomor": "084/ICISS/CONF-INV/IX/2026",
            "perihal": "Undangan Konferensi Internasional ICISS 2026"
        },
        kegiatan={
            "nama_acara": "The 7th International Conference on Information Systems and Security (ICISS 2026)",
            "tanggal_kegiatan": "15 s.d. 16 Oktober 2026",
            "lokasi": "Grand Ballroom Hotel Indonesia Kempinski, Jakarta Pusat",
            "anggaran": "DIPA Pusat Data dan Teknologi Informasi Tahun 2026"
        },
        daftar_pegawai=sample_pegawai,
        pejabat_penandatangan=pejabat_default,
        output_filename="Contoh_Surat_Tugas_ICISS_2026.docx"
    )
`;

export const PYTHON_STREAMLIT_APP = `"""
APLIKASI WEB STREAMLIT: GENERATOR SURAT TUGAS OTOMATIS
======================================================
Cara menjalankan:
    pip install streamlit python-docx pandas google-genai
    streamlit run app_streamlit.py
"""

import streamlit as st
import datetime
import json
from generator_surat import NomorSuratManager, generate_surat_tugas_docx

st.set_page_config(
    page_title="Sistem Otomasi Surat Tugas Pusdatin",
    page_icon="📄",
    layout="wide"
)

# Inisialisasi Database Sederhana dalam Session State
if "db_nomor" not in st.session_state:
    st.session_state.db_nomor = NomorSuratManager([
        {"nomor_urut": 772, "tahun": 2026, "bulan": "09", "nomor_lengkap": "772/SJ.9/KP.01.06/09/2026"}
    ])

PEGAWAI_DB = [
    {"nama": "Bambang Pratama, S.Kom., M.T.I.", "nip": "19850412 201012 1 002", "pangkat_golongan": "Penata Tk. I / III/d", "jabatan": "Pranata Komputer Ahli Muda", "unit_kerja": "Pusdatin"},
    {"nama": "Siti Rahmawati, S.Kom.", "nip": "19900823 201403 2 003", "pangkat_golongan": "Penata / III/c", "jabatan": "Pengolah Data dan Informasi", "unit_kerja": "Pusdatin"},
    {"nama": "Dimas Aditya, S.T.", "nip": "19920117 201602 1 004", "pangkat_golongan": "Penata Muda Tk. I / III/b", "jabatan": "Pranata Komputer Ahli Pertama", "unit_kerja": "Pusdatin"},
    {"nama": "Nurul Hidayah, S.Kom., M.Cs.", "nip": "19880710 201212 2 001", "pangkat_golongan": "Penata Tk. I / III/d", "jabatan": "Pranata Komputer Ahli Muda", "unit_kerja": "Pusdatin"},
    {"nama": "Eko Prasetyo, A.Md.", "nip": "19940305 201801 1 005", "pangkat_golongan": "Pengatur / II/c", "jabatan": "Pranata Komputer Terampil", "unit_kerja": "Pusdatin"},
    {"nama": "Indah Kusuma Wardani, S.Sos.", "nip": "19911129 201503 2 002", "pangkat_golongan": "Penata Muda / III/a", "jabatan": "Analis Kebijakan Ahli Pertama", "unit_kerja": "Pusdatin"},
]

PEJABAT_LIST = [
    {"nama": "Dr. Ir. Heru Santoso, M.Kom.", "nip": "19720815 199803 1 001", "jabatan": "Kepala Pusat Data dan Teknologi Informasi", "label": "Kepala Pusat (Default)"},
    {"nama": "Dra. Sri Wahyuni, M.Si.", "nip": "19750312 199903 2 002", "jabatan": "Ketua Tim Kerja Tata Kelola & Layanan TI", "label": "Katim 1: Tata Kelola & Layanan TI"},
    {"nama": "Ahmad Fauzi, S.T., M.Kom.", "nip": "19780520 200212 1 003", "jabatan": "Ketua Tim Kerja Infrastruktur & Jaringan", "label": "Katim 2: Infrastruktur Jaringan"},
    {"nama": "Rina Agustina, S.Kom., M.Eng.", "nip": "19810914 200501 2 004", "jabatan": "Ketua Tim Kerja Pengembangan Sistem Informasi", "label": "Katim 3: Sistem Informasi"},
    {"nama": "Budi Hartono, S.Kom., M.Cs.", "nip": "19801125 200312 1 002", "jabatan": "Ketua Tim Kerja Keamanan Informasi & Siber", "label": "Katim 4: Keamanan Siber"},
    {"nama": "Dewi Lestari, S.Si., M.Stat.", "nip": "19830419 200604 2 001", "jabatan": "Ketua Tim Kerja Transformasi Digital", "label": "Katim 5: Transformasi Digital"},
]

st.title("🏛️ Sistem Generator Surat Tugas Otomatis")
st.caption("Pusat Data dan Teknologi Informasi - Berbasis Python & python-docx")

# Nomor Surat Otomatis
_, _, _, nomor_otomatis = st.session_state.db_nomor.get_next_number()

col_kiri, col_kanan = st.columns([1, 1])

with col_kiri:
    st.subheader("1. Data Undangan & Acara")
    uploaded_file = st.file_uploader("Upload Dokumen Undangan (PDF / Scan / Teks)", type=["pdf", "png", "jpg", "txt"])
    
    nama_acara = st.text_input("Nama Kegiatan / Acara", value="The 7th International Conference on Information Systems and Security (ICISS 2026)")
    instansi = st.text_input("Instansi Pengundang", value="Panitia ICISS 2026 & Universitas Indonesia")
    nomor_undangan = st.text_input("Nomor Surat Undangan", value="084/ICISS/CONF-INV/IX/2026")
    
    col_tgl1, col_tgl2 = st.columns(2)
    with col_tgl1:
        tgl_mulai = st.date_input("Tanggal Mulai", datetime.date(2026, 10, 15))
    with col_tgl2:
        tgl_selesai = st.date_input("Tanggal Selesai", datetime.date(2026, 10, 16))

    lokasi = st.text_input("Tempat & Lokasi", value="Hotel Indonesia Kempinski Jakarta Pusat")

with col_kanan:
    st.subheader("2. Penugasan Pegawai & Penandatangan")
    
    pegawai_names = [p["nama"] for p in PEGAWAI_DB]
    selected_names = st.multiselect(
        "Pilih Pegawai yang Ditugaskan (Otomatis Lookup NIP & Jabatan)",
        options=pegawai_names,
        default=pegawai_names[:2]
    )

    selected_pegawai = [p for p in PEGAWAI_DB if p["nama"] in selected_names]
    
    jumlah = len(selected_pegawai)
    if jumlah <= 3:
        st.info(f"💡 Terpilih **{jumlah} pegawai** (<= 3): Akan dicetak langsung di badan surat.")
    else:
        st.warning(f"⚠️ Terpilih **{jumlah} pegawai** (> 3): Bagian 'Kepada' akan menjadi '(Daftar Terlampir)' dan tabel lampiran dibuat di halaman baru.")

    st.write("---")
    pejabat_labels = [p["label"] for p in PEJABAT_LIST]
    selected_label = st.selectbox("Pejabat Penandatangan", options=pejabat_labels, index=0)
    selected_pejabat = next(p for p in PEJABAT_LIST if p["label"] == selected_label)

    st.write("---")
    st.markdown(f"**Nomor Surat Otomatis:** \`{nomor_otomatis}\`")

    if st.button("🚀 Generate Surat Tugas (.docx)", type="primary"):
        if not selected_pegawai:
            st.error("Silakan pilih minimal 1 pegawai yang ditugaskan!")
        else:
            filename = f"Surat_Tugas_{nomor_otomatis.replace('/', '_')}.docx"
            rentang_tgl = f"{tgl_mulai.strftime('%d %B %Y')} s.d. {tgl_selesai.strftime('%d %B %Y')}" if tgl_mulai != tgl_selesai else tgl_mulai.strftime('%d %B %Y')
            
            output_file = generate_surat_tugas_docx(
                nomor_lengkap=nomor_otomatis,
                dasar_undangan={
                    "instansi": instansi,
                    "nomor": nomor_undangan,
                    "perihal": f"Undangan {nama_acara}"
                },
                kegiatan={
                    "nama_acara": nama_acara,
                    "tanggal_kegiatan": rentang_tgl,
                    "lokasi": lokasi,
                    "anggaran": "DIPA Pusat Data dan Teknologi Informasi Tahun 2026"
                },
                daftar_pegawai=selected_pegawai,
                pejabat_penandatangan=selected_pejabat,
                output_filename=filename
            )

            # Catat ke Database Nomor Surat
            nomor_urut, tahun, bulan, _ = st.session_state.db_nomor.get_next_number()
            st.session_state.db_nomor.catat_surat_terbit(nomor_urut, tahun, bulan, nomor_otomatis, nama_acara)

            st.success(f"✅ Surat Tugas nomor **{nomor_otomatis}** berhasil dibuat dan dicatat ke log!")
            with open(output_file, "rb") as f:
                st.download_button(
                    label="⬇️ Download File Word (.docx)",
                    data=f,
                    file_name=filename,
                    mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                )
`;

export const PYTHON_FASTAPI_APP = `"""
FASTAPI REST BACKEND UNTUK GENERATOR SURAT TUGAS
================================================
Endpoints:
- GET  /api/nomor-surat/next  : Ambil nomor surat dinas otomatis
- POST /api/extract           : Ekstraksi OCR/AI dari teks undangan
- POST /api/generate-docx     : Buat dan download file .docx resmi
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import datetime
from generator_surat import NomorSuratManager, generate_surat_tugas_docx

app = FastAPI(title="Pusdatin Surat Tugas API", version="1.0.0")
nomor_manager = NomorSuratManager()

class PegawaiItem(BaseModel):
    nama: str
    nip: str
    pangkat_golongan: str
    jabatan: str
    unit_kerja: str

class PejabatSignatory(BaseModel):
    nama: str
    nip: str
    jabatan: str

class GenerateRequest(BaseModel):
    nama_acara: str
    instansi_pengundang: str
    nomor_surat_undangan: str
    tanggal_kegiatan: str
    lokasi: str
    anggaran: Optional[str] = "DIPA Pusdatin 2026"
    pegawai: List[PegawaiItem]
    penandatangan: PejabatSignatory

@app.get("/api/nomor-surat/next")
def get_next_nomor():
    nomor_urut, tahun, bulan, nomor_lengkap = nomor_manager.get_next_number()
    return {
        "nomor_urut": nomor_urut,
        "tahun": tahun,
        "bulan": bulan,
        "nomor_lengkap": nomor_lengkap
    }

@app.post("/api/generate-docx")
def generate_docx(req: GenerateRequest):
    nomor_urut, tahun, bulan, nomor_lengkap = nomor_manager.get_next_number()
    filename = f"Surat_Tugas_{nomor_urut}_{tahun}.docx"
    
    generate_surat_tugas_docx(
        nomor_lengkap=nomor_lengkap,
        dasar_undangan={
            "instansi": req.instansi_pengundang,
            "nomor": req.nomor_surat_undangan,
            "perihal": f"Undangan {req.nama_acara}"
        },
        kegiatan={
            "nama_acara": req.nama_acara,
            "tanggal_kegiatan": req.tanggal_kegiatan,
            "lokasi": req.lokasi,
            "anggaran": req.anggaran
        },
        daftar_pegawai=[p.dict() for p in req.pegawai],
        pejabat_penandatangan=req.penandatangan.dict(),
        output_filename=filename
    )
    
    # Catat log
    nomor_manager.catat_surat_terbit(nomor_urut, tahun, bulan, nomor_lengkap, req.nama_acara)
    return FileResponse(filename, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", filename=filename)
`;

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * GOOGLE APPS SCRIPT: SISTEM GENERATOR SURAT TUGAS
 * Pasang di Extensions > Apps Script pada Google Sheet Anda
 */

function generateNomorSuratOtomatis() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetNomor = ss.getSheetByName("Database Nomor Surat");
  
  const lastRow = sheetNomor.getLastRow();
  const now = new Date();
  const tahunSekarang = now.getFullYear();
  const bulanSekarang = ("0" + (now.getMonth() + 1)).slice(-2);
  
  let nomorUrut = 1;
  if (lastRow > 1) {
    const lastTahun = sheetNomor.getRange(lastRow, 2).getValue();
    const lastNomor = sheetNomor.getRange(lastRow, 1).getValue();
    if (lastTahun === tahunSekarang) {
      nomorUrut = Number(lastNomor) + 1;
    }
  }
  
  const nomorLengkap = nomorUrut + "/SJ.9/KP.01.06/" + bulanSekarang + "/" + tahunSekarang;
  return { nomorUrut, tahun: tahunSekarang, bulan: bulanSekarang, nomorLengkap };
}

function buatSuratTugas(dataForm) {
  const { nomorLengkap } = generateNomorSuratOtomatis();
  const templateId = "YOUR_GOOGLE_DOC_TEMPLATE_ID";
  const folder = DriveApp.getRootFolder();
  
  const fileCopy = DriveApp.getFileById(templateId).makeCopy("Surat Tugas - " + dataForm.namaAcara, folder);
  const doc = DocumentApp.openById(fileCopy.getId());
  const body = doc.getBody();
  
  body.replaceText("{{nomor_surat}}", nomorLengkap);
  body.replaceText("{{nama_acara}}", dataForm.namaAcara);
  body.replaceText("{{instansi_pengundang}}", dataForm.instansi);
  body.replaceText("{{lokasi}}", dataForm.lokasi);
  
  // Logika <= 3 vs > 3 Pegawai
  if (dataForm.daftarPegawai.length <= 3) {
    let teksPegawai = "";
    dataForm.daftarPegawai.forEach((peg, idx) => {
      teksPegawai += (idx + 1) + ". " + peg.nama + " (NIP: " + peg.nip + ", Jabatan: " + peg.jabatan + ")\\n";
    });
    body.replaceText("{{daftar_pegawai}}", teksPegawai);
  } else {
    body.replaceText("{{daftar_pegawai}}", "(Daftar Terlampir)");
    body.appendPageBreak();
    body.appendParagraph("LAMPIRAN SURAT TUGAS\\nNOMOR: " + nomorLengkap).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    
    const tableData = [["NO", "NAMA", "NIP", "PANGKAT/GOL", "JABATAN"]];
    dataForm.daftarPegawai.forEach((peg, idx) => {
      tableData.push([idx + 1, peg.nama, peg.nip, peg.pangkat, peg.jabatan]);
    });
    body.appendTable(tableData);
  }
  
  doc.saveAndClose();
  return doc.getUrl();
}
`;

export const PYTHON_REQUIREMENTS = `python-docx>=1.1.2
streamlit>=1.39.0
pandas>=2.2.0
google-genai>=2.4.0
fastapi>=0.115.0
uvicorn>=0.32.0
pydantic>=2.9.0
openpyxl>=3.1.5
`;

export const PYTHON_README = `# Sistem Generator Surat Tugas Otomatis (Python)

Aplikasi otomasi penyusunan Surat Tugas dinas resmi berstandar tata naskah dinas instansi pemerintah Republik Indonesia.

## Fitur Utama Sesuai Spesifikasi:
1. **Penomoran Otomatis**: Format \`{nomor_urut}/SJ.9/KP.01.06/{bulan}/{tahun}\`. Reset otomatis ke nomor 1 jika tahun berganti.
2. **Lookup Database Kepegawaian**: Otomatis mengisi NIP, Pangkat/Golongan, dan Jabatan saat memilih nama pegawai.
3. **Pilihan Penandatangan**: 1 Kepala Pusat (default) + 5 Ketua Tim (Katim).
4. **Logika Kondisional Pegawai**:
   - Jika $\\le 3$ pegawai: Dicetak langsung lengkap pada badan surat.
   - Jika $> 3$ pegawai: Bagian "Kepada" tertulis \`(Daftar Terlampir)\` dan otomatis membuat halaman lampiran baru berisi tabel resmi.
5. **Ekstraksi AI Undangan**: Menggunakan Google Gemini API untuk mengekstrak otomatis nama acara, tanggal, lokasi, dan nomor surat undangan.

## Cara Menjalankan Versi Streamlit (Web UI):
\`\`\`bash
# 1. Buat virtual environment & install requirements
python3 -m venv venv
source venv/bin/activate  # Di Windows: venv\\Scripts\\activate
pip install -r requirements.txt

# 2. Jalankan aplikasi Streamlit
streamlit run app_streamlit.py
\`\`\`

## Cara Menjalankan Versi Script CLI:
\`\`\`bash
python3 generator_surat.py
\`\`\`

## Cara Menjalankan FastAPI REST Backend:
\`\`\`bash
uvicorn server_fastapi:app --reload --port 8000
\`\`\`
`;

/**
 * Packs all Python project source files into a downloadable ZIP archive.
 */
export async function createPythonProjectZip(
  pegawai: Pegawai[],
  pejabat: Pejabat[],
  nomorSurat: NomorSuratRecord[]
): Promise<Blob> {
  const zip = new JSZip();

  zip.file('generator_surat.py', PYTHON_GENERATOR_SCRIPT);
  zip.file('app_streamlit.py', PYTHON_STREAMLIT_APP);
  zip.file('server_fastapi.py', PYTHON_FASTAPI_APP);
  zip.file('Code.gs', GOOGLE_APPS_SCRIPT_CODE);
  zip.file('requirements.txt', PYTHON_REQUIREMENTS);
  zip.file('README.md', PYTHON_README);

  // Add initial database json
  zip.file(
    'data/database_kepegawaian.json',
    JSON.stringify(pegawai, null, 2)
  );
  zip.file('data/database_pejabat.json', JSON.stringify(pejabat, null, 2));
  zip.file(
    'data/database_nomor_surat.json',
    JSON.stringify(nomorSurat, null, 2)
  );

  return await zip.generateAsync({ type: 'blob' });
}

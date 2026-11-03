/**
 * Format teks ringan ("markup") yang dipakai bersama oleh formulir (textarea),
 * lembar pratinjau (contentEditable), PDF, dan DOCX.
 *
 * Inline : **tebal**  ^^miring^^  __garis bawah__  ~~coret~~
 * Baris  : "# " Heading 1, "## " Heading 2, "- " bullet, awalan spasi (2 spasi = 1 tingkat indent)
 * Daftar bernomor ditulis apa adanya ("1. ", "2. ", ...).
 */

export interface ParsedLine {
  indent: number;
  heading: 0 | 1 | 2;
  bullet: boolean;
  text: string;
}

export interface Segment {
  text: string;
  b?: boolean;
  i?: boolean;
  u?: boolean;
  s?: boolean;
}

export interface RichOpts {
  rich?: boolean;
  variant?: 'plain' | 'nota';
}

const MAX_INDENT = 6;

export const parseLine = (line: string): ParsedLine => {
  const spaces = (line.match(/^ */) || [''])[0].length;
  const indent = Math.min(MAX_INDENT, Math.floor(spaces / 2));
  let rest = line.slice(spaces);
  let heading: 0 | 1 | 2 = 0;
  let bullet = false;
  let m: RegExpMatchArray | null;
  if ((m = rest.match(/^(#{1,2}) (.*)$/))) {
    heading = m[1].length as 1 | 2;
    rest = m[2];
  } else if ((m = rest.match(/^- (.*)$/))) {
    bullet = true;
    rest = m[1];
  }
  return { indent, heading, bullet, text: rest };
};

export const buildLine = (p: ParsedLine): string =>
  ' '.repeat(p.indent * 2) + (p.heading ? '#'.repeat(p.heading) + ' ' : p.bullet ? '- ' : '') + p.text;

const MARKERS: Array<['**' | '^^' | '__' | '~~', 'b' | 'i' | 'u' | 's']> = [
  ['**', 'b'],
  ['^^', 'i'],
  ['__', 'u'],
  ['~~', 's'],
];

export function inlineSegments(text: string): Segment[] {
  const segs: Segment[] = [];
  const f = { b: false, i: false, u: false, s: false };
  let buf = '';
  const flush = () => {
    if (!buf) return;
    const seg: Segment = { text: buf };
    if (f.b) seg.b = true;
    if (f.i) seg.i = true;
    if (f.u) seg.u = true;
    if (f.s) seg.s = true;
    segs.push(seg);
    buf = '';
  };
  let i = 0;
  while (i < text.length) {
    const two = text.substr(i, 2);
    const mk = MARKERS.find((m) => m[0] === two);
    if (mk) {
      const key = mk[1];
      const canClose = f[key];
      const canOpen = !f[key] && text.indexOf(two, i + 2) !== -1;
      if (canClose || canOpen) {
        flush();
        f[key] = !f[key];
        i += 2;
        continue;
      }
    }
    buf += text[i];
    i++;
  }
  flush();
  return segs;
}

export const stripInline = (text: string): string =>
  inlineSegments(text)
    .map((s) => s.text)
    .join('');

/** Teks yang benar-benar tampil (tanpa penanda format) untuk satu baris markup. */
export const visibleText = (line: string): string => stripInline(parseLine(line).text);

/** Seluruh markup -> teks polos (untuk tempat yang tidak mendukung format). */
export const stripMarkup = (text: string): string =>
  (text || '')
    .split('\n')
    .map((l) => visibleText(l))
    .join('\n');

export const visibleLength = (lines: string[]): number =>
  lines.reduce((sum, l) => sum + visibleText(l).length, 0);

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const inlineToHtml = (text: string, rich: boolean): string => {
  if (!rich) return escapeHtml(text);
  return inlineSegments(text)
    .map((seg) => {
      let h = escapeHtml(seg.text);
      if (seg.b) h = `<b>${h}</b>`;
      if (seg.i) h = `<i>${h}</i>`;
      if (seg.u) h = `<u>${h}</u>`;
      if (seg.s) h = `<s>${h}</s>`;
      return h;
    })
    .join('');
};

export const isNotaKeyValueLine = (text: string): boolean => {
  const t = stripInline(text).trim();
  return /^(Nama(?:\s+Pegawai|\s+Lengkap)?|NIP|NIK|Pangkat(?:\s*\/\s*Gol(?:\.\s*Ruang|\s*Ruang)?|\s+saat\s+ini|\s+yang\s+dituju)?|Golongan(?:\s*\/\s*Ruang)?|Jabatan(?:\s+Baru|\s+Lama|\s+saat\s+ini|\s+yang\s+dituju)?|Kelas\s+Jabatan(?:\s+Semula|\s+Usulan)?|Unit\s+Kerja|Instansi|TMT(?:\s+Jabatan|\s+Pangkat)?|Pendidikan|Tempat,\s*Tgl\s*Lahir|Masa\s+Kerja|Gaji\s+Pokok(?:\s+Lama|\s+Baru)?|Alamat\s+Email|Akun\s+Pengguna|Nomor\s+SK|Tautan(?:\s+Berkas|\s+Data)?|Narahubung|PIC)\s*:\s*\S+/i.test(
    t
  );
};

export const lineClass = (
  text: string,
  bullet: boolean,
  heading: number,
  variant: 'plain' | 'nota'
): string => {
  if (heading) return `rt-h${heading}`;
  if (variant !== 'nota') return '';
  if (bullet) return 'rt-b';
  const t = text.trim();
  if (/^\d+[.)]\s+/.test(t)) return 'rt-num';
  if (/^([a-zA-Z][.)]|\([0-9a-zA-Z]\))\s+/.test(t)) return 'rt-sub';
  if (isNotaKeyValueLine(t)) return 'rt-kv';
  return 'rt-p';
};

export function markupToHtml(text: string, opts: RichOpts = {}): string {
  const rich = opts.rich !== false;
  const variant = opts.variant || 'plain';
  if (!text) return '';
  return text
    .split('\n')
    .map((line) => {
      const p: ParsedLine = rich
        ? parseLine(line)
        : { indent: 0, heading: 0, bullet: false, text: line };
      const lClass = lineClass(p.text, p.bullet, p.heading, variant);
      const cls = `rt-line ${lClass}`.trim();
      const attrs =
        (p.indent ? ` data-indent="${p.indent}" style="margin-left:${p.indent * 24}px"` : '') +
        (p.heading ? ` data-h="${p.heading}"` : '') +
        (p.bullet ? ' data-list="b"' : '');
      if (lClass === 'rt-kv') {
        const colonIdx = p.text.indexOf(':');
        if (colonIdx !== -1) {
          const afterColon = p.text.slice(colonIdx + 1);
          const leadingSpaceMatch = afterColon.match(/^\s*/);
          const sepLen = 1 + (leadingSpaceMatch ? leadingSpaceMatch[0].length : 0);
          const keyPart = p.text.slice(0, colonIdx);
          const sepPart = p.text.slice(colonIdx, colonIdx + sepLen);
          const valPart = p.text.slice(colonIdx + sepLen);
          return `<div class="${cls}"${attrs}><span class="rt-kv-key">${inlineToHtml(keyPart, rich)}</span><span class="rt-kv-sep">${escapeHtml(sepPart)}</span><span class="rt-kv-val">${inlineToHtml(valPart, rich) || '<br>'}</span></div>`;
        }
      }
      return `<div class="${cls}"${attrs}>${inlineToHtml(p.text, rich) || '<br>'}</div>`;
    })
    .join('');
}

const BLOCK_TAGS = new Set(['DIV', 'P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'BLOCKQUOTE']);
const isBlockEl = (n: Node): n is HTMLElement => n.nodeType === 1 && BLOCK_TAGS.has((n as HTMLElement).tagName);

function inlineMarkup(node: Node, rich: boolean): string {
  if (node.nodeType === 3) {
    return (node.textContent || '').replace(/\u00a0/g, ' ').replace(/\u200b/g, '');
  }
  if (node.nodeType !== 1) return '';
  const el = node as HTMLElement;
  if (el.tagName === 'BR') return '\n';
  let inner = '';
  el.childNodes.forEach((c) => {
    inner += inlineMarkup(c, rich);
  });
  if (!rich || !inner.trim()) return inner;
  const tag = el.tagName;
  const st = el.style;
  const deco = `${st.textDecorationLine || ''} ${st.textDecoration || ''}`;
  const bold = tag === 'B' || tag === 'STRONG' || /^(bold|[6-9]00)$/.test(st.fontWeight || '');
  const italic = tag === 'I' || tag === 'EM' || st.fontStyle === 'italic';
  const underline = tag === 'U' || /underline/.test(deco);
  const strike = tag === 'S' || tag === 'STRIKE' || tag === 'DEL' || /line-through/.test(deco);
  if (bold) inner = `**${inner}**`;
  if (italic) inner = `^^${inner}^^`;
  if (underline) inner = `__${inner}__`;
  if (strike) inner = `~~${inner}~~`;
  return inner;
}

function blockLine(el: HTMLElement, rich: boolean): string {
  let inner = '';
  el.childNodes.forEach((c) => {
    inner += inlineMarkup(c, rich);
  });
  inner = inner.replace(/\n$/, '');
  if (!rich) return inner;
  const indent = Math.min(MAX_INDENT, parseInt(el.dataset.indent || '0', 10) || 0);
  const heading = (parseInt(el.dataset.h || '0', 10) || 0) as 0 | 1 | 2;
  const bullet = el.dataset.list === 'b';
  const [first, ...others] = inner.split('\n');
  const head = buildLine({ indent, heading, bullet, text: first });
  return [head, ...others].join('\n');
}

function collectLines(parent: Node, rich: boolean, lines: string[]) {
  let buf = '';
  let hasBuf = false;
  const flush = () => {
    if (hasBuf) {
      lines.push(buf.replace(/\n$/, ''));
      buf = '';
      hasBuf = false;
    }
  };
  parent.childNodes.forEach((n) => {
    if (isBlockEl(n)) {
      flush();
      const tag = n.tagName;
      if (tag === 'UL' || tag === 'OL') {
        n.querySelectorAll(':scope > li').forEach((li, idx) => {
          const txt = blockLine(li as HTMLElement, rich);
          lines.push(tag === 'UL' ? (rich ? `- ${txt}` : txt) : `${idx + 1}. ${txt}`);
        });
      } else if (Array.from(n.children).some((c) => isBlockEl(c))) {
        collectLines(n, rich, lines);
      } else {
        lines.push(blockLine(n, rich));
      }
    } else {
      buf += inlineMarkup(n, rich);
      hasBuf = true;
    }
  });
  flush();
}

export function htmlToMarkup(root: HTMLElement, opts: RichOpts = {}): string {
  const rich = opts.rich !== false;
  const lines: string[] = [];
  collectLines(root, rich, lines);
  return lines.join('\n');
}

/** Normalisasi untuk perbandingan: buang baris kosong & spasi akhir. */
export const normMarkup = (text: string): string =>
  (text || '')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l) => l.trim() !== '')
    .join('\n');

// ─── Posisi kursor berbasis offset teks tampak ────────────────────────────────

export function getVisibleOffset(root: HTMLElement, node?: Node | null, offset?: number): number {
  const sel = window.getSelection();
  const n = node ?? sel?.anchorNode;
  const o = offset ?? sel?.anchorOffset ?? 0;
  if (!n || !root.contains(n)) return 0;
  const r = document.createRange();
  r.selectNodeContents(root);
  r.setEnd(n, o);
  return r.toString().replace(/\u200b/g, '').length;
}

export function visibleTotal(root: HTMLElement): number {
  return (root.textContent || '').replace(/\u200b/g, '').length;
}

function locate(root: HTMLElement, offset: number): { node: Node; off: number } {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let last: Text | null = null;
  let cur = walker.nextNode() as Text | null;
  while (cur) {
    const len = cur.data.length;
    if (remaining <= len) return { node: cur, off: remaining };
    remaining -= len;
    last = cur;
    cur = walker.nextNode() as Text | null;
  }
  if (last) return { node: last, off: last.data.length };
  return { node: root, off: 0 };
}

export function setVisibleRange(root: HTMLElement, start: number, end: number = start) {
  const sel = window.getSelection();
  if (!sel) return;
  const a = locate(root, start);
  const b = locate(root, end);
  const r = document.createRange();
  r.setStart(a.node, a.off);
  r.setEnd(b.node, b.off);
  sel.removeAllRanges();
  sel.addRange(r);
}

/** Bungkus teks/elemen inline yang "telanjang" di root menjadi baris (div). */
export function ensureBlocks(root: HTMLElement) {
  const needs = Array.from(root.childNodes).some((n) => n.nodeType === 3 || (n.nodeType === 1 && !isBlockEl(n)));
  if (!needs) return;
  const sel = window.getSelection();
  const hasSel = !!sel && sel.rangeCount > 0 && root.contains(sel.anchorNode);
  let s = 0;
  let e = 0;
  if (hasSel) {
    const r = sel!.getRangeAt(0);
    s = getVisibleOffset(root, r.startContainer, r.startOffset);
    e = getVisibleOffset(root, r.endContainer, r.endOffset);
  }
  let run: Node[] = [];
  const flushRun = () => {
    if (!run.length) return;
    const div = document.createElement('div');
    div.className = 'rt-line';
    root.insertBefore(div, run[0]);
    run.forEach((n) => div.appendChild(n));
    run = [];
  };
  Array.from(root.childNodes).forEach((n) => {
    if (isBlockEl(n)) flushRun();
    else run.push(n);
  });
  flushRun();
  if (hasSel) setVisibleRange(root, s, e);
}

/** Perbarui kelas gaya paragraf (pratinjau nota) sesuai isi tiap baris. */
export function applyLineClasses(root: HTMLElement, variant: 'plain' | 'nota') {
  Array.from(root.children).forEach((c) => {
    if (c.tagName !== 'DIV') return;
    const el = c as HTMLElement;
    const heading = parseInt(el.dataset.h || '0', 10) || 0;
    const bullet = el.dataset.list === 'b';
    el.className = `rt-line ${lineClass(el.textContent || '', bullet, heading, variant)}`.trim();
  });
}


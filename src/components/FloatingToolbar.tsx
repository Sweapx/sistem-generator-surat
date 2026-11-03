import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  IndentDecrease,
  IndentIncrease,
  ChevronDown,
} from 'lucide-react';
import {
  parseLine,
  buildLine,
  ensureBlocks,
  applyLineClasses,
  getVisibleOffset,
  setVisibleRange,
} from '../services/richText';

type Target = HTMLElement; // contentEditable root atau textarea

interface ToolbarState {
  top: number;
  left: number;
  isCE: boolean;
  active: { b: boolean; i: boolean; u: boolean; s: boolean };
  style: 'Normal' | 'Heading 1' | 'Heading 2';
}

const STYLE_OPTIONS: Array<{ label: ToolbarState['style']; level: 0 | 1 | 2 }> = [
  { label: 'Normal', level: 0 },
  { label: 'Heading 1', level: 1 },
  { label: 'Heading 2', level: 2 },
];

const isTextarea = (el: Element | null): el is HTMLTextAreaElement =>
  !!el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'text'));

const findTarget = (el: Element | null): Target | null => {
  if (!el) return null;
  // Jika interaksi ada di dalam floating toolbar itu sendiri, jangan reset target
  if (el.closest?.('[data-floating-toolbar]')) return null;

  // 1. Cek langsung jika elemen adalah textarea, text input, atau contentEditable
  if (isTextarea(el) || (el as HTMLElement).isContentEditable) {
    return el as HTMLElement;
  }
  // 2. Cek elemen editable parent terdekat
  const t = (el as HTMLElement).closest?.('[data-rich="true"], [contenteditable="true"], textarea, input[type="text"]') as HTMLElement | null;
  if (t && (isTextarea(t) || t.isContentEditable)) return t;

  return null;
};

// ── Operasi pada textarea / text input (teks berpenanda) ─────────────────────

function setTextareaValue(el: HTMLTextAreaElement | HTMLInputElement, value: string, s: number, e: number) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  try {
    el.setSelectionRange(s, e);
  } catch {}
}

function taInline(el: HTMLTextAreaElement, marker: string) {
  const v = el.value;
  const s = el.selectionStart || 0;
  const e = el.selectionEnd || 0;
  const m = marker.length;
  const sel = v.slice(s, e);
  if (!sel) {
    setTextareaValue(el, v.slice(0, s) + marker + marker + v.slice(e), s + m, s + m);
    return;
  }
  if (sel.length >= m * 2 && sel.startsWith(marker) && sel.endsWith(marker)) {
    const inner = sel.slice(m, sel.length - m);
    setTextareaValue(el, v.slice(0, s) + inner + v.slice(e), s, s + inner.length);
    return;
  }
  if (v.slice(s - m, s) === marker && v.slice(e, e + m) === marker) {
    setTextareaValue(el, v.slice(0, s - m) + sel + v.slice(e + m), s - m, e - m);
    return;
  }
  setTextareaValue(el, v.slice(0, s) + marker + sel + marker + v.slice(e), s + m, e + m);
}

function taLines(
  el: HTMLTextAreaElement,
  transform: (lines: ReturnType<typeof parseLine>[]) => ReturnType<typeof parseLine>[]
) {
  const v = el.value;
  const s = el.selectionStart || 0;
  const e = el.selectionEnd || 0;
  const ls = v.lastIndexOf('\n', s - 1) + 1;
  let le = v.indexOf('\n', e > s && v[e - 1] === '\n' ? e - 1 : e);
  if (le === -1) le = v.length;
  const parsed = v.slice(ls, le).split('\n').map(parseLine);
  const out = transform(parsed).map(buildLine).join('\n');
  setTextareaValue(el, v.slice(0, ls) + out + v.slice(le), ls, ls + out.length);
}

const NUM_RE = /^\d+\.\s+/;

function taCommand(el: HTMLTextAreaElement, cmd: string, arg?: number) {
  el.focus();
  switch (cmd) {
    case 'bold':
      return taInline(el, '**');
    case 'italic':
      return taInline(el, '^^');
    case 'underline':
      return taInline(el, '__');
    case 'strike':
      return taInline(el, '~~');
    case 'style':
      return taLines(el, (ls) =>
        ls.map((l) => ({
          ...l,
          heading: (arg || 0) as 0 | 1 | 2,
          bullet: arg ? false : l.bullet,
        }))
      );
    case 'bullet':
      return taLines(el, (ls) => {
        const all = ls.every((l) => l.bullet);
        return ls.map((l) => ({
          ...l,
          heading: 0,
          bullet: !all,
          text: l.text.replace(NUM_RE, ''),
        }));
      });
    case 'number':
      return taLines(el, (ls) => {
        const all = ls.every((l) => NUM_RE.test(l.text));
        let n = 0;
        return ls.map((l) => {
          if (all) return { ...l, text: l.text.replace(NUM_RE, '') };
          n++;
          return { ...l, heading: 0, bullet: false, text: `${n}. ${l.text.replace(NUM_RE, '')}` };
        });
      });
    case 'indent':
      return taLines(el, (ls) => ls.map((l) => ({ ...l, indent: Math.min(l.indent + 1, 4) })));
    case 'outdent':
      return taLines(el, (ls) => ls.map((l) => ({ ...l, indent: Math.max(l.indent - 1, 0) })));
  }
}

// ── Operasi pada contentEditable (DOM kaya) ──────────────────────────────────

function ceCommand(root: HTMLElement, cmd: string, arg?: number) {
  root.focus();
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;

  switch (cmd) {
    case 'bold':
      document.execCommand('bold', false);
      break;
    case 'italic':
      document.execCommand('italic', false);
      break;
    case 'underline':
      document.execCommand('underline', false);
      break;
    case 'strike':
      document.execCommand('strikeThrough', false);
      break;
    case 'style':
      ceSetStyle(root, (arg || 0) as 0 | 1 | 2);
      break;
    case 'bullet':
      ceToggleList(root, 'bullet');
      break;
    case 'number':
      ceToggleList(root, 'number');
      break;
    case 'indent':
      ceChangeIndent(root, +1);
      break;
    case 'outdent':
      ceChangeIndent(root, -1);
      break;
  }
}

function getSelectedBlocks(root: HTMLElement): HTMLElement[] {
  ensureBlocks(root);
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return [];
  const r = sel.getRangeAt(0);
  const blocks = Array.from(root.querySelectorAll<HTMLElement>('.rt-line'));
  return blocks.filter((b) => r.intersectsNode(b));
}

function ceSetStyle(root: HTMLElement, level: 0 | 1 | 2) {
  const blocks = getSelectedBlocks(root);
  const s = getVisibleOffset(root);
  const e = s;
  blocks.forEach((b) => {
    b.dataset.h = String(level);
    if (level > 0) {
      delete b.dataset.list;
      b.style.marginLeft = '';
      stripNumber(b);
    }
  });
  applyLineClasses(root, (root.dataset.variant as 'plain' | 'nota') || 'plain');
  try {
    setVisibleRange(root, s, e);
  } catch {}
  root.dispatchEvent(new Event('input', { bubbles: true }));
}

function ceToggleList(root: HTMLElement, kind: 'bullet' | 'number') {
  const blocks = getSelectedBlocks(root);
  const s = getVisibleOffset(root);
  const e = s;
  const allMatch =
    kind === 'bullet'
      ? blocks.every((b) => b.dataset.list === 'bullet')
      : blocks.every((b) => NUM_RE.test((b.textContent || '').trim()));

  blocks.forEach((b, i) => {
    b.dataset.h = '0';
    if (allMatch) {
      delete b.dataset.list;
      stripNumber(b);
    } else if (kind === 'bullet') {
      b.dataset.list = 'bullet';
      stripNumber(b);
    } else {
      delete b.dataset.list;
      stripNumber(b);
      const text = b.textContent || '';
      b.textContent = `${i + 1}. ${text.trimStart()}`;
    }
  });
  applyLineClasses(root, (root.dataset.variant as 'plain' | 'nota') || 'plain');
  try {
    setVisibleRange(root, s, e);
  } catch {}
  root.dispatchEvent(new Event('input', { bubbles: true }));
}

function ceChangeIndent(root: HTMLElement, delta: number) {
  const blocks = getSelectedBlocks(root);
  const s = getVisibleOffset(root);
  const e = s;
  blocks.forEach((b) => {
    const cur = parseInt(b.dataset.indent || '0', 10);
    const next = Math.max(0, Math.min(4, cur + delta));
    b.dataset.indent = String(next);
    if (next > 0) {
      b.style.marginLeft = `${next * 24}px`;
    } else {
      b.style.marginLeft = '';
    }
  });
  applyLineClasses(root, (root.dataset.variant as 'plain' | 'nota') || 'plain');
  try {
    setVisibleRange(root, s, e);
  } catch {}
  root.dispatchEvent(new Event('input', { bubbles: true }));
}

function stripNumber(block: HTMLElement) {
  const first = block.firstChild;
  if (first && first.nodeType === 3) {
    const t = first as Text;
    const m = t.data.match(NUM_RE);
    if (m) t.data = t.data.slice(m[0].length);
  }
}

// ── Komponen Floating Toolbar Global ─────────────────────────────────────────

export const FloatingToolbar: React.FC = () => {
  const [state, setState] = useState<ToolbarState | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const targetRef = useRef<Target | null>(null);

  const compute = useCallback(() => {
    const el = targetRef.current;
    if (!el || !document.contains(el)) {
      setState(null);
      return;
    }
    const isCE = !isTextarea(el);
    let rect = el.getBoundingClientRect();
    let active = { b: false, i: false, u: false, s: false };
    let style: ToolbarState['style'] = 'Normal';

    if (isCE) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount && el.contains(sel.anchorNode)) {
        const r = sel.getRangeAt(0);
        const rr = r.getClientRects()[0] || r.getBoundingClientRect();
        if (rr && (rr.width > 0 || rr.height > 0)) rect = rr as DOMRect;
        const blk = ((sel.anchorNode as Node).nodeType === 1
          ? (sel.anchorNode as HTMLElement)
          : (sel.anchorNode as Node).parentElement
        )?.closest('.rt-line') as HTMLElement | null;
        const h = parseInt(blk?.dataset.h || '0', 10);
        style = h === 1 ? 'Heading 1' : h === 2 ? 'Heading 2' : 'Normal';
      }
      try {
        active = {
          b: document.queryCommandState('bold'),
          i: document.queryCommandState('italic'),
          u: document.queryCommandState('underline'),
          s: document.queryCommandState('strikeThrough'),
        };
      } catch {}
    } else {
      const ta = el as HTMLTextAreaElement;
      const s = ta.selectionStart || 0;
      const ls = ta.value.lastIndexOf('\n', s - 1) + 1;
      const le = ta.value.indexOf('\n', s);
      const h = parseLine(ta.value.slice(ls, le === -1 ? undefined : le)).heading;
      style = h === 1 ? 'Heading 1' : h === 2 ? 'Heading 2' : 'Normal';
    }

    const W = 380;
    const H = 42;
    let top = rect.top - H - 8;
    // Jika di atas mentok layar, tampilkan di bawah elemen
    if (top < 8) top = Math.min(rect.bottom + 8, window.innerHeight - H - 8);
    top = Math.max(8, top);
    const left = Math.max(8, Math.min(rect.left + (rect.width / 2) - (W / 2), window.innerWidth - W - 8));
    setState({ top, left, isCE, active, style });
  }, []);

  useEffect(() => {
    const handleCheck = () => {
      const active = document.activeElement;
      const t = findTarget(active);
      if (t) {
        targetRef.current = t;
        compute();
      } else if (!active?.closest?.('[data-floating-toolbar]')) {
        targetRef.current = null;
        setState(null);
        setMenuOpen(false);
      }
    };

    document.addEventListener('focusin', handleCheck);
    document.addEventListener('selectionchange', handleCheck);
    document.addEventListener('keyup', handleCheck);
    document.addEventListener('mouseup', handleCheck);
    window.addEventListener('scroll', handleCheck, true);
    window.addEventListener('resize', handleCheck);

    return () => {
      document.removeEventListener('focusin', handleCheck);
      document.removeEventListener('selectionchange', handleCheck);
      document.removeEventListener('keyup', handleCheck);
      document.removeEventListener('mouseup', handleCheck);
      window.removeEventListener('scroll', handleCheck, true);
      window.removeEventListener('resize', handleCheck);
    };
  }, [compute]);

  const run = (cmd: string, arg?: number) => {
    const el = targetRef.current;
    if (!el) return;
    if (isTextarea(el)) {
      taCommand(el as HTMLTextAreaElement, cmd, arg);
    } else {
      ceCommand(el, cmd, arg);
    }
    setMenuOpen(false);
    compute();
  };

  if (!state) return null;

  return createPortal(
    <div
      data-floating-toolbar="true"
      style={{
        position: 'fixed',
        top: `${state.top}px`,
        left: `${state.left}px`,
        zIndex: 99999,
      }}
      className="flex items-center gap-0.5 p-1 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 text-xs select-none backdrop-blur-md animate-fade-in"
      onMouseDown={(e) => {
        // Mencegah blur pada editor/textarea
        e.preventDefault();
      }}
    >
      {/* Text Style Selector (Dropdown Text ∨) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
          title="Ubah gaya teks (Heading, Normal)"
        >
          <span>{state.style}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
        </button>

        {menuOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1 z-50">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => run('style', opt.level)}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-700 transition-colors flex items-center justify-between cursor-pointer ${
                  state.style === opt.label ? 'text-blue-400 font-bold' : 'text-slate-200'
                }`}
              >
                <span>{opt.label}</span>
                {state.style === opt.label && <span className="text-[10px]">&bull;</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-slate-700 mx-0.5" />

      {/* Format Teks Dasar: B, I, U, S */}
      <button
        type="button"
        onClick={() => run('bold')}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          state.active.b ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
        }`}
        title="Tebal / Bold (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => run('italic')}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          state.active.i ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
        }`}
        title="Miring / Italic (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => run('underline')}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          state.active.u ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
        }`}
        title="Garis Bawah / Underline (Ctrl+U)"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => run('strike')}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          state.active.s ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
        }`}
        title="Coret / Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-slate-700 mx-0.5" />

      {/* Lists: Bullets & Numbered */}
      <button
        type="button"
        onClick={() => run('bullet')}
        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
        title="Daftar Poin / Bullet List"
      >
        <List className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => run('number')}
        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
        title="Daftar Bernomor / Numbered List"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-slate-700 mx-0.5" />

      {/* Indentasi: Outdent & Indent */}
      <button
        type="button"
        onClick={() => run('outdent')}
        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
        title="Kurangi Indentasi / Decrease Indent"
      >
        <IndentDecrease className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => run('indent')}
        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
        title="Tambah Indentasi / Increase Indent"
      >
        <IndentIncrease className="w-3.5 h-3.5" />
      </button>
    </div>,
    document.body
  );
};

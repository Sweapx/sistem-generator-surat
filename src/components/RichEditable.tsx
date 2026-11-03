import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  htmlToMarkup,
  markupToHtml,
  normMarkup,
  ensureBlocks,
  getVisibleOffset,
  setVisibleRange,
  visibleTotal,
} from '../services/richText';

/** Penyerahan kursor antar editor dalam satu grup (mis. halaman 1 -> halaman 2 nota dinas). */
let pendingHandoff: { group: string; abs: number } | null = null;
let handoffTimer: number | undefined;

interface RichEditableProps {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  variant?: 'plain' | 'nota';
  /** false = teks polos (tanpa format & tanpa toolbar). */
  rich?: boolean;
  singleLine?: boolean;
  style?: React.CSSProperties;
  className?: string;
  title?: string;
  groupId?: string;
  groupStart?: number;
  debounceMs?: number;
}

/**
 * Editor langsung (contentEditable) yang:
 * - Menggunakan CSS Grid slot tunggal sehingga placeholder otomatis memberikan tinggi alami
 *   dan TIDAK PERNAH MENUMPUK dengan elemen atau baris di bawahnya!
 * - Selalu menyinkronkan tampilan dengan `value` (reset isi benar-benar mengosongkan kotak dan placeholder),
 * - Menyimpan perubahan saat mengetik (debounce cepat ~150ms) dan saat keluar / pindah tab,
 * - Mendukung format ringan lewat floating toolbar.
 */
export const RichEditable: React.FC<RichEditableProps> = ({
  value,
  onCommit,
  placeholder,
  variant = 'plain',
  rich = true,
  singleLine = false,
  style,
  className = '',
  title,
  groupId,
  groupStart = 0,
  debounceMs = 90,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const composing = useRef(false);
  const valueRef = useRef(value);
  const commitRef = useRef(onCommit);
  const startRef = useRef(groupStart);
  valueRef.current = value;
  commitRef.current = onCommit;
  startRef.current = groupStart;

  const [isEmpty, setIsEmpty] = useState(() => normMarkup(value || '').trim() === '');
  const [commitTick, setCommitTick] = useState(0);

  const refreshEmpty = (el: HTMLElement) => {
    const rawText = (el.textContent || '').replace(/\u200b/g, '').trim();
    setIsEmpty(rawText === '' && !el.querySelector('[data-list]'));
  };

  // Sinkronkan DOM dengan value (termasuk saat reset isi atau saat dipotong ke halaman berikutnya)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isValBlank = normMarkup(value || '').trim() === '';
    // Jika value kosong (misal saat reset), bersihkan seluruh isi DOM secara mutlak
    if (isValBlank) {
      window.clearTimeout(timer.current);
      if (el.innerHTML !== '') {
        el.innerHTML = '';
      }
      setIsEmpty(true);
      return;
    }

    const focused = document.activeElement === el;
    const currentMarkup = normMarkup(htmlToMarkup(el, { rich }));
    const targetMarkup = normMarkup(value || '');

    if (currentMarkup !== targetMarkup) {
      window.clearTimeout(timer.current);
      const caret = focused ? getVisibleOffset(el) : null;
      el.innerHTML = markupToHtml(value || '', { rich, variant });
      if (focused && caret !== null) {
        const newTotal = visibleTotal(el);
        if (groupId && caret > newTotal) {
          // Teks meluber ke halaman berikutnya -> oper fokus dan kursor ke editor halaman berikutnya
          pendingHandoff = { group: groupId, abs: startRef.current + caret };
          window.clearTimeout(handoffTimer);
          handoffTimer = window.setTimeout(() => {
            pendingHandoff = null;
          }, 350);
        } else {
          const p = Math.min(caret, newTotal);
          setVisibleRange(el, p, p);
        }
      }
    }
    refreshEmpty(el);
  }, [value, rich, variant, commitTick]);

  // Terima kursor yang "dioper" dari editor lain dalam grup
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !groupId || !pendingHandoff) return;
    if (pendingHandoff.group !== groupId) return;
    const req = pendingHandoff.abs;
    const myStart = groupStart;
    const myTotal = visibleTotal(el);
    const myEnd = myStart + myTotal;
    if (req >= myStart && req <= myEnd + 5) {
      pendingHandoff = null;
      window.clearTimeout(handoffTimer);
      el.focus();
      const local = Math.max(0, Math.min(myTotal, req - myStart));
      setVisibleRange(el, local, local);
      try {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } catch {}
    }
  });

  const commit = () => {
    window.clearTimeout(timer.current);
    const el = ref.current;
    if (!el) return;
    const next = htmlToMarkup(el, { rich });
    if (normMarkup(next) !== normMarkup(valueRef.current || '')) {
      commitRef.current(next);
      setCommitTick((t) => t + 1);
    }
    refreshEmpty(el);
  };

  // Pastikan perubahan di-commit saat unmount / tab berpindah
  useEffect(() => {
    const handleBeforeUnload = () => {
      commit();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      commit();
    };
  }, []);

  const handleInput = () => {
    if (composing.current) return;
    const el = ref.current;
    if (!el) return;
    ensureBlocks(el);
    refreshEmpty(el);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(commit, debounceMs);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        alignItems: 'start',
        position: 'relative',
        minWidth: 0,
        ...style,
      }}
      className={className}
    >
      {/* Placeholder menggunakan slot grid yang sama sehingga memberikan tinggi alami teks dan TIDAK PERNAH MENUMPUK */}
      {isEmpty && placeholder && (
        <div
          className="no-print select-none"
          style={{
            gridArea: '1 / 1 / 2 / 2',
            color: '#94a3b8',
            fontStyle: 'italic',
            fontWeight: 'normal',
            pointerEvents: 'none',
            userSelect: 'none',
            lineHeight: style?.lineHeight || 'inherit',
            textAlign: style?.textAlign || 'left',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            zIndex: 1,
            padding: 0,
            margin: 0,
          }}
        >
          {placeholder}
        </div>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        data-rich={rich ? 'true' : undefined}
        data-variant={variant}
        title={title}
        className={`editable-text-field rt-root rt-${variant}`}
        style={{
          gridArea: '1 / 1 / 2 / 2',
          outline: 'none',
          minHeight: '1.25em',
          width: '100%',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: style?.lineHeight || 'inherit',
          textAlign: style?.textAlign || 'left',
          background: 'transparent',
          position: 'relative',
          zIndex: 2,
        }}
        onInput={handleInput}
        onBlur={commit}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
          handleInput();
        }}
        onKeyDown={(e) => {
          if (singleLine && e.key === 'Enter') e.preventDefault();
        }}
      />
    </div>
  );
};

export const MarkupText: React.FC<{
  text: string;
  variant?: 'plain' | 'nota';
  style?: React.CSSProperties;
  className?: string;
}> = ({ text, variant = 'plain', style, className }) => {
  const html = markupToHtml(text || '', { rich: true, variant });
  return (
    <div
      style={style}
      className={`rt-root rt-${variant} ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

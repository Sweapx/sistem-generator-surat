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

/** Penyerahan kursor antar editor dalam satu grup (mis. halaman 1 -> halaman 2). */
let pendingHandoff: { group: string; abs: number; fromStart: number; overflowChars: number } | null = null;
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
  const isDirtyRef = useRef(false);
  const isMountedRef = useRef(true);
  const valueRef = useRef(value);
  const commitRef = useRef(onCommit);
  const startRef = useRef(groupStart);
  valueRef.current = value;
  commitRef.current = onCommit;
  startRef.current = groupStart;

  const isEmptyRef = useRef(normMarkup(value || '').trim() === '');
  const [isEmpty, setIsEmpty] = useState(isEmptyRef.current);

  const setEmptySafe = (nextEmpty: boolean) => {
    if (isEmptyRef.current !== nextEmpty) {
      isEmptyRef.current = nextEmpty;
      setIsEmpty(nextEmpty);
    }
  };

  const refreshEmpty = (el: HTMLElement) => {
    const rawText = (el.textContent || '').replace(/\u200b/g, '').trim();
    const nextEmpty = rawText === '' && !el.querySelector('[data-list]');
    setEmptySafe(nextEmpty);
  };

  // Sinkronkan DOM dengan value (termasuk saat reset isi atau saat dipotong ke halaman berikutnya)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isValBlank = normMarkup(value || '').trim() === '';
    // Jika value kosong (misal saat reset), bersihkan seluruh isi DOM secara mutlak
    if (isValBlank) {
      window.clearTimeout(timer.current);
      timer.current = undefined;
      isDirtyRef.current = false;
      if (el.innerHTML !== '') {
        el.innerHTML = '';
      }
      setEmptySafe(true);
      return;
    }

    const focused = document.activeElement === el;
    const currentMarkup = normMarkup(htmlToMarkup(el, { rich }));
    const targetMarkup = normMarkup(value || '');

    if (currentMarkup !== targetMarkup) {
      window.clearTimeout(timer.current);
      timer.current = undefined;
      isDirtyRef.current = false;
      const caret = focused ? getVisibleOffset(el) : null;
      el.innerHTML = markupToHtml(value || '', { rich, variant });
      if (focused && caret !== null) {
        const newTotal = visibleTotal(el);
        if (groupId && caret > newTotal) {
          // Teks meluber ke halaman berikutnya -> oper fokus dan kursor ke editor halaman berikutnya
          pendingHandoff = {
            group: groupId,
            abs: startRef.current + caret,
            fromStart: startRef.current,
            overflowChars: caret - newTotal,
          };
          window.clearTimeout(handoffTimer);
          handoffTimer = window.setTimeout(() => {
            pendingHandoff = null;
          }, 400);
        } else {
          const p = Math.min(caret, newTotal);
          setVisibleRange(el, p, p);
        }
      }
    }
    refreshEmpty(el);
  }, [value, rich, variant]);

  // Terima kursor yang "dioper" dari editor lain dalam grup
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !groupId || !pendingHandoff) return;
    if (pendingHandoff.group !== groupId) return;
    const req = pendingHandoff.abs;
    const myStart = groupStart;
    const myTotal = visibleTotal(el);
    const myEnd = myStart + myTotal;
    const isNextPageTarget = myStart > pendingHandoff.fromStart && myTotal > 0;
    if ((req >= myStart && req <= myEnd + 25) || isNextPageTarget) {
      const overflowOffset = pendingHandoff.overflowChars;
      pendingHandoff = null;
      window.clearTimeout(handoffTimer);
      el.focus();
      const local = isNextPageTarget
        ? Math.max(0, Math.min(myTotal, overflowOffset))
        : Math.max(0, Math.min(myTotal, req - myStart));
      setVisibleRange(el, local, local);
      try {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } catch {}
    }
  });

  const commit = () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    if (!isDirtyRef.current) return;
    isDirtyRef.current = false;
    const el = ref.current;
    if (!el) return;
    const next = htmlToMarkup(el, { rich });
    if (normMarkup(next) !== normMarkup(valueRef.current || '')) {
      commitRef.current(next);
    }
    if (isMountedRef.current) {
      refreshEmpty(el);
    }
  };

  // Pastikan perubahan yang sedang diketik di-commit saat unmount / tab berpindah
  useEffect(() => {
    isMountedRef.current = true;
    const handleBeforeUnload = () => {
      commit();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (isDirtyRef.current) {
        commit();
      } else {
        window.clearTimeout(timer.current);
        timer.current = undefined;
      }
    };
  }, []);

  const handleInput = () => {
    if (composing.current) return;
    const el = ref.current;
    if (!el) return;
    isDirtyRef.current = true;
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
          cursor: 'text',
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
          const el = ref.current;
          if (!el) return;

          const moveFocusToSiblingEditable = (direction: 'prev' | 'next') => {
            const page = el.closest('.print-page') || document;
            const allEditables = Array.from(
              page.querySelectorAll<HTMLElement>('.editable-text-field[contenteditable="true"]')
            );
            const idx = allEditables.indexOf(el);
            if (idx === -1) return false;
            const target = direction === 'next' ? allEditables[idx + 1] : allEditables[idx - 1];
            if (!target) return false;
            target.focus();
            const total = visibleTotal(target);
            const pos = direction === 'next' ? 0 : total;
            setVisibleRange(target, pos, pos);
            return true;
          };

          if (singleLine && e.key === 'Enter') {
            e.preventDefault();
            commit();
            moveFocusToSiblingEditable('next');
            return;
          }

          if (e.key === 'ArrowDown' && !e.shiftKey) {
            const caret = getVisibleOffset(el);
            const total = visibleTotal(el);
            const textAfter = (el.textContent || '').slice(caret);
            if (!textAfter.includes('\n') && caret >= total) {
              if (moveFocusToSiblingEditable('next')) {
                e.preventDefault();
              }
            }
          } else if (e.key === 'ArrowUp' && !e.shiftKey) {
            const caret = getVisibleOffset(el);
            const textBefore = (el.textContent || '').slice(0, caret);
            if (!textBefore.includes('\n') && caret <= 0) {
              if (moveFocusToSiblingEditable('prev')) {
                e.preventDefault();
              }
            }
          } else if (e.key === 'ArrowRight' && !e.shiftKey) {
            const caret = getVisibleOffset(el);
            const total = visibleTotal(el);
            if (caret >= total) {
              if (moveFocusToSiblingEditable('next')) {
                e.preventDefault();
              }
            }
          } else if (e.key === 'ArrowLeft' && !e.shiftKey) {
            const caret = getVisibleOffset(el);
            if (caret <= 0) {
              if (moveFocusToSiblingEditable('prev')) {
                e.preventDefault();
              }
            }
          }
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

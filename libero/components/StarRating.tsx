'use client';

import { useState } from 'react';
import { LEVEL_NAMES, type Level } from '@/lib/types';
import { StarGlyph } from './Icon';

interface Props {
  value: number; // 0–5
  onChange?: (v: Level) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showName?: boolean;
  readOnly?: boolean;
  className?: string;
}

/** 1–5 yıldızlı yetenek seviyesi. Erişilebilir radyo grubu; klavye ile ok tuşları. */
export function StarRating({ value, onChange, size = 'md', label = 'Yetenek seviyesi', showName = true, readOnly, className = '' }: Props) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  const onKey = (e: React.KeyboardEvent) => {
    if (readOnly || !onChange) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(5, (value || 0) + 1) as Level);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(1, (value || 2) - 1) as Level);
    }
  };

  return (
    <div className={`stars-wrap ${className}`}>
      <div
        className={`stars stars--${size} ${readOnly ? 'stars--static' : ''}`}
        role={readOnly ? 'img' : 'radiogroup'}
        aria-label={readOnly ? `${label}: ${value ? `${value} yıldız, ${LEVEL_NAMES[value as Level]}` : 'seçilmedi'}` : label}
        onKeyDown={onKey}
        onMouseLeave={() => setHover(0)}
      >
        {([1, 2, 3, 4, 5] as Level[]).map((n) => (
          <button
            key={n}
            type="button"
            role={readOnly ? undefined : 'radio'}
            aria-checked={readOnly ? undefined : value === n}
            aria-label={`${n} yıldız — ${LEVEL_NAMES[n]}`}
            tabIndex={readOnly ? -1 : value === n || (!value && n === 1) ? 0 : -1}
            className="stars__btn"
            data-on={n <= shown}
            onMouseEnter={() => !readOnly && setHover(n)}
            onFocus={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && onChange?.(n)}
          >
            <StarGlyph filled={n <= shown} />
          </button>
        ))}
      </div>
      {showName && shown > 0 && <span className="stars-label">{LEVEL_NAMES[shown as Level]}</span>}
    </div>
  );
}

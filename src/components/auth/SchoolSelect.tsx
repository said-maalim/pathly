import React, { useEffect, useId, useRef, useState } from 'react';
import { SCHOOLS, STORAGE_KEY } from './constants';
import type { School } from './constants';

interface SchoolSelectProps {
  value: School | null;
  onChange: (school: School) => void;
  error?: string;
  comboRef?: React.RefObject<HTMLButtonElement>;
}

export function SchoolSelect({ value, onChange, error, comboRef }: SchoolSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const internalRef = useRef<HTMLButtonElement>(null);
  const btnRef = comboRef ?? internalRef;
  const listRef = useRef<HTMLUListElement>(null);
  const labelId = useId();
  const listId = useId();

  const openList = (val: boolean) => {
    setOpen(val);
    if (val) setHighlight(Math.max(0, SCHOOLS.findIndex(s => s.id === value?.id)));
  };

  const pick = (school: School) => {
    onChange(school);
    setOpen(false);
    btnRef.current?.focus();
    try { localStorage.setItem(STORAGE_KEY, school.id); } catch { /* ignore */ }
  };

  // Preselect remembered school on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const found = SCHOOLS.find(s => s.id === saved);
        if (found && !value) onChange(found);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !listRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(h => (h + 1) % SCHOOLS.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => (h - 1 + SCHOOLS.length) % SCHOOLS.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(SCHOOLS[highlight]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="ap-field">
      <span className="ap-lbl" id={labelId}>School</span>

      <button
        ref={btnRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        aria-activedescendant={open ? `ap-opt-${highlight}` : undefined}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? 'ap-school-err' : undefined}
        onClick={() => openList(!open)}
        onKeyDown={handleKeyDown}
        className="ap-input ap-combo-btn"
      >
        {value ? (
          <>
            <span className="ap-m">{value.abbr}</span>
            {value.name}
          </>
        ) : (
          <span className="ap-ph">Select your school</span>
        )}
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 6l5 5 5-5" />
        </svg>
      </button>

      {error && (
        <p id="ap-school-err" role="alert" className="ap-err">{error}</p>
      )}

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          className="ap-list"
        >
          {SCHOOLS.map((school, i) => (
            <li
              key={school.id}
              id={`ap-opt-${i}`}
              role="option"
              aria-selected={value?.id === school.id}
              onClick={() => pick(school)}
              className={`ap-opt${highlight === i ? ' ap-hl' : ''}`}
            >
              <span className="ap-m">{school.abbr}</span>
              {school.name}
            </li>
          ))}

          <hr />

          <li role="option" aria-disabled="true" className="ap-opt ap-soon">
            <span className="ap-m">+</span>
            More schools
            <small>Coming soon</small>
          </li>

          <li className="ap-req">
            Don't see yours?{' '}
            <a
              href="mailto:hello@pathly.app?subject=Add%20my%20school"
              onClick={e => e.stopPropagation()}
            >
              Request your school
            </a>
          </li>
        </ul>
      )}
    </div>
  );
}

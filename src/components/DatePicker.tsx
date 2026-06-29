import { useState, useRef, useEffect, useId, useCallback } from 'react';
import './DatePicker.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const DAY_NAMES_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toISODate(year: number, month: number, day: number): string {
  const y = year;
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseISODate(iso: string): { year: number; month: number; day: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { year: y, month: m - 1, day: d };
}

interface DatePickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  helpText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export function DatePicker({
  id,
  label,
  value,
  onChange,
  min,
  max,
  placeholder = 'YYYY-MM-DD',
  helpText,
  error,
  disabled = false,
  required = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => {
    const parsed = parseISODate(value);
    return parsed ? new Date(parsed.year, parsed.month, parsed.day) : new Date();
  });
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const helpTextId = `${id}-help`;
  const errorId = `${id}-error`;
  const calendarId = `${id}-calendar`;
  const describedBy = [helpText && helpTextId, error && errorId].filter(Boolean).join(' ') || undefined;

  const parsedValue = parseISODate(value);
  const selectedDate = parsedValue ? new Date(parsedValue.year, parsedValue.month, parsedValue.day) : null;

  const isDateDisabled = useCallback(
    (year: number, month: number, day: number): boolean => {
      const iso = toISODate(year, month, day);
      if (min && iso < min) return true;
      if (max && iso > max) return true;
      return false;
    },
    [min, max],
  );

  const isToday = useCallback((year: number, month: number, day: number): boolean => {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth() && day === now.getDate();
  }, []);

  const isSelected = useCallback(
    (year: number, month: number, day: number): boolean => {
      if (!selectedDate) return false;
      return (
        year === selectedDate.getFullYear() &&
        month === selectedDate.getMonth() &&
        day === selectedDate.getDate()
      );
    },
    [selectedDate],
  );

  const focusCell = useCallback((date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;
    const cell = gridRef.current?.querySelector(`[data-date="${key}"]`) as HTMLElement | null;
    cell?.focus();
  }, []);

  useEffect(() => {
    const parsed = parseISODate(value);
    if (parsed) {
      setViewDate(new Date(parsed.year, parsed.month, parsed.day));
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const sel = parseISODate(value);
    const now = new Date();
    const target = sel ? new Date(sel.year, sel.month, sel.day) : now;
    setFocusedDate(target);
    setViewDate(new Date(target.getFullYear(), target.getMonth(), 1));

    const timer = setTimeout(() => {
      focusCell(target);
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, value, focusCell]);

  useEffect(() => {
    if (!isOpen || !focusedDate) return;

    const timer = setTimeout(() => {
      focusCell(focusedDate);
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, focusedDate, focusCell]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleOpen = useCallback(() => {
    if (disabled) return;
    setIsOpen((prev) => {
      if (!prev) {
        const sel = parseISODate(value);
        const target = sel ? new Date(sel.year, sel.month, sel.day) : new Date();
        setFocusedDate(target);
        setViewDate(new Date(target.getFullYear(), target.getMonth(), 1));
      }
      return !prev;
    });
  }, [disabled, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const selectDate = useCallback(
    (year: number, month: number, day: number) => {
      onChange(toISODate(year, month, day));
      setIsOpen(false);
    },
    [onChange],
  );

  useEffect(() => {
    if (!isOpen) {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
      return;
    }
    previousFocusRef.current = document.activeElement as HTMLElement | null;
  }, [isOpen]);

  const goToPrevMonth = useCallback(() => {
    setViewDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setViewDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }, []);

  const handleCalendarKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    const base = focusedDate || new Date();
    const newDate = new Date(base);

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'PageUp':
        e.preventDefault();
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'PageDown':
        e.preventDefault();
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'Home':
        e.preventDefault();
        newDate.setDate(newDate.getDate() - newDate.getDay());
        break;
      case 'End':
        e.preventDefault();
        newDate.setDate(newDate.getDate() + (6 - newDate.getDay()));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        selectDate(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
        return;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        return;
      default:
        return;
    }

    if (
      newDate.getMonth() !== viewDate.getMonth() ||
      newDate.getFullYear() !== viewDate.getFullYear()
    ) {
      setViewDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
    setFocusedDate(newDate);
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleOpen();
    }
  };

  const firstDay = getFirstDayOfWeek(viewDate.getFullYear(), viewDate.getMonth());
  const days: Array<{ day: number; empty: boolean }> = [];

  for (let i = 0; i < firstDay; i++) {
    days.push({ day: 0, empty: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, empty: false });
  }
  const totalCells = Math.ceil(days.length / 7) * 7;
  while (days.length < totalCells) {
    days.push({ day: 0, empty: true });
  }

  const weeks: Array<Array<{ day: number; empty: boolean }>> = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const monthLabel = `${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  const prevMonthLabel = MONTH_NAMES[viewDate.getMonth() === 0 ? 11 : viewDate.getMonth() - 1];
  const nextMonthLabel = MONTH_NAMES[viewDate.getMonth() === 11 ? 0 : viewDate.getMonth() + 1];

  return (
    <div
      className={`date-picker ${disabled ? 'date-picker--disabled' : ''} ${error ? 'date-picker--error' : ''}`}
      ref={containerRef}
    >
      <label htmlFor={id} className="date-picker__label">
        {label}
        {required && <span className="date-picker__required" aria-label="required">*</span>}
      </label>
      {helpText && !error && (
        <p id={helpTextId} className="date-picker__help">
          {helpText}
        </p>
      )}
      <div className="date-picker__input-wrapper">
        <input
          ref={inputRef}
          id={id}
          type="text"
          className="date-picker__input"
          value={value}
          onChange={handleInputChange}
          onClick={toggleOpen}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          aria-required={required}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? calendarId : undefined}
          disabled={disabled}
          autoComplete="off"
          inputMode="numeric"
        />
        <span className="date-picker__icon" aria-hidden="true">
          📅
        </span>
      </div>
      {error && (
        <p id={errorId} className="date-picker__error" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      {isOpen && (
        <div
          ref={calendarRef}
          id={calendarId}
          className="date-picker__calendar"
          role="dialog"
          aria-label={`Choose a date. Current view: ${monthLabel}`}
        >
          <div className="date-picker__header">
            <button
              type="button"
              className="date-picker__nav date-picker__nav--prev"
              onClick={goToPrevMonth}
              aria-label={`Go to previous month. Previous: ${prevMonthLabel}`}
            >
              ‹
            </button>
            <span className="date-picker__month-year" aria-live="polite" aria-atomic="true">
              {monthLabel}
            </span>
            <button
              type="button"
              className="date-picker__nav date-picker__nav--next"
              onClick={goToNextMonth}
              aria-label={`Go to next month. Next: ${nextMonthLabel}`}
            >
              ›
            </button>
          </div>

          <div className="date-picker__weekdays" role="row" aria-label="Days of the week">
            {DAY_NAMES.map((dayName, i) => (
              <span
                key={dayName}
                className="date-picker__weekday"
                role="columnheader"
                aria-label={DAY_NAMES_FULL[i]}
              >
                {dayName}
              </span>
            ))}
          </div>

          <div
            ref={gridRef}
            className="date-picker__days"
            role="grid"
            aria-label={`${monthLabel} calendar`}
            onKeyDown={handleCalendarKeyDown}
          >
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="date-picker__week" role="row">
                {week.map((cell, cellIndex) => {
                  if (cell.empty) {
                    return (
                      <div
                        key={`empty-${weekIndex}-${cellIndex}`}
                        className="date-picker__cell date-picker__cell--empty"
                        role="gridcell"
                        aria-hidden="true"
                      />
                    );
                  }

                  const year = viewDate.getFullYear();
                  const month = viewDate.getMonth();
                  const iso = toISODate(year, month, cell.day);
                  const disabled = isDateDisabled(year, month, cell.day);
                  const selected = isSelected(year, month, cell.day);
                  const today = isToday(year, month, cell.day);
                  const isFocused =
                    focusedDate !== null &&
                    focusedDate.getFullYear() === year &&
                    focusedDate.getMonth() === month &&
                    focusedDate.getDate() === cell.day;

                  const ariaLabel = `${MONTH_NAMES[month]} ${cell.day}, ${year}${selected ? ', selected' : ''}${today && !selected ? ', today' : ''}${disabled ? ', unavailable' : ''}`;

                  return (
                    <button
                      key={cell.day}
                      type="button"
                      data-date={iso}
                      className={[
                        'date-picker__cell',
                        selected ? 'date-picker__cell--selected' : '',
                        today && !selected ? 'date-picker__cell--today' : '',
                        disabled ? 'date-picker__cell--disabled' : '',
                        isFocused && !selected ? 'date-picker__cell--focused' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      tabIndex={isFocused ? 0 : -1}
                      role="gridcell"
                      aria-selected={selected}
                      aria-disabled={disabled}
                      aria-label={ariaLabel}
                      disabled={disabled}
                      onClick={() => selectDate(year, month, cell.day)}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="date-picker__footer">
            <button
              type="button"
              className="date-picker__today-btn"
              onClick={() => {
                const now = new Date();
                setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
                selectDate(now.getFullYear(), now.getMonth(), now.getDate());
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useId, useRef } from 'react';
import './DateRangeChips.css';

export const DATE_PRESET_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'custom', label: 'Custom' },
] as const;

export type DatePreset = (typeof DATE_PRESET_OPTIONS)[number]['value'];

interface DateRangeChipsProps {
  selectedPreset: DatePreset;
  customStartDate: string;
  customEndDate: string;
  onPresetChange: (preset: DatePreset) => void;
  onCustomStartDateChange: (value: string) => void;
  onCustomEndDateChange: (value: string) => void;
}

export function DateRangeChips({
  selectedPreset,
  customStartDate,
  customEndDate,
  onPresetChange,
  onCustomStartDateChange,
  onCustomEndDateChange,
}: DateRangeChipsProps) {
  const labelId = useId();
  const startInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedPreset === 'custom') {
      startInputRef.current?.focus();
    }
  }, [selectedPreset]);

  return (
    <div className="date-range-chips">
      <span className="th-filter-label" id={labelId}>
        Date Range
      </span>
      <div className="th-chip-group" role="group" aria-labelledby={labelId}>
        {DATE_PRESET_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className="th-filter-chip"
            aria-pressed={selectedPreset === option.value}
            onClick={() => onPresetChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {selectedPreset === 'custom' && (
        <div className="date-range-custom-fields">
          <label className="date-range-custom-field">
            <span>Start date</span>
            <input
              ref={startInputRef}
              type="date"
              value={customStartDate}
              onChange={(event) => onCustomStartDateChange(event.target.value)}
              max={customEndDate || undefined}
            />
          </label>
          <label className="date-range-custom-field">
            <span>End date</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(event) => onCustomEndDateChange(event.target.value)}
              min={customStartDate || undefined}
            />
          </label>
        </div>
      )}
    </div>
  );
}

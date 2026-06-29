import { useEffect, useId } from 'react';
import { DatePicker } from './DatePicker';
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

  useEffect(() => {
    if (selectedPreset === 'custom') {
      document.getElementById('custom-start-date')?.focus();
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
          <DatePicker
            id="custom-start-date"
            label="Start date"
            value={customStartDate}
            onChange={onCustomStartDateChange}
            max={customEndDate || undefined}
          />
          <DatePicker
            id="custom-end-date"
            label="End date"
            value={customEndDate}
            onChange={onCustomEndDateChange}
            min={customStartDate || undefined}
          />
        </div>
      )}
    </div>
  );
}

import { describe, expect, it } from 'vitest';
import { escapeCsvCell, toCsv } from './csv';

describe('escapeCsvCell', () => {
  it('leaves simple values unchanged', () => {
    expect(escapeCsvCell('Completed')).toBe('Completed');
    expect(escapeCsvCell(1250)).toBe('1250');
  });

  it('escapes commas and quotes', () => {
    expect(escapeCsvCell('Fee, monthly')).toBe('"Fee, monthly"');
    expect(escapeCsvCell('He said "hello"')).toBe('"He said ""hello"""');
  });

  it('escapes newlines', () => {
    expect(escapeCsvCell('Line one\nLine two')).toBe('"Line one\nLine two"');
  });

  it('normalizes nullish values to empty strings', () => {
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(undefined)).toBe('');
  });
});

describe('toCsv', () => {
  it('builds a CRLF-delimited CSV document', () => {
    const csv = toCsv(
      ['Date', 'Note'],
      [["2025-02-20", 'Fee, monthly'], ["2025-02-21", 'He said "hello"']],
    );

    expect(csv).toBe(
      'Date,Note\r\n2025-02-20,"Fee, monthly"\r\n2025-02-21,"He said ""hello"""',
    );
  });
});

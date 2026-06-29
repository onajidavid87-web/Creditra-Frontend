import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportAccountSettings } from '../Export';

describe('ExportAccountSettings Component Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Mock the global URL objects to prevent runner crashes during virtual asset generation
    global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('should render headers and download interaction buttons correctly', () => {
    render(<ExportAccountSettings />);
    expect(screen.getByTestId('export-settings-container')).toBeInTheDocument();
    expect(screen.getByTestId('export-json-button')).toBeInTheDocument();
    expect(screen.getByTestId('export-csv-button')).toBeInTheDocument();
  });

  it('should trigger JSON formatting flow download pipeline cleanly when clicked', async () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    render(<ExportAccountSettings />);
    const jsonBtn = screen.getByTestId('export-json-button');
    fireEvent.click(jsonBtn);

    await waitFor(() => {
      expect(appendSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
    });
  });
});
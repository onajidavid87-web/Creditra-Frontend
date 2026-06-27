import { render, screen, act, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Dashboard } from './Dashboard';

// Mock modules before imports
vi.mock('../context/WalletContext', () => ({
  useWallet: () => ({
    wallet: {
      publicKey: '0x1234567890abcdef1234567890abcdef12345678',
      network: 'TESTNET',
    },
    status: 'connected',
  }),
}));

const { mockReadJson, mockWriteJson, mockStorageStore } = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return {
    mockReadJson: vi.fn((key: string, fallback: unknown) => {
      const val = store[key];
      return val !== undefined ? val : fallback;
    }),
    mockWriteJson: vi.fn((key: string, value: unknown) => {
      store[key] = value;
    }),
    mockStorageStore: store,
  };
});

vi.mock('../utils/storage', () => ({
  readJson: mockReadJson,
  writeJson: mockWriteJson,
}));

const WALLET_KEY = 'risk-explainer-dismissed-0x1234567890abcdef1234567890abcdef12345678';

describe('Dashboard component skeletons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete mockStorageStore[WALLET_KEY];
  });

  it('renders initial skeleton loading phase with appropriate accessibility attributes', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const announcement = container.querySelector('.dashboard-root > .sr-only') as HTMLElement;
    expect(announcement).toBeInTheDocument();
    expect(announcement.textContent).toBe('Loading dashboard');

    const root = container.querySelector('.dashboard-root') as HTMLElement;
    expect(root).toBeInTheDocument();
    expect(root.getAttribute('aria-busy')).toBe('true');
  });

  it('transitions to loaded state after timer fires', () => {
    vi.useFakeTimers();

    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const announcement = container.querySelector('.dashboard-root > .sr-only') as HTMLElement;
    expect(announcement).toBeInTheDocument();
    expect(announcement.textContent).toBe('Dashboard loaded');

    const root = container.querySelector('.dashboard-root') as HTMLElement;
    expect(root.getAttribute('aria-busy')).toBe('false');

    expect(screen.getByText('Total Credit Limit')).toBeInTheDocument();
    expect(screen.getByText('Total Utilized')).toBeInTheDocument();
    expect(screen.getByText('Available Credit')).toBeInTheDocument();

    vi.useRealTimers();
  });
});

describe('RiskExplainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete mockStorageStore[WALLET_KEY];
  });

  it('shows explainer text when not dismissed', () => {
    vi.useFakeTimers();
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    act(() => { vi.advanceTimersByTime(500); });

    expect(screen.getByText(
      'Strong credit position \u2014 you\u2019re above the recommended threshold for new draws.'
    )).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('reads dismissed state from storage on mount', () => {
    mockStorageStore[WALLET_KEY] = true;

    vi.useFakeTimers();
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    act(() => { vi.advanceTimersByTime(500); });

    expect(screen.queryByText(
      'Strong credit position \u2014 you\u2019re above the recommended threshold for new draws.'
    )).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('persists dismissal to storage when dismiss button is clicked', () => {
    vi.useFakeTimers();
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    act(() => { vi.advanceTimersByTime(500); });

    const dismissBtn = screen.getByLabelText('Dismiss risk score explainer');
    fireEvent.click(dismissBtn);

    expect(mockWriteJson).toHaveBeenCalledWith(WALLET_KEY, true);
    expect(screen.queryByText(
      'Strong credit position \u2014 you\u2019re above the recommended threshold for new draws.'
    )).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('has accessible dismiss button with correct aria-label and type', () => {
    vi.useFakeTimers();
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    act(() => { vi.advanceTimersByTime(500); });

    const btn = screen.getByLabelText('Dismiss risk score explainer');
    expect(btn).toBeInTheDocument();
    expect(btn.getAttribute('type')).toBe('button');
    vi.useRealTimers();
  });

  it('uses role="status" for the explainer container', () => {
    vi.useFakeTimers();
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    act(() => { vi.advanceTimersByTime(500); });

    const explainer = container.querySelector('.risk-explainer');
    expect(explainer).toBeInTheDocument();
    expect(explainer?.getAttribute('role')).toBe('status');
    vi.useRealTimers();
  });
});

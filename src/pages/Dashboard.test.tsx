import { render, screen, act, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Dashboard, RiskGauge } from './Dashboard';
import { ReducedMotionProvider } from '../context/ReducedMotionContext';

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

function stubMatchMedia(matches: boolean) {
  const original = window.matchMedia;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  return () => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: original });
  };
}

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

describe('RiskGauge inline component from Dashboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('matches snapshot at score 580', () => {
    const { container } = render(
      <ReducedMotionProvider>
        <RiskGauge score={580} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />
      </ReducedMotionProvider>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot at score 660', () => {
    const { container } = render(
      <ReducedMotionProvider>
        <RiskGauge score={660} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />
      </ReducedMotionProvider>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot at score 740', () => {
    const { container } = render(
      <ReducedMotionProvider>
        <RiskGauge score={740} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />
      </ReducedMotionProvider>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('tweens score value when normal-motion is active', () => {
    vi.useFakeTimers();
    const restore = stubMatchMedia(false);

    const { rerender } = render(
      <ReducedMotionProvider>
        <RiskGauge score={580} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />
      </ReducedMotionProvider>
    );

    // Initial render shows 580
    expect(screen.getByText('580')).toBeInTheDocument();

    // Rerender with new score 740
    rerender(
      <ReducedMotionProvider>
        <RiskGauge score={740} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />
      </ReducedMotionProvider>
    );

    // Score does not snap immediately to 740 because it's tweening
    expect(screen.queryByText('740')).not.toBeInTheDocument();

    // Advance halfway (140ms)
    act(() => {
      vi.advanceTimersByTime(140);
    });
    // Check that it's tweening (not 580 and not 740)
    const scoreText = document.querySelector('.risk-gauge-score');
    const midVal = parseInt(scoreText?.textContent || '0', 10);
    expect(midVal).toBeGreaterThan(580);
    expect(midVal).toBeLessThan(740);

    // Advance to completion (another 140ms)
    act(() => {
      vi.advanceTimersByTime(140);
    });
    expect(screen.getByText('740')).toBeInTheDocument();

    restore();
    vi.useRealTimers();
  });

  it('updates score instantly without tweening when reduced-motion is active', () => {
    vi.useFakeTimers();
    const restore = stubMatchMedia(true);

    const { rerender } = render(
      <ReducedMotionProvider>
        <RiskGauge score={580} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />
      </ReducedMotionProvider>
    );

    expect(screen.getByText('580')).toBeInTheDocument();

    rerender(
      <ReducedMotionProvider>
        <RiskGauge score={740} trend="stable" lastUpdated="2025-01-01T00:00:00Z" />
      </ReducedMotionProvider>
    );

    // Snaps instantly to 740
    expect(screen.getByText('740')).toBeInTheDocument();

    restore();
    vi.useRealTimers();
  });
});

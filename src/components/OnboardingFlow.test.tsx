import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi, describe, beforeEach } from 'vitest';
import { OnboardingFlow } from './OnboardingFlow';

// Provide a clean requestAnimationFrame polyfill (jsdom doesn't ship one)
if (typeof globalThis.requestAnimationFrame !== 'function') {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(cb, 16) as unknown as number;
}

// Mock framer-motion so tests run without a real browser environment
const mockUseReducedMotion = vi.hoisted(() => vi.fn(() => false));

vi.mock('framer-motion', async () => {
  const { createElement, Fragment, forwardRef } = await import('react');
  return {
    motion: {
      div: forwardRef(function MotionDiv(
        { children, initial, animate, exit, transition, ...props }: any,
        ref: any,
      ) {
        return createElement('div', { ...props, ref }, children);
      }),
    },
    AnimatePresence({ children, mode: _mode }: any) {
      return createElement(Fragment, null, children);
    },
    useReducedMotion(...args: any[]) {
      return mockUseReducedMotion(...args);
    },
  };
});

describe('OnboardingFlow', () => {
  const defaultProps = {
    isOpen: true,
    onComplete: vi.fn(),
    onSkip: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockUseReducedMotion.mockReturnValue(false);
  });

  test('returns null when isOpen is false', () => {
    const { container } = render(
      <OnboardingFlow {...defaultProps} isOpen={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('renders the first step by default', () => {
    render(<OnboardingFlow {...defaultProps} />);
    expect(screen.getByText('Welcome to Creditra')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  test('navigates to the next step on Next click', () => {
    render(<OnboardingFlow {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByText('Credit Evaluation')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });

  test('navigates back on Back click', () => {
    render(<OnboardingFlow {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByText('Welcome to Creditra')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  test('back button is disabled on the first step', () => {
    render(<OnboardingFlow {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Go back' })).toBeDisabled();
  });

  test('calls onComplete and persists localStorage on the last step', () => {
    const onComplete = vi.fn();
    render(<OnboardingFlow {...defaultProps} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    fireEvent.click(screen.getByRole('button', { name: 'Get started' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('onboarding_completed')).toBe('true');
  });

  test('calls onSkip and persists localStorage when skip is clicked', () => {
    const onSkip = vi.fn();
    render(<OnboardingFlow {...defaultProps} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip onboarding' }));
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('onboarding_completed')).toBe('true');
  });

  test('renders step indicators for each step', () => {
    render(<OnboardingFlow {...defaultProps} />);
    const indicators = screen.getAllByRole('listitem');
    expect(indicators).toHaveLength(3);
  });

  test('shows Get Started label on the last step', () => {
    render(<OnboardingFlow {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(
      screen.getByRole('button', { name: 'Get started' }),
    ).toBeInTheDocument();
  });

  describe('reduced-motion', () => {
    test('renders all steps and supports navigation when reduced motion is active', () => {
      mockUseReducedMotion.mockReturnValue(true);
      render(<OnboardingFlow {...defaultProps} />);

      // First step renders
      expect(screen.getByText('Welcome to Creditra')).toBeInTheDocument();

      // Navigate forward
      fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
      expect(screen.getByText('Credit Evaluation')).toBeInTheDocument();

      // Navigate backward
      fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
      expect(screen.getByText('Welcome to Creditra')).toBeInTheDocument();

      // Complete the flow
      fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
      fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
      fireEvent.click(screen.getByRole('button', { name: 'Get started' }));
      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });

    test('supports skip when reduced motion is active', () => {
      mockUseReducedMotion.mockReturnValue(true);
      const onSkip = vi.fn();
      render(<OnboardingFlow {...defaultProps} onSkip={onSkip} />);

      fireEvent.click(screen.getByRole('button', { name: 'Skip onboarding' }));
      expect(onSkip).toHaveBeenCalledTimes(1);
    });
  });
});

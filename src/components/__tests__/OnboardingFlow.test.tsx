import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../context/ReducedMotionContext', () => ({
  useReducedMotion: () => ({ isReducedMotionActive: false }),
}));

import { OnboardingFlow } from '../OnboardingFlow';

describe('OnboardingFlow', () => {
  const onComplete = vi.fn();
  const onSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('advances and retreats steps with arrow keys', () => {
    render(<OnboardingFlow isOpen onComplete={onComplete} onSkip={onSkip} />);

    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  it('calls onComplete when advancing from the last step', () => {
    render(<OnboardingFlow isOpen onComplete={onComplete} onSkip={onSkip} />);

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'ArrowRight' });

    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('skips onboarding when Escape is pressed', () => {
    render(<OnboardingFlow isOpen onComplete={onComplete} onSkip={onSkip} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});

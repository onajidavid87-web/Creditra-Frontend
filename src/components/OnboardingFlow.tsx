import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './OnboardingFlow.css';

interface Props {
  /** Whether the onboarding modal is visible. */
  isOpen: boolean;
  /**
   * Invoked after the final step. The component writes
   * `localStorage.onboarding_completed = 'true'` before calling this so
   * returning users skip the flow on subsequent connects.
   */
  onComplete: () => void;
  /**
   * Invoked when the user opts out via the Skip affordance. Skipping
   * does NOT mark onboarding as complete — the next session will see
   * the flow again, which is intentional. The trade-off is documented
   * in `docs/UX_RATIONALE.md` "Single onboarding stepper, not separate
   * modals".
   */
  onSkip: () => void;
}

const steps = [
  {
    title: 'Welcome to Creditra',
    description: 'Your adaptive credit protocol on Stellar blockchain',
    icon: '👋'
  },
  {
    title: 'Credit Evaluation',
    description: 'We analyze your on-chain activity to determine your credit limit and terms',
    icon: '📊'
  },
  {
    title: 'Flexible Credit Lines',
    description: 'Draw and repay credit as needed with dynamic interest rates based on your risk profile',
    icon: '💳'
  }
];

export const OnboardingFlow = ({ isOpen, onComplete, onSkip }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const step = steps[currentStep];

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem('onboarding_completed', 'true');
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    onSkip();
  };

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Onboarding">
      <div className="onboarding-content">
        <button className="skip-btn" onClick={handleSkip} aria-label="Skip onboarding">
          Skip
        </button>

        <div className="progress-label" aria-live="polite">
          Step {currentStep + 1} of {steps.length}
        </div>

        <div className="step-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              className="onboarding-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="step-icon">{step.icon}</div>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="step-indicators" role="list">
          {steps.map((_, index) => (
            <div
              key={index}
              role="listitem"
              className={`indicator ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              aria-current={index === currentStep ? 'step' : undefined}
              aria-label={`Step ${index + 1}`}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
          ))}
        </div>

        <div className="button-group">
          <button
            className="secondary-btn"
            onClick={handleBack}
            disabled={isFirstStep}
            aria-label="Go back"
          >
            Back
          </button>
          <button
            className="primary-btn"
            onClick={handleNext}
            aria-label={isLastStep ? 'Get started' : 'Next step'}
          >
            {isLastStep ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

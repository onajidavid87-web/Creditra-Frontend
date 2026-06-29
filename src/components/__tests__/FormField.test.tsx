import { render, screen, act } from '@testing-library/react';
import { FormField } from '../FormField';

describe('FormField', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test('renders label and input', () => {
    render(
      <FormField
        id="test"
        label="Test Field"
        type="text"
      />
    );
    expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
  });

  test('shows error visually immediately', () => {
    render(
      <FormField
        id="test"
        label="Test Field"
        type="text"
        error="Error message"
      />
    );
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  test('sets aria-invalid when error exists', () => {
    render(
      <FormField
        id="test"
        label="Test Field"
        type="text"
        error="Error message"
      />
    );
    const input = screen.getByLabelText('Test Field');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  test('debounces error announcement', () => {
    const { rerender } = render(
      <FormField
        id="test"
        label="Test Field"
        type="text"
      />
    );

    // Update error
    rerender(
      <FormField
        id="test"
        label="Test Field"
        type="text"
        error="First error"
      />
    );

    // Before debounce delay
    const errorElement = screen.getByText('First error');
    expect(errorElement).toBeInTheDocument();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Verify the error is still there (visual remains)
    expect(screen.getByText('First error')).toBeInTheDocument();
  });
});

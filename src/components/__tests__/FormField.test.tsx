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

  test('shows the error visually immediately while delaying the alert announcement', () => {
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

    expect(screen.getByText('First error')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('First error');
  });

  test('announces the settled error after rapid validation changes', () => {
    const { rerender } = render(
      <FormField
        id="test"
        label="Test Field"
        type="text"
        error="First error"
      />
    );

    rerender(
      <FormField
        id="test"
        label="Test Field"
        type="text"
        error="Second error"
      />
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Second error');
  });
});

import { act, render, screen } from '@testing-library/react';
import { FormMessage } from '../FormMessage';

describe('FormMessage', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test('renders the visual message immediately and delays the alert announcement', () => {
    render(
      <FormMessage
        title="Check the amount"
        message="Enter a value within your available credit."
        type="danger"
      />
    );

    expect(screen.getByText('Check the amount')).toBeInTheDocument();
    expect(screen.getByText('Enter a value within your available credit.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Check the amount Enter a value within your available credit.'
    );
  });

  test('announces the settled message after rapid updates', () => {
    const { rerender } = render(
      <FormMessage
        title="Check the amount"
        message="Enter a value within your available credit."
        type="danger"
      />
    );

    rerender(
      <FormMessage
        title="Amount looks good"
        message="You can continue."
        type="success"
      />
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Amount looks good You can continue.');
  });
});

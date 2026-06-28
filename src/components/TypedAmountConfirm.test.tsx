import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TypedAmountConfirm,
  TypedAmountConfirmField,
  parseTypedAmount,
  isTypedAmountMatch,
  shouldRequireTypedAmountConfirm,
} from './TypedAmountConfirm';

vi.mock('../hooks/useBodyScrollLock', () => ({ useBodyScrollLock: vi.fn() }));
vi.mock('../hooks/useInertBackdrop', () => ({ useInertBackdrop: vi.fn() }));

describe('typed amount helpers', () => {
  it('parseTypedAmount returns 0 for empty or invalid input', () => {
    expect(parseTypedAmount('')).toBe(0);
    expect(parseTypedAmount('abc')).toBe(0);
  });

  it('isTypedAmountMatch requires exact numeric equality', () => {
    expect(isTypedAmountMatch('5000', 5000)).toBe(true);
    expect(isTypedAmountMatch('5000.00', 5000)).toBe(true);
    expect(isTypedAmountMatch('4999.99', 5000)).toBe(false);
  });

  it('shouldRequireTypedAmountConfirm delegates to threshold helper', () => {
    expect(shouldRequireTypedAmountConfirm(4999)).toBe(false);
    expect(shouldRequireTypedAmountConfirm(5000)).toBe(true);
  });
});

describe('TypedAmountConfirmField', () => {
  it('renders labelled input with hint text', () => {
    render(
      <TypedAmountConfirmField amount={7500} value="" onChange={vi.fn()} />,
    );

    expect(screen.getByLabelText('Type the repayment amount to confirm')).toBeInTheDocument();
    expect(screen.getByText(/Type the repayment amount \(\$7,500.00\)/)).toBeInTheDocument();
  });

  it('marks input invalid when value does not match', () => {
    render(
      <TypedAmountConfirmField amount={5000} value="1234" onChange={vi.fn()} />,
    );

    expect(screen.getByLabelText('Type the repayment amount to confirm')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Amount does not match');
  });

  it('marks input valid when value matches', () => {
    render(
      <TypedAmountConfirmField amount={5000} value="5000" onChange={vi.fn()} />,
    );

    expect(screen.getByLabelText('Type the repayment amount to confirm')).toHaveAttribute(
      'aria-invalid',
      'false',
    );
    expect(screen.getByText('Amount confirmed.')).toBeInTheDocument();
  });

  it('calls onChange when user types', async () => {
    const onChange = vi.fn();
    render(
      <TypedAmountConfirmField amount={5000} value="" onChange={onChange} />,
    );

    await userEvent.type(screen.getByLabelText('Type the repayment amount to confirm'), '5');
    expect(onChange).toHaveBeenCalled();
  });
});

describe('TypedAmountConfirm modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <TypedAmountConfirm
        isOpen={false}
        amount={6000}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders dialog with amount summary when open', () => {
    render(
      <TypedAmountConfirm
        isOpen
        amount={6000}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Confirm large repayment')).toBeInTheDocument();
    expect(screen.getByText('$6,000.00')).toBeInTheDocument();
  });

  it('disables confirm until amount matches', () => {
    render(
      <TypedAmountConfirm
        isOpen
        amount={6000}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Confirm Repayment' })).toBeDisabled();
  });

  it('calls onConfirm when amount matches and confirm is clicked', async () => {
    const onConfirm = vi.fn();
    render(
      <TypedAmountConfirm
        isOpen
        amount={6000}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    await userEvent.type(
      screen.getByLabelText('Type the repayment amount to confirm'),
      '6000',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Repayment' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel is clicked', async () => {
    const onCancel = vi.fn();
    render(
      <TypedAmountConfirm
        isOpen
        amount={6000}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape is pressed', () => {
    const onCancel = vi.fn();
    render(
      <TypedAmountConfirm
        isOpen
        amount={6000}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('resets typed value when reopened', async () => {
    const { rerender } = render(
      <TypedAmountConfirm
        isOpen
        amount={6000}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await userEvent.type(
      screen.getByLabelText('Type the repayment amount to confirm'),
      '1234',
    );
    expect(screen.getByLabelText('Type the repayment amount to confirm')).toHaveValue(1234);

    rerender(
      <TypedAmountConfirm
        isOpen={false}
        amount={6000}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    rerender(
      <TypedAmountConfirm
        isOpen
        amount={6000}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Type the repayment amount to confirm')).toHaveValue(null);
  });
});

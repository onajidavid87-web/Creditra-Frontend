import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PayoffProjection } from '../PayoffProjection';

const BASE_PROPS = {
  currentDebt: 100_000,
  apr: 8.5,
  repayAmount: 0,
  limit: 200_000,
  nextPaymentAmount: 2500,
};

describe('PayoffProjection', () => {
  it('renders empty state when repayAmount is 0', () => {
    render(<PayoffProjection {...BASE_PROPS} />);
    expect(
      screen.getByText('Enter a repayment amount to see how it affects your payoff timeline.'),
    ).toBeInTheDocument();
  });

  it('shows months saved when a repayment amount is entered', () => {
    render(<PayoffProjection {...BASE_PROPS} repayAmount={20_000} />);
    expect(screen.getByText(/mo sooner/)).toBeInTheDocument();
  });

  it('shows full payoff state when amount clears the debt', () => {
    render(<PayoffProjection {...BASE_PROPS} repayAmount={100_000} />);
    expect(screen.getByText('Full payoff')).toBeInTheDocument();
  });

  it('displays payoff timeline comparison', () => {
    render(<PayoffProjection {...BASE_PROPS} repayAmount={20_000} />);
    expect(screen.getByText('Current payoff')).toBeInTheDocument();
    expect(screen.getByText('With this repayment')).toBeInTheDocument();
  });

  it('displays monthly payment with edit capability', () => {
    render(<PayoffProjection {...BASE_PROPS} repayAmount={20_000} />);
    expect(screen.getByText('Monthly payment')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit monthly payment amount')).toBeInTheDocument();
  });

  it('has accessible region role', () => {
    render(<PayoffProjection {...BASE_PROPS} repayAmount={20_000} />);
    expect(screen.getByRole('region', { name: 'Payoff projection' })).toBeInTheDocument();
  });

  it('shows utilization bars when amount is entered', () => {
    render(<PayoffProjection {...BASE_PROPS} repayAmount={20_000} />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars.length).toBeGreaterThanOrEqual(2);
  });

  it('shows interest saved when repayment reduces timeline', () => {
    render(<PayoffProjection {...BASE_PROPS} repayAmount={20_000} />);
    expect(screen.getByText('Interest saved')).toBeInTheDocument();
  });

  it('shows months saved stat card', () => {
    render(<PayoffProjection {...BASE_PROPS} repayAmount={20_000} />);
    expect(screen.getByText('Months saved')).toBeInTheDocument();
  });

  it('uses default monthly payment from nextPaymentAmount', () => {
    render(<PayoffProjection {...BASE_PROPS} repayAmount={20_000} />);
    expect(screen.getByText(/\$2,500/)).toBeInTheDocument();
  });

  it('falls back to computed payment when nextPaymentAmount is not provided', () => {
    render(
      <PayoffProjection
        currentDebt={100_000}
        apr={8.5}
        repayAmount={20_000}
        limit={200_000}
      />,
    );
    expect(screen.getByText('Monthly payment')).toBeInTheDocument();
  });
});

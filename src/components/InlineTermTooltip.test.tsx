import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineTermTooltip } from './InlineTermTooltip';

describe('InlineTermTooltip', () => {
  it('renders the term and associates it with the definition via aria-describedby', () => {
    render(
      <InlineTermTooltip term="APR" definition="Annual Percentage Rate" />
    );

    const trigger = screen.getByRole('button', { name: 'APR' });
    expect(trigger).toBeInTheDocument();

    const tooltip = screen.getByRole('tooltip', { name: 'Annual Percentage Rate' });
    expect(tooltip).toBeInTheDocument();
    
    // Check association
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
  });

  it('can receive keyboard focus', async () => {
    render(
      <InlineTermTooltip term="APR" definition="Annual Percentage Rate" />
    );

    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: 'APR' });

    expect(trigger).not.toHaveFocus();
    
    await user.tab();
    
    expect(trigger).toHaveFocus();
  });
});

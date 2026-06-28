import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import CreditLines from '../CreditLines';

function renderPage() {
  return render(
    <BrowserRouter>
      <CreditLines />
    </BrowserRouter>
  );
}

describe('CreditLines page', () => {
  it('renders the page header', () => {
    renderPage();
    expect(screen.getByText('Credit Lines')).toBeInTheDocument();
    expect(screen.getByText('Manage your credit facilities')).toBeInTheDocument();
  });

  it('renders credit line cards from mock data', () => {
    renderPage();
    expect(screen.getByText('Primary Business Line')).toBeInTheDocument();
    expect(screen.getByText('Expansion Capital Line')).toBeInTheDocument();
    expect(screen.getByText('Working Capital Facility')).toBeInTheDocument();
  });

  it('renders filter controls', () => {
    renderPage();
    expect(screen.getAllByText(/Status/).length).toBeGreaterThan(0);
    expect(screen.getByText('Sort By')).toBeInTheDocument();
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
  });

  it('shows Last Activity timestamp on each credit line card', () => {
    renderPage();
    const lastActivityLabels = screen.getAllByText('Last Activity');
    expect(lastActivityLabels.length).toBeGreaterThanOrEqual(3);
  });

  it('shows relative time for updatedAt on each card', () => {
    renderPage();
    const timeElements = document.querySelectorAll('.cl-last-activity__time');
    expect(timeElements.length).toBeGreaterThanOrEqual(3);
    timeElements.forEach(el => {
      expect(el.textContent).toMatch(/(m|h|d ago|[A-Z][a-z]{2} \d{1,2}, \d{4})/);
    });
  });

  it('renders AccessibleTooltip with absolute timestamp for each card', () => {
    renderPage();
    const tooltips = document.querySelectorAll('.accessible-tooltip');
    expect(tooltips.length).toBeGreaterThanOrEqual(3);
  });

  it('renders tooltip content with "Last updated:" prefix', () => {
    renderPage();
    const tooltipContents = document.querySelectorAll('.accessible-tooltip__content');
    expect(tooltipContents.length).toBeGreaterThanOrEqual(3);
    tooltipContents.forEach(el => {
      expect(el.textContent).toMatch(/^Last updated: /);
    });
  });

  it('displays APR, Risk Score, and Opened date for each card', () => {
    renderPage();
    const card = screen.getByText('Primary Business Line').closest('.cl-card');
    expect(card).toBeInTheDocument();
    expect(card?.textContent).toMatch(/APR/);
    expect(card?.textContent).toMatch(/Risk Score/);
    expect(card?.textContent).toMatch(/Opened/);
  });
});

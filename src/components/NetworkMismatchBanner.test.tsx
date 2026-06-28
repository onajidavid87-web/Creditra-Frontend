import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NetworkMismatchBanner } from './NetworkMismatchBanner';

describe('NetworkMismatchBanner', () => {
  it('announces the mismatch and triggers a switch request', async () => {
    const onSwitchNetwork = vi.fn().mockResolvedValue(undefined);

    render(
      <NetworkMismatchBanner
        currentNetwork="TESTNET"
        expectedNetwork="PUBLIC"
        walletType="freighter"
        onSwitchNetwork={onSwitchNetwork}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(/wallet network doesn't match/i);

    await userEvent.click(screen.getByRole('button', { name: /switch network/i }));

    expect(onSwitchNetwork).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when the network already matches', () => {
    const { container } = render(
      <NetworkMismatchBanner
        currentNetwork="PUBLIC"
        expectedNetwork="PUBLIC"
        walletType="freighter"
        onSwitchNetwork={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when currentNetwork is null', () => {
    const { container } = render(
      <NetworkMismatchBanner
        currentNetwork={null}
        expectedNetwork="PUBLIC"
        walletType="freighter"
        onSwitchNetwork={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('disables the button and shows switching label while the request is in-flight', async () => {
    let resolve!: () => void;
    const onSwitchNetwork = vi.fn(
      () => new Promise<void>((res) => { resolve = res; }),
    );

    render(
      <NetworkMismatchBanner
        currentNetwork="TESTNET"
        expectedNetwork="PUBLIC"
        walletType="freighter"
        onSwitchNetwork={onSwitchNetwork}
      />,
    );

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Switching…');

    resolve();

    await waitFor(() => expect(button).not.toBeDisabled());
    expect(button).toHaveTextContent(/switch network/i);
  });

  it('announces success after a successful switch', async () => {
    const onSwitchNetwork = vi.fn().mockResolvedValue(undefined);

    render(
      <NetworkMismatchBanner
        currentNetwork="TESTNET"
        expectedNetwork="PUBLIC"
        walletType="freighter"
        onSwitchNetwork={onSwitchNetwork}
      />,
    );

    await userEvent.click(screen.getByRole('button'));

    await waitFor(() =>
      expect(screen.getByText(/network switched to public network/i)).toBeInTheDocument(),
    );
  });

  it('announces failure after a failed switch', async () => {
    const onSwitchNetwork = vi.fn().mockRejectedValue(new Error('denied'));

    render(
      <NetworkMismatchBanner
        currentNetwork="TESTNET"
        expectedNetwork="PUBLIC"
        walletType="freighter"
        onSwitchNetwork={onSwitchNetwork}
      />,
    );

    await userEvent.click(screen.getByRole('button'));

    await waitFor(() =>
      expect(screen.getByText(/failed to switch network/i)).toBeInTheDocument(),
    );
  });

  it.each([
    ['freighter', /switch network in freighter/i],
    ['albedo', /switch network in albedo/i],
    ['xbull', /switch network in xbull/i],
    ['rabet', /switch network in rabet/i],
  ] as const)('shows provider-specific copy for %s', (walletType, expectedPattern) => {
    render(
      <NetworkMismatchBanner
        currentNetwork="TESTNET"
        expectedNetwork="PUBLIC"
        walletType={walletType}
        onSwitchNetwork={vi.fn()}
      />,
    );

    expect(screen.getByRole('button')).toHaveTextContent(expectedPattern);
  });

  it('links the button to the description via aria-describedby', () => {
    render(
      <NetworkMismatchBanner
        currentNetwork="TESTNET"
        expectedNetwork="PUBLIC"
        walletType="freighter"
        onSwitchNetwork={vi.fn()}
      />,
    );

    const button = screen.getByRole('button');
    const descId = button.getAttribute('aria-describedby');
    expect(descId).toBeTruthy();
    expect(document.getElementById(descId!)).toHaveTextContent(/current network/i);
  });
});

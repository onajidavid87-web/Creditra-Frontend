import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WalletQrCode } from './WalletQrCode';
import * as leanQr from 'lean-qr';

describe('WalletQrCode Component', () => {
  it('renders a QR code SVG when a valid address is provided', () => {
    const address = 'GABCDEF1234567890';
    render(<WalletQrCode address={address} />);

    const wrapper = screen.getByTestId('wallet-qr-wrapper');
    expect(wrapper).toBeInTheDocument();

    const svg = wrapper.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox');
    expect(svg).toHaveAttribute('aria-hidden', 'true');

    const path = svg?.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('d');
  });

  it('renders null when address is empty or not provided', () => {
    const { container } = render(<WalletQrCode address="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders error message when QR code generation throws an error', () => {
    // Passing an extremely long address causes generate() to exceed the maximum QR capacity and throw an error.
    const longAddress = 'A'.repeat(10000);
    render(<WalletQrCode address={longAddress} />);

    const errorMsg = screen.getByRole('alert');
    expect(errorMsg).toBeInTheDocument();
    expect(errorMsg).toHaveTextContent(/failed to load qr code/i);
  });
});

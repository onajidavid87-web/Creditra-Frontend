import { generate } from 'lean-qr';
import { toSvgPath } from 'lean-qr/extras/svg';
import './WalletQrCode.css';

interface WalletQrCodeProps {
  address: string;
}

/**
 * WalletQrCode renders a client-side generated QR code representing a wallet address.
 * It uses the lightweight 'lean-qr' library to generate the QR code matrix inline.
 * No external network calls are made.
 *
 * For accessibility:
 * - The SVG has aria-hidden="true" because the text address is always displayed alongside it.
 * - Under high-contrast media queries, the QR wrapper/module size increases.
 */
export const WalletQrCode = ({ address }: WalletQrCodeProps) => {
  if (!address) return null;

  try {
    const code = generate(address);
    const size = code.size;
    const pathData = toSvgPath(code);

    // We add a 4-module quiet zone (padding) around the QR code as required by the standard.
    // Setting viewBox to -4 -4 (size + 8) (size + 8) achieves this without drawing extra padding shapes.
    return (
      <div className="wallet-qr-wrapper" data-testid="wallet-qr-wrapper">
        <svg
          viewBox={`-4 -4 ${size + 8} ${size + 8}`}
          className="wallet-qr-svg"
          role="img"
          aria-hidden="true"
        >
          <path d={pathData} fill="currentColor" />
        </svg>
      </div>
    );
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    return (
      <div className="wallet-qr-error" role="alert">
        Failed to load QR code
      </div>
    );
  }
};

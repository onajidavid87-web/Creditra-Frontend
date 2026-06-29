/**
 * Copies the provided text to the user's clipboard.
 *
 * Prefers the modern async Clipboard API when available, otherwise falls
 * back to a temporary off-screen textarea + `document.execCommand('copy')`
 * for older browsers and non-secure contexts.
 *
 * @param text - The string to place on the clipboard.
 * @throws Error If no clipboard mechanism is available, or the legacy copy fails.
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === 'undefined') {
    throw new Error('Clipboard is not available in this environment.');
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  textArea.style.pointerEvents = 'none';

  document.body.appendChild(textArea);
  textArea.select();

  const successful = document.execCommand('copy');
  document.body.removeChild(textArea);

  if (!successful) {
    throw new Error('Failed to copy text to clipboard.');
  }
}

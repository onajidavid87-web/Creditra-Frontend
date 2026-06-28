/**
 * ToastContainer — WCAG AA contrast regression tests.
 *
 * Verifies that every toast severity's foreground color meets WCAG 2.1 AA
 * contrast ratios against the tinted toast background produced by the CSS.
 *
 * WCAG 2.1 AA thresholds:
 *   - Normal text  (< 18 pt / < 14 pt bold): ratio ≥ 4.5 : 1
 *   - Large text   (≥ 18 pt OR ≥ 14 pt bold): ratio ≥ 3.0 : 1
 *   - UI components / graphical objects:      ratio ≥ 3.0 : 1
 *
 * Toast titles are 0.875 rem / weight 600 ≈ 11.7 pt bold, which falls
 * below the "14 pt bold" large-text threshold, so they must satisfy the
 * stricter 4.5 : 1 requirement.
 *
 * Toast body copy is 0.8 rem / normal weight at var(--muted), also
 * normal text — 4.5 : 1 required.
 *
 * The icon and left-border accent are UI components — 3.0 : 1 required.
 *
 * Background: 8% tint of the semantic token blended against --bg (#0d1117).
 * We compute the composited background in JS to match the CSS color-mix().
 */

import { describe, expect, it } from "vitest";

// ─── Color math ───────────────────────────────────────────────────────────────

/** Parse a CSS hex color string (#rrggbb or #rgb) to [r, g, b] in 0-255. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * Convert an sRGB channel value (0–255) to linear light.
 * Uses the IEC 61966-2-1 piecewise formula.
 */
function toLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Relative luminance of an sRGB color (WCAG 2.x definition). */
function luminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio between two colors. Result is ≥ 1. */
function contrastRatio(
  fg: [number, number, number],
  bg: [number, number, number],
): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Alpha-composite `fg` (with opacity `alpha` 0–1) over `bg`.
 * Equivalent to CSS color-mix(in srgb, fg alpha*100%, bg).
 */
function alphaComposite(
  fg: [number, number, number],
  bg: [number, number, number],
  alpha: number,
): [number, number, number] {
  return [
    Math.round(fg[0] * alpha + bg[0] * (1 - alpha)),
    Math.round(fg[1] * alpha + bg[1] * (1 - alpha)),
    Math.round(fg[2] * alpha + bg[2] * (1 - alpha)),
  ];
}

// ─── Design tokens (mirror src/index.css and src/utils/tokens.ts) ────────────

const TOKEN = {
  bg: "#0d1117",      // --bg
  surface: "#161b22", // --surface (base toast bg before tint)
  text: "#e6edf3",    // --text  (toast title color)
  muted: "#8b949e",   // --muted (toast body color)
  accent: "#58a6ff",  // --accent  / info icon
  success: "#3fb950", // --success
  warning: "#d29922", // --warning
  error: "#f85149",   // --error / danger icon
} as const;

// ─── Severity matrix ──────────────────────────────────────────────────────────

/**
 * Each row describes one toast severity.
 *
 * `tintColor`  — the semantic token used for the 8% background tint.
 * `iconColor`  — the icon / left-border accent color (also from TYPE_COLOR).
 * `titleColor` — always var(--text).
 * `bodyColor`  — always var(--muted).
 */
const SEVERITIES = [
  { name: "info",    tintColor: TOKEN.accent,  iconColor: TOKEN.accent  },
  { name: "success", tintColor: TOKEN.success, iconColor: TOKEN.success },
  { name: "warning", tintColor: TOKEN.warning, iconColor: TOKEN.warning },
  { name: "error",   tintColor: TOKEN.error,   iconColor: TOKEN.error   },
  { name: "danger",  tintColor: TOKEN.error,   iconColor: TOKEN.error   },
] as const;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ToastContainer — WCAG AA contrast", () => {
  for (const { name, tintColor, iconColor } of SEVERITIES) {
    /**
     * Compute the composited toast background:
     *   8% of the tint token blended over --bg.
     * This matches the CSS:
     *   background: color-mix(in srgb, var(--token) 8%, var(--bg));
     */
    const bgRgb = alphaComposite(
      hexToRgb(tintColor),
      hexToRgb(TOKEN.bg),
      0.08,
    );

    it(`[${name}] title text (#e6edf3) meets AA normal-text (≥ 4.5:1)`, () => {
      const ratio = contrastRatio(hexToRgb(TOKEN.text), bgRgb);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it(`[${name}] body/muted text (#8b949e) meets AA normal-text (≥ 4.5:1)`, () => {
      const ratio = contrastRatio(hexToRgb(TOKEN.muted), bgRgb);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it(`[${name}] icon/accent color meets AA UI component (≥ 3.0:1)`, () => {
      const ratio = contrastRatio(hexToRgb(iconColor), bgRgb);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });
  }
});

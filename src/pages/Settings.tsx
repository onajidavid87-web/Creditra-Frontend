/**
 * Settings page
 *
 * Houses accessibility and display preferences.
 * High-contrast toggle uses ContrastContext; future light/dark theme toggle
 * will use ThemeContext.
 *
 * Route: /settings  (add to App.tsx router when ready)
 */

import { Settings as SettingsIcon } from 'lucide-react';
import { HighContrastToggle } from '../components/HighContrastToggle';
import { ReducedMotionToggle } from '../components/ReducedMotionToggle';

export function Settings() {
  return (
    <div className="card card-large">
      <h2>
        <SettingsIcon className="icon" aria-hidden="true" />
        Settings
      </h2>
      <p>Customize your experience with accessibility options.</p>

      {/* ── Accessibility section ─────────────────────────────────────── */}
      <section
        aria-labelledby="settings-a11y-heading"
        style={{ marginTop: '2rem', display: 'grid', gap: '1.5rem' }}
      >
        <h3
          id="settings-a11y-heading"
          style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}
        >
          Accessibility
        </h3>

        {/*
          HighContrastToggle wires itself to ContrastContext and renders
          the label / description / switch row.
        */}
        <HighContrastToggle />
        <ReducedMotionToggle />

        {/*
          Placeholder: theme toggle (light / dark / system) lives here once
          the ThemeContext light variant is implemented.
        */}
      </section>
    </div>
  );
}

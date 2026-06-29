# Design System

## Accessibility

### Color-only-is-never-the-sole-signal
To ensure accessibility for users with color blindness and those using forced-colors mode, color must never be the sole indicator of status or value.

**Implementation Pattern: Utilization Bars**
Utilization bars use both color and diagonal stripe patterns to communicate thresholds:
- **Low (Success)**: Solid color, no pattern.
- **Medium (Warning)**: Color + 6px diagonal stripes.
- **High (Danger)**: Color + 4px diagonal stripes.

Aria text is always provided to announce the exact percentage value.

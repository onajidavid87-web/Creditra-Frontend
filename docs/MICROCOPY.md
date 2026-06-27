# Microcopy Guide

Short, scannable text that helps users understand what they're looking at
and what to do next. Every sentence should earn its place.

## Tone

- **Direct** — say what the number means, don't bury it.
- **Neutral** — inform without alarming. A low score is a signal, not a
  judgment.
- **Actionable** — if there's something the user can do, tell them.
- **No jargon without context** — "utilization" is fine in a label;
  "delinquency ratio" is not.

## Risk-explainer sentences

One sentence per band, derived from `RISK_COLOR(score)`:

| Band        | Threshold | Message |
|-------------|-----------|---------|
| success     | >= 700    | Strong credit position — you're above the recommended threshold for new draws. |
| warning     | >= 600    | Fair credit position — within acceptable range, though keep an eye on your utilization. |
| danger      | < 600     | Below the recommended threshold — consider improving your score before new draws. |

## Dismiss label

`Dismiss risk score explainer`

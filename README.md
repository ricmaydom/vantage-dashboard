# Vantage — PKA Intelligence Dashboard

A single-page intelligence dashboard for pipeline deals, transactions, leasing, market intel, strategy, and contacts. Built as a browser-first prototype using React (via Babel standalone, no build step) with inline data.

## Run it

Open `Vantage v4.html` in any modern browser. No server or build required.

For local development, serve the folder over HTTP so React/Babel resolve the JSX files:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/Vantage%20v4.html
```

## Structure

```
Vantage v4.html              Main entry — shell, styles, script tags
vantage-v4/
  adapter.jsx                Raw data → view models (deals, txs, intel, etc.)
  app.jsx                    Top-level app, drawer, modals, routing
  components.jsx             Shared UI primitives (cards, editable fields, etc.)
  screens.jsx                Per-view screens (Dashboard, Pipeline, Deals, …)
  data-inline.js             Inlined dataset (generated from /data)
data/                        JSON source of truth for the inlined dataset
```

## Responsive

- Desktop: full 224px sidebar + multi-column grids
- Tablet (≤1024px): sidebar collapses to 56px rail
- Mobile (≤760px): off-canvas drawer with hamburger toggle; tables scroll horizontally; inputs sized to prevent iOS zoom-on-focus; safe-area insets honored

## Tweaks

Toggle the Tweaks panel from the toolbar to flip feature flags live (theme, density, value hero, sparklines, etc.). Changes persist to `localStorage` and — when edited via the host — write back to the `TWEAK_DEFAULTS` block in `Vantage v4.html`.

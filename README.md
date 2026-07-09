# Commerce Toolkit — Framer Plugin

One plugin, three tools, zero code.

Stripe Checkout + QR Codes + Countdown Urgency — bundle complementary "sell stuff on your site" tools into a single install with a tabbed interface.

## Tools

### 1. Stripe Checkout Button
- Drop-in "Pay with Stripe" button
- Paste publishable key + Payment Link
- Style controls: color, text, radius, padding, font weight
- New tab or redirect behavior
- Works with one-time payments, subscriptions, donations

### 2. QR Code Generator
- Turn any URL, Payment Link, WhatsApp number, or wifi credential into a styled QR code
- Color/background customization to match brand
- Great pairing with Stripe: generate a QR that points straight to a Payment Link for in-person/print use
- Inserts as a real SVG layer on canvas

### 3. Countdown Timer
- "Sale ends in..." or "Launch in..." bar/badge
- Date-based or evergreen (rolling X hours from first visit)
- Pairs naturally with the checkout button for landing pages selling something

## Free vs Pro

| Feature | Free | Pro ($19) |
|---------|------|-----------|
| Stripe test keys | ✅ | ✅ |
| Stripe live keys | ❌ | ✅ |
| QR Code | ✅ | ✅ |
| Countdown Bar style | ✅ | ✅ |
| Countdown Badge style | ❌ | ✅ |
| Countdown Fixed date | ✅ | ✅ |
| Countdown Evergreen | ❌ | ✅ |

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open in Framer
# 1. Enable Developer Tools in Framer Preferences → Plugin
# 2. Click Plugin menu → "Open Development Plugin"
# 3. Navigate to http://localhost:5173
```

## Packaging & Publishing

```bash
# Build the plugin zip
npm run pack

# Upload plugin.zip to the Framer Marketplace
# https://www.framer.com/marketplace/dashboard/plugins/
```

## Tech Stack

- React 18 + TypeScript
- Vite 8 with HTTPS via vite-plugin-mkcert
- @framer/plugin v4
- qrcode package for QR generation

## TODO

- [ ] Wire Pro unlock to real payment backend (currently stubbed with local flag)
- [ ] Add analytics/telemetry for license verification
- [ ] Test with multiple Framer users/permissions

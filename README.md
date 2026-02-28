# Sasolburg Online Store (SOS)

A lightweight online store page built with **HTML + CSS + JavaScript only**.  
Products are loaded from `items.json` and rendered dynamically in the browser.

**Motto:** _Reliable service with Real value._

---

## Features

- Loads products from **`items.json`** (no frameworks)
- Product cards show:
  - **Image** (with fallback to `./assets/imgs/logo.png`)
  - SKU, name, brand, category, description
  - Price (currency: **R**)
  - Quantity selector
- Search by SKU/name/brand/category/description
- Filter by category
- Sort by name, price, or SKU
- Simple cart summary:
  - Total item count
  - Subtotal **(excl VAT)**
- **Tupperware registration section**
  - Copy self-register link
  - Share buttons: WhatsApp, Facebook, X, Instagram
- Footer with basic info

---

## Project Structure

```text
.
├── index.html
├── root.css
├── app.js
├── items.json
└── assets
    ├── imgs
    │   └── logo.png
    └── videos
        └── ad.mp4           (optional)




---

(WEBSITE)[https://theekingza.github.io/sos]

---
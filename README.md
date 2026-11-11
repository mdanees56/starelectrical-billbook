<<<<<<< HEAD
# STAR ELECTRICAL HAZARIBAGH

An billing and inventory application. It uses only the browser's IndexedDB and LocalStorage. No server, cloud database, paid API, or PDF upload is used.

## Run locally

```powershell
cd C:\Users\anees\OneDrive\Desktop\star-electrical-hazaribagh
npm install
npm run dev
```

Open the local address Vite prints (normally `http://localhost:5173`). To create an optimized production bundle, run `npm run build`.

## First use

1. Open **Settings** and upload the actual logo and handwritten signature. They are kept in this browser and embedded in future invoice PDFs.
2. Review the editable sample products, then add your own inventory and prices.
3. Optionally set a local PIN and enable/disable invoice metadata storage.
4. Export a full backup regularly from **Settings**. Clearing browser data can erase the local records. Downloaded PDFs stay wherever the browser saves them and are never kept by this app.

## Included functions

- Product and customer CRUD, search, category filtering, low-stock alerts and product CSV export.
- Local IndexedDB persistence with editable initial electrical-product samples.
- Bill creation with product search, custom lines, line and overall discounts, mixed GST, additional charges, round-off, partial payments, and stock deduction.
- A4 PDF invoice download with invoice details, tax totals, Indian amount-in-words, optional logo/signature, and multi-page item tables.
- Optional basic local sales metadata plus complete JSON export/restore.
=======
# starelectrical-billbook
>>>>>>> 32e5bcef1255fa5e0f0160042ecd7640a9ac5aa0

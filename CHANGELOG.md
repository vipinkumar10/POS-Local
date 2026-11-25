# Changelog

All notable changes to **POS Local** are documented in this file.

## [1.0.0] - 2026-11-25

Initial release (`v1.0.0`, matching `pos-backend` `1.0.0`) covering commits `0c5437c` through `71f3a92`.

### Added
- **Offline-First React PWA Frontend** (`src/`):
  - Point-of-Sale ordering (`POSScreen.jsx`) with AI voice ordering via `@google/generative-ai` and offline fallback parsing, plus order history (`OrderHistory.jsx`).
  - Menu management (`MenuManagement.jsx`) with multi-unit variants and CSV bulk import.
  - Inventory management (`InventoryManagement.jsx`) with recipe-based ingredient deduction and low-stock monitoring.
  - Expense tracking (`ExpenseModule.jsx`) and analytics dashboard (`DashboardScreen.jsx`) with custom date-range filtering and Recharts visualizations.
  - Staff PIN login (`PinLogin.jsx`) with keyboard input support.
  - Bluetooth thermal receipt printing (`PrinterSettings.jsx`, `bluetoothService.js`, `receiptBuilder.js`) via Web Bluetooth and `@point-of-sale/receipt-printer-encoder`.
  - Local IndexedDB persistence via Dexie.js (`database.js`, `seed.js`) and PWA install/update support (`vite-plugin-pwa`, `PWAUpdatePrompt.jsx`).
- **Spring Boot Synchronization & Reporting Backend** (`pos-backend/`):
  - REST endpoints (`SyncController`, `ConfigController`, `ReportController`) backed by H2 database (`H2ServerConfig`, `WebConfig`).
  - Bidirectional sync for orders, expenses, business configuration, menu items, inventory items, and recipes (`SyncService`, `SyncedOrder`, `SyncedExpense`, `SyncedMenuItem`, `SyncedInventoryItem`, `SyncedRecipe`, `AppConfig`).
  - Scheduled email and Excel (`poi-ooxml`) report generation (`ReportScheduler`, `ReportService`, `EmailService`, `report-email.html`).
- **Tooling & Environment**:
  - Unified startup script (`run_all.cmd`) to launch both the Vite frontend and Spring Boot backend.
  - Environment template (`.env.example`) and backend ignore rules (`pos-backend/.gitignore`).

### Changed
- Made background sync interval configurable in `SettingsScreen.jsx` and `App.jsx` (`28eb4cd`).
- Updated H2 datasource configuration in `pos-backend/src/main/resources/application.properties` (`28eb4cd`, `645eac2`).
- Expanded master-data sync and updated `run_all.cmd` and `vite.config.js` (`645eac2`).

### Commits Included
- `71f3a92` — backend files added to gitignore (2026-07-27)
- `645eac2` — Last working commit. (2026-07-27)
- `28eb4cd` — Sync fixed (2026-04-25)
- `0c5437c` — initial commit (2026-04-25)

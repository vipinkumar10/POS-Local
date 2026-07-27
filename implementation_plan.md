# POS Local - Master Implementation Plan & Architecture

A lightweight, offline-first POS application for small restaurant/cafe businesses, built with **React PWA** (frontend) and **Spring Boot** (backend), designed for Android tablets and phones.

---

## 1. System Architecture
The system follows a **Local-First** philosophy where all daily operations are handled by the browser's IndexedDB, with a Spring Boot backend acting as a centralized synchronization and reporting hub.

```mermaid
graph TB
    subgraph "Android Tablet / Phone (PWA)"
        UI["React PWA UI (Vite)"]
        AI["Gemini AI Voice Parser"]
        DB["IndexedDB (Dexie.js)"]
        BT["Web Bluetooth API"]
        UI --> DB
        AI --> UI
        UI --> BT
    end

    subgraph "Thermal Printer"
        TP["Bluetooth Thermal Printer"]
    end

    subgraph "Centralized Backend"
        API["Spring Boot REST API"]
        H2["H2/SQLite Database"]
        MAIL["JavaMail SMTP"]
        API --> H2
        API --> MAIL
    end

    BT -->|"ESC/POS"| TP
    DB <==>|"Bidirectional Sync (Push/Pull)"| API
```

---

## 2. Key Database Schema (IndexedDB via Dexie.js)

```mermaid
erDiagram
    BUSINESS_CONFIG ||--|| USER : "has"
    CATEGORY ||--|{ MENU_ITEM : "contains"
    MENU_ITEM ||--|{ MENU_ITEM_INGREDIENT : "uses"
    INVENTORY_ITEM ||--|{ MENU_ITEM_INGREDIENT : "supplies"
    ORDER ||--|{ ORDER_ITEM : "contains"
    MENU_ITEM ||--|{ ORDER_ITEM : "references"

    MENU_ITEM {
        string id PK
        string name
        float price
        json variants "e.g. [{unit:'Half', price:100}]"
        boolean isVeg
    }

    INVENTORY_ITEM {
        string id PK
        string name
        float currentStock
        float minStockAlert
    }

    ORDER {
        string id PK
        datetime orderDate
        float totalAmount
        string paymentMode
    }
```

---

## 3. Implemented Features (Update: May 2, 2026)

### A. Sales & Smart Ordering
- **AI Voice Ordering**: 
  - **Online**: Uses Google Gemini API for natural language parsing.
  - **Offline**: Automatic fallback to local fuzzy-matching regex parser.
- **Multi-Unit Pricing (Variants)**: Items can have multiple portions (e.g., Small/Large) with unique prices.
- **PIN Login Keyboard**: Integrated native keyboard support (hidden input) for faster staff login.

### B. Menu & Inventory Intelligence
- **Bulk Import**: CSV-based bulk upload for menu items with automatic category creation.
- **Recipe-Based Auto-Deduction**: Ingredients are automatically deducted from stock when an order is completed.
- **Low Stock Alerts**: Real-time visual monitoring based on configurable thresholds.

### C. Advanced Synchronization
- **Bidirectional Sync Loop**:
  - **Push**: Local orders, expenses, and business settings are backed up to the server.
  - **Pull (Master Data)**: Latest menu, recipes, and settings are retrieved from the server at every login.
- **Settings Sync**: Business info (Name, Address, GST) is centrally stored and shared across all devices.

### D. Analytics & Dashboard
- **Custom Date Range**: Dynamic filtering for all charts and stats (Today, Week, Month, or Custom).
- **Visual Trends**: Weekly sales line charts and payment mode pie charts using Recharts.

---

## 4. Infrastructure & DevOps
- **Reorganized Logging**: All logs stored in `./logs/` as human-readable plain text (ANSI stripped).
- **Unified Environment**: `run_all.cmd` launches both Frontend and Backend with automated log redirection.
- **PWA Excellence**: Optimized for standalone installation with mobile-responsive navigation.

---

## 5. Next Phase Roadmap
- [ ] **Bluetooth Thermal Printing**: Implementation of ESC/POS builder for KOT and Bills.
- [ ] **Kitchen Display System (KDS)**: Real-time order tracking for kitchen staff.
- [ ] **Multi-Role Permissions**: Separation of Admin and Waiter privileges.
- [ ] **Cloud Deployment**: Transition from localtunnel to a permanent HTTPS hosting environment.

---
*Last Updated: May 2, 2026*

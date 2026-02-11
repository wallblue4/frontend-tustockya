# Vendedor (Seller) - User Flows & Sequences

## Overview

The **Vendedor** (Seller) is the primary point-of-sale user. They scan products, register sales, manage transfers (requesting products from warehouses), handle returns, record expenses, and track daily performance.

**Route:** `/seller`
**Role key:** `seller`
**Dashboard:** `SellerDashboard`

---

## Navigation & Views

| View | Description |
|------|-------------|
| Dashboard | Quick actions, vendor info, daily summary, transfer summary |
| Scan | Product scanning via camera (AI classification) |
| New Sale | Sales form with payment methods |
| Today Sales | List of today's sales with confirmation status |
| Expenses | Register daily expenses |
| Expenses List | View today's expenses |
| Transfers | Manage transfer requests, pending, completed, returns |
| Notifications | Notifications view |

---

## User Flow 1: Scan Product & Sell

```mermaid
flowchart TD
    A[Login as Vendedor] --> B[Seller Dashboard]
    B --> C[Click 'Vender Producto' - Opens Camera]
    C --> D[CameraCapture Modal Opens]
    D --> E[Capture Product Photo]
    E --> F[AI Processes Image]
    F --> G[ProductScanner View]
    G --> H{Product found in inventory?}
    H -->|Yes - In local stock| I[See product details & sizes]
    H -->|Yes - In other locations| J[Option to request transfer]
    H -->|Not found| K[Classification only]
    I --> L[Select size to sell]
    L --> M[Click 'Vender']
    M --> N[SalesForm - Prefilled]
    N --> O[Set quantity & payment method]
    O --> P[Add receipt image - optional]
    P --> Q[Submit Sale]
    Q --> R[Sale registered]

    J --> S[Click 'Solicitar Transferencia']
    S --> T[TransfersView - Prefilled]
    T --> U[Configure transfer request]
    U --> V[Submit transfer request]
    V --> W[Wait for transfer completion]
    W --> X[Transfer arrives - sell product]
```

## User Flow 2: Request a Transfer

```mermaid
flowchart TD
    A[Dashboard] --> B[Click 'Transferencias pendientes' card]
    B --> C[TransfersView Opens]
    C --> D{Has prefilled data?}
    D -->|Yes - from scan| E[See pre-configured request]
    D -->|No - manual| F[See pending transfers list]

    E --> G[Configure transfer details]
    G --> H[Select pickup type]
    H -->|Corredor| I[Runner will pick up & deliver]
    H -->|Vendedor| J[Seller picks up from warehouse]
    I --> K[Submit request]
    J --> K
    K --> L[Transfer status: pending]

    F --> M[View pending transfers]
    M --> N{Transfer delivered?}
    N -->|Yes| O[Click 'Confirmar Recepcion']
    O --> P[Confirm quantity & condition]
    P --> Q[Inventory updated automatically]
    Q --> R[Option to sell from transfer]

    N -->|No - waiting| S[Track transfer status]
    S --> T[See courier info if assigned]
```

## User Flow 3: Register a Return (Devolucion)

```mermaid
flowchart TD
    A[TransfersView] --> B[View Completed Transfers]
    B --> C[Find transfer to return]
    C --> D[Click 'Devolucion']
    D --> E[ReturnModal Opens]
    E --> F[Select return reason]
    F --> G[Select quantity to return]
    G --> H[Select product condition]
    H --> I[Select pickup type]
    I -->|Corredor| J[Runner picks up return]
    I -->|Vendedor| K[Seller delivers to warehouse]
    J --> L[Submit return request]
    K --> L
    L --> M[Return status: pending]
    M --> N[Bodeguero accepts return]
    N --> O{Pickup type?}
    O -->|Corredor| P[Corredor picks up from seller]
    P --> Q[Corredor delivers to warehouse]
    O -->|Vendedor| R[Seller delivers directly]
    Q --> S[Bodeguero confirms reception]
    R --> S
    S --> T[Inventory restored]
```

## User Flow 4: Register Expenses

```mermaid
flowchart TD
    A[Dashboard] --> B[Click 'Registrar Gasto']
    B --> C[ExpensesForm]
    C --> D[Enter concept]
    D --> E[Enter amount]
    E --> F[Add receipt image - optional]
    F --> G[Add notes - optional]
    G --> H[Submit expense]
    H --> I[Expense registered]
    I --> J[Return to dashboard]
```

## Sequence Diagram: Complete Sale Flow

```mermaid
sequenceDiagram
    actor V as Vendedor
    participant App as Seller Dashboard
    participant Cam as CameraCapture
    participant AI as Classification API
    participant API as Backend API

    V->>App: Click "Vender Producto"
    App->>Cam: Open camera modal
    V->>Cam: Take photo of product
    Cam->>AI: POST /classify/scan (image)
    AI-->>Cam: {best_match, alternatives, availability}
    Cam-->>App: Navigate to ProductScanner

    App-->>V: Show product info & inventory
    V->>App: Select size, click "Vender"
    App-->>V: Open SalesForm (prefilled)

    V->>App: Set payment method & amount
    V->>App: Attach receipt (optional)
    V->>App: Click "Registrar Venta"

    App->>API: POST /sales/create (FormData)
    API-->>App: {sale_id, status}
    App-->>V: Sale confirmed
```

## Sequence Diagram: Transfer Request & Reception

```mermaid
sequenceDiagram
    actor V as Vendedor
    participant App as Seller Dashboard
    participant TAPI as Transfers API
    participant WH as Bodeguero
    participant CR as Corredor

    Note over V,CR: Transfer Request Flow

    V->>App: Request transfer (from scan or manual)
    App->>TAPI: POST /transfers/request
    TAPI-->>App: {transfer_id, status: pending}
    App-->>V: Transfer requested

    WH->>TAPI: Accept request
    TAPI-->>WH: {status: accepted}

    alt Pickup by Corredor
        CR->>TAPI: Accept transport
        TAPI-->>CR: {status: courier_assigned}
        CR->>TAPI: Confirm pickup from warehouse
        TAPI-->>CR: {status: in_transit}
        CR->>TAPI: Confirm delivery to seller
        TAPI-->>CR: {status: delivered}
    else Pickup by Vendedor
        WH->>TAPI: Deliver to vendor
        TAPI-->>V: {status: delivered}
    end

    Note over V: Product arrives

    V->>App: Confirm reception
    App->>TAPI: POST /vendor/confirm-reception/{id}
    TAPI-->>App: {inventory_updated: true}
    App-->>V: Product available to sell

    V->>App: Click "Vender" on completed transfer
    App-->>V: SalesForm (with transfer_id)
    V->>App: Complete sale
    App->>TAPI: POST /vendor/sell-from-transfer/{id}
    TAPI-->>App: Sale registered
```

## Sequence Diagram: Return Flow

```mermaid
sequenceDiagram
    actor V as Vendedor
    participant App as TransfersView
    participant API as Returns API
    participant WH as Bodeguero
    participant CR as Corredor

    V->>App: Click "Devolucion" on completed transfer
    App-->>V: Open ReturnModal
    V->>App: Fill return details
    App->>API: POST /returns/request
    API-->>App: {return_id, status: pending}

    WH->>API: Accept return

    alt Pickup by Corredor
        CR->>API: Accept return transport
        CR->>API: Pickup from seller
        CR->>API: Deliver to warehouse
    else Pickup by Vendedor
        V->>API: Deliver return to warehouse
    end

    WH->>API: Confirm return reception
    API-->>WH: {inventory_restored: true}
```

## State Machine: Transfer Lifecycle (Seller Perspective)

```mermaid
stateDiagram-v2
    [*] --> pending: Request transfer
    pending --> accepted: Bodeguero accepts
    accepted --> courier_assigned: Corredor assigned
    courier_assigned --> in_transit: Corredor picks up
    in_transit --> delivered: Corredor delivers
    delivered --> completed: Seller confirms reception
    completed --> selled: Seller sells product

    pending --> cancelled: Cancel request
    accepted --> cancelled: Cancel request

    completed --> return_pending: Request return
    return_pending --> return_completed: Return process

    note right of pending: Waiting for warehouse
    note right of delivered: Confirm reception
    note right of completed: Ready to sell
```

---

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/vendor/dashboard` | GET | Get seller dashboard data |
| `/classify/scan` | POST | Scan product image (AI) |
| `/sales/create` | POST | Create a new sale (FormData) |
| `/sales/today` | GET | Get today's sales |
| `/sales/confirm` | POST | Confirm a pending sale |
| `/expenses/create` | POST | Register an expense (FormData) |
| `/expenses/today` | GET | Get today's expenses |
| `/transfers/request` | POST | Request a product transfer |
| `/transfers/request-single-foot` | POST | Request single foot transfer |
| `/vendor/pending-transfers` | GET | Get pending transfers (reception) |
| `/vendor/completed-transfers` | GET | Get completed transfers |
| `/vendor/confirm-reception/{id}` | POST | Confirm product reception |
| `/vendor/sell-from-transfer/{id}` | POST | Sell from completed transfer |
| `/vendor/cancel-transfer/{id}` | POST | Cancel a transfer |
| `/returns/request` | POST | Request a return |
| `/vendor/incoming-transfers` | GET | Get incoming transfers |
| `/vendor/incoming-transfers/{id}/accept` | POST | Accept incoming transfer |
| `/discounts/request` | POST | Request a discount |

---

## Key Features

- **AI-powered product scanning** via camera with classification
- **Multiple payment methods** (efectivo, tarjeta, transferencia)
- **Transfer management** with real-time status tracking
- **Return flow** with reason, condition, and pickup type selection
- **Expense tracking** with receipt image upload
- **Sale confirmations** for pending sales
- **Discount requests** to admin
- **Transfer polling** for real-time updates

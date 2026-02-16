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

## User Flow 1: Scan Product & Direct Action

The scan flow uses a **2-step process**: Options → Direct Action. After scanning, the seller sees product cards with **interactive size toggles** and two action buttons (**Vendedor** / **Corredor**). Selecting a size and clicking an action button triggers the appropriate flow immediately, without an intermediate "details" view.

**Decision logic:**
- If the selected size is **local + can_sell=true** → always redirects to **Nueva Venta** (regardless of which button was clicked)
- If the selected size is **not locally sellable** → redirects to **Solicitud de Transferencia** with `pickup_type` pre-filled based on the button clicked

```mermaid
flowchart TD
    A[Login as Vendedor] --> B[Seller Dashboard]
    B --> C[Click 'Vender Producto' - Opens Camera]
    C --> D[CameraCapture Modal Opens]
    D --> E[Capture Product Photo]
    E --> F[AI Processes Image]
    F --> G[ProductScanner View - Options Step]
    G --> H[Product cards with size toggle group]
    H --> I[Select a size from toggle buttons]
    I --> J[Click 'Vendedor' or 'Corredor' button]
    J --> K{Size available locally with can_sell?}
    K -->|Yes - Local sellable| L[SalesForm - Prefilled with product + size]
    K -->|No - Remote or not sellable| M{Multiple locations?}
    M -->|Any remote location| N[TransfersView - Prefilled with pickup_type]
    L --> O[Set quantity & payment method]
    O --> P[Add receipt image - optional]
    P --> Q[Submit Sale]
    Q --> R[Sale registered]

    N --> S[Configure transfer request]
    S --> T[Submit transfer request]
    T --> U[Wait for transfer completion]
    U --> V[Transfer arrives - sell product]
```

### ProductOptionsCard Layout (per product card)

```
[ Image ] [ Info: brand, model, confidence, price                ]
          [ Toggle sizes: [7🟢] [7.5] [8🟢] [8.5] [9] ...       ]
          [ [Vender]  (if can_sell)  OR  [Vendedor] [Corredor]    ]
```

- **Size toggles**: Single-select, all sizes shown (no truncation). Sizes are active if they have any stock (complete pairs, left feet, or right feet); sizes with no stock at all are disabled/grey. **Green toggles** indicate sizes available for direct sale (`can_sell=true`); **primary-colored toggles** indicate sizes that require a transfer.
- **"Vender" button** (green, single): Shown when the selected size has `can_sell=true`. Redirects directly to Nueva Venta.
- **"Vendedor" / "Corredor" buttons**: Shown when the selected size requires a transfer. Sets `pickup_type` accordingly.
- **Card border**: Green when the product has at least one directly sellable size; default border otherwise (never red).
- Buttons are **disabled** until a size is selected (only applies to transfer buttons; the "Vender" button only appears when a sellable size is already selected)

## User Flow 2: Request a Transfer

When coming from the scanner, the `pickup_type` field is **pre-filled** based on which button the seller clicked (Vendedor or Corredor). The seller can still change it in the form if needed.

```mermaid
flowchart TD
    A[Dashboard] --> B[Click 'Transferencias pendientes' card]
    B --> C[TransfersView Opens]
    C --> D{Has prefilled data?}
    D -->|Yes - from scan| E[See pre-configured request]
    D -->|No - manual| F[See pending transfers list]

    E --> G[pickup_type pre-filled from scanner button]
    G --> H[Review & adjust transfer details]
    H --> I[Submit request]
    I --> J[Transfer status: pending]

    F --> K[View pending transfers]
    K --> L{Transfer delivered?}
    L -->|Yes| M[Click 'Confirmar Recepcion']
    M --> N[Confirm quantity & condition]
    N --> O[Inventory updated automatically]
    O --> P[Option to sell from transfer]

    L -->|No - waiting| Q[Track transfer status]
    Q --> R[See courier info if assigned]
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

## Sequence Diagram: Complete Sale Flow (Direct Action)

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
    AI-->>Cam: {matches[], sizes, availability}
    Cam-->>App: Navigate to ProductScanner

    Note over App: Pre-compute sizesMap for all matches

    App-->>V: Show product cards with size toggles
    V->>App: Toggle size on a product card
    V->>App: Click "Vendedor" or "Corredor"

    alt Size is local + can_sell
        App-->>V: Open SalesForm (prefilled with product + size)
        V->>App: Set payment method & amount
        V->>App: Attach receipt (optional)
        V->>App: Click "Registrar Venta"
        App->>API: POST /sales/create (FormData)
        API-->>App: {sale_id, status}
        App-->>V: Sale confirmed
    else Size is remote / not sellable
        App-->>V: Open TransfersView (prefilled with pickup_type)
        V->>App: Review & submit transfer request
        App->>API: POST /transfers/request
        API-->>App: {transfer_id, status: pending}
        App-->>V: Transfer requested
    end
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
- **Direct action flow**: Select size → click "Vender" (direct sale) or "Vendedor"/"Corredor" (transfer) → immediate redirect (no intermediate details step)
- **Interactive size toggle group**: Single-select, all sizes visible, green for directly sellable sizes (`can_sell`), primary color for transfer-required sizes, disabled when no stock exists. Considers complete pairs + individual feet (left/right).
- **Smart routing**: Sellable sizes show single green "Vender" button → Nueva Venta; transfer-required sizes show "Vendedor"/"Corredor" buttons → Transferencia with pre-filled `pickup_type`
- **Multiple payment methods** (efectivo, tarjeta, transferencia)
- **Transfer management** with real-time status tracking and pre-filled pickup type
- **Return flow** with reason, condition, and pickup type selection
- **Expense tracking** with receipt image upload
- **Sale confirmations** for pending sales
- **Discount requests** to admin
- **Transfer polling** for real-time updates

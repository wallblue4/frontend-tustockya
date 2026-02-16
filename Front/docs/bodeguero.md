# Bodeguero (Warehouse Keeper) - User Flows & Sequences

## Overview

The **Bodeguero** (Warehouse Keeper) manages warehouse inventory, processes transfer requests from sellers, prepares products for dispatch, coordinates with couriers, and handles product returns.

**Route:** `/warehouse`
**Role key:** `bodeguero`
**Dashboard:** `WarehouseDashboard`

---

## Navigation & Tabs

| Tab | Description |
|-----|-------------|
| Pendientes | Pending transfer requests to accept |
| Aceptadas | Accepted requests being processed |
| Inventario | Warehouse inventory view |
| Estadisticas | Warehouse performance stats |
| Devoluciones | Pending return requests |
| Historial | Daily transfer history |

---

## User Flow 1: Process a Transfer Request

```mermaid
flowchart TD
    A[Login as Bodeguero] --> B[Warehouse Dashboard]
    B --> C[View Pending Requests Tab]
    C --> D{Filter requests}
    D -->|By priority| E[High/Normal filter]
    D -->|By purpose| F[Cliente/Restock filter]
    E --> G[Review request details]
    F --> G
    G --> H[See product info & stock availability]
    H --> I{Can fulfill?}
    I -->|Yes| J[Click 'Aceptar Solicitud']
    I -->|No - Out of stock| K[Reject or wait for restock]
    J --> L[Request accepted - status: accepted]
    L --> M[Prepare product for dispatch]
    M --> N{Pickup type?}
    N -->|Corredor| O[Wait for courier assignment]
    O --> P[Courier arrives]
    P --> Q[Click 'Entregar a Corredor']
    Q --> R[Status: in_transit]
    N -->|Vendedor| S[Seller comes to pickup]
    S --> T[Click 'Entregar a Vendedor']
    T --> U[Status: delivered]
    R --> V[Courier delivers to seller]
    V --> W[Seller confirms reception]
    U --> W
    W --> X[Transfer completed]
```

## User Flow 2: Handle a Return (Devolucion)

```mermaid
flowchart TD
    A[Warehouse Dashboard] --> B[Devoluciones Tab]
    B --> C[View pending returns]
    C --> D[Review return details]
    D --> E[See product condition & quantity]
    E --> F[Click 'Aceptar Devolucion']
    F --> G{Pickup type?}
    G -->|Corredor| H[Courier picks up from seller]
    H --> I[Courier delivers to warehouse]
    I --> J[Product arrives at warehouse]
    G -->|Vendedor| K[Seller delivers to warehouse]
    K --> J
    J --> L[Click 'Confirmar Recepcion']
    L --> M[Verify product condition]
    M --> N[Enter received quantity]
    N --> O[Add notes if needed]
    O --> P[Submit confirmation]
    P --> Q[Inventory automatically restored]
    Q --> R[Return completed]
```

## User Flow 3: View Inventory

```mermaid
flowchart TD
    A[Warehouse Dashboard] --> B[Inventario Tab]
    B --> C[Load inventory data]
    C --> D{Filter by location?}
    D -->|All locations| E[See all inventory]
    D -->|Specific location| F[Filter by location]
    E --> G[Search by product name/code]
    F --> G
    G --> H[View product details]
    H --> I[See sizes & quantities]
    I --> J[See exhibition vs storage qty]
```

## Sequence Diagram: Accept & Dispatch Transfer

```mermaid
sequenceDiagram
    actor B as Bodeguero
    participant App as Warehouse Dashboard
    participant API as Backend API
    participant CR as Corredor
    participant S as Vendedor

    Note over B,S: Transfer Processing Flow

    App->>API: GET /warehouse/pending-requests
    API-->>App: List of pending requests
    App-->>B: Display pending requests

    B->>App: Review request details
    B->>App: Click "Aceptar Solicitud"
    App->>API: POST /warehouse/accept-request
    API-->>App: {status: accepted}
    App-->>B: Request moved to "Aceptadas"

    Note over B: Prepare product

    alt Pickup by Corredor
        CR->>API: Accept transport
        API-->>CR: {status: courier_assigned}
        Note over CR: Courier arrives at warehouse
        B->>App: Click "Entregar a Corredor"
        App->>API: POST /warehouse/deliver-to-courier
        API-->>App: {status: in_transit}
        CR->>API: Confirm pickup
        CR->>API: Confirm delivery
        S->>API: Confirm reception
    else Pickup by Vendedor
        Note over S: Seller arrives at warehouse
        B->>App: Click "Entregar a Vendedor"
        App->>API: POST /warehouse/deliver-to-vendor/{id}
        API-->>App: {status: delivered}
        S->>API: Confirm reception
    end
```

## Sequence Diagram: Return Reception

```mermaid
sequenceDiagram
    actor B as Bodeguero
    participant App as Warehouse Dashboard
    participant API as Backend API
    participant S as Vendedor
    participant CR as Corredor

    Note over B,CR: Return Reception Flow

    S->>API: POST /returns/request
    API-->>S: {return_id, status: pending}

    App->>API: GET /warehouse/accepted-requests
    API-->>App: Returns with request_type=return
    App-->>B: Show in Devoluciones tab

    B->>App: Review return request
    B->>App: Click "Aceptar Devolucion"
    App->>API: POST /warehouse/accept-request
    API-->>App: {status: accepted}

    alt Corredor delivers return
        CR->>API: Accept return transport
        CR->>API: Pick up from seller
        CR->>API: Deliver to warehouse
        Note over B: Product arrives
    else Vendedor delivers return
        S->>API: Deliver to warehouse
        Note over B: Product arrives
    end

    B->>App: Click "Confirmar Recepcion"
    App->>API: POST /warehouse/confirm-return-reception/{id}
    API-->>App: {inventory_restored, pair_reversal}
    App-->>B: Inventory updated
```

## Sequence Diagram: Real-time Polling

```mermaid
sequenceDiagram
    participant App as Warehouse Dashboard
    participant Hook as useTransferPolling
    participant API as Backend API
    participant Notif as Notification System

    Note over App,Notif: Polling runs every 15 seconds

    loop Every 15 seconds
        Hook->>API: GET /warehouse/polling-data
        API-->>Hook: {pending, accepted}
        Hook->>App: onUpdate(data)

        alt New requests detected
            App->>Notif: notifyNewTransferAvailable()
            Notif-->>App: Show notification
        end

        App->>App: Update pending requests
        App->>App: Update accepted requests
        App->>App: Update statistics
    end
```

## State Machine: Request Processing (Bodeguero Perspective)

```mermaid
stateDiagram-v2
    [*] --> pending: Seller creates request
    pending --> accepted: Bodeguero accepts

    state pickup_type <<choice>>
    accepted --> pickup_type: Ready for dispatch

    pickup_type --> courier_assigned: Corredor pickup
    pickup_type --> delivered: Vendedor pickup (deliver directly)

    courier_assigned --> in_transit: Corredor picks up
    in_transit --> delivered: Corredor delivers
    delivered --> completed: Receiver confirms

    note right of pending: New request\nCheck stock
    note right of accepted: Preparing product
    note right of courier_assigned: Waiting for courier
```

## State Machine: Return Processing

```mermaid
stateDiagram-v2
    [*] --> return_pending: Seller requests return
    return_pending --> return_accepted: Bodeguero accepts

    state return_pickup <<choice>>
    return_accepted --> return_pickup: Pickup method

    return_pickup --> return_courier: Via corredor
    return_pickup --> return_direct: Via vendedor

    return_courier --> return_in_transit: Corredor picks up
    return_in_transit --> return_delivered: Corredor delivers

    return_direct --> return_delivered: Vendedor delivers

    return_delivered --> return_completed: Bodeguero confirms

    note right of return_completed: Inventory restored
```

---

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/warehouse/pending-requests` | GET | Get pending transfer requests |
| `/warehouse/accept-request` | POST | Accept a transfer request |
| `/warehouse/accepted-requests` | GET | Get accepted/in-progress requests |
| `/warehouse/deliver-to-courier` | POST | Hand off product to courier |
| `/warehouse/deliver-to-vendor/{id}` | POST | Hand off product to vendor |
| `/warehouse/confirm-return-reception/{id}` | POST | Confirm return reception |
| `/warehouse/daily-transfer-history` | GET | Get today's transfer history |

---

## Key Features

- **Real-time polling** every 15 seconds for new requests
- **Notifications** for new transfer and return requests
- **Stock availability check** when reviewing requests
- **Inventory view** with location filtering and search
- **Return management** with inventory auto-restoration
- **Separate handling** for corredor vs vendedor pickups
- **Priority indicators** (URGENT / NORMAL) on requests
- **Preparation instructions** for special items (single feet, pair formation)

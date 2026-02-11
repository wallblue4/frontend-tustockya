# Corredor (Runner) - User Flows & Sequences

## Overview

The **Corredor** (Runner/Courier) is responsible for physically transporting products between locations (bodegas and locals/stores). They pick up products from warehouses and deliver them to sellers, or pick up returns from sellers and deliver them back to warehouses.

**Route:** `/runner`
**Role key:** `corredor`
**Dashboard:** `RunnerDashboard`

---

## Navigation & Tabs

| Tab | Description |
|-----|-------------|
| Disponibles | Available delivery requests to accept |
| Mis Entregas | Currently assigned transports |
| Historial | Completed deliveries history |
| Estadisticas | Performance stats & metrics |

---

## User Flow 1: Accept & Complete a Regular Transfer

```mermaid
flowchart TD
    A[Login as Corredor] --> B[Runner Dashboard]
    B --> C[View Available Requests Tab]
    C --> D{Filter by type?}
    D -->|All| E[See all available requests]
    D -->|Urgent cliente| F[See urgent requests only]
    D -->|Normal restock| G[See normal requests only]
    E --> H[Review Request Details]
    F --> H
    G --> H
    H --> I[See pickup & delivery locations]
    I --> J[See estimated earnings]
    J --> K[Click 'Aceptar Entrega']
    K --> L[Request accepted - status: courier_assigned]
    L --> M[Go to 'Mis Entregas' tab]
    M --> N[Physically go to pickup location]
    N --> O[Click 'Confirmar Recoleccion']
    O --> P[Status changes to: in_transit]
    P --> Q[Physically deliver to destination]
    Q --> R[Click 'Confirmar Entrega']
    R --> S[Status changes to: delivered]
    S --> T[Waiting for seller confirmation]
    T --> U[Transfer completed]
```

## User Flow 2: Accept & Complete a Return (Devolucion)

```mermaid
flowchart TD
    A[View Available Requests] --> B{Is it a return?}
    B -->|Yes - purpose: return| C[See return request details]
    C --> D[Click 'Aceptar Entrega']
    D --> E[Status: courier_assigned]
    E --> F[Go to 'Mis Entregas' tab]
    F --> G[Go to seller location]
    G --> H[Click 'Recibir de Vendedor']
    H --> I[Status: in_transit]
    I --> J[Transport to warehouse]
    J --> K[Click 'Entregar a Bodeguero']
    K --> L[Status: delivered]
    L --> M[Bodeguero confirms reception]
    M --> N[Return completed]
```

## Sequence Diagram: Transfer Delivery Flow

```mermaid
sequenceDiagram
    actor C as Corredor
    participant App as Runner Dashboard
    participant API as Backend API
    participant WH as Bodeguero
    participant S as Vendedor

    Note over C,S: Transfer Delivery Flow

    C->>App: Open Available Requests
    App->>API: GET /courier/available-requests
    API-->>App: List of available transports
    App-->>C: Display requests with details

    C->>App: Click "Aceptar Entrega"
    App->>API: POST /courier/accept-request/{id}
    API-->>App: {status: courier_assigned}
    App-->>C: Move to "Mis Entregas"

    Note over C: Physically travels to pickup

    C->>App: Click "Confirmar Recoleccion"
    App->>API: POST /courier/confirm-pickup/{id}
    API-->>App: {status: in_transit}
    App-->>C: Updated status badge

    Note over C: Physically delivers product

    C->>App: Click "Confirmar Entrega"
    App->>API: POST /courier/confirm-delivery/{id}
    API-->>App: {status: delivered}
    App-->>C: Notification - delivery completed

    S->>API: POST /vendor/confirm-reception/{id}
    API-->>S: Transfer completed
```

## Sequence Diagram: Return Flow

```mermaid
sequenceDiagram
    actor C as Corredor
    participant App as Runner Dashboard
    participant API as Backend API
    participant S as Vendedor
    participant WH as Bodeguero

    Note over C,WH: Return (Devolucion) Flow

    C->>App: View available returns
    App->>API: GET /courier/available-requests
    API-->>App: Returns with purpose=return

    C->>App: Accept return transport
    App->>API: POST /courier/accept-request/{id}
    API-->>App: {status: courier_assigned}

    Note over C: Go to seller location

    C->>App: "Recibir de Vendedor"
    App->>API: POST /courier/confirm-pickup/{id}
    API-->>App: {status: in_transit}

    Note over C: Transport to warehouse

    C->>App: "Entregar a Bodeguero"
    App->>API: POST /courier/confirm-delivery/{id}
    API-->>App: {status: delivered}

    WH->>API: Confirm return reception
    API-->>WH: Inventory restored
```

## Sequence Diagram: Real-time Polling

```mermaid
sequenceDiagram
    participant App as Runner Dashboard
    participant Hook as useTransferPolling
    participant API as Backend API
    participant Notif as Notification System

    Note over App,Notif: Polling runs every 20 seconds

    loop Every 20 seconds
        Hook->>API: GET /courier/polling-data
        API-->>Hook: {available, my_transports}
        Hook->>App: onUpdate(data)

        alt New requests detected
            App->>Notif: notifyTransportAvailable()
            Notif-->>App: Show notification
        end

        App->>App: Update available list
        App->>App: Update assigned list
    end
```

## State Machine: Transport Status

```mermaid
stateDiagram-v2
    [*] --> Available: Request created
    Available --> courier_assigned: Corredor accepts
    courier_assigned --> in_transit: Confirm pickup
    in_transit --> delivered: Confirm delivery
    delivered --> completed: Receiver confirms

    note right of courier_assigned: Corredor assigned\nGoing to pickup
    note right of in_transit: Product picked up\nIn transit
    note right of delivered: Delivered\nAwaiting confirmation
```

---

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/courier/available-requests` | GET | Get available delivery requests |
| `/courier/accept-request/{id}` | POST | Accept a transport request |
| `/courier/my-transports` | GET | Get assigned transports |
| `/courier/confirm-pickup/{id}` | POST | Confirm product pickup |
| `/courier/confirm-delivery/{id}` | POST | Confirm product delivery |
| `/courier/my-deliveries` | GET | Get delivery history |

---

## Key Features

- **Real-time polling** every 20 seconds for new available requests
- **Notifications** when new transport requests appear
- **Estimated earnings** calculated based on distance and urgency
- **Filter** by purpose (cliente/urgent vs restock/normal)
- **Separate flows** for regular transfers and returns (devoluciones)
- **Mobile-responsive** design with collapsible card details

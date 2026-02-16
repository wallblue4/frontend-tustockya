# Administrador (Admin) - User Flows & Sequences

## Overview

The **Administrador** (Admin) has comprehensive oversight of the business. They manage users, locations, inventory, costs, sales reports, wholesale operations, transfers, and system health. The admin dashboard is the most feature-rich panel in the system.

**Route:** `/administrador`
**Role key:** `administrador`
**Dashboard:** `AdminDashboard`

---

## Navigation & Views

| View | Description |
|------|-------------|
| Dashboard | Overview with metrics, alerts, and recent activity |
| Users | Create, edit, and manage employees (vendedor, bodeguero, corredor) |
| Costs | Operational cost management, payments, alerts |
| Locations | Manage stores and warehouses |
| Wholesale | Wholesale (mayoreo) product and sales management |
| Notifications | Discount approvals, return alerts, inventory alerts |
| Reports | Sales reports and daily traceability |
| Inventory | Admin-level inventory with adjustments and pricing |
| Analytics | Performance metrics and user analytics |
| Transfers | Transfer overview and daily traceability |

---

## User Flow 1: Manage Users

```mermaid
flowchart TD
    A[Login as Administrador] --> B[Admin Dashboard]
    B --> C[Navigate to Users View]
    C --> D[View managed users list]
    D --> E{Action?}
    E -->|Create| F[Click 'Crear Usuario']
    E -->|Edit| G[Click 'Editar' on user]
    E -->|Filter| H[Filter by role/search]

    F --> I[CreateUserModal Opens]
    I --> J[Enter name, email, password]
    J --> K[Select role: vendedor/bodeguero/corredor]
    K --> L[Assign locations]
    L --> M[Submit - User created]

    G --> N[EditUserModal Opens]
    N --> O[Modify user details]
    O --> P[Change role or locations]
    P --> Q[Toggle active/inactive]
    Q --> R[Submit - User updated]

    H --> S[Filter by role dropdown]
    S --> T[Search by name/email]
    T --> U[View filtered results]
```

## User Flow 2: Manage Operational Costs

```mermaid
flowchart TD
    A[Admin Dashboard] --> B[Navigate to Costs View]
    B --> C[View Operational Dashboard]
    C --> D[See locations status]
    D --> E{Action?}

    E -->|Create Cost| F[Click 'Crear Costo']
    F --> G[CreateCostModal Opens]
    G --> H[Select location]
    H --> I[Enter cost type & amount]
    I --> J[Set due date & recurrence]
    J --> K[Submit cost configuration]

    E -->|View Overdue| L[See critical alerts]
    L --> M[View overdue payments]
    M --> N[Register payment for overdue]

    E -->|View Upcoming| O[See upcoming payments]
    O --> P[Plan for upcoming costs]

    E -->|Register Payment| Q[Select cost configuration]
    Q --> R[Enter payment amount]
    R --> S[Submit payment]
    S --> T[Cost status updated]
```

## User Flow 3: Inventory Management

```mermaid
flowchart TD
    A[Admin Dashboard] --> B[Navigate to Inventory View]
    B --> C[Load admin inventory]
    C --> D{Filter by location?}
    D -->|All| E[View all locations]
    D -->|Specific| F[Select location]

    E --> G[Search products]
    F --> G
    G --> H[Expand product details]
    H --> I[View sizes & quantities]
    I --> J{Action?}

    J -->|Adjust Quantity| K[Click size adjustment]
    K --> L[AdjustInventoryModal]
    L --> M[Set new quantity]
    M --> N[Enter reason]
    N --> O[Submit adjustment]

    J -->|Adjust Price| P[Click price adjustment]
    P --> Q[AdjustPriceModal]
    Q --> R[Set new unit/box price]
    R --> S[Submit price change]

    J -->|Add Size| T[Click add size]
    T --> U[AddSizeModal]
    U --> V[Enter size & quantities]
    V --> W[Submit new size]

    J -->|Video Entry| X[Record video inventory]
    X --> Y[Capture photo & video]
    Y --> Z[Enter product details]
    Z --> AA[Submit video entry]
```

## User Flow 4: Approve Discount Requests

```mermaid
flowchart TD
    A[Admin Dashboard] --> B[Navigate to Notifications View]
    B --> C[View pending discount requests]
    C --> D[Review discount details]
    D --> E[See original price & requested discount]
    E --> F{Decision?}
    F -->|Approve| G[Click 'Aprobar']
    G --> H[Discount applied to sale]
    F -->|Reject| I[Click 'Rechazar']
    I --> J[Discount denied - seller notified]
```

## User Flow 5: View Reports & Traceability

```mermaid
flowchart TD
    A[Admin Dashboard] --> B[Navigate to Reports View]
    B --> C{Report type?}

    C -->|Sales Report| D[Generate sales report]
    D --> E[Select date range]
    E --> F[View sales data by location]

    C -->|Sales Traceability| G[View daily sales trace]
    G --> H[See each sale with details]
    H --> I[Track seller, items, payments]

    C -->|Transfer Traceability| J[View daily transfer trace]
    J --> K[See each transfer with timeline]
    K --> L[Track status changes & actors]
```

## User Flow 6: Wholesale Management (Mayoreo)

```mermaid
flowchart TD
    A[Admin Dashboard] --> B[Navigate to Wholesale View]
    B --> C{Action?}

    C -->|Create Product| D[Click 'Crear Producto Mayoreo']
    D --> E[Enter model, sizes, price]
    E --> F[Set boxes & pairs per box]
    F --> G[Submit product]

    C -->|Register Sale| H[Click 'Registrar Venta']
    H --> I[Select product]
    I --> J[Enter boxes sold & price]
    J --> K[Submit wholesale sale]

    C -->|View Stats| L[See wholesale statistics]
    L --> M[Total products, boxes, sales value]

    C -->|View Sales| N[Click product sales history]
    N --> O[See all sales for product]
```

## Sequence Diagram: User Management

```mermaid
sequenceDiagram
    actor A as Administrador
    participant App as Admin Dashboard
    participant API as Admin API

    A->>App: Navigate to Users
    App->>API: GET /admin/managed-users
    API-->>App: List of users
    App-->>A: Display users table

    A->>App: Click "Crear Usuario"
    App-->>A: Open CreateUserModal

    A->>App: Fill user details & submit
    App->>API: POST /admin/users
    API-->>App: {user_id, status: created}
    App-->>A: User created - refresh list

    A->>App: Click "Editar" on user
    App-->>A: Open EditUserModal

    A->>App: Modify details & submit
    App->>API: PUT /admin/users/{id}
    API-->>App: {status: updated}
    App-->>A: User updated
```

## Sequence Diagram: Cost Management

```mermaid
sequenceDiagram
    actor A as Administrador
    participant App as Admin Dashboard
    participant API as Admin API

    A->>App: Navigate to Costs
    App->>API: GET /admin/costs/operational-dashboard
    API-->>App: {summary, locations_status, critical_alerts}
    App-->>A: Display operational overview

    A->>App: Click "Crear Costo"
    App-->>A: Open CreateCostModal
    A->>App: Fill cost details & submit
    App->>API: POST /admin/costs/configurations
    API-->>App: Cost created

    A->>App: Register payment
    App->>API: POST /admin/costs/payments
    API-->>App: Payment recorded

    App->>API: GET /admin/costs/overdue-alerts
    API-->>App: Overdue payment alerts
    App-->>A: Show critical alerts

    App->>API: GET /admin/costs/upcoming-payments
    API-->>App: Upcoming payment list
    App-->>A: Show upcoming payments
```

## Sequence Diagram: Inventory Adjustment

```mermaid
sequenceDiagram
    actor A as Administrador
    participant App as Admin Dashboard
    participant API as Admin API

    A->>App: Navigate to Inventory
    App->>API: GET /admin/inventory
    API-->>App: All locations with products
    App-->>A: Display inventory grid

    A->>App: Expand product, click size
    App-->>A: Open AdjustInventoryModal

    A->>App: Set new quantity & reason
    App->>API: POST /admin/inventory/adjust
    API-->>App: {inventory_updated: true}
    App-->>A: Quantity updated

    A->>App: Click price adjustment
    App-->>A: Open AdjustPriceModal

    A->>App: Set new prices
    App->>API: POST /admin/inventory/adjust-price
    API-->>App: {price_updated: true}
    App-->>A: Price updated
```

## Sequence Diagram: Dashboard Overview Load

```mermaid
sequenceDiagram
    actor A as Administrador
    participant App as Admin Dashboard
    participant API as Admin API

    A->>App: Login & navigate to /administrador

    par Load all dashboard data
        App->>API: GET /admin/dashboard
        App->>API: GET /admin/metrics
        App->>API: GET /admin/costs/operational-dashboard
        App->>API: GET /admin/discount-requests/pending
    end

    API-->>App: Dashboard data
    API-->>App: Metrics (sales, users, transfers, alerts)
    API-->>App: Operational cost overview
    API-->>App: Pending discount requests

    App-->>A: Complete dashboard with all widgets
```

## State Machine: Admin Views

```mermaid
stateDiagram-v2
    [*] --> Dashboard: Login
    Dashboard --> Users: Navigate
    Dashboard --> Costs: Navigate
    Dashboard --> Locations: Navigate
    Dashboard --> Wholesale: Navigate
    Dashboard --> Notifications: Navigate
    Dashboard --> Reports: Navigate
    Dashboard --> Inventory: Navigate
    Dashboard --> Analytics: Navigate
    Dashboard --> Transfers: Navigate

    Users --> Dashboard: Back
    Costs --> Dashboard: Back
    Inventory --> Dashboard: Back

    note right of Dashboard: KPIs, alerts,\nrecent activity
    note right of Users: CRUD vendedores,\nbodegueros, corredores
    note right of Costs: Operational costs,\npayments, alerts
    note right of Inventory: Stock adjustments,\nprice changes
```

---

## API Endpoints Used

### Dashboard & Metrics
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/dashboard` | GET | Get admin dashboard overview |
| `/admin/metrics` | GET | Get key performance metrics |
| `/admin/system/overview` | GET | Get system health overview |

### User Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/users` | POST | Create a new user |
| `/admin/managed-users` | GET | List all managed users |
| `/admin/users/{id}` | PUT | Update user details |
| `/admin/available-locations` | GET | Get locations for user assignment |

### Location Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/managed-locations` | GET | List managed locations |
| `/admin/location-statistics` | GET | Get location performance stats |

### Cost Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/costs/configurations` | POST | Create cost configuration |
| `/admin/costs/configurations` | GET | List cost configurations |
| `/admin/costs/configurations/{id}` | GET | Get specific cost config |
| `/admin/costs/configurations/{id}` | PUT | Update cost config |
| `/admin/costs/configurations/{id}` | DELETE | Delete cost config |
| `/admin/costs/configurations/{id}/deactivate` | POST | Deactivate cost |
| `/admin/costs/payments` | POST | Register a payment |
| `/admin/costs/operational-dashboard` | GET | Operational overview |
| `/admin/costs/location-dashboard` | GET | Location cost dashboard |
| `/admin/costs/overdue-alerts` | GET | Get overdue payment alerts |
| `/admin/costs/upcoming-payments` | GET | Get upcoming payments |
| `/admin/costs/health` | GET | Cost module health |

### Sales & Reports
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/reports/sales` | GET | Generate sales reports |
| `/admin/reports/daily-sales-traceability` | GET | Daily sales traceability |

### Discounts
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/discount-requests/pending` | GET | Get pending discount requests |
| `/admin/discount-requests/{id}/approve` | POST | Approve/reject discount |

### Transfers
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/transfers/overview` | GET | Get transfers overview |
| `/admin/transfers/daily-traceability` | GET | Daily transfer traceability |

### Inventory
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/inventory` | GET | Get full admin inventory |
| `/admin/inventory/adjust` | POST | Adjust inventory quantity |
| `/admin/inventory/adjust-price` | POST | Adjust product price |
| `/admin/inventory/alerts` | POST | Configure inventory alerts |

### Performance & Analytics
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/users/performance` | GET | Get user performance data |
| `/admin/product-assignments` | GET | Get product assignments |

### Video Inventory
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/video-inventory/process` | POST | Process video inventory entry |
| `/admin/video-inventory/history` | GET | Get processing history |

### Wholesale (Mayoreo)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mayoreo/productos` | POST | Create wholesale product |
| `/mayoreo/productos` | GET | List wholesale products |
| `/mayoreo/productos/{id}` | PUT | Update wholesale product |
| `/mayoreo/productos/{id}` | DELETE | Delete wholesale product |
| `/mayoreo/ventas` | POST | Register wholesale sale |
| `/mayoreo/ventas` | GET | List wholesale sales |
| `/mayoreo/ventas/producto/{id}` | GET | Get sales by product |
| `/mayoreo/estadisticas` | GET | Get wholesale statistics |

---

## Key Features

- **Full user CRUD** for vendedores, bodegueros, and corredores
- **Operational cost management** with payments, alerts, and overdue tracking
- **Inventory adjustments** (quantity, pricing, add sizes)
- **Video inventory entry** with photo and video capture
- **Sales reports** with daily traceability
- **Transfer monitoring** with overview and traceability
- **Discount approval** workflow for seller-requested discounts
- **Wholesale module** for bulk product management
- **Location management** with statistics per location
- **Performance analytics** across all users
- **System health monitoring** with microservice connectivity checks

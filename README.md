# AssetFlow - Enterprise Asset & Resource Management System

## Overview
AssetFlow is a modular Odoo 18 addon suite for enterprise asset and resource management.
Built for hackathon by a team of 4 developers.

## Modules

| Module | Description | Developer |
|--------|-------------|----------|
| assetflow_base | Core module: auth, users, roles, departments, categories | Developer 1 |
| assetflow_assets | Asset registration, lifecycle, documents, locations | Developer 2 |
| assetflow_operations | Allocation, transfer, booking, maintenance, approvals | Developer 3 |
| assetflow_dashboard | Dashboard, notifications, activity logs, audit, KPIs | Developer 4 |
| assetflow_reports | Reports, analytics, PDF/Excel export, charts | Shared |

## Installation

1. Clone this repository into your Odoo addons path
2. Install dependencies: `pip install -r requirements.txt`
3. Update the Odoo module list
4. Install `assetflow_base` first, then other modules in order

## Module Dependencies

```
assetflow_base (no addon dependencies)
    └── assetflow_assets
        └── assetflow_operations
            └── assetflow_dashboard
assetflow_reports (depends on all)
```

## Development Order

1. assetflow_base
2. assetflow_assets
3. assetflow_operations
4. assetflow_dashboard
5. assetflow_reports

## Tech Stack
- Odoo 18 Community/Enterprise
- Python 3.10+
- PostgreSQL 15+
- XML, QWeb, OWL (frontend)

## License
LGPL-3

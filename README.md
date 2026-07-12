# 🚀 AssetFlow - Enterprise Asset & Resource Management System

> A modern ERP solution for managing organizational assets, resource bookings, maintenance workflows, audits, and analytics.


---

## 📌 Overview

AssetFlow is a comprehensive Enterprise Asset & Resource Management System developed for the **Odoo Hackathon**.

The platform enables organizations to efficiently manage physical assets, allocate resources, schedule maintenance, book shared resources, perform audits, and monitor operational performance through an intuitive dashboard.

---

## ✨ Features

### 👤 User Management
- Secure Authentication
- Role-Based Access Control
- Employee Directory
- Department Management
- Asset Category Management

### 📦 Asset Management
- Asset Registration
- Asset Lifecycle Tracking
- QR/Barcode Ready
- Asset History
- Asset Status Management

### 🔄 Allocation & Transfer
- Asset Allocation
- Transfer Requests
- Return Workflow
- Conflict Detection
- Expected Return Tracking

### 📅 Resource Booking
- Room Booking
- Vehicle Booking
- Equipment Booking
- Calendar View
- Overlap Validation

### 🔧 Maintenance
- Raise Maintenance Requests
- Approval Workflow
- Technician Assignment
- Maintenance History
- Asset Status Updates

### 📊 Dashboard & Analytics
- Live KPIs
- Asset Utilization
- Maintenance Statistics
- Department Reports
- Activity Logs

### 🔍 Audit
- Audit Cycles
- Asset Verification
- Missing Asset Reports
- Discrepancy Reports

### 🔔 Notifications
- Overdue Returns
- Booking Reminders
- Maintenance Alerts
- Transfer Notifications

---

# 🏗 Project Architecture

```
assetflow/
│
├── addons/
│   ├── assetflow_base/
│   ├── assetflow_assets/
│   ├── assetflow_operations/
│   ├── assetflow_dashboard/
│   └── assetflow_reports/
│
├── frontend/
│
├── docs/
│
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

# 👨‍💻 Team Structure

| Member | Module |
|---------|--------|
| Member 1 | assetflow_base |
| Member 2 | assetflow_assets |
| Member 3 | assetflow_operations |
| Member 4 | assetflow_dashboard |
| Team | assetflow_reports & Integration |

---

# 🛠 Technology Stack

## Backend
- Odoo 18
- Python
- PostgreSQL

## Frontend
- React
- TypeScript
- Tailwind CSS
- Vite
- Framer Motion
- Lucide Icons

## Database
- PostgreSQL

## DevOps
- Docker
- Docker Compose

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/<username>/assetflow.git
cd assetflow
```

---

## Start Backend

Using Docker

```bash
docker compose up -d
```

Open

```
http://localhost:8069
```

Create a database named

```
assetflow
```

Install modules from Apps.

---

## Run Frontend

```bash
cd frontend

npm install

npm run dev
```

Open

```
http://localhost:5173
```

---

# 📂 Modules

## assetflow_base

- Authentication
- Departments
- Employees
- Roles
- Asset Categories

---

## assetflow_assets

- Asset Registration
- Asset Directory
- Asset Lifecycle
- Asset History

---

## assetflow_operations

- Asset Allocation
- Resource Booking
- Transfers
- Maintenance

---

## assetflow_dashboard

- Dashboard
- Notifications
- Audit
- Activity Logs

---

## assetflow_reports

- Analytics
- Reports
- Export
- Charts

---

# 👥 User Roles

### Administrator

- Manage departments
- Manage employees
- Manage categories
- View analytics

---

### Asset Manager

- Register assets
- Allocate assets
- Approve transfers
- Approve maintenance

---

### Department Head

- View department assets
- Approve allocations
- Book resources

---

### Employee

- View assigned assets
- Raise maintenance requests
- Book resources
- Request transfers

---

# 📈 Future Enhancements

- QR Code Scanning
- RFID Integration
- Mobile Application
- AI-based Asset Prediction
- Predictive Maintenance
- IoT Asset Monitoring

---

# 📸 Screenshots

### Login

> *(Add login page screenshot here)*

### Dashboard

> *(Add dashboard screenshot here)*

### Assets

> *(Add assets page screenshot here)*

---

# 🤝 Contributing

1. Fork the repository

2. Create a branch

```bash
git checkout -b feature/module-name
```

3. Commit

```bash
git commit -m "feat: add new feature"
```

4. Push

```bash
git push origin feature/module-name
```

5. Create a Pull Request

---

# 📄 License

Developed for the **Odoo Hackathon**.

For educational and demonstration purposes only.

---

# ⭐ Acknowledgements

- Odoo
- React
- PostgreSQL
- Docker
- Tailwind CSS
- Framer Motion

---

<div align="center">

### AssetFlow

**Manage • Track • Optimize**

Built with ❤️ for the Odoo Hackathon

</div>

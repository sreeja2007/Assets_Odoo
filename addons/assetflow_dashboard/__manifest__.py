# -*- coding: utf-8 -*-
{
    'name': 'AssetFlow Dashboard',
    'version': '18.0.1.0.0',
    'category': 'Asset Management',
    'summary': 'Dashboard, notifications, activity logs and audit management',
    'description': """
        AssetFlow Dashboard Module
        ==========================
        Provides:
        - Interactive dashboard with KPI cards
        - Notification system
        - Activity log tracking
        - Audit cycle management
    """,
    'author': 'AssetFlow Team',
    'website': 'https://assetflow.example.com',
    'license': 'LGPL-3',
    'depends': [
        'assetflow_operations',
        'mail',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/notification_data.xml',
        'data/audit_cycle_data.xml',
        'views/dashboard_views.xml',
        'views/notification_views.xml',
        'views/activity_log_views.xml',
        'views/audit_cycle_views.xml',
        'views/audit_item_views.xml',
        'views/menu_views.xml',
    ],
    'demo': [
        'demo/demo_data.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'assetflow_dashboard/static/src/css/assetflow_dashboard.css',
            'assetflow_dashboard/static/src/js/assetflow_dashboard.js',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
}

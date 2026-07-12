# -*- coding: utf-8 -*-
{
    'name': 'AssetFlow Dashboard',
    'version': '18.0.1.0.0',
    'category': 'Asset Management',
    'summary': 'Dashboard APIs, notifications, activity logs and audit management',
    'description': "Headless Dashboard APIs and Audit Cycle Management",
    'author': 'AssetFlow Team',
    'depends': ['assetflow_operations', 'mail'],
    'data': [
        'security/ir.model.access.csv',
        'data/notification_data.xml',
        'data/audit_cycle_data.xml',
        'views/notification_views.xml',
        'views/activity_log_views.xml',
        'views/audit_cycle_views.xml',
        'views/audit_item_views.xml',
        'views/menu_views.xml',
    ],
    'demo': ['demo/demo_data.xml'],
    'installable': True,
    'application': False,
    'auto_install': False,
}

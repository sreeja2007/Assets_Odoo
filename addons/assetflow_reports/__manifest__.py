# -*- coding: utf-8 -*-
{
    'name': 'AssetFlow Reports',
    'version': '18.0.1.0.0',
    'category': 'Asset Management',
    'summary': 'Reports, analytics, and data export for AssetFlow',
    'description': """
        AssetFlow Reports Module
        ========================
        Provides:
        - Asset reports (PDF/Excel)
        - Maintenance reports
        - Booking reports
        - Dashboard analytics reports
        - Chart generation
    """,
    'author': 'AssetFlow Team',
    'website': 'https://assetflow.example.com',
    'license': 'LGPL-3',
    'depends': [
        'assetflow_base',
        'assetflow_assets',
        'assetflow_operations',
        'assetflow_dashboard',
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/report_menu_views.xml',
        'reports/asset_report_templates.xml',
        'reports/maintenance_report_templates.xml',
        'reports/booking_report_templates.xml',
        'reports/dashboard_report_templates.xml',
        'wizard/report_wizard_views.xml',
    ],
    'demo': [],
    'assets': {},
    'installable': True,
    'application': False,
    'auto_install': False,
    'external_dependencies': {
        'python': ['xlsxwriter'],
    },
}

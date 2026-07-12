# -*- coding: utf-8 -*-
{
    'name': 'AssetFlow Operations',
    'version': '18.0.1.0.0',
    'category': 'Asset Management',
    'summary': 'Asset allocation, transfer, booking and maintenance operations',
    'description': """
        AssetFlow Operations Module
        ===========================
        Provides:
        - Asset allocation and return
        - Asset transfer between departments/locations
        - Resource booking system
        - Maintenance request management
        - Approval workflows
    """,
    'author': 'AssetFlow Team',
    'website': 'https://assetflow.example.com',
    'license': 'LGPL-3',
    'depends': [
        'assetflow_assets',
        'mail',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/allocation_sequence_data.xml',
        'data/maintenance_sequence_data.xml',
        'views/asset_allocation_views.xml',
        'views/asset_transfer_views.xml',
        'views/resource_booking_views.xml',
        'views/maintenance_request_views.xml',
        'views/menu_views.xml',
        'wizard/allocation_wizard_views.xml',
    ],
    'demo': [
        'demo/demo_data.xml',
    ],
    'assets': {},
    'installable': True,
    'application': False,
    'auto_install': False,
}

# -*- coding: utf-8 -*-
{
    'name': 'AssetFlow Operations',
    'version': '18.0.1.0.0',
    'category': 'Asset Management',
    'summary': 'Asset allocation, booking, transfer and maintenance requests',
    'description': "Backend workflows and APIs for allocations, bookings and maintenance requests.",
    'author': 'AssetFlow Team',
    'depends': ['assetflow_assets', 'mail'],
    'data': [
        'security/ir.model.access.csv',
        'data/allocation_sequence_data.xml',
        'data/maintenance_sequence_data.xml',
        'views/asset_allocation_views.xml',
        'views/asset_transfer_views.xml',
        'views/resource_booking_views.xml',
        'views/maintenance_request_views.xml',
        'views/menu_views.xml',
    ],
    'demo': [],
    'installable': True,
    'application': False,
    'auto_install': False,
}

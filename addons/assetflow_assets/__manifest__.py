# -*- coding: utf-8 -*-
{
    'name': 'AssetFlow Assets',
    'version': '18.0.1.0.0',
    'category': 'Asset Management',
    'summary': 'Asset registration, lifecycle, documents and locations',
    'description': """
        AssetFlow Assets Module
        =======================
        Provides:
        - Asset registration and directory
        - Asset lifecycle management
        - Asset document management
        - Asset history tracking
        - QR/Barcode generation
        - Location management
    """,
    'author': 'AssetFlow Team',
    'website': 'https://assetflow.example.com',
    'license': 'LGPL-3',
    'depends': [
        'assetflow_base',
        'mail',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/asset_sequence_data.xml',
        'views/asset_views.xml',
        'views/asset_history_views.xml',
        'views/asset_document_views.xml',
        'views/asset_location_views.xml',
        'views/menu_views.xml',
        'reports/asset_report_templates.xml',
    ],
    'demo': [
        'demo/demo_data.xml',
    ],
    'assets': {},
    'installable': True,
    'application': False,
    'auto_install': False,
}

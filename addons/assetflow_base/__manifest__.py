# -*- coding: utf-8 -*-
{
    'name': 'AssetFlow Base',
    'version': '18.0.1.0.0',
    'category': 'Asset Management',
    'summary': 'Base module for AssetFlow - Enterprise Asset & Resource Management',
    'description': """
        AssetFlow Base Module
        =====================
        Core module providing:
        - Department management
        - Employee directory
        - Asset categories
        - User extensions
        - Security groups and access rights
        - Base menu structure
    """,
    'author': 'AssetFlow Team',
    'website': 'https://assetflow.example.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'mail',
        'hr',
    ],
    'data': [
        'security/assetflow_security.xml',
        'security/ir.model.access.csv',
        'data/asset_category_data.xml',
        'data/department_data.xml',
        'views/department_views.xml',
        'views/employee_views.xml',
        'views/asset_category_views.xml',
        'views/res_users_views.xml',
        'views/menu_views.xml',
    ],
    'demo': [
        'demo/demo_data.xml',
    ],
    'assets': {},
    'installable': True,
    'application': True,
    'auto_install': False,
}

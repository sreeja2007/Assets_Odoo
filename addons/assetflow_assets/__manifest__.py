{
    "name": "AssetFlow Assets",
    "version": "18.0.1.0.0",
    "summary": "Asset Management Module",
    "description": """
        AssetFlow Asset Management
        --------------------------
        Asset Registration
        Asset Locations
        Asset Documents
        Asset History
        Asset Lifecycle
    """,
    "author": "AssetFlow Team",
    "category": "Inventory",
    "license": "LGPL-3",

    "depends": [
        "base",
        "mail",
        "assetflow_base",
    ],

    "data": [
        "security/groups.xml",
        "security/security.xml",
        "security/ir.model.access.csv",

        "data/asset_sequence.xml",

        "views/actions.xml",
        "views/menus.xml",

        "views/asset_views.xml",
        "views/asset_location_views.xml",
        "views/asset_history_views.xml",
        "views/asset_document_views.xml",
    ],

    "installable": True,
    "application": True,
}
import os

assets_dir = r"d:\Odoo\assetflow\addons\assetflow_assets"

def create_file(path, content):
    full_path = os.path.join(assets_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# 1. Update manifest to load controllers? Controllers don't need manifest entry in Odoo, but __init__.py needs it.
# 2. Update __init__.py
create_file("__init__.py", """
# -*- coding: utf-8 -*-
from . import models
from . import controllers
from . import wizard
""")

# 3. controllers/__init__.py
create_file("controllers/__init__.py", """
# -*- coding: utf-8 -*-
from . import api
""")

# 4. controllers/api.py
create_file("controllers/api.py", """
# -*- coding: utf-8 -*-
import json
from odoo import http
from odoo.http import request

class AssetFlowAssetsAPI(http.Controller):

    def _json_response(self, data, status=200):
        headers = [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE'),
            ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
        ]
        return request.make_response(json.dumps(data), headers=headers, status=status)

    @http.route('/api/assets', auth='public', type='http', methods=['GET', 'OPTIONS'], cors='*')
    def get_assets(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            assets = request.env['assetflow.asset'].sudo().search([])
            data = []
            for asset in assets:
                data.append({
                    'id': asset.id,
                    'tag': asset.asset_tag or '',
                    'name': asset.name,
                    'categoryId': asset.category_id.id if asset.category_id else None,
                    'serialNumber': asset.serial_number or '',
                    'acquisitionDate': str(asset.purchase_date) if asset.purchase_date else False,
                    'acquisitionCost': asset.purchase_cost,
                    'condition': asset.condition,
                    'location': asset.location_id.name if asset.location_id else '',
                    'status': asset.status.title() if asset.status else 'Available',
                    'departmentId': asset.department_id.id if asset.department_id else None,
                    'assignedTo': asset.employee_id.id if asset.employee_id else None,
                    'active': asset.active
                })
            return self._json_response({'status': 'success', 'data': data})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/assets/create', auth='public', type='http', methods=['POST', 'OPTIONS'], cors='*')
    def create_asset(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            body = request.httprequest.data
            params = json.loads(body) if body else {}
            name = params.get('name')
            category_id = params.get('categoryId')
            serial = params.get('serialNumber')
            cost = params.get('acquisitionCost') or 0.0
            condition = params.get('condition') or 'good'
            
            if not name or not category_id:
                return self._json_response({'status': 'error', 'message': 'Missing name or categoryId'}, status=400)
                
            # Auto generate asset tag for the spec
            count = request.env['assetflow.asset'].sudo().search_count([]) + 1
            tag = f"AF-{str(count).padStart(4, '0')}"
            
            asset = request.env['assetflow.asset'].sudo().create({
                'name': name,
                'category_id': int(category_id),
                'serial_number': serial,
                'purchase_cost': float(cost),
                'condition': condition,
                'asset_tag': tag,
                'status': 'available'
            })
            return self._json_response({'status': 'success', 'data': {'id': asset.id, 'tag': asset.asset_tag}})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/assets/locations', auth='public', type='http', methods=['GET', 'OPTIONS'], cors='*')
    def get_locations(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            locations = request.env['assetflow.asset.location'].sudo().search([])
            data = []
            for loc in locations:
                data.append({
                    'id': loc.id,
                    'name': loc.name,
                    'address': loc.address or '',
                    'parentId': loc.parent_id.id if loc.parent_id else None
                })
            return self._json_response({'status': 'success', 'data': data})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)
""")

print("Successfully written REST API endpoints to assetflow_assets.")

import os

base_dir = r"d:\Odoo\assetflow\addons\assetflow_base"

def create_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# 1. Update __init__.py to import controllers
create_file("__init__.py", """
# -*- coding: utf-8 -*-
from . import models
from . import wizard
from . import controllers
""")

# 2. controllers/__init__.py
create_file("controllers/__init__.py", """
# -*- coding: utf-8 -*-
from . import api
""")

# 3. controllers/api.py
create_file("controllers/api.py", """
# -*- coding: utf-8 -*-
import json
from odoo import http
from odoo.http import request

class AssetFlowBaseAPI(http.Controller):

    def _json_response(self, data, status=200):
        headers = [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE'),
            ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
        ]
        return request.make_response(json.dumps(data), headers=headers, status=status)

    @http.route('/api/auth/login', auth='public', type='http', methods=['POST', 'OPTIONS'], cors='*')
    def api_login(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            body = request.httprequest.data
            params = json.loads(body) if body else {}
            email = params.get('email')
            password = params.get('password')
            
            if not email:
                return self._json_response({'status': 'error', 'message': 'Missing email'}, status=400)
                
            # Search for user in Odoo res.users
            user = request.env['res.users'].sudo().search([('login', '=', email)], limit=1)
            if not user:
                return self._json_response({'status': 'error', 'message': 'User not found'}, status=404)
            
            # Identify role matching React mockData ROLES: 'Admin', 'Asset Manager', 'Department Head', 'Employee'
            role = 'Employee'
            if user.has_group('assetflow_base.group_assetflow_administrator'):
                role = 'Admin'
            elif user.has_group('assetflow_base.group_assetflow_asset_manager'):
                role = 'Asset Manager'
            elif user.has_group('assetflow_base.group_assetflow_department_head'):
                role = 'Department Head'
                
            return self._json_response({
                'status': 'success',
                'data': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.login,
                    'role': role,
                    'avatar': ''.join([w[0].upper() for w in user.name.split() if w][:2])
                }
            })
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/base/departments', auth='public', type='http', methods=['GET', 'OPTIONS'], cors='*')
    def get_departments(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            departments = request.env['assetflow.department'].sudo().search([])
            data = []
            for dept in departments:
                data.append({
                    'id': dept.id,
                    'name': dept.name,
                    'code': dept.code,
                    'headId': dept.head_id.id if dept.head_id else None,
                    'parentId': dept.parent_id.id if dept.parent_id else None,
                    'status': 'Active' if dept.active else 'Inactive'
                })
            return self._json_response({'status': 'success', 'data': data})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/base/departments/save', auth='public', type='http', methods=['POST', 'OPTIONS'], cors='*')
    def save_department(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            body = request.httprequest.data
            params = json.loads(body) if body else {}
            dept_id = params.get('id')
            name = params.get('name')
            head_id = params.get('headId')
            parent_id = params.get('parentId')
            status = params.get('status')
            
            if not name:
                return self._json_response({'status': 'error', 'message': 'Missing department name'}, status=400)
                
            vals = {
                'name': name,
                'active': status == 'Active',
                'head_id': int(head_id) if head_id else False,
                'parent_id': int(parent_id) if parent_id else False,
            }
            
            env = request.env['assetflow.department'].sudo()
            if dept_id:
                dept = env.browse(int(dept_id))
                if dept.exists():
                    dept.write(vals)
                    return self._json_response({'status': 'success', 'message': 'Department updated'})
                else:
                    return self._json_response({'status': 'error', 'message': 'Department not found'}, status=404)
            else:
                new_dept = env.create(vals)
                return self._json_response({'status': 'success', 'data': {'id': new_dept.id, 'code': new_dept.code}})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/base/categories', auth='public', type='http', methods=['GET', 'OPTIONS'], cors='*')
    def get_categories(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            categories = request.env['assetflow.asset.category'].sudo().search([])
            data = []
            for cat in categories:
                data.append({
                    'id': cat.id,
                    'name': cat.name,
                    'warranty_period': cat.warranty_period,
                    'description': cat.description or '',
                    'status': 'Active' if cat.active else 'Inactive'
                })
            return self._json_response({'status': 'success', 'data': data})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/base/categories/save', auth='public', type='http', methods=['POST', 'OPTIONS'], cors='*')
    def save_category(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            body = request.httprequest.data
            params = json.loads(body) if body else {}
            cat_id = params.get('id')
            name = params.get('name')
            warranty = params.get('warranty_period') or 12
            description = params.get('description')
            status = params.get('status')
            
            if not name:
                return self._json_response({'status': 'error', 'message': 'Missing category name'}, status=400)
                
            vals = {
                'name': name,
                'warranty_period': int(warranty),
                'description': description,
                'active': status == 'Active' if status else True
            }
            
            env = request.env['assetflow.asset.category'].sudo()
            if cat_id:
                cat = env.browse(int(cat_id))
                if cat.exists():
                    cat.write(vals)
                    return self._json_response({'status': 'success', 'message': 'Category updated'})
                else:
                    return self._json_response({'status': 'error', 'message': 'Category not found'}, status=404)
            else:
                new_cat = env.create(vals)
                return self._json_response({'status': 'success', 'data': {'id': new_cat.id}})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/base/employees', auth='public', type='http', methods=['GET', 'OPTIONS'], cors='*')
    def get_employees(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            employees = request.env['assetflow.employee'].sudo().search([])
            data = []
            for emp in employees:
                # Map role to React compatible Role Name
                role = 'Employee'
                if emp.role_id:
                    role = emp.role_id.name
                
                data.append({
                    'id': emp.id,
                    'employee_id': emp.employee_id,
                    'name': emp.name,
                    'email': emp.email,
                    'phone': emp.phone or '',
                    'departmentId': emp.department_id.id if emp.department_id else None,
                    'role': role,
                    'job_title': emp.job_title or '',
                    'status': 'Active' if emp.active else 'Inactive',
                    'avatar': ''.join([w[0].upper() for w in emp.name.split() if w][:2])
                })
            return self._json_response({'status': 'success', 'data': data})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/base/employees/promote', auth='public', type='http', methods=['POST', 'OPTIONS'], cors='*')
    def promote_employee(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            body = request.httprequest.data
            params = json.loads(body) if body else {}
            employee_id = params.get('employee_id')
            new_role_name = params.get('role')
            new_job_title = params.get('job_title')
            
            if not employee_id or not new_role_name:
                return self._json_response({'status': 'error', 'message': 'Missing employee_id or role'}, status=400)
                
            emp = request.env['assetflow.employee'].sudo().browse(int(employee_id))
            if not emp.exists():
                return self._json_response({'status': 'error', 'message': 'Employee not found'}, status=404)
                
            # Find the corresponding role record
            role = request.env['assetflow.role'].sudo().search([('name', '=', new_role_name)], limit=1)
            if not role:
                return self._json_response({'status': 'error', 'message': 'Role not found'}, status=404)
                
            vals = {'role_id': role.id}
            if new_job_title:
                vals['job_title'] = new_job_title
                
            emp.write(vals)
            return self._json_response({'status': 'success', 'message': 'Employee promoted successfully'})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)
""")

print("Successfully written REST API endpoints to assetflow_base.")

import os

ops_dir = r"d:\Odoo\assetflow\addons\assetflow_operations"
assets_dir = r"d:\Odoo\assetflow\addons\assetflow_assets"

def create_file(dir_path, path, content):
    full_path = os.path.join(dir_path, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# 1. asset.py in assetflow_assets
create_file(assets_dir, "models/asset.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields

class Asset(models.Model):
    _name = 'assetflow.asset'
    _description = 'Asset'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Asset Name', required=True)
    code = fields.Char(string='Asset Code', default='New')
    active = fields.Boolean(string='Active', default=True)
    status = fields.Selection([
        ('available', 'Available'),
        ('allocated', 'Allocated'),
        ('reserved', 'Reserved'),
        ('maintenance', 'Under Maintenance'),
        ('lost', 'Lost'),
        ('retired', 'Retired'),
        ('disposed', 'Disposed')
    ], string='Status', default='available', tracking=True)
""")

# 2. asset_allocation.py in assetflow_operations
create_file(ops_dir, "models/asset_allocation.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError

class AssetAllocation(models.Model):
    _name = 'assetflow.asset.allocation'
    _description = 'Asset Allocation'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    code = fields.Char(string='Allocation Reference', required=True, copy=False, readonly=True, default='New')
    asset_id = fields.Many2one('assetflow.asset', string='Asset', required=True, tracking=True)
    employee_id = fields.Many2one('assetflow.employee', string='Employee', required=True, tracking=True)
    allocate_date = fields.Date(string='Allocation Date', required=True, default=fields.Date.context_today, tracking=True)
    expected_return_date = fields.Date(string='Expected Return Date', tracking=True)
    actual_return_date = fields.Date(string='Actual Return Date', tracking=True)
    return_notes = fields.Text(string='Condition Check-in Notes', tracking=True)
    status = fields.Selection([
        ('draft', 'Draft'),
        ('allocated', 'Allocated'),
        ('returned', 'Returned')
    ], string='Status', default='draft', required=True, tracking=True)

    @api.constrains('asset_id', 'status')
    def _check_double_allocation(self):
        for record in self:
            if record.status == 'allocated':
                overlapping = self.search([
                    ('id', '!=', record.id),
                    ('asset_id', '=', record.asset_id.id),
                    ('status', '=', 'allocated')
                ])
                if overlapping:
                    current_holder = overlapping[0].employee_id.name or "another employee"
                    raise ValidationError(f"This asset is currently held by {current_holder}. Please request a transfer instead.")

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('code', 'New') == 'New':
                vals['code'] = self.env['ir.sequence'].next_by_code('assetflow.asset.allocation') or 'New'
        records = super().create(vals_list)
        for record in records:
            if record.status == 'allocated':
                record.asset_id.write({'status': 'allocated'})
        return records

    def write(self, vals):
        res = super().write(vals)
        for record in self:
            if record.status == 'allocated':
                record.asset_id.write({'status': 'allocated'})
            elif record.status == 'returned':
                record.asset_id.write({'status': 'available'})
        return res
""")

# 3. resource_booking.py in assetflow_operations
create_file(ops_dir, "models/resource_booking.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError

class ResourceBooking(models.Model):
    _name = 'assetflow.resource.booking'
    _description = 'Resource Booking'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    asset_id = fields.Many2one('assetflow.asset', string='Resource/Asset', required=True, tracking=True)
    user_id = fields.Many2one('res.users', string='Booked By', required=True, default=lambda self: self.env.user, tracking=True)
    start_datetime = fields.Datetime(string='Start Time', required=True, tracking=True)
    end_datetime = fields.Datetime(string='End Time', required=True, tracking=True)
    status = fields.Selection([
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ], string='Status', default='upcoming', required=True, tracking=True)

    @api.constrains('asset_id', 'start_datetime', 'end_datetime', 'status')
    def _check_booking_overlap(self):
        for record in self:
            if record.status in ['upcoming', 'ongoing']:
                overlapping = self.search([
                    ('id', '!=', record.id),
                    ('asset_id', '=', record.asset_id.id),
                    ('status', 'in', ['upcoming', 'ongoing']),
                    ('start_datetime', '<', record.end_datetime),
                    ('end_datetime', '>', record.start_datetime)
                ])
                if overlapping:
                    raise ValidationError("This resource is already booked during the requested time slot.")
""")

# 4. maintenance_request.py in assetflow_operations
create_file(ops_dir, "models/maintenance_request.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields, api

class MaintenanceRequest(models.Model):
    _name = 'assetflow.maintenance.request'
    _description = 'Maintenance Request'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    code = fields.Char(string='Maintenance Reference', required=True, copy=False, readonly=True, default='New')
    asset_id = fields.Many2one('assetflow.asset', string='Asset', required=True, tracking=True)
    description = fields.Text(string='Issue Description', required=True)
    priority = fields.Selection([
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High')
    ], string='Priority', default='medium', required=True, tracking=True)
    status = fields.Selection([
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('assigned', 'Technician Assigned'),
        ('in_progress', 'Under Repair'),
        ('resolved', 'Resolved')
    ], string='Status', default='pending', required=True, tracking=True)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('code', 'New') == 'New':
                vals['code'] = self.env['ir.sequence'].next_by_code('assetflow.maintenance.request') or 'New'
        return super().create(vals_list)

    def write(self, vals):
        res = super().write(vals)
        for record in self:
            if record.status == 'approved':
                record.asset_id.write({'status': 'maintenance'})
            elif record.status == 'resolved':
                record.asset_id.write({'status': 'available'})
        return res
""")

# 5. asset_transfer.py in assetflow_operations
create_file(ops_dir, "models/asset_transfer.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields, api

class AssetTransfer(models.Model):
    _name = 'assetflow.asset.transfer'
    _description = 'Asset Transfer'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    asset_id = fields.Many2one('assetflow.asset', string='Asset', required=True, tracking=True)
    from_dept_id = fields.Many2one('assetflow.department', string='From Department', tracking=True)
    to_dept_id = fields.Many2one('assetflow.department', string='To Department', required=True, tracking=True)
    transfer_date = fields.Date(string='Transfer Date', required=True, default=fields.Date.context_today)
    status = fields.Selection([
        ('draft', 'Draft'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ], string='Status', default='draft', required=True, tracking=True)

    def write(self, vals):
        res = super().write(vals)
        for record in self:
            if record.status == 'approved':
                # 1. Close current active allocation
                active_allocations = self.env['assetflow.asset.allocation'].search([
                    ('asset_id', '=', record.asset_id.id),
                    ('status', '=', 'allocated')
                ])
                for alloc in active_allocations:
                    alloc.write({
                        'status': 'returned',
                        'actual_return_date': fields.Date.context_today(self),
                        'return_notes': f"Transferred to department."
                    })
                # 2. Update asset status
                record.asset_id.write({'status': 'available'})
        return res
""")

# 6. api.py in assetflow_operations
create_file(ops_dir, "controllers/api.py", """
# -*- coding: utf-8 -*-
import json
from odoo import http, fields
from odoo.http import request

class AssetFlowOperationsAPI(http.Controller):

    def _json_response(self, data, status=200):
        headers = [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE'),
            ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
        ]
        return request.make_response(json.dumps(data), headers=headers, status=status)

    @http.route('/api/operations/allocations', auth='public', type='http', methods=['GET', 'OPTIONS'], cors='*')
    def get_allocations(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            allocations = request.env['assetflow.asset.allocation'].sudo().search([])
            data = []
            for alloc in allocations:
                data.append({
                    'id': alloc.id,
                    'code': alloc.code,
                    'asset': alloc.asset_id.name,
                    'employee': alloc.employee_id.name,
                    'allocate_date': str(alloc.allocate_date),
                    'expected_return_date': str(alloc.expected_return_date) if alloc.expected_return_date else False,
                    'actual_return_date': str(alloc.actual_return_date) if alloc.actual_return_date else False,
                    'return_notes': alloc.return_notes,
                    'status': alloc.status
                })
            return self._json_response({'status': 'success', 'data': data})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/operations/allocations/create', auth='public', type='http', methods=['POST', 'OPTIONS'], cors='*')
    def create_allocation(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            body = request.httprequest.data
            params = json.loads(body) if body else {}
            asset_id = params.get('asset_id')
            employee_id = params.get('employee_id')
            allocate_date = params.get('allocate_date') or fields.Date.context_today(request.env.user)
            expected_return_date = params.get('expected_return_date')
            
            if not asset_id or not employee_id:
                return self._json_response({'status': 'error', 'message': 'Missing asset_id or employee_id'}, status=400)
                
            # Perform a pre-check to send a structured conflict error for the frontend
            overlapping = request.env['assetflow.asset.allocation'].sudo().search([
                ('asset_id', '=', int(asset_id)),
                ('status', '=', 'allocated')
            ], limit=1)
            
            if overlapping:
                held_by = overlapping.employee_id.name
                return self._json_response({
                    'status': 'conflict',
                    'held_by': held_by,
                    'message': f"This asset is currently held by {held_by}."
                }, status=409)
                
            alloc = request.env['assetflow.asset.allocation'].sudo().create({
                'asset_id': int(asset_id),
                'employee_id': int(employee_id),
                'allocate_date': allocate_date,
                'expected_return_date': expected_return_date,
                'status': 'allocated'
            })
            return self._json_response({'status': 'success', 'data': {'id': alloc.id, 'code': alloc.code}})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/operations/allocations/return', auth='public', type='http', methods=['POST', 'OPTIONS'], cors='*')
    def return_allocation(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            body = request.httprequest.data
            params = json.loads(body) if body else {}
            allocation_id = params.get('allocation_id')
            return_notes = params.get('return_notes') or ''
            
            if not allocation_id:
                return self._json_response({'status': 'error', 'message': 'Missing allocation_id'}, status=400)
                
            alloc = request.env['assetflow.asset.allocation'].sudo().browse(int(allocation_id))
            if alloc.exists() and alloc.status == 'allocated':
                alloc.write({
                    'status': 'returned',
                    'actual_return_date': fields.Date.context_today(request.env.user),
                    'return_notes': return_notes
                })
                return self._json_response({'status': 'success', 'message': 'Asset marked as returned successfully'})
            else:
                return self._json_response({'status': 'error', 'message': 'Allocation record not found or not currently allocated'}, status=404)
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/operations/bookings', auth='public', type='http', methods=['GET', 'OPTIONS'], cors='*')
    def get_bookings(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            bookings = request.env['assetflow.resource.booking'].sudo().search([])
            data = []
            for b in bookings:
                data.append({
                    'id': b.id,
                    'asset': b.asset_id.name,
                    'booked_by': b.user_id.name,
                    'start_datetime': b.start_datetime.strftime('%Y-%m-%d %H:%M:%S') if b.start_datetime else False,
                    'end_datetime': b.end_datetime.strftime('%Y-%m-%d %H:%M:%S') if b.end_datetime else False,
                    'status': b.status
                })
            return self._json_response({'status': 'success', 'data': data})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/operations/bookings/create', auth='public', type='http', methods=['POST', 'OPTIONS'], cors='*')
    def create_booking(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            body = request.httprequest.data
            params = json.loads(body) if body else {}
            asset_id = params.get('asset_id')
            start_time = params.get('start_datetime')
            end_time = params.get('end_datetime')
            
            if not asset_id or not start_time or not end_time:
                return self._json_response({'status': 'error', 'message': 'Missing asset_id, start_datetime or end_datetime'}, status=400)
                
            # Check overlap to return a clean status code for React frontend
            overlapping = request.env['assetflow.resource.booking'].sudo().search([
                ('asset_id', '=', int(asset_id)),
                ('status', 'in', ['upcoming', 'ongoing']),
                ('start_datetime', '<', end_time),
                ('end_datetime', '>', start_time)
            ], limit=1)
            
            if overlapping:
                return self._json_response({
                    'status': 'conflict',
                    'message': "This resource is already booked during the requested time slot."
                }, status=409)
                
            booking = request.env['assetflow.resource.booking'].sudo().create({
                'asset_id': int(asset_id),
                'start_datetime': start_time,
                'end_datetime': end_time,
                'status': 'upcoming'
            })
            return self._json_response({'status': 'success', 'data': {'id': booking.id, 'status': booking.status}})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/operations/maintenance', auth='public', type='http', methods=['GET', 'OPTIONS'], cors='*')
    def get_maintenance(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            requests = request.env['assetflow.maintenance.request'].sudo().search([])
            data = []
            for r in requests:
                data.append({
                    'id': r.id,
                    'code': r.code,
                    'asset': r.asset_id.name,
                    'description': r.description,
                    'priority': r.priority,
                    'status': r.status
                })
            return self._json_response({'status': 'success', 'data': data})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/operations/maintenance/create', auth='public', type='http', methods=['POST', 'OPTIONS'], cors='*')
    def create_maintenance(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
        try:
            body = request.httprequest.data
            params = json.loads(body) if body else {}
            asset_id = params.get('asset_id')
            description = params.get('description')
            priority = params.get('priority') or 'medium'
            
            if not asset_id or not description:
                return self._json_response({'status': 'error', 'message': 'Missing asset_id or description'}, status=400)
                
            maint = request.env['assetflow.maintenance.request'].sudo().create({
                'asset_id': int(asset_id),
                'description': description,
                'priority': priority,
                'status': 'pending'
            })
            return self._json_response({'status': 'success', 'data': {'id': maint.id, 'code': maint.code}})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)
""")

print("Compliance files updated successfully.")

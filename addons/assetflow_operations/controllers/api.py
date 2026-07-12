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

# -*- coding: utf-8 -*-
import json
from odoo import http
from odoo.http import request

class AssetFlowDashboardAPI(http.Controller):

    def _json_response(self, data, status=200):
        headers = [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE'),
            ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
        ]
        return request.make_response(json.dumps(data), headers=headers, status=status)

    @http.route('/api/dashboard/kpis', auth='public', type='http', methods=['GET', 'OPTIONS'], cors='*')
    def get_dashboard_kpis(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})
            
        env = request.env
        try:
            total_audits = env['assetflow.audit.cycle'].sudo().search_count([('state', '!=', 'completed')])
            total_notifications = env['assetflow.notification'].sudo().search_count([('is_read', '=', False)])
            recent_activities = env['assetflow.activity.log'].sudo().search_count([])
            
            total_assets = 0
            if 'assetflow.asset' in env:
                total_assets = env['assetflow.asset'].sudo().search_count([('active', '=', True)])
                
            return self._json_response({
                'status': 'success',
                'data': {
                    'active_audits': total_audits,
                    'unread_notifications': total_notifications,
                    'total_activities': recent_activities,
                    'total_active_assets': total_assets,
                }
            })
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/dashboard/notifications', auth='public', type='http', methods=['GET', 'OPTIONS'], cors='*')
    def get_notifications(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})

        env = request.env
        try:
            domain = []
            if kwargs.get('unread_only') == 'true':
                domain.append(('is_read', '=', False))
                
            notifications = env['assetflow.notification'].sudo().search(domain, limit=100)
            data = []
            for n in notifications:
                data.append({
                    'id': n.id,
                    'title': n.title,
                    'message': n.message,
                    'type': n.type,
                    'is_read': n.is_read,
                    'create_date': n.create_date.strftime('%Y-%m-%d %H:%M:%S') if n.create_date else False
                })
            return self._json_response({'status': 'success', 'data': data})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/dashboard/notifications/mark_read', auth='public', type='http', methods=['POST', 'OPTIONS'], cors='*')
    def mark_notification_read(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})

        try:
            body = request.httprequest.data
            params = json.loads(body) if body else {}
            notification_id = params.get('notification_id')
            
            if not notification_id:
                return self._json_response({'status': 'error', 'message': 'Missing notification_id'}, status=400)
                
            notification = request.env['assetflow.notification'].sudo().browse(int(notification_id))
            if notification.exists():
                notification.write({'is_read': True})
                return self._json_response({'status': 'success', 'message': 'Notification marked as read'})
            else:
                return self._json_response({'status': 'error', 'message': 'Notification not found'}, status=404)
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/dashboard/audits', auth='public', type='http', methods=['GET', 'OPTIONS'], cors='*')
    def get_audits(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})

        env = request.env
        try:
            audits = env['assetflow.audit.cycle'].sudo().search([])
            data = []
            for audit in audits:
                data.append({
                    'id': audit.id,
                    'name': audit.name,
                    'start_date': str(audit.start_date) if audit.start_date else False,
                    'end_date': str(audit.end_date) if audit.end_date else False,
                    'state': audit.state,
                    'auditor': audit.auditor_id.name if audit.auditor_id else False
                })
            return self._json_response({'status': 'success', 'data': data})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/dashboard/audits/<int:cycle_id>', auth='public', type='http', methods=['GET', 'OPTIONS'], cors='*')
    def get_audit_details(self, cycle_id, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})

        env = request.env
        try:
            audit = env['assetflow.audit.cycle'].sudo().browse(cycle_id)
            if not audit.exists():
                return self._json_response({'status': 'error', 'message': 'Audit cycle not found'}, status=404)
                
            items = []
            for item in audit.item_ids:
                items.append({
                    'id': item.id,
                    'asset_ref': item.asset_id,
                    'status': item.status,
                    'notes': item.notes
                })
                
            data = {
                'id': audit.id,
                'name': audit.name,
                'start_date': str(audit.start_date) if audit.start_date else False,
                'end_date': str(audit.end_date) if audit.end_date else False,
                'state': audit.state,
                'auditor': audit.auditor_id.name if audit.auditor_id else False,
                'items': items
            }
            return self._json_response({'status': 'success', 'data': data})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/dashboard/audits/item/update', auth='public', type='http', methods=['POST', 'OPTIONS'], cors='*')
    def update_audit_item(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})

        try:
            body = request.httprequest.data
            params = json.loads(body) if body else {}
            item_id = params.get('item_id')
            status = params.get('status')
            notes = params.get('notes')
            
            if not item_id or not status:
                return self._json_response({'status': 'error', 'message': 'Missing item_id or status'}, status=400)
                
            item = request.env['assetflow.audit.item'].sudo().browse(int(item_id))
            if item.exists():
                vals = {'status': status}
                if notes is not None:
                    vals['notes'] = notes
                item.write(vals)
                return self._json_response({'status': 'success', 'message': 'Audit item updated successfully'})
            else:
                return self._json_response({'status': 'error', 'message': 'Audit item not found'}, status=404)
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

    @http.route('/api/dashboard/activities', auth='public', type='http', methods=['GET', 'OPTIONS'], cors='*')
    def get_activities(self, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            return self._json_response({})

        env = request.env
        try:
            logs = env['assetflow.activity.log'].sudo().search([], limit=20)
            data = []
            for log in logs:
                data.append({
                    'id': log.id,
                    'action': log.action,
                    'model_name': log.model_name,
                    'record_id': log.record_id,
                    'user': log.user_id.name if log.user_id else 'System',
                    'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M:%S') if log.timestamp else False
                })
            return self._json_response({'status': 'success', 'data': data})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)

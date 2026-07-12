# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request

class AssetFlowDashboardAPI(http.Controller):
    
    @http.route('/api/dashboard/kpis', auth='public', type='json', methods=['POST', 'GET'], cors='*')
    def get_dashboard_kpis(self, **kwargs):
        # Allow cross-origin requests from the React frontend easily
        # Calculate summary statistics
        env = request.env
        
        # Note: In a real system, you'd calculate these from real tables.
        # Since we are building modules progressively, we use safe env searches.
        # We handle cases where modules might not be fully populated yet.
        
        try:
            total_audits = env['assetflow.audit.cycle'].sudo().search_count([('state', '!=', 'completed')])
            total_notifications = env['assetflow.notification'].sudo().search_count([('is_read', '=', False)])
            recent_activities = env['assetflow.activity.log'].sudo().search_count([])
            
            # If assetflow_assets is installed, we could query assets
            total_assets = 0
            if 'assetflow.asset' in env:
                total_assets = env['assetflow.asset'].sudo().search_count([('active', '=', True)])
                
            return {
                'status': 'success',
                'data': {
                    'active_audits': total_audits,
                    'unread_notifications': total_notifications,
                    'total_activities': recent_activities,
                    'total_active_assets': total_assets,
                }
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            }

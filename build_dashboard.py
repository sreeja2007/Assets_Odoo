import os
import shutil

dash_dir = r"d:\Odoo\assetflow\addons\assetflow_dashboard"

def create_file(path, content):
    full_path = os.path.join(dash_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# Remove obsolete dashboard model and view
dashboard_py = os.path.join(dash_dir, "models", "dashboard.py")
dashboard_xml = os.path.join(dash_dir, "views", "dashboard_views.xml")
if os.path.exists(dashboard_py):
    os.remove(dashboard_py)
if os.path.exists(dashboard_xml):
    os.remove(dashboard_xml)

# 1. __init__.py
create_file("__init__.py", """
# -*- coding: utf-8 -*-
from . import models
from . import controllers
from . import wizard
""")

# 2. __manifest__.py
create_file("__manifest__.py", """
# -*- coding: utf-8 -*-
{
    'name': 'AssetFlow Dashboard',
    'version': '18.0.1.0.0',
    'category': 'Asset Management',
    'summary': 'Dashboard APIs, notifications, activity logs and audit management',
    'description': "Headless Dashboard APIs and Audit Cycle Management",
    'author': 'AssetFlow Team',
    'depends': ['assetflow_operations', 'mail'],
    'data': [
        'security/ir.model.access.csv',
        'data/notification_data.xml',
        'data/audit_cycle_data.xml',
        'views/notification_views.xml',
        'views/activity_log_views.xml',
        'views/audit_cycle_views.xml',
        'views/audit_item_views.xml',
        'views/menu_views.xml',
    ],
    'demo': ['demo/demo_data.xml'],
    'installable': True,
    'application': False,
    'auto_install': False,
}
""")

# 3. controllers/__init__.py
create_file("controllers/__init__.py", """
# -*- coding: utf-8 -*-
from . import api
""")

# 4. controllers/api.py
create_file("controllers/api.py", """
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
""")

# 5. models/__init__.py
create_file("models/__init__.py", """
# -*- coding: utf-8 -*-
from . import notification
from . import activity_log
from . import audit_cycle
from . import audit_item
""")

# 6. models/notification.py
create_file("models/notification.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields, api

class AssetFlowNotification(models.Model):
    _name = 'assetflow.notification'
    _description = 'AssetFlow Notification'
    _order = 'create_date desc'

    title = fields.Char(string='Title', required=True)
    message = fields.Text(string='Message')
    type = fields.Selection([
        ('info', 'Information'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('success', 'Success')
    ], string='Type', default='info', required=True)
    user_id = fields.Many2one('res.users', string='Recipient', index=True)
    is_read = fields.Boolean(string='Read', default=False)
""")

# 7. models/activity_log.py
create_file("models/activity_log.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields

class ActivityLog(models.Model):
    _name = 'assetflow.activity.log'
    _description = 'Activity Log'
    _order = 'create_date desc'

    action = fields.Char(string='Action', required=True)
    model_name = fields.Char(string='Model Name')
    record_id = fields.Integer(string='Record ID')
    user_id = fields.Many2one('res.users', string='User')
    timestamp = fields.Datetime(string='Timestamp', default=fields.Datetime.now)
""")

# 8. models/audit_cycle.py
create_file("models/audit_cycle.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields

class AuditCycle(models.Model):
    _name = 'assetflow.audit.cycle'
    _description = 'Audit Cycle'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Audit Name', required=True, tracking=True)
    start_date = fields.Date(string='Start Date', required=True, default=fields.Date.context_today)
    end_date = fields.Date(string='End Date', tracking=True)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed')
    ], string='Status', default='draft', tracking=True)
    auditor_id = fields.Many2one('assetflow.employee', string='Lead Auditor')
    item_ids = fields.One2many('assetflow.audit.item', 'cycle_id', string='Audit Items')
""")

# 9. models/audit_item.py
create_file("models/audit_item.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields

class AuditItem(models.Model):
    _name = 'assetflow.audit.item'
    _description = 'Audit Item'

    cycle_id = fields.Many2one('assetflow.audit.cycle', string='Audit Cycle', required=True, ondelete='cascade')
    # Using a Char for asset_id temporarily until assetflow_assets is fully built
    asset_id = fields.Char(string='Asset Reference', required=True)
    status = fields.Selection([
        ('pending', 'Pending Review'),
        ('found', 'Found/Verified'),
        ('missing', 'Missing'),
        ('damaged', 'Damaged')
    ], string='Status', default='pending')
    notes = fields.Text(string='Notes')
""")

# 10. security/ir.model.access.csv
create_file("security/ir.model.access.csv", """
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_notification_employee,notification.employee,model_assetflow_notification,assetflow_base.group_assetflow_employee,1,1,0,0
access_notification_admin,notification.admin,model_assetflow_notification,assetflow_base.group_assetflow_administrator,1,1,1,1
access_activity_log_admin,activity_log.admin,model_assetflow_activity_log,assetflow_base.group_assetflow_administrator,1,0,0,0
access_audit_cycle_manager,audit_cycle.manager,model_assetflow_audit_cycle,assetflow_base.group_assetflow_asset_manager,1,1,1,0
access_audit_cycle_admin,audit_cycle.admin,model_assetflow_audit_cycle,assetflow_base.group_assetflow_administrator,1,1,1,1
access_audit_item_manager,audit_item.manager,model_assetflow_audit_item,assetflow_base.group_assetflow_asset_manager,1,1,1,1
access_audit_item_admin,audit_item.admin,model_assetflow_audit_item,assetflow_base.group_assetflow_administrator,1,1,1,1
""")

# 11. views/menu_views.xml
create_file("views/menu_views.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <menuitem id="menu_assetflow_audit_root" name="Audits" parent="assetflow_base.menu_assetflow_root" sequence="40"/>
    
    <record id="action_audit_cycle" model="ir.actions.act_window">
        <field name="name">Audit Cycles</field>
        <field name="res_model">assetflow.audit.cycle</field>
        <field name="view_mode">tree,form</field>
    </record>
    <menuitem id="menu_audit_cycle" name="Audit Cycles" parent="menu_assetflow_audit_root" action="action_audit_cycle" sequence="10"/>

    <record id="action_activity_log" model="ir.actions.act_window">
        <field name="name">System Activity Logs</field>
        <field name="res_model">assetflow.activity.log</field>
        <field name="view_mode">tree,form</field>
    </record>
    <menuitem id="menu_activity_log" name="Activity Logs" parent="assetflow_base.menu_assetflow_root" action="action_activity_log" sequence="90" groups="assetflow_base.group_assetflow_administrator"/>
</odoo>
""")

# 12. views/audit_cycle_views.xml
create_file("views/audit_cycle_views.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_audit_cycle_tree" model="ir.ui.view">
        <field name="name">assetflow.audit.cycle.tree</field>
        <field name="model">assetflow.audit.cycle</field>
        <field name="arch" type="xml">
            <tree string="Audit Cycles">
                <field name="name"/>
                <field name="start_date"/>
                <field name="end_date"/>
                <field name="auditor_id"/>
                <field name="state" widget="badge"/>
            </tree>
        </field>
    </record>

    <record id="view_audit_cycle_form" model="ir.ui.view">
        <field name="name">assetflow.audit.cycle.form</field>
        <field name="model">assetflow.audit.cycle</field>
        <field name="arch" type="xml">
            <form string="Audit Cycle">
                <header>
                    <field name="state" widget="statusbar" statusbar_visible="draft,ongoing,completed"/>
                </header>
                <sheet>
                    <div class="oe_title">
                        <h1><field name="name" placeholder="Audit Name"/></h1>
                    </div>
                    <group>
                        <group>
                            <field name="start_date"/>
                            <field name="end_date"/>
                        </group>
                        <group>
                            <field name="auditor_id"/>
                        </group>
                    </group>
                    <notebook>
                        <page string="Audit Items">
                            <field name="item_ids">
                                <tree editable="bottom">
                                    <field name="asset_id"/>
                                    <field name="status"/>
                                    <field name="notes"/>
                                </tree>
                            </field>
                        </page>
                    </notebook>
                </sheet>
                <div class="oe_chatter">
                    <field name="message_follower_ids"/>
                    <field name="activity_ids"/>
                    <field name="message_ids"/>
                </div>
            </form>
        </field>
    </record>
</odoo>
""")

# 13. views/activity_log_views.xml
create_file("views/activity_log_views.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_activity_log_tree" model="ir.ui.view">
        <field name="name">assetflow.activity.log.tree</field>
        <field name="model">assetflow.activity.log</field>
        <field name="arch" type="xml">
            <tree string="Activity Logs" create="false" edit="false" delete="false">
                <field name="timestamp"/>
                <field name="action"/>
                <field name="model_name"/>
                <field name="record_id"/>
                <field name="user_id"/>
            </tree>
        </field>
    </record>
</odoo>
""")

# Ensure remaining views are blank valid xml to satisfy manifest
create_file("views/notification_views.xml", """<?xml version="1.0" encoding="utf-8"?><odoo></odoo>""")
create_file("views/audit_item_views.xml", """<?xml version="1.0" encoding="utf-8"?><odoo></odoo>""")

print("Successfully generated files for assetflow_dashboard.")

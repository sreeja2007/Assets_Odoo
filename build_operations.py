import os

ops_dir = r"d:\Odoo\assetflow\addons\assetflow_operations"
assets_dir = r"d:\Odoo\assetflow\addons\assetflow_assets"

def create_file(dir_path, path, content):
    full_path = os.path.join(dir_path, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# 1. Update basic asset.py in assetflow_assets so relation compiles
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
""")

# 2. assetflow_operations/__init__.py
create_file(ops_dir, "__init__.py", """
# -*- coding: utf-8 -*-
from . import models
from . import controllers
from . import wizard
""")

# 3. assetflow_operations/__manifest__.py
create_file(ops_dir, "__manifest__.py", """
# -*- coding: utf-8 -*-
{
    'name': 'AssetFlow Operations',
    'version': '18.0.1.0.0',
    'category': 'Asset Management',
    'summary': 'Asset allocation, booking, transfer and maintenance requests',
    'description': "Backend workflows and APIs for allocations, bookings and maintenance requests.",
    'author': 'AssetFlow Team',
    'depends': ['assetflow_assets', 'mail'],
    'data': [
        'security/ir.model.access.csv',
        'data/allocation_sequence_data.xml',
        'data/maintenance_sequence_data.xml',
        'views/asset_allocation_views.xml',
        'views/asset_transfer_views.xml',
        'views/resource_booking_views.xml',
        'views/maintenance_request_views.xml',
        'views/menu_views.xml',
    ],
    'demo': [],
    'installable': True,
    'application': False,
    'auto_install': False,
}
""")

# 4. assetflow_operations/models/__init__.py
create_file(ops_dir, "models/__init__.py", """
# -*- coding: utf-8 -*-
from . import asset_allocation
from . import asset_transfer
from . import resource_booking
from . import maintenance_request
""")

# 5. assetflow_operations/models/asset_allocation.py
create_file(ops_dir, "models/asset_allocation.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields, api

class AssetAllocation(models.Model):
    _name = 'assetflow.asset.allocation'
    _description = 'Asset Allocation'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    code = fields.Char(string='Allocation Reference', required=True, copy=False, readonly=True, default='New')
    asset_id = fields.Many2one('assetflow.asset', string='Asset', required=True, tracking=True)
    employee_id = fields.Many2one('assetflow.employee', string='Employee', required=True, tracking=True)
    allocate_date = fields.Date(string='Allocation Date', required=True, default=fields.Date.context_today, tracking=True)
    return_date = fields.Date(string='Return Date', tracking=True)
    status = fields.Selection([
        ('draft', 'Draft'),
        ('allocated', 'Allocated'),
        ('returned', 'Returned')
    ], string='Status', default='draft', required=True, tracking=True)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('code', 'New') == 'New':
                vals['code'] = self.env['ir.sequence'].next_by_code('assetflow.asset.allocation') or 'New'
        return super().create(vals_list)
""")

# 6. assetflow_operations/models/asset_transfer.py
create_file(ops_dir, "models/asset_transfer.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields

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
""")

# 7. assetflow_operations/models/resource_booking.py
create_file(ops_dir, "models/resource_booking.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields

class ResourceBooking(models.Model):
    _name = 'assetflow.resource.booking'
    _description = 'Resource Booking'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    asset_id = fields.Many2one('assetflow.asset', string='Resource/Asset', required=True, tracking=True)
    user_id = fields.Many2one('res.users', string='Booked By', required=True, default=lambda self: self.env.user, tracking=True)
    start_datetime = fields.Datetime(string='Start Time', required=True, tracking=True)
    end_datetime = fields.Datetime(string='End Time', required=True, tracking=True)
    status = fields.Selection([
        ('draft', 'Draft'),
        ('booked', 'Confirmed Booked'),
        ('cancelled', 'Cancelled')
    ], string='Status', default='draft', required=True, tracking=True)
""")

# 8. assetflow_operations/models/maintenance_request.py
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
        ('draft', 'Draft'),
        ('in_progress', 'Under Repair'),
        ('resolved', 'Resolved')
    ], string='Status', default='draft', required=True, tracking=True)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('code', 'New') == 'New':
                vals['code'] = self.env['ir.sequence'].next_by_code('assetflow.maintenance.request') or 'New'
        return super().create(vals_list)
""")

# 9. assetflow_operations/controllers/__init__.py
create_file(ops_dir, "controllers/__init__.py", """
# -*- coding: utf-8 -*-
from . import api
""")

# 10. assetflow_operations/controllers/api.py
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
                    'return_date': str(alloc.return_date) if alloc.return_date else False,
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
            
            if not asset_id or not employee_id:
                return self._json_response({'status': 'error', 'message': 'Missing asset_id or employee_id'}, status=400)
                
            alloc = request.env['assetflow.asset.allocation'].sudo().create({
                'asset_id': int(asset_id),
                'employee_id': int(employee_id),
                'allocate_date': allocate_date,
                'status': 'allocated'
            })
            return self._json_response({'status': 'success', 'data': {'id': alloc.id, 'code': alloc.code}})
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
                
            booking = request.env['assetflow.resource.booking'].sudo().create({
                'asset_id': int(asset_id),
                'start_datetime': start_time,
                'end_datetime': end_time,
                'status': 'booked'
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
                'status': 'draft'
            })
            return self._json_response({'status': 'success', 'data': {'id': maint.id, 'code': maint.code}})
        except Exception as e:
            return self._json_response({'status': 'error', 'message': str(e)}, status=500)
""")

# 11. assetflow_operations/security/ir.model.access.csv
create_file(ops_dir, "security/ir.model.access.csv", """
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_allocation_employee,allocation.employee,model_assetflow_asset_allocation,assetflow_base.group_assetflow_employee,1,1,1,0
access_allocation_admin,allocation.admin,model_assetflow_asset_allocation,assetflow_base.group_assetflow_administrator,1,1,1,1
access_transfer_manager,transfer.manager,model_assetflow_asset_transfer,assetflow_base.group_assetflow_asset_manager,1,1,1,0
access_transfer_admin,transfer.admin,model_assetflow_asset_transfer,assetflow_base.group_assetflow_administrator,1,1,1,1
access_booking_employee,booking.employee,model_assetflow_resource_booking,assetflow_base.group_assetflow_employee,1,1,1,0
access_booking_admin,booking.admin,model_assetflow_resource_booking,assetflow_base.group_assetflow_administrator,1,1,1,1
access_maintenance_employee,maintenance.employee,model_assetflow_maintenance_request,assetflow_base.group_assetflow_employee,1,1,1,0
access_maintenance_admin,maintenance.admin,model_assetflow_maintenance_request,assetflow_base.group_assetflow_administrator,1,1,1,1
""")

# 12. assetflow_operations/data/allocation_sequence_data.xml
create_file(ops_dir, "data/allocation_sequence_data.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data noupdate="1">
        <record id="seq_assetflow_allocation" model="ir.sequence">
            <field name="name">Asset Allocation Sequence</field>
            <field name="code">assetflow.asset.allocation</field>
            <field name="prefix">ALLOC/</field>
            <field name="padding">4</field>
            <field name="company_id" eval="False"/>
        </record>
    </data>
</odoo>
""")

# 13. assetflow_operations/data/maintenance_sequence_data.xml
create_file(ops_dir, "data/maintenance_sequence_data.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data noupdate="1">
        <record id="seq_assetflow_maintenance" model="ir.sequence">
            <field name="name">Maintenance Request Sequence</field>
            <field name="code">assetflow.maintenance.request</field>
            <field name="prefix">MAINT/</field>
            <field name="padding">4</field>
            <field name="company_id" eval="False"/>
        </record>
    </data>
</odoo>
""")

# 14. assetflow_operations/views/menu_views.xml
create_file(ops_dir, "views/menu_views.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <menuitem id="menu_assetflow_ops_root" name="Operations" parent="assetflow_base.menu_assetflow_root" sequence="20"/>
    
    <record id="action_asset_allocation" model="ir.actions.act_window">
        <field name="name">Asset Allocations</field>
        <field name="res_model">assetflow.asset.allocation</field>
        <field name="view_mode">tree,form</field>
    </record>
    <menuitem id="menu_asset_allocation" name="Allocations" parent="menu_assetflow_ops_root" action="action_asset_allocation" sequence="10"/>

    <record id="action_asset_transfer" model="ir.actions.act_window">
        <field name="name">Asset Transfers</field>
        <field name="res_model">assetflow.asset.transfer</field>
        <field name="view_mode">tree,form</field>
    </record>
    <menuitem id="menu_asset_transfer" name="Transfers" parent="menu_assetflow_ops_root" action="action_asset_transfer" sequence="20"/>

    <record id="action_resource_booking" model="ir.actions.act_window">
        <field name="name">Resource Bookings</field>
        <field name="res_model">assetflow.resource.booking</field>
        <field name="view_mode">tree,form</field>
    </record>
    <menuitem id="menu_resource_booking" name="Bookings" parent="menu_assetflow_ops_root" action="action_resource_booking" sequence="30"/>

    <record id="action_maintenance_request" model="ir.actions.act_window">
        <field name="name">Maintenance Requests</field>
        <field name="res_model">assetflow.maintenance.request</field>
        <field name="view_mode">tree,form</field>
    </record>
    <menuitem id="menu_maintenance_request" name="Maintenance" parent="menu_assetflow_ops_root" action="action_maintenance_request" sequence="40"/>
</odoo>
""")

# 15. assetflow_operations/views/asset_allocation_views.xml
create_file(ops_dir, "views/asset_allocation_views.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_asset_allocation_tree" model="ir.ui.view">
        <field name="name">assetflow.asset.allocation.tree</field>
        <field name="model">assetflow.asset.allocation</field>
        <field name="arch" type="xml">
            <tree string="Asset Allocations">
                <field name="code"/>
                <field name="asset_id"/>
                <field name="employee_id"/>
                <field name="allocate_date"/>
                <field name="return_date"/>
                <field name="status" widget="badge"/>
            </tree>
        </field>
    </record>

    <record id="view_asset_allocation_form" model="ir.ui.view">
        <field name="name">assetflow.asset.allocation.form</field>
        <field name="model">assetflow.asset.allocation</field>
        <field name="arch" type="xml">
            <form string="Asset Allocation">
                <header>
                    <field name="status" widget="statusbar" statusbar_visible="draft,allocated,returned"/>
                </header>
                <sheet>
                    <div class="oe_title">
                        <h1><field name="code" readonly="1"/></h1>
                    </div>
                    <group>
                        <group>
                            <field name="asset_id"/>
                            <field name="employee_id"/>
                        </group>
                        <group>
                            <field name="allocate_date"/>
                            <field name="return_date"/>
                        </group>
                    </group>
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

# 16. assetflow_operations/views/asset_transfer_views.xml
create_file(ops_dir, "views/asset_transfer_views.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_asset_transfer_tree" model="ir.ui.view">
        <field name="name">assetflow.asset.transfer.tree</field>
        <field name="model">assetflow.asset.transfer</field>
        <field name="arch" type="xml">
            <tree string="Asset Transfers">
                <field name="asset_id"/>
                <field name="from_dept_id"/>
                <field name="to_dept_id"/>
                <field name="transfer_date"/>
                <field name="status" widget="badge"/>
            </tree>
        </field>
    </record>

    <record id="view_asset_transfer_form" model="ir.ui.view">
        <field name="name">assetflow.asset.transfer.form</field>
        <field name="model">assetflow.asset.transfer</field>
        <field name="arch" type="xml">
            <form string="Asset Transfer">
                <header>
                    <field name="status" widget="statusbar" statusbar_visible="draft,approved,rejected"/>
                </header>
                <sheet>
                    <group>
                        <group>
                            <field name="asset_id"/>
                            <field name="transfer_date"/>
                        </group>
                        <group>
                            <field name="from_dept_id"/>
                            <field name="to_dept_id"/>
                        </group>
                    </group>
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

# 17. assetflow_operations/views/resource_booking_views.xml
create_file(ops_dir, "views/resource_booking_views.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_resource_booking_tree" model="ir.ui.view">
        <field name="name">assetflow.resource.booking.tree</field>
        <field name="model">assetflow.resource.booking</field>
        <field name="arch" type="xml">
            <tree string="Resource Bookings">
                <field name="asset_id"/>
                <field name="user_id"/>
                <field name="start_datetime"/>
                <field name="end_datetime"/>
                <field name="status" widget="badge"/>
            </tree>
        </field>
    </record>

    <record id="view_resource_booking_form" model="ir.ui.view">
        <field name="name">assetflow.resource.booking.form</field>
        <field name="model">assetflow.resource.booking</field>
        <field name="arch" type="xml">
            <form string="Resource Booking">
                <header>
                    <field name="status" widget="statusbar" statusbar_visible="draft,booked,cancelled"/>
                </header>
                <sheet>
                    <group>
                        <group>
                            <field name="asset_id"/>
                            <field name="user_id"/>
                        </group>
                        <group>
                            <field name="start_datetime"/>
                            <field name="end_datetime"/>
                        </group>
                    </group>
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

# 18. assetflow_operations/views/maintenance_request_views.xml
create_file(ops_dir, "views/maintenance_request_views.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_maintenance_request_tree" model="ir.ui.view">
        <field name="name">assetflow.maintenance.request.tree</field>
        <field name="model">assetflow.maintenance.request</field>
        <field name="arch" type="xml">
            <tree string="Maintenance Requests">
                <field name="code"/>
                <field name="asset_id"/>
                <field name="priority"/>
                <field name="status" widget="badge"/>
            </tree>
        </field>
    </record>

    <record id="view_maintenance_request_form" model="ir.ui.view">
        <field name="name">assetflow.maintenance.request.form</field>
        <field name="model">assetflow.maintenance.request</field>
        <field name="arch" type="xml">
            <form string="Maintenance Request">
                <header>
                    <field name="status" widget="statusbar" statusbar_visible="draft,in_progress,resolved"/>
                </header>
                <sheet>
                    <div class="oe_title">
                        <h1><field name="code" readonly="1"/></h1>
                    </div>
                    <group>
                        <group>
                            <field name="asset_id"/>
                            <field name="priority"/>
                        </group>
                        <group>
                            <field name="description"/>
                        </group>
                    </group>
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

# Standard init/view files in wizard just to satisfy import structures
create_file(ops_dir, "wizard/__init__.py", """# -*- coding: utf-8 -*-""")

print("Successfully generated all files for assetflow_operations.")

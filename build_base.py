import os

base_dir = r"d:\Odoo\assetflow\addons\assetflow_base"

def create_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# 1. __init__.py
create_file("__init__.py", """
# -*- coding: utf-8 -*-
from . import models
from . import wizard
""")

# 2. __manifest__.py
create_file("__manifest__.py", """
# -*- coding: utf-8 -*-
{
    'name': 'AssetFlow Base',
    'version': '18.0.1.0.0',
    'category': 'Asset Management',
    'summary': 'Core module for AssetFlow - Enterprise Asset & Resource Management',
    'description': "Core foundation for Department, Employee, Category and Security Management",
    'author': 'AssetFlow Team',
    'website': 'https://assetflow.example.com',
    'license': 'LGPL-3',
    'depends': ['base', 'mail'],
    'data': [
        'security/groups.xml',
        'security/security.xml',
        'security/ir.model.access.csv',
        'data/department_sequence.xml',
        'data/role_data.xml',
        'data/category_data.xml',
        'views/actions.xml',
        'views/menus.xml',
        'views/department_views.xml',
        'views/employee_views.xml',
        'views/asset_category_views.xml',
        'views/role_views.xml',
        'wizard/promote_employee_views.xml',
    ],
    'demo': ['demo/demo.xml'],
    'installable': True,
    'application': True,
    'auto_install': False,
}
""")

# 3. models/__init__.py
create_file("models/__init__.py", """
# -*- coding: utf-8 -*-
from . import department
from . import employee
from . import asset_category
from . import role
from . import user_extension
""")

# 4. models/department.py
create_file("models/department.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError

class Department(models.Model):
    _name = 'assetflow.department'
    _description = 'AssetFlow Department'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Department Name', required=True, tracking=True)
    code = fields.Char(string='Department Code', required=True, copy=False, tracking=True, default='New')
    parent_id = fields.Many2one('assetflow.department', string='Parent Department', index=True)
    head_id = fields.Many2one('assetflow.employee', string='Department Head', tracking=True)
    active = fields.Boolean(string='Active', default=True, tracking=True)
    employee_ids = fields.One2many('assetflow.employee', 'department_id', string='Employees')

    _sql_constraints = [
        ('name_unique', 'unique(name)', 'Department name must be unique!')
    ]

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('code', 'New') == 'New':
                vals['code'] = self.env['ir.sequence'].next_by_code('assetflow.department') or 'New'
        return super().create(vals_list)
""")

# 5. models/employee.py
create_file("models/employee.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError

class Employee(models.Model):
    _name = 'assetflow.employee'
    _description = 'AssetFlow Employee'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Name', required=True, tracking=True)
    employee_id = fields.Char(string='Employee ID', required=True, copy=False, readonly=True, default='New')
    email = fields.Char(string='Email', required=True, tracking=True)
    phone = fields.Char(string='Phone', tracking=True)
    department_id = fields.Many2one('assetflow.department', string='Department', tracking=True)
    role_id = fields.Many2one('assetflow.role', string='Role', tracking=True)
    job_title = fields.Char(string='Job Title', tracking=True)
    active = fields.Boolean(string='Active', default=True, tracking=True)
    user_id = fields.Many2one('res.users', string='Related User')

    _sql_constraints = [
        ('email_unique', 'unique(email)', 'Employee email must be unique!')
    ]

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('employee_id', 'New') == 'New':
                vals['employee_id'] = self.env['ir.sequence'].next_by_code('assetflow.employee') or 'New'
        return super().create(vals_list)
""")

# 6. models/asset_category.py
create_file("models/asset_category.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields, api

class AssetCategory(models.Model):
    _name = 'assetflow.asset.category'
    _description = 'Asset Category'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Category Name', required=True, tracking=True)
    description = fields.Text(string='Description')
    warranty_period = fields.Integer(string='Warranty Period (Months)', default=12, tracking=True)
    active = fields.Boolean(string='Active', default=True, tracking=True)

    _sql_constraints = [
        ('name_unique', 'unique(name)', 'Category name must be unique!')
    ]
""")

# 7. models/role.py
create_file("models/role.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields, api

class Role(models.Model):
    _name = 'assetflow.role'
    _description = 'AssetFlow Role'

    name = fields.Char(string='Role Name', required=True)
    description = fields.Text(string='Description')
    group_id = fields.Many2one('res.groups', string='Associated Security Group')
    
    _sql_constraints = [
        ('name_unique', 'unique(name)', 'Role name must be unique!')
    ]
""")

# 8. models/user_extension.py
create_file("models/user_extension.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields

class ResUsers(models.Model):
    _inherit = 'res.users'

    employee_id = fields.Many2one('assetflow.employee', string='AssetFlow Employee Profile')
""")

# 9. security/groups.xml
create_file("security/groups.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="module_category_assetflow" model="ir.module.category">
        <field name="name">AssetFlow</field>
        <field name="description">Enterprise Asset &amp; Resource Management System</field>
        <field name="sequence">10</field>
    </record>

    <record id="group_assetflow_employee" model="res.groups">
        <field name="name">Employee</field>
        <field name="category_id" ref="module_category_assetflow"/>
    </record>

    <record id="group_assetflow_department_head" model="res.groups">
        <field name="name">Department Head</field>
        <field name="category_id" ref="module_category_assetflow"/>
        <field name="implied_ids" eval="[(4, ref('group_assetflow_employee'))]"/>
    </record>

    <record id="group_assetflow_asset_manager" model="res.groups">
        <field name="name">Asset Manager</field>
        <field name="category_id" ref="module_category_assetflow"/>
        <field name="implied_ids" eval="[(4, ref('group_assetflow_employee'))]"/>
    </record>

    <record id="group_assetflow_administrator" model="res.groups">
        <field name="name">Administrator</field>
        <field name="category_id" ref="module_category_assetflow"/>
        <field name="implied_ids" eval="[(4, ref('group_assetflow_asset_manager')), (4, ref('group_assetflow_department_head'))]"/>
    </record>
</odoo>
""")

# 10. security/security.xml
create_file("security/security.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <!-- Employee record rules -->
    <record id="rule_employee_own" model="ir.rule">
        <field name="name">Employee can see only their own profile</field>
        <field name="model_id" ref="model_assetflow_employee"/>
        <field name="domain_force">[('user_id', '=', user.id)]</field>
        <field name="groups" eval="[(4, ref('group_assetflow_employee'))]"/>
    </record>

    <record id="rule_employee_dept_head" model="ir.rule">
        <field name="name">Department Head can see employees in their department</field>
        <field name="model_id" ref="model_assetflow_employee"/>
        <field name="domain_force">['|', ('department_id.head_id.user_id', '=', user.id), ('user_id', '=', user.id)]</field>
        <field name="groups" eval="[(4, ref('group_assetflow_department_head'))]"/>
    </record>

    <record id="rule_employee_admin" model="ir.rule">
        <field name="name">Admin/Asset Manager can see all employees</field>
        <field name="model_id" ref="model_assetflow_employee"/>
        <field name="domain_force">[(1, '=', 1)]</field>
        <field name="groups" eval="[(4, ref('group_assetflow_administrator')), (4, ref('group_assetflow_asset_manager'))]"/>
    </record>
</odoo>
""")

# 11. security/ir.model.access.csv
create_file("security/ir.model.access.csv", """
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_department_employee,department.employee,model_assetflow_department,group_assetflow_employee,1,0,0,0
access_department_dept_head,department.dept_head,model_assetflow_department,group_assetflow_department_head,1,0,0,0
access_department_manager,department.manager,model_assetflow_department,group_assetflow_asset_manager,1,1,1,0
access_department_admin,department.admin,model_assetflow_department,group_assetflow_administrator,1,1,1,1
access_employee_employee,employee.employee,model_assetflow_employee,group_assetflow_employee,1,0,0,0
access_employee_dept_head,employee.dept_head,model_assetflow_employee,group_assetflow_department_head,1,1,0,0
access_employee_manager,employee.manager,model_assetflow_employee,group_assetflow_asset_manager,1,1,1,0
access_employee_admin,employee.admin,model_assetflow_employee,group_assetflow_administrator,1,1,1,1
access_category_employee,category.employee,model_assetflow_asset_category,group_assetflow_employee,1,0,0,0
access_category_manager,category.manager,model_assetflow_asset_category,group_assetflow_asset_manager,1,1,1,1
access_role_admin,role.admin,model_assetflow_role,group_assetflow_administrator,1,1,1,1
""")

# 12. data/department_sequence.xml
create_file("data/department_sequence.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data noupdate="1">
        <record id="seq_assetflow_department" model="ir.sequence">
            <field name="name">Department Sequence</field>
            <field name="code">assetflow.department</field>
            <field name="prefix">DEP/</field>
            <field name="padding">3</field>
            <field name="company_id" eval="False"/>
        </record>
        
        <record id="seq_assetflow_employee" model="ir.sequence">
            <field name="name">Employee Sequence</field>
            <field name="code">assetflow.employee</field>
            <field name="prefix">EMP/</field>
            <field name="padding">4</field>
            <field name="company_id" eval="False"/>
        </record>
    </data>
</odoo>
""")

# 13. data/role_data.xml
create_file("data/role_data.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data noupdate="1">
        <record id="role_admin" model="assetflow.role">
            <field name="name">Administrator</field>
            <field name="description">System Administrator with full access</field>
        </record>
        <record id="role_asset_manager" model="assetflow.role">
            <field name="name">Asset Manager</field>
            <field name="description">Manages assets and allocations</field>
        </record>
        <record id="role_dept_head" model="assetflow.role">
            <field name="name">Department Head</field>
            <field name="description">Manages department employees and requests</field>
        </record>
        <record id="role_employee" model="assetflow.role">
            <field name="name">Employee</field>
            <field name="description">Standard employee access</field>
        </record>
    </data>
</odoo>
""")

# 14. data/category_data.xml
create_file("data/category_data.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data noupdate="1">
        <record id="cat_laptops" model="assetflow.asset.category">
            <field name="name">Laptops</field>
            <field name="warranty_period">36</field>
        </record>
        <record id="cat_monitors" model="assetflow.asset.category">
            <field name="name">Monitors</field>
            <field name="warranty_period">24</field>
        </record>
    </data>
</odoo>
""")

# 15. views/actions.xml
create_file("views/actions.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="action_assetflow_department" model="ir.actions.act_window">
        <field name="name">Departments</field>
        <field name="res_model">assetflow.department</field>
        <field name="view_mode">tree,form</field>
        <field name="help" type="html">
            <p class="o_view_nocontent_smiling_face">Create your first department!</p>
        </field>
    </record>

    <record id="action_assetflow_employee" model="ir.actions.act_window">
        <field name="name">Employees</field>
        <field name="res_model">assetflow.employee</field>
        <field name="view_mode">tree,form</field>
    </record>

    <record id="action_assetflow_asset_category" model="ir.actions.act_window">
        <field name="name">Asset Categories</field>
        <field name="res_model">assetflow.asset.category</field>
        <field name="view_mode">tree,form</field>
    </record>

    <record id="action_assetflow_role" model="ir.actions.act_window">
        <field name="name">Roles</field>
        <field name="res_model">assetflow.role</field>
        <field name="view_mode">tree,form</field>
    </record>
</odoo>
""")

# 16. views/menus.xml
create_file("views/menus.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <menuitem id="menu_assetflow_root" name="AssetFlow" sequence="10"/>
    
    <menuitem id="menu_assetflow_organization" name="Organization" parent="menu_assetflow_root" sequence="10"/>
    
    <menuitem id="menu_department" name="Departments" parent="menu_assetflow_organization" action="action_assetflow_department" sequence="10"/>
    <menuitem id="menu_employee" name="Employees" parent="menu_assetflow_organization" action="action_assetflow_employee" sequence="20"/>
    <menuitem id="menu_asset_category" name="Asset Categories" parent="menu_assetflow_organization" action="action_assetflow_asset_category" sequence="30"/>
    <menuitem id="menu_role" name="Roles" parent="menu_assetflow_organization" action="action_assetflow_role" sequence="40" groups="group_assetflow_administrator"/>
</odoo>
""")

# 17. views/department_views.xml
create_file("views/department_views.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_department_tree" model="ir.ui.view">
        <field name="name">assetflow.department.tree</field>
        <field name="model">assetflow.department</field>
        <field name="arch" type="xml">
            <tree string="Departments">
                <field name="code"/>
                <field name="name"/>
                <field name="parent_id"/>
                <field name="head_id"/>
                <field name="active" widget="boolean_toggle"/>
            </tree>
        </field>
    </record>

    <record id="view_department_form" model="ir.ui.view">
        <field name="name">assetflow.department.form</field>
        <field name="model">assetflow.department</field>
        <field name="arch" type="xml">
            <form string="Department">
                <sheet>
                    <div class="oe_title">
                        <h1>
                            <field name="code" readonly="1"/>
                        </h1>
                        <h2>
                            <field name="name" placeholder="Department Name"/>
                        </h2>
                    </div>
                    <group>
                        <group>
                            <field name="parent_id"/>
                            <field name="head_id"/>
                        </group>
                        <group>
                            <field name="active" widget="boolean_toggle"/>
                        </group>
                    </group>
                    <notebook>
                        <page string="Employees" name="employees">
                            <field name="employee_ids" readonly="1">
                                <tree>
                                    <field name="employee_id"/>
                                    <field name="name"/>
                                    <field name="job_title"/>
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

    <record id="view_department_search" model="ir.ui.view">
        <field name="name">assetflow.department.search</field>
        <field name="model">assetflow.department</field>
        <field name="arch" type="xml">
            <search>
                <field name="name"/>
                <field name="code"/>
                <field name="head_id"/>
                <filter string="Archived" name="inactive" domain="[('active', '=', False)]"/>
                <group expand="0" string="Group By">
                    <filter string="Parent Department" name="parent" context="{'group_by':'parent_id'}"/>
                </group>
            </search>
        </field>
    </record>
</odoo>
""")

# 18. views/employee_views.xml
create_file("views/employee_views.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_employee_tree" model="ir.ui.view">
        <field name="name">assetflow.employee.tree</field>
        <field name="model">assetflow.employee</field>
        <field name="arch" type="xml">
            <tree string="Employees">
                <field name="employee_id"/>
                <field name="name"/>
                <field name="email"/>
                <field name="department_id"/>
                <field name="role_id"/>
                <field name="active" widget="boolean_toggle"/>
            </tree>
        </field>
    </record>

    <record id="view_employee_form" model="ir.ui.view">
        <field name="name">assetflow.employee.form</field>
        <field name="model">assetflow.employee</field>
        <field name="arch" type="xml">
            <form string="Employee">
                <header>
                    <button name="%(assetflow_base.action_promote_employee)d" string="Promote Employee" type="action" class="oe_highlight"/>
                </header>
                <sheet>
                    <div class="oe_title">
                        <h1>
                            <field name="employee_id" readonly="1"/>
                        </h1>
                        <h2>
                            <field name="name" placeholder="Employee Name"/>
                        </h2>
                    </div>
                    <group>
                        <group string="Contact Info">
                            <field name="email" widget="email"/>
                            <field name="phone" widget="phone"/>
                        </group>
                        <group string="Organization">
                            <field name="department_id"/>
                            <field name="job_title"/>
                            <field name="role_id"/>
                            <field name="user_id"/>
                            <field name="active" widget="boolean_toggle"/>
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

# 19. views/asset_category_views.xml
create_file("views/asset_category_views.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_asset_category_tree" model="ir.ui.view">
        <field name="name">assetflow.asset.category.tree</field>
        <field name="model">assetflow.asset.category</field>
        <field name="arch" type="xml">
            <tree string="Asset Categories" editable="bottom">
                <field name="name"/>
                <field name="warranty_period"/>
                <field name="description"/>
                <field name="active" widget="boolean_toggle"/>
            </tree>
        </field>
    </record>

    <record id="view_asset_category_form" model="ir.ui.view">
        <field name="name">assetflow.asset.category.form</field>
        <field name="model">assetflow.asset.category</field>
        <field name="arch" type="xml">
            <form string="Asset Category">
                <sheet>
                    <group>
                        <field name="name"/>
                        <field name="warranty_period"/>
                        <field name="active"/>
                    </group>
                    <group>
                        <field name="description"/>
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

# 20. views/role_views.xml
create_file("views/role_views.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_role_tree" model="ir.ui.view">
        <field name="name">assetflow.role.tree</field>
        <field name="model">assetflow.role</field>
        <field name="arch" type="xml">
            <tree string="Roles">
                <field name="name"/>
                <field name="description"/>
            </tree>
        </field>
    </record>
</odoo>
""")

# 21. wizard/__init__.py
create_file("wizard/__init__.py", """
# -*- coding: utf-8 -*-
from . import promote_employee
""")

# 22. wizard/promote_employee.py
create_file("wizard/promote_employee.py", """
# -*- coding: utf-8 -*-
from odoo import models, fields

class PromoteEmployee(models.TransientModel):
    _name = 'assetflow.promote.employee'
    _description = 'Promote Employee Wizard'

    employee_id = fields.Many2one('assetflow.employee', string='Employee', required=True)
    new_role_id = fields.Many2one('assetflow.role', string='New Role', required=True)
    new_job_title = fields.Char(string='New Job Title')

    def action_promote(self):
        self.ensure_one()
        self.employee_id.write({
            'role_id': self.new_role_id.id,
            'job_title': self.new_job_title or self.employee_id.job_title
        })
        return {'type': 'ir.actions.act_window_close'}
""")

# 23. wizard/promote_employee_views.xml
create_file("wizard/promote_employee_views.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_promote_employee_form" model="ir.ui.view">
        <field name="name">assetflow.promote.employee.form</field>
        <field name="model">assetflow.promote.employee</field>
        <field name="arch" type="xml">
            <form string="Promote Employee">
                <group>
                    <field name="employee_id" readonly="1"/>
                    <field name="new_role_id"/>
                    <field name="new_job_title"/>
                </group>
                <footer>
                    <button string="Promote" name="action_promote" type="object" class="btn-primary"/>
                    <button string="Cancel" class="btn-secondary" special="cancel"/>
                </footer>
            </form>
        </field>
    </record>

    <record id="action_promote_employee" model="ir.actions.act_window">
        <field name="name">Promote Employee</field>
        <field name="res_model">assetflow.promote.employee</field>
        <field name="view_mode">form</field>
        <field name="target">new</field>
        <field name="context">{'default_employee_id': active_id}</field>
    </record>
</odoo>
""")

# 24. demo/demo.xml
create_file("demo/demo.xml", """
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data noupdate="1">
        <record id="demo_dept_it" model="assetflow.department">
            <field name="name">IT Department</field>
            <field name="code">IT</field>
        </record>
    </data>
</odoo>
""")

print("Successfully generated all files for assetflow_base.")

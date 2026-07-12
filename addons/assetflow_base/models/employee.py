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

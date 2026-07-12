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

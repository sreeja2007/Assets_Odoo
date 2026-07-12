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

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

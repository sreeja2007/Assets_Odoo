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

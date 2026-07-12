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

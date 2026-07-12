# -*- coding: utf-8 -*-
from odoo import models, fields, api

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

    def write(self, vals):
        res = super().write(vals)
        for record in self:
            if record.status == 'approved':
                # 1. Close current active allocation
                active_allocations = self.env['assetflow.asset.allocation'].search([
                    ('asset_id', '=', record.asset_id.id),
                    ('status', '=', 'allocated')
                ])
                for alloc in active_allocations:
                    alloc.write({
                        'status': 'returned',
                        'actual_return_date': fields.Date.context_today(self),
                        'return_notes': f"Transferred to department."
                    })
                # 2. Update asset status
                record.asset_id.write({'status': 'available'})
        return res

# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError

class AssetAllocation(models.Model):
    _name = 'assetflow.asset.allocation'
    _description = 'Asset Allocation'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    code = fields.Char(string='Allocation Reference', required=True, copy=False, readonly=True, default='New')
    asset_id = fields.Many2one('assetflow.asset', string='Asset', required=True, tracking=True)
    employee_id = fields.Many2one('assetflow.employee', string='Employee', required=True, tracking=True)
    allocate_date = fields.Date(string='Allocation Date', required=True, default=fields.Date.context_today, tracking=True)
    expected_return_date = fields.Date(string='Expected Return Date', tracking=True)
    actual_return_date = fields.Date(string='Actual Return Date', tracking=True)
    return_notes = fields.Text(string='Condition Check-in Notes', tracking=True)
    status = fields.Selection([
        ('draft', 'Draft'),
        ('allocated', 'Allocated'),
        ('returned', 'Returned')
    ], string='Status', default='draft', required=True, tracking=True)

    @api.constrains('asset_id', 'status')
    def _check_double_allocation(self):
        for record in self:
            if record.status == 'allocated':
                overlapping = self.search([
                    ('id', '!=', record.id),
                    ('asset_id', '=', record.asset_id.id),
                    ('status', '=', 'allocated')
                ])
                if overlapping:
                    current_holder = overlapping[0].employee_id.name or "another employee"
                    raise ValidationError(f"This asset is currently held by {current_holder}. Please request a transfer instead.")

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('code', 'New') == 'New':
                vals['code'] = self.env['ir.sequence'].next_by_code('assetflow.asset.allocation') or 'New'
        records = super().create(vals_list)
        for record in records:
            if record.status == 'allocated':
                record.asset_id.write({'status': 'allocated'})
        return records

    def write(self, vals):
        res = super().write(vals)
        for record in self:
            if record.status == 'allocated':
                record.asset_id.write({'status': 'allocated'})
            elif record.status == 'returned':
                record.asset_id.write({'status': 'available'})
        return res

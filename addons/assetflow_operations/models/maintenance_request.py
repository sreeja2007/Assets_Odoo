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
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('assigned', 'Technician Assigned'),
        ('in_progress', 'Under Repair'),
        ('resolved', 'Resolved')
    ], string='Status', default='pending', required=True, tracking=True)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('code', 'New') == 'New':
                vals['code'] = self.env['ir.sequence'].next_by_code('assetflow.maintenance.request') or 'New'
        return super().create(vals_list)

    def write(self, vals):
        res = super().write(vals)
        for record in self:
            if record.status == 'approved':
                record.asset_id.write({'status': 'maintenance'})
            elif record.status == 'resolved':
                record.asset_id.write({'status': 'available'})
        return res

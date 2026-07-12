# -*- coding: utf-8 -*-
from odoo import models, fields

class AuditItem(models.Model):
    _name = 'assetflow.audit.item'
    _description = 'Audit Item'

    cycle_id = fields.Many2one('assetflow.audit.cycle', string='Audit Cycle', required=True, ondelete='cascade')
    # Using a Char for asset_id temporarily until assetflow_assets is fully built
    asset_id = fields.Char(string='Asset Reference', required=True)
    status = fields.Selection([
        ('pending', 'Pending Review'),
        ('found', 'Found/Verified'),
        ('missing', 'Missing'),
        ('damaged', 'Damaged')
    ], string='Status', default='pending')
    notes = fields.Text(string='Notes')

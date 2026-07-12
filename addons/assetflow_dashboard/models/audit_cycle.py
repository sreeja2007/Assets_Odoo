# -*- coding: utf-8 -*-
from odoo import models, fields

class AuditCycle(models.Model):
    _name = 'assetflow.audit.cycle'
    _description = 'Audit Cycle'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Audit Name', required=True, tracking=True)
    start_date = fields.Date(string='Start Date', required=True, default=fields.Date.context_today)
    end_date = fields.Date(string='End Date', tracking=True)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed')
    ], string='Status', default='draft', tracking=True)
    auditor_id = fields.Many2one('assetflow.employee', string='Lead Auditor')
    item_ids = fields.One2many('assetflow.audit.item', 'cycle_id', string='Audit Items')

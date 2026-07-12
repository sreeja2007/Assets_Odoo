# -*- coding: utf-8 -*-
from odoo import models, fields, api

class AssetFlowNotification(models.Model):
    _name = 'assetflow.notification'
    _description = 'AssetFlow Notification'
    _order = 'create_date desc'

    title = fields.Char(string='Title', required=True)
    message = fields.Text(string='Message')
    type = fields.Selection([
        ('info', 'Information'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('success', 'Success')
    ], string='Type', default='info', required=True)
    user_id = fields.Many2one('res.users', string='Recipient', index=True)
    is_read = fields.Boolean(string='Read', default=False)

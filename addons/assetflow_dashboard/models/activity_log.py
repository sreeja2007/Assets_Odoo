# -*- coding: utf-8 -*-
from odoo import models, fields

class ActivityLog(models.Model):
    _name = 'assetflow.activity.log'
    _description = 'Activity Log'
    _order = 'create_date desc'

    action = fields.Char(string='Action', required=True)
    model_name = fields.Char(string='Model Name')
    record_id = fields.Integer(string='Record ID')
    user_id = fields.Many2one('res.users', string='User')
    timestamp = fields.Datetime(string='Timestamp', default=fields.Datetime.now)

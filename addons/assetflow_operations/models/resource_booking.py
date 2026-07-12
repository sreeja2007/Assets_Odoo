# -*- coding: utf-8 -*-
from odoo import models, fields

class ResourceBooking(models.Model):
    _name = 'assetflow.resource.booking'
    _description = 'Resource Booking'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    asset_id = fields.Many2one('assetflow.asset', string='Resource/Asset', required=True, tracking=True)
    user_id = fields.Many2one('res.users', string='Booked By', required=True, default=lambda self: self.env.user, tracking=True)
    start_datetime = fields.Datetime(string='Start Time', required=True, tracking=True)
    end_datetime = fields.Datetime(string='End Time', required=True, tracking=True)
    status = fields.Selection([
        ('draft', 'Draft'),
        ('booked', 'Confirmed Booked'),
        ('cancelled', 'Cancelled')
    ], string='Status', default='draft', required=True, tracking=True)

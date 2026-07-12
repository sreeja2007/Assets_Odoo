# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError

class ResourceBooking(models.Model):
    _name = 'assetflow.resource.booking'
    _description = 'Resource Booking'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    asset_id = fields.Many2one('assetflow.asset', string='Resource/Asset', required=True, tracking=True)
    user_id = fields.Many2one('res.users', string='Booked By', required=True, default=lambda self: self.env.user, tracking=True)
    start_datetime = fields.Datetime(string='Start Time', required=True, tracking=True)
    end_datetime = fields.Datetime(string='End Time', required=True, tracking=True)
    status = fields.Selection([
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ], string='Status', default='upcoming', required=True, tracking=True)

    @api.constrains('asset_id', 'start_datetime', 'end_datetime', 'status')
    def _check_booking_overlap(self):
        for record in self:
            if record.status in ['upcoming', 'ongoing']:
                overlapping = self.search([
                    ('id', '!=', record.id),
                    ('asset_id', '=', record.asset_id.id),
                    ('status', 'in', ['upcoming', 'ongoing']),
                    ('start_datetime', '<', record.end_datetime),
                    ('end_datetime', '>', record.start_datetime)
                ])
                if overlapping:
                    raise ValidationError("This resource is already booked during the requested time slot.")

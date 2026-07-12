# -*- coding: utf-8 -*-
from odoo import models, fields

class Asset(models.Model):
    _name = 'assetflow.asset'
    _description = 'Asset'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Asset Name', required=True)
    code = fields.Char(string='Asset Code', default='New')
    active = fields.Boolean(string='Active', default=True)

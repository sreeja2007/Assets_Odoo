# -*- coding: utf-8 -*-
from odoo import models, fields

class ResUsers(models.Model):
    _inherit = 'res.users'

    employee_id = fields.Many2one('assetflow.employee', string='AssetFlow Employee Profile')

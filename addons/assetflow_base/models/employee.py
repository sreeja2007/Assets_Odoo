# -*- coding: utf-8 -*-

from odoo import models, fields, api


class AssetFlowEmployee(models.Model):
    """Employee model for AssetFlow."""
    _name = 'assetflow.employee'
    _description = 'AssetFlow Employee'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    # TODO: Implement employee fields and methods
    pass

# -*- coding: utf-8 -*-

from odoo import models, fields, api


class AssetFlowDepartment(models.Model):
    """Department model for AssetFlow."""
    _name = 'assetflow.department'
    _description = 'AssetFlow Department'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    # TODO: Implement department fields and methods
    pass

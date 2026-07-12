# -*- coding: utf-8 -*-

from odoo import models, fields, api


class AssetLocation(models.Model):
    """Asset Location management."""
    _name = 'assetflow.asset.location'
    _description = 'Asset Location'
    _inherit = ['mail.thread']

    # TODO: Implement location fields (name, address, parent, etc.)
    pass

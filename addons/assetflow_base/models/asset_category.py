# -*- coding: utf-8 -*-

from odoo import models, fields, api


class AssetCategory(models.Model):
    """Asset Category model for classifying assets."""
    _name = 'assetflow.asset.category'
    _description = 'Asset Category'
    _inherit = ['mail.thread']

    # TODO: Implement asset category fields and methods
    pass

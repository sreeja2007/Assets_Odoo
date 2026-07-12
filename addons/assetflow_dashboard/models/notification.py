# -*- coding: utf-8 -*-

from odoo import models, fields, api


class AssetFlowNotification(models.Model):
    """Notification model for AssetFlow alerts."""
    _name = 'assetflow.notification'
    _description = 'AssetFlow Notification'
    _order = 'create_date desc'

    # TODO: Implement notification fields (title, message, type, user_id, read, etc.)
    pass

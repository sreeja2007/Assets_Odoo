from odoo import fields, models


class AssetLocation(models.Model):
    _name = "assetflow.asset.location"
    _description = "Asset Location"
    _rec_name = "name"

    name = fields.Char(
        string="Location Name",
        required=True,
    )

    building = fields.Char(
        string="Building",
    )

    floor = fields.Char(
        string="Floor",
    )

    room = fields.Char(
        string="Room",
    )

    description = fields.Text(
        string="Description",
    )

    asset_ids = fields.One2many(
        "assetflow.asset",
        "location_id",
        string="Assets",
    )

    active = fields.Boolean(
        default=True,
    )
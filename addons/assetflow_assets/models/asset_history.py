from odoo import fields, models


class AssetHistory(models.Model):
    _name = "assetflow.asset.history"
    _description = "Asset History"
    _order = "date desc"

    asset_id = fields.Many2one(
        "assetflow.asset",
        string="Asset",
        required=True,
        ondelete="cascade",
    )

    user_id = fields.Many2one(
        "res.users",
        string="Performed By",
        default=lambda self: self.env.user,
    )

    date = fields.Datetime(
        string="Date",
        default=fields.Datetime.now,
    )

    action = fields.Selection(
        [
            ("created", "Created"),
            ("allocated", "Allocated"),
            ("returned", "Returned"),
            ("maintenance", "Maintenance"),
            ("transferred", "Transferred"),
            ("lost", "Lost"),
            ("retired", "Retired"),
            ("disposed", "Disposed"),
        ],
        required=True,
        string="Action",
    )

    remarks = fields.Text(
        string="Remarks",
    )
from odoo import fields, models


class AssetDocument(models.Model):
    _name = "assetflow.asset.document"
    _description = "Asset Document"

    asset_id = fields.Many2one(
        "assetflow.asset",
        string="Asset",
        required=True,
        ondelete="cascade",
    )

    name = fields.Char(
        string="Document Name",
        required=True,
    )

    document_type = fields.Selection(
        [
            ("invoice", "Invoice"),
            ("warranty", "Warranty Card"),
            ("manual", "User Manual"),
            ("purchase_order", "Purchase Order"),
            ("amc", "AMC Contract"),
            ("other", "Other"),
        ],
        default="other",
        string="Document Type",
    )

    attachment = fields.Binary(
        string="File",
        attachment=True,
    )

    filename = fields.Char(
        string="File Name",
    )

    upload_date = fields.Date(
        string="Upload Date",
        default=fields.Date.today,
    )

    uploaded_by = fields.Many2one(
        "res.users",
        string="Uploaded By",
        default=lambda self: self.env.user,
    )

    notes = fields.Text(
        string="Notes",
    )
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError


class Asset(models.Model):
    _name = "assetflow.asset"
    _description = "Asset"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _rec_name = "name"

    name = fields.Char(
        string="Asset Name",
        required=True,
        tracking=True,
    )

    asset_id = fields.Char(
        string="Asset ID",
        readonly=True,
        copy=False,
        default=lambda self: _("New"),
    )

    asset_tag = fields.Char(
        string="Asset Tag",
        required=True,
        tracking=True,
    )

    serial_number = fields.Char(
        string="Serial Number",
        tracking=True,
    )

    category_id = fields.Many2one(
        "assetflow.asset.category",
        string="Category",
        required=True,
    )

    department_id = fields.Many2one(
        "assetflow.department",
        string="Department",
    )

    employee_id = fields.Many2one(
        "assetflow.employee",
        string="Current Holder",
    )

    location_id = fields.Many2one(
        "assetflow.asset.location",
        string="Location",
    )

    purchase_date = fields.Date(
        string="Purchase Date",
    )

    purchase_cost = fields.Float(
        string="Purchase Cost",
    )

    vendor = fields.Char(
        string="Vendor",
    )

    warranty_expiry = fields.Date(
        string="Warranty Expiry",
    )

    barcode = fields.Char(
        string="Barcode",
    )

    qr_code = fields.Char(
        string="QR Code",
    )

    image = fields.Image(
        string="Asset Image",
    )

    description = fields.Text(
        string="Description",
    )

    condition = fields.Selection(
        [
            ("excellent", "Excellent"),
            ("good", "Good"),
            ("fair", "Fair"),
            ("poor", "Poor"),
            ("damaged", "Damaged"),
        ],
        default="good",
        string="Condition",
    )

    status = fields.Selection(
        [
            ("available", "Available"),
            ("allocated", "Allocated"),
            ("reserved", "Reserved"),
            ("maintenance", "Under Maintenance"),
            ("lost", "Lost"),
            ("retired", "Retired"),
            ("disposed", "Disposed"),
        ],
        default="available",
        tracking=True,
        string="Status",
    )

    active = fields.Boolean(
        default=True,
    )

    history_ids = fields.One2many(
        "assetflow.asset.history",
        "asset_id",
        string="History",
    )

    document_ids = fields.One2many(
        "assetflow.asset.document",
        "asset_id",
        string="Documents",
    )

    _sql_constraints = [
        (
            "asset_tag_unique",
            "unique(asset_tag)",
            "Asset Tag must be unique!",
        ),
        (
            "serial_unique",
            "unique(serial_number)",
            "Serial Number must be unique!",
        ),
    ]

    @api.constrains("purchase_cost")
    def _check_cost(self):
        for record in self:
            if record.purchase_cost < 0:
                raise ValidationError(
                    _("Purchase Cost cannot be negative.")
                )

    @api.constrains("purchase_date", "warranty_expiry")
    def _check_dates(self):
        for record in self:
            if (
                record.purchase_date
                and record.warranty_expiry
                and record.warranty_expiry < record.purchase_date
            ):
                raise ValidationError(
                    _("Warranty expiry cannot be before purchase date.")
                )

    @api.model
    def create(self, vals):
        if vals.get("asset_id", _("New")) == _("New"):
            vals["asset_id"] = self.env["ir.sequence"].next_by_code(
                "assetflow.asset"
            ) or _("New")
        return super().create(vals)
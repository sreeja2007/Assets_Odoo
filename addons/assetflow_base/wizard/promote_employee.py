# -*- coding: utf-8 -*-
from odoo import models, fields

class PromoteEmployee(models.TransientModel):
    _name = 'assetflow.promote.employee'
    _description = 'Promote Employee Wizard'

    employee_id = fields.Many2one('assetflow.employee', string='Employee', required=True)
    new_role_id = fields.Many2one('assetflow.role', string='New Role', required=True)
    new_job_title = fields.Char(string='New Job Title')

    def action_promote(self):
        self.ensure_one()
        self.employee_id.write({
            'role_id': self.new_role_id.id,
            'job_title': self.new_job_title or self.employee_id.job_title
        })
        return {'type': 'ir.actions.act_window_close'}

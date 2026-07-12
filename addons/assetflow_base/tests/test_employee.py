# -*- coding: utf-8 -*-
from odoo.tests.common import TransactionCase
from odoo.exceptions import IntegrityError

class TestEmployee(TransactionCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.employee_model = cls.env['assetflow.employee']

    def test_create_employee(self):
        emp = self.employee_model.create({
            'name': 'John Doe',
            'email': 'john.doe@example.com'
        })
        self.assertEqual(emp.name, 'John Doe')
        self.assertTrue(emp.employee_id.startswith('EMP/'))

    def test_unique_email(self):
        self.employee_model.create({
            'name': 'Jane Doe',
            'email': 'jane.doe@example.com'
        })
        with self.assertRaises(IntegrityError):
            self.employee_model.create({
                'name': 'Jane Duplicate',
                'email': 'jane.doe@example.com'
            })

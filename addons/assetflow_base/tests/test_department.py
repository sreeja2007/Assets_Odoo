# -*- coding: utf-8 -*-
from odoo.tests.common import TransactionCase
from odoo.exceptions import IntegrityError

class TestDepartment(TransactionCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.department_model = cls.env['assetflow.department']

    def test_create_department(self):
        dept = self.department_model.create({'name': 'Engineering'})
        self.assertEqual(dept.name, 'Engineering')
        self.assertTrue(dept.code.startswith('DEP/'))

    def test_unique_department_name(self):
        self.department_model.create({'name': 'HR'})
        with self.assertRaises(IntegrityError):
            self.department_model.create({'name': 'HR'})

# -*- coding: utf-8 -*-
from odoo.tests.common import TransactionCase
from odoo.exceptions import IntegrityError

class TestAssetCategory(TransactionCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.category_model = cls.env['assetflow.asset.category']

    def test_create_category(self):
        cat = self.category_model.create({
            'name': 'Laptops',
            'warranty_period': 24
        })
        self.assertEqual(cat.name, 'Laptops')
        self.assertEqual(cat.warranty_period, 24)

    def test_unique_category_name(self):
        self.category_model.create({'name': 'Monitors'})
        with self.assertRaises(IntegrityError):
            self.category_model.create({'name': 'Monitors'})

import os
import shutil

base_dir = r"d:\Odoo\assetflow\addons\assetflow_base"

# Copy the generated icon
icon_src = r"C:\Users\anjus\.gemini\antigravity\brain\7fdb44e8-6d9e-4f53-b459-1692360a4e27\assetflow_icon_1783833040523.png"
icon_dest = os.path.join(base_dir, "static", "description", "icon.png")
os.makedirs(os.path.dirname(icon_dest), exist_ok=True)
if os.path.exists(icon_src):
    shutil.copy(icon_src, icon_dest)

def create_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# test_department.py
create_file("tests/test_department.py", """
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
""")

# test_employee.py
create_file("tests/test_employee.py", """
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
""")

# test_asset_category.py
create_file("tests/test_asset_category.py", """
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
""")

print("Tests and icon added successfully.")

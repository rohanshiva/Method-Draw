from deta import Deta
import unittest
import os
import io
import base64
from config import PROJ_KEY
from state import *

deta = Deta(PROJ_KEY)
def get_base():
    return 
base = deta.Base("drawings")
drive = deta.Drive("drawings")

def clean_up():
    all_records = get_all(base, {})
    for record in all_records:
        base.delete(record["key"])
    all_drawings = drive.list()
    for drawing in all_drawings["names"]:
        drive.delete(drawing)

class TestDriveMethods(unittest.TestCase):
    def startUp(self):
        clean_up()

    def tearDown(self):
        clean_up()
    
    def test_save_as(self):
        f = open('./untitled.svg', 'r')
        name = "untitled.svg"
        encoded_name = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
        file = f.read()
        f.close()
        # Overwrite - False, Record Doesn't Exist
        d = save_as(name, file, False)
        self.assertEqual(d["key"], encoded_name)

        # Overwrite - True, Record Exists
        d = save_as(name, file, True)
        self.assertEqual(d["key"], encoded_name)

        # Overwrite - False, Record Exists 
        d = save_as(name, file, False)
        self.assertEqual(d, None)

        f = open('./s.svg', 'r')
        name = 's.svg'
        encoded_name = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
        file = f.read()
        f.close() 
        # Overwrite - True, Record Doesn't Exist
        d = save_as(name, file, True)
        self.assertEqual(d["key"], encoded_name)
    
    def test_save(self):
        f = open('./untitled.svg', 'r')
        name = "untitled.svg"
        encoded_name = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
        file = f.read()
        f.close()
        # Record Doesn't Exist
        d = save(name, file)
        self.assertEqual(d, name)
        
        d = save_as(name, file, True)
        d = save(name, file)
        self.assertEqual(d, name)

    def test_save_space(self):
        f = open('./draw ing.svg')
        name = 'draw ing.svg'
        encoded_name = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
        file = f.read()
        f.close()

        d = save(name, file)
        self.assertEqual(d, name)

        d = save_as(name, file, True)
        d = save(name, file)
        self.assertEqual(d, name)

    def test_save_weird_characters(self):
        f = open("saGEh dd #$@%& ^&#@ {]';-_.m!.svg")
        name = "saGEh dd #$@%& ^&#@ {]';-_.m!?*.svg"
        encoded_name = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
        file = f.read()
        f.close()

        d = save(name, file)
        self.assertEqual(d, name)

        d = save_as(name, file, True)
        d = save(name, file)
        self.assertEqual(d, name)
    
    def test_toggle_drawing(self):
        f = open('./s.svg', 'r')
        name = 's.svg'
        encoded_name = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
        file = f.read()
        f.close()
        toggle = toggle_public(name, True)
        self.assertEqual(toggle, None)

        d = save_as(name, file, True)
        toggle = toggle_public(name, True)
        self.assertEqual(toggle["public"], True)

        toggle = toggle_public(name, False)
        self.assertEqual(toggle["public"], False)

    def test_metadata(self):
        f = open('./s.svg', 'r')
        name = 's.svg'
        encoded_name = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
        file = f.read()
        f.close()
        metadata = get_metadata(name)
        self.assertEqual(metadata, None)

        d = save(name, file)
        metadata = get_metadata(name)
        self.assertEqual(metadata["key"], encoded_name)

    def test_public_drawing(self):
        f = open('./s.svg', 'r')
        name = 's.svg'
        encoded_name = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
        file = f.read()
        f.close()

        d = get_public_drawing(name)
        self.assertEqual(d, None)

        save(name, file)
        d = get_public_drawing(name)
        self.assertEqual(d, None)

        toggle_public(name, True)
        d = get_public_drawing(name)
        self.assertEqual(d.read(), drive.get(name).read())
    
    def test_get_drawing(self):
        f = open("./s.svg", 'r')
        name = 's.svg'
        encoded_name = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
        file = f.read()
        f.close()

        d = get_drawing(name)
        self.assertEqual(d, None)

        save(name, file)
        d = get_drawing(name)
        self.assertEqual(d, drive.get(name).read())

    def test_delete_drawing(self):
        f = open("./s.svg", 'r')
        name = 's.svg'
        encoded_name = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
        file = f.read()
        f.close()

        d = delete_drawing(name)
        self.assertEqual(d, name)

        save(name, file)
        d = delete_drawing(name)
        self.assertEqual(d, name)
        


if __name__ == "__main__":
    unittest.main()
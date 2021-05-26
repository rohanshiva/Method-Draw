from deta import Deta
from datetime import date, datetime
from fastapi import HTTPException
import urllib
import base64

from util import get_all

deta = Deta("b03c85ap_MoPugZjSV7zmTKUW3brwEZPWQdAh9gDL")
base = deta.Base("drawings")
drive = deta.Drive("drawings")

def save_as(name, file, overwrite):
    encoded_name = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
    if (overwrite): # Record Exists and Overwrite allowed
        base.put({"key": encoded_name, "name":name, "public": False, 'lastModified': datetime.utcnow().timestamp()})
        return drive.put(name, file)
    else:  # Overwrite False
        b = base.get(encoded_name)
        if (b): # Record Exists - 409
            raise HTTPException(status_code=409)
        base.put({"key": encoded_name, "name":name, "public": False, 'lastModified': datetime.utcnow().timestamp()})
        return drive.put(name, file)

def save(name, file):
    encoded_name = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
    b = base.get(encoded_name)
    if (b):
        base.put({"key":encoded_name, "name": name, "public": b["public"], "lastModified": datetime.utcnow().timestamp()})
        return drive.put(name, file)
    base.put({"key":encoded_name, "name": name, "public": False, "lastModified": datetime.utcnow().timestamp()})
    return drive.put(name, file)

def get_metadata(name):
    encoded_name = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
    return base.get(encoded_name)

def get_drawing(name):
    encoded_name  = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
    b = base.get(encoded_name)
    d = drive.get(name)
    if (b and d):
        return d.read()
    base.delete(encoded_name)
    drive.delete(name)
    raise HTTPException(status_code=404, detail="Drawing doesn't exist")

def get_drawings():
    return get_all(base, {})
    
def delete_drawing(name):
    encoded_name  = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
    base.delete(encoded_name)
    drive.delete(name)
    return 

def toggle_public(name, public):
    encoded_name  = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
    b = base.get(encoded_name)
    if (b):
        b["public"] = public
        base.put(b)
        return
    raise HTTPException(status_code=404, detail="Drawing not found")

def raw_url(name):
    encoded_name = str(base64.urlsafe_b64encode(name.encode("utf-8")), 'utf-8')
    b = base.get(encoded_name)
    if (b and b["public"]):
        return drive.get(name)
    return None





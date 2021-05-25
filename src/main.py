from fastapi import FastAPI, Request, File, UploadFile, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, StreamingResponse, RedirectResponse, FileResponse
from deta import Deta
from pydantic import BaseModel
from datetime import datetime
from util import get_all


deta = Deta("")
base = deta.Base("drawings")
drive = deta.Drive("drawings")

app = FastAPI()

class Drawing(BaseModel):
    public: bool = False

def get(name):
    b = next(base.fetch({"name": name}))

    if(len(b)==1):
        return b[0]
    return None

def delete(name):
    b = get(name)
    if (b):
        return base.delete(b["key"])

@app.post("/api/save")
def upload_img(overwrite: bool = Form(...), file: UploadFile = File(...)):
    name = file.filename
    f = file.file
    b = get(name)
    if(b and overwrite):
        d = drive.put(name, f)
        base.put({'name':name, 'public': b["public"], 'lastModified': datetime.utcnow().timestamp()})
        base.delete(b["key"]) 
        return d
    elif (b and not overwrite):
        raise HTTPException(status_code=409)
    d = drive.put(name, f)
    b = base.put({'name':name, 'public': False, 'lastModified': datetime.utcnow().timestamp()})
    return d

@app.get("/api/drawings")
def get_drawings():
    return get_all(base, {})

@app.get("/api/{name}")
def get_drawing(name: str):
    b = get(name)
    d = drive.get(name)
    if (b and d):
        return d.read()
    if (b):
        base.delete(b["key"])
    drive.delete(name)
    raise HTTPException(status_code=404, detail="Drawing not found")

@app.get("/api/metadata/{name}")
def get_metadata(name: str):
    b = get(name)
    if(b):
        return b
    raise HTTPException(status_code=404, detail="Drawing not found")

@app.delete("/api/delete/{name}", status_code=200)
def delete_drawing(name: str):
    b = get(name)
    if (b):
        base.delete(b["key"])
    d = drive.delete(name)
    return

@app.put("/api/public/{name}", status_code=200)
def toggle_public(name: str, drawing: Drawing):
    res = get(name)
    if (res):
        res["public"] = drawing.public
        base.put(res)
        return
    raise HTTPException(status_code=401, detail="Image doesn't exist")

# @public
@app.get("/public/raw/{name}")
def get_raw_link(name: str):
    res = get(name)
    if (res and res["public"]):
        img = drive.get(name)
        return StreamingResponse(img.iter_chunks(1024), media_type="image/svg+xml")
    return FileResponse("./404.html")

# @public
@app.get("/public/bytes/{name}")
def get_img_data(name:str):
    res = get(name)
    if (res and res["public"]):
        img = drive.get(name)
        return img.read()
    raise HTTPException(status_code=404, detail="Drawing not found")

# @public
@app.get("/public/")
def get_edit_link(name: str = None):
    if (name):
        res = get(name)
        if(res and res["public"]):
            response = FileResponse("public/index.html")
            return response
    return FileResponse("public/index.html")

app.mount("/public", StaticFiles(directory="public", html="true"), name="static")
app.mount("/", StaticFiles(directory=".", html="true"), name="static")
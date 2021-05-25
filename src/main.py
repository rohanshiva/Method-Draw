from fastapi import FastAPI, Request, File, UploadFile, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, StreamingResponse, RedirectResponse, FileResponse
from deta import Deta
from pydantic import BaseModel
from datetime import datetime
from util import get_all


deta = Deta("PROJECT_KEY")
base = deta.Base("drawings")
drive = deta.Drive("drawings")

app = FastAPI()

class Drawing(BaseModel):
    public: bool = False

@app.post("/api/save")
def upload_img(file: UploadFile = File(...)):
    name = file.filename
    f = file.file
    res = drive.put(name, f)
    d = base.get(name)
    if (d):
        base.put({'key':name, 'public': d["public"], 'lastModified': datetime.utcnow().timestamp()})
    else:
        base.put({'key':name, 'public': False, 'lastModified': datetime.utcnow().timestamp()})
    return res

@app.get("/api/drawings")
def get_drawings():
    return get_all(base, {})

@app.get("/api/{name}")
def get_drawing(name: str):
    b = base.get(name)
    d = drive.get(name)
    if (b and d):
        return d.read()
    base.delete(name)
    drive.delete(name)
    raise HTTPException(status_code=404, detail="Drawing not found")

@app.get("/api/metadata/{name}")
def get_metadata(name: str):
    b = base.get(name)
    if(b):
        return b
    raise HTTPException(status_code=404, detail="Drawing not found")

@app.delete("/api/delete/{name}", status_code=200)
def delete_drawing(name: str):
    b = base.delete(name)
    d = drive.delete(name)
    return

@app.get("/api/unique/{name}")
def is_unique(name: str):
    b = base.get(name)
    d = drive.get(name)
    if (b and d):
        return False
    return True

@app.put("/api/public/{name}", status_code=200)
def toggle_public(name: str, drawing: Drawing):
    res = base.get(name)
    if (res):
        res["public"] = drawing.public
        base.put(res)
        return
    raise HTTPException(status_code=401, detail="Image doesn't exist")

# @public
@app.get("/public/raw/{name}")
def get_raw_link(name: str):
    res = base.get(name)
    if (res and res["public"]):
        img = drive.get(name)
        return StreamingResponse(img.iter_chunks(1024), media_type="image/svg+xml")
    return FileResponse("./404.html")

# @public
@app.get("/public/bytes/{name}")
def get_img_data(name:str):
    res = base.get(name)
    if (res and res["public"]):
        img = drive.get(name)
        return img.read()
    raise HTTPException(status_code=404, detail="Drawing not found")

# @public
@app.get("/public/")
def get_edit_link(name: str = None):
    if (name):
        res = base.get(name)
        if(res and res["public"]):
            response = FileResponse("public/index.html")
            return response
    return FileResponse("public/index.html")

app.mount("/public", StaticFiles(directory="public", html="true"), name="static")
app.mount("/", StaticFiles(directory=".", html="true"), name="static")
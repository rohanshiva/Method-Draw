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


@app.get("/api/delete/{name}")
def delete_drawing(name: str):
    b = base.delete(name)
    d = drive.delete(name)
    return d
@app.get("/api/{name}")
def get_drawing(name: str):
    res = base.get(name)
    if (res):
        res = drive.get(name)
        return res.read()
    return False
        

@app.get("/api/public/{name}")
def toggle_public(name: str):
    res = base.get(name)
    if (res):
        res["public"] = not res["public"]
        base.put(res)
        return True
    raise HTTPException(status_code=401, detail="Image doesn't exist")

# @public
@app.get("/public/raw/{name}")
def get_raw_link(name: str):
    res = base.get(name)
    if (res and res["public"]):
        img = drive.get(name)
        return StreamingResponse(img.iter_chunks(1024), media_type="image/svg+xml")
    raise HTTPException(status_code=404, detail="Drawing not found")

# # @public
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
            # response = RedirectResponse("http://127.0.0.1:8000/public/")
            response = FileResponse("public/index.html")
            return response
    return FileResponse("public/index.html")

app.mount("/public", StaticFiles(directory="public", html="true"), name="static")
app.mount("/", StaticFiles(directory=".", html="true"), name="static")
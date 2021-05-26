from fastapi import FastAPI, Request, File, UploadFile, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, StreamingResponse, RedirectResponse, FileResponse
from pydantic import BaseModel

from datetime import datetime
import urllib

from util import get_all
from middleware import delete_drawing, get_drawing, get_drawings, get_metadata, raw_url, save, save_as, toggle_public

app = FastAPI()

class Drawing(BaseModel):
    public: bool = False

@app.post("/api/save")
def save_drawing_handler(file: UploadFile = File(...)):
    name = file.filename
    f = file.file
    return save(name, f)

@app.post("/api/saveas")
def save_as_drawing_handler(overwrite: bool = Form(...), file: UploadFile = File(...)):
    name = file.filename
    f = file.file
    return save_as(name, f, overwrite)

@app.get("/api/drawings")
def get_drawings_handler():
    return get_drawings()

@app.get("/api/{name}")
def get_drawing_handler(name: str):
    return get_drawing(name)

@app.get("/api/metadata/{name}")
def get_metadata_handler(name: str):
    return get_metadata(name)

@app.delete("/api/delete/{name}", status_code=200)
def delete_drawing_handler(name: str):
    return delete_drawing(name)
    

@app.put("/api/public/{name}", status_code=200)
def toggle_public_handler(name: str, drawing: Drawing):
    return toggle_public(name, drawing.public)

@app.get("/public/raw/{name}")
def get_raw_link(name: str):
    drawing = raw_url(name)
    if (drawing):
        return StreamingResponse(drawing.iter_chunks(1024), media_type="image/svg+xml")
    return FileResponse("./404.html")

app.mount("/", StaticFiles(directory=".", html="true"), name="static")
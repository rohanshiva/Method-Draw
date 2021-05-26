from fastapi import FastAPI, Request, File, UploadFile, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, StreamingResponse, RedirectResponse, FileResponse
from deta import Deta
from pydantic import BaseModel
from datetime import datetime
from state import *
import os


deta = Deta("a0zgsbqm_bdhbNUzmPiHtY46DWeW1cyAuDhPYe2FN")

def get_base():
    return deta.Base("drawings")

base = get_base()

drive = deta.Drive("drawings")

app = FastAPI()

class Drawing(BaseModel):
    public: bool = False

def get_all(db, query):
    blob_gen = db.fetch(query)
    blobs = []
    for stored_blob in blob_gen:
        for blob in stored_blob:
            blobs.append(blob)
    return blobs

@app.get("/api/drawings")
def get_drawings_handler():
    drawings = get_drawings()
    return drawings

@app.post("/api/save")
def upload_img(file: UploadFile = File(...), overwrite: bool = Form(False)):
    name = file.filename
    f = file.file
    # base and drive fix logic, unique names
    success = save(name, f, overwrite)
    if success:
        return {"message": "success"}
    else:
        raise HTTPException(status_code=409, detail="Drawing already exists")


app.mount("/public", StaticFiles(directory=".", html="true"), name="static")
app.mount("/", StaticFiles(directory=".", html="true"), name="static")
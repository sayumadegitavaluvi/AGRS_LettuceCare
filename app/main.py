from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config.database import Base, engine

from app.models import user
from app.models import disease
from app.models import password_reset

from app.routers import auth
from app.routers import test
from app.routers import users
from app.routers import diseases
from app.routers import detection
from app.models import detection_history
from app.routers import history


# Membuat tabel database yang belum ada
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="LettuceCare API",
    version="1.0.0",
    description="LettuceCare Backend"
)


# Folder penyimpanan foto hasil deteksi.
# Lokasinya berada di root project AGRS_LettuceCare/uploads.
UPLOAD_DIR = (
    Path(__file__).resolve().parent.parent
    / "uploads"
)

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# Izinkan foto diakses melalui URL backend.
app.mount(
    "/uploads",
    StaticFiles(
        directory=str(UPLOAD_DIR)
    ),
    name="uploads"
)


app.include_router(test.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(diseases.router)
app.include_router(detection.router)
app.include_router(history.router)


@app.get("/")
def home():
    return {
        "message": "LettuceCare Backend Running"
    }
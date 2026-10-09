from fastapi import FastAPI

from app.config.database import Base, engine
from app.models import user
from app.models import disease

from app.routers import auth
from app.routers import test
from app.routers import users
from app.routers import diseases
from app.routers import detection


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="LettuceCare API",
    version="1.0.0",
    description="LettuceCare Backend"
)


app.include_router(test.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(diseases.router)
app.include_router(detection.router)


@app.get("/")
def home():
    return {
        "message": "LettuceCare Backend Running"
    }
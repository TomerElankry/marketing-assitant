from fastapi import FastAPI
from app.core.config import settings


from app.api import endpoints
from app.db.base import Base
from app.db.session import engine
from app.db import models # Import models to register them

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

app.include_router(endpoints.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

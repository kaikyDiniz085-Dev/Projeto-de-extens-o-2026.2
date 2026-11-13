import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine, SessionLocal
from app.seed import popular_banco_inicial
from app.routers import (
    auth,
    membros,
    escalas,
    trocas,
    cerimoniario,
    admin,
    disponibilidade,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Cria as tabelas no SQLite/PostgreSQL e executa o seed inicial
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        popular_banco_inicial(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="API Pastoral dos Coroinhas | Comunidade São Judas Tadeu",
    description="Back-end RESTful para gestão de escalas litúrgicas, trocas, chamadas e disponibilidade mensal.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configuração de CORS para permitir chamadas do arquivo HTML/JS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monta o diretório estático /uploads para servir as fotos das Santas Missas
os.makedirs(os.path.join("uploads", "fotos"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Registro dos Routers
app.include_router(auth.router)
app.include_router(membros.router)
app.include_router(escalas.router)
app.include_router(trocas.router)
app.include_router(cerimoniario.router)
app.include_router(admin.router)
app.include_router(disponibilidade.router)
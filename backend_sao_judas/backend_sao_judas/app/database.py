import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Para produção com PostgreSQL, basta definir no ambiente:
# DATABASE_URL="postgresql://usuario:senha@localhost:5432/pastoral_coroinhas"
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./saojudas.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
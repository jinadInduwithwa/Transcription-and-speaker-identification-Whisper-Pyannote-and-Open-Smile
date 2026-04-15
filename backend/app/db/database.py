"""
Database engine and session factory.
Uses DATABASE_URL from .env via python-dotenv.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

# Load .env from the project root (two levels up from this file)
_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
load_dotenv(os.path.join(_root, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check your .env file.")

# SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # Test connections before use (handles idle timeouts)
    pool_size=10,             # Max persistent connections
    max_overflow=20,          # Temporary extra connections allowed
)

# Session factory — use as a context manager in each request
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


def get_db():
    """
    FastAPI dependency — yields a database session and ensures it is
    always closed after the request, even if an exception occurs.
    Usage:
        @app.get("/")
        def route(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

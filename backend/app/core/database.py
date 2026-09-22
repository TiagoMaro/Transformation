"""Conexão com o banco (PostgreSQL) e sessão do SQLAlchemy."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# `check_same_thread` só existe no SQLite — usado apenas em testes locais.
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base declarativa de todos os modelos."""


def get_db() -> Generator[Session, None, None]:
    """Dependência do FastAPI: abre e fecha a sessão por requisição."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def criar_tabelas() -> None:
    """Cria as tabelas que ainda não existem.

    Para um projeto em produção o caminho recomendado é Alembic (migrations
    versionadas). Aqui usamos create_all para simplificar a subida inicial.
    """
    from app import models  # noqa: F401  (garante o registro dos modelos)

    Base.metadata.create_all(bind=engine)

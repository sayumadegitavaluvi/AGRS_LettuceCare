from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import URL

DATABASE_URL = URL.create(
    drivername="postgresql+psycopg2",
    username="postgres",
    password="iet123",
    host="localhost",
    port=5432,
    database="lettucecare",
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()

try:
    with engine.connect() as connection:
        print("Database berhasil terhubung")
except Exception as e:
    print("Database gagal terhubung:", repr(e))
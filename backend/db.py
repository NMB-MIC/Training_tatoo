from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_USER = "sa"
DB_PASSWORD = "DmX08775416421"
DB_SERVER = "db"
DB_NAME = "autoplan"
DB_DRIVER = "ODBC+Driver+17+for+SQL+Server"

MASTER_URL = f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD}@{DB_SERVER}/master?driver={DB_DRIVER}"

DATABASE_URL = f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD}@{DB_SERVER}/{DB_NAME}?driver={DB_DRIVER}"

engine_master = create_engine(MASTER_URL, isolation_level="AUTOCOMMIT")

with engine_master.connect() as conn:
    result = conn.execute(
        text(f"SELECT name FROM sys.databases WHERE name = '{DB_NAME}'")
    )
    if not result.first():
        conn.execute(text(f"CREATE DATABASE {DB_NAME}"))
        print(f"✅ Created database: {DB_NAME}")
    else:
        print(f"✅ Database already exists: {DB_NAME}")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

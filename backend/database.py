from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


DATABASE_URL = "postgresql://mushahid@localhost:5432/deviationiq"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)
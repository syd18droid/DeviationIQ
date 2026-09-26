from sqlalchemy import Column, Date, Integer, Text, TIMESTAMP, text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Deviation(Base):
    __tablename__ = "deviations"

    id = Column(Integer, primary_key=True, index=True)
    site_plant = Column(Text)
    date_of_occurrence = Column(Date)
    title = Column(Text)
    source = Column(Text)
    related_product_material = Column(Text)
    batch_lot_number = Column(Text)
    detailed_description = Column(Text)
    initial_impact = Column(Text)
    initial_severity = Column(Text)
    impact_reason = Column(Text)
    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
    )
from typing import Optional

from pydantic import BaseModel


class DeviationData(BaseModel):
    site_plant: Optional[str] = None
    date_of_occurrence: Optional[str] = None
    title: Optional[str] = None
    source: Optional[str] = None
    related_product_material: Optional[str] = None
    batch_lot_number: Optional[str] = None
    detailed_description: Optional[str] = None
    initial_impact: Optional[str] = None
    initial_severity: Optional[str] = None
    impact_reason: Optional[str] = None


class AssessmentData(BaseModel):
    initial_impact: Optional[str] = None
    initial_severity: Optional[str] = None
    impact_reason: Optional[str] = None
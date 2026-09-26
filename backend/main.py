from datetime import datetime
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from ai.graph import deviation_graph
from database import SessionLocal
from db.models import Deviation


app = FastAPI(title="DeviationIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DeviationRequest(BaseModel):
    deviation_text: str


class DeviationChatRequest(BaseModel):
    current_data: dict
    user_message: str


class DeviationSaveRequest(BaseModel):
    site_plant: str | None = None
    date_of_occurrence: str | None = None
    title: str | None = None
    source: str | None = None
    related_product_material: str | None = None
    batch_lot_number: str | None = None
    detailed_description: str | None = None
    initial_impact: str | None = None
    initial_severity: str | None = None
    impact_reason: str | None = None


def parse_date(value):
    if not value:
        return None

    if isinstance(value, datetime):
        return value.date()

    try:
        return datetime.strptime(
            value,
            "%Y-%m-%d",
        ).date()
    except ValueError:
        pass

    try:
        return datetime.strptime(
            value,
            "%B %d, %Y",
        ).date()
    except ValueError:
        return None


def analyze_text(text: str):
    result = deviation_graph.invoke(
        {
            "deviation_text": text,
            "extracted_data": {},
        }
    )

    return result["extracted_data"]


@app.get("/")
def root():
    return {
        "message": "DeviationIQ API is running"
    }


@app.post("/api/deviations/analyze")
def analyze_deviation(
    request: DeviationRequest,
):
    return analyze_text(
        request.deviation_text
    )


@app.post("/api/deviations/extract-pdf")
async def extract_pdf(
    file: UploadFile = File(...),
):
    reader = PdfReader(file.file)

    text = "\n".join(
        page.extract_text() or ""
        for page in reader.pages
    )

    extracted_data = analyze_text(text)

    return {
        "filename": file.filename,
        "text": text,
        "extracted_data": extracted_data,
    }


@app.post("/api/deviations/chat")
def deviation_chat(
    request: DeviationChatRequest,
):
    from ai.graph import edit_deviation

    result = edit_deviation(
        {
            "current_data": request.current_data,
            "user_message": request.user_message,
        }
    )

    return {
        "updated_data": result["updated_data"],
        "assistant_message": result[
            "assistant_message"
        ],
    }


@app.post("/api/deviations")
def save_deviation(
    request: DeviationSaveRequest,
):
    db = SessionLocal()

    try:
        deviation = Deviation(
            site_plant=request.site_plant,
            date_of_occurrence=parse_date(
                request.date_of_occurrence
            ),
            title=request.title,
            source=request.source,
            related_product_material=(
                request.related_product_material
            ),
            batch_lot_number=(
                request.batch_lot_number
            ),
            detailed_description=(
                request.detailed_description
            ),
            initial_impact=request.initial_impact,
            initial_severity=request.initial_severity,
            impact_reason=request.impact_reason,
        )

        db.add(deviation)
        db.commit()
        db.refresh(deviation)

        return {
            "message": "Deviation saved successfully",
            "id": deviation.id,
        }

    finally:
        db.close()
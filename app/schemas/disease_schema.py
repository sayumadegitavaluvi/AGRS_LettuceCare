from pydantic import BaseModel


class DiseaseCreate(BaseModel):
    code: str
    name: str
    cause: str
    treatment: str


class DiseaseResponse(BaseModel):
    id: int
    code: str
    name: str
    cause: str
    treatment: str

    class Config:
        from_attributes = True
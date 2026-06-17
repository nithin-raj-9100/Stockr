from datetime import datetime
from pydantic import BaseModel, EmailStr


class CustomerCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None


class CustomerOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

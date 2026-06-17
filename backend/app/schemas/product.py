from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, field_validator


class ProductCreate(BaseModel):
    name: str
    sku: str
    price: Decimal
    quantity_in_stock: int = 0

    @field_validator("price")
    @classmethod
    def price_non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("price cannot be negative")
        return v

    @field_validator("quantity_in_stock")
    @classmethod
    def qty_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("quantity_in_stock cannot be negative")
        return v


class ProductUpdate(BaseModel):
    name: str | None = None
    sku: str | None = None
    price: Decimal | None = None
    quantity_in_stock: int | None = None

    @field_validator("price")
    @classmethod
    def price_non_negative(cls, v: Decimal | None) -> Decimal | None:
        if v is not None and v < 0:
            raise ValueError("price cannot be negative")
        return v

    @field_validator("quantity_in_stock")
    @classmethod
    def qty_non_negative(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("quantity_in_stock cannot be negative")
        return v


class ProductOut(BaseModel):
    id: int
    name: str
    sku: str
    price: Decimal
    quantity_in_stock: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

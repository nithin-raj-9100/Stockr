from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.customer import CustomerCreate, CustomerOut
from app.services import customer_service
from app import cache

router = APIRouter()

TTL = 120


@router.get("", response_model=list[CustomerOut])
async def list_customers(db: Session = Depends(get_db)):
    cached = await cache.get(cache.CUSTOMERS_ALL)
    if cached is not None:
        return cached
    data = customer_service.get_all(db)
    result = [CustomerOut.model_validate(c).model_dump() for c in data]
    await cache.set(cache.CUSTOMERS_ALL, result, TTL)
    return result


@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
async def create_customer(data: CustomerCreate, db: Session = Depends(get_db)):
    customer = customer_service.create(db, data)
    await cache.delete(cache.CUSTOMERS_ALL, cache.DASHBOARD_STATS)
    return customer


@router.get("/{customer_id}", response_model=CustomerOut)
async def get_customer(customer_id: int, db: Session = Depends(get_db)):
    key = cache.CUSTOMER_ONE.format(id=customer_id)
    cached = await cache.get(key)
    if cached is not None:
        return cached
    customer = customer_service.get_by_id(db, customer_id)
    result = CustomerOut.model_validate(customer).model_dump()
    await cache.set(key, result, TTL)
    return result


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer_service.delete(db, customer_id)
    await cache.delete(
        cache.CUSTOMERS_ALL,
        cache.CUSTOMER_ONE.format(id=customer_id),
        cache.DASHBOARD_STATS,
    )

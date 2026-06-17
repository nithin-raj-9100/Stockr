from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.services import product_service
from app import cache

router = APIRouter()

TTL = 120  # seconds


@router.get("", response_model=list[ProductOut])
async def list_products(db: Session = Depends(get_db)):
    cached = await cache.get(cache.PRODUCTS_ALL)
    if cached is not None:
        return cached
    data = product_service.get_all(db)
    result = [ProductOut.model_validate(p).model_dump() for p in data]
    await cache.set(cache.PRODUCTS_ALL, result, TTL)
    return result


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    product = product_service.create(db, data)
    await cache.delete(cache.PRODUCTS_ALL, cache.DASHBOARD_STATS)
    return product


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    key = cache.PRODUCT_ONE.format(id=product_id)
    cached = await cache.get(key)
    if cached is not None:
        return cached
    product = product_service.get_by_id(db, product_id)
    result = ProductOut.model_validate(product).model_dump()
    await cache.set(key, result, TTL)
    return result


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    product = product_service.update(db, product_id, data)
    await cache.delete(
        cache.PRODUCTS_ALL,
        cache.PRODUCT_ONE.format(id=product_id),
        cache.DASHBOARD_STATS,
    )
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    product_service.delete(db, product_id)
    await cache.delete(
        cache.PRODUCTS_ALL,
        cache.PRODUCT_ONE.format(id=product_id),
        cache.DASHBOARD_STATS,
    )

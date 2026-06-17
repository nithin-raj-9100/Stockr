from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.order import OrderCreate, OrderOut, OrderSummaryOut
from app.services import order_service
from app import cache

router = APIRouter()

TTL = 60


@router.get("", response_model=list[OrderSummaryOut])
async def list_orders(q: str | None = None, status: str | None = None, db: Session = Depends(get_db)):
    if q or status:
        data = order_service.get_all(db, q=q, status=status)
        return [OrderSummaryOut.model_validate(o).model_dump() for o in data]

    cached = await cache.get(cache.ORDERS_ALL)
    if cached is not None:
        return cached
    data = order_service.get_all(db)
    result = [OrderSummaryOut.model_validate(o).model_dump() for o in data]
    await cache.set(cache.ORDERS_ALL, result, TTL)
    return result


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(data: OrderCreate, db: Session = Depends(get_db)):
    order = order_service.create(db, data)
    keys_to_delete = [
        cache.ORDERS_ALL,
        cache.PRODUCTS_ALL,
        cache.DASHBOARD_STATS,
    ]
    for item in data.items:
        keys_to_delete.append(cache.PRODUCT_ONE.format(id=item.product_id))
    await cache.delete(*keys_to_delete)
    return order


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: int, db: Session = Depends(get_db)):
    key = cache.ORDER_ONE.format(id=order_id)
    cached = await cache.get(key)
    if cached is not None:
        return cached
    order = order_service.get_by_id(db, order_id)
    result = OrderOut.model_validate(order).model_dump()
    await cache.set(key, result, TTL)
    return result


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(order_id: int, db: Session = Depends(get_db)):
    product_ids = order_service.delete(db, order_id)
    keys_to_delete = [
        cache.ORDERS_ALL,
        cache.PRODUCTS_ALL,
        cache.ORDER_ONE.format(id=order_id),
        cache.DASHBOARD_STATS,
    ]
    for pid in product_ids:
        keys_to_delete.append(cache.PRODUCT_ONE.format(id=pid))
    await cache.delete(*keys_to_delete)

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.order import DashboardStats
from app import cache

router = APIRouter()

LOW_STOCK_THRESHOLD = 10
TTL = 30


@router.get("/stats", response_model=DashboardStats)
async def get_stats(db: Session = Depends(get_db)):
    cached = await cache.get(cache.DASHBOARD_STATS)
    if cached is not None:
        return cached

    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()
    low_stock = (
        db.query(Product)
        .filter(Product.quantity_in_stock <= LOW_STOCK_THRESHOLD)
        .all()
    )

    result = DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=[
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "quantity_in_stock": p.quantity_in_stock,
            }
            for p in low_stock
        ],
    )

    await cache.set(cache.DASHBOARD_STATS, result.model_dump(), TTL)
    return result

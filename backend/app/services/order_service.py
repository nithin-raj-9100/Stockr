from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate


def get_all(db: Session, q: str | None = None, status: str | None = None) -> list[Order]:
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    if q:
        if q.isdigit():
            query = query.outerjoin(Customer).filter(
                (Order.id == int(q))
                | Customer.full_name.ilike(f"%{q}%")
                | Customer.email.ilike(f"%{q}%")
            )
        else:
            query = query.join(Customer).filter(
                Customer.full_name.ilike(f"%{q}%")
                | Customer.email.ilike(f"%{q}%")
            )
    return query.all()


def get_by_id(db: Session, order_id: int) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def create(db: Session, data: OrderCreate) -> Order:
    customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    total = Decimal("0")
    resolved_items = []

    for item in data.items:
        product = (
            db.query(Product)
            .filter(Product.id == item.product_id)
            .with_for_update()
            .first()
        )
        if not product:
            raise HTTPException(
                status_code=404, detail=f"Product {item.product_id} not found"
            )
        if product.quantity_in_stock < item.quantity:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Insufficient stock for '{product.name}'. "
                    f"Available: {product.quantity_in_stock}, Requested: {item.quantity}"
                ),
            )
        unit_price = Decimal(str(product.price))
        total += unit_price * item.quantity
        product.quantity_in_stock -= item.quantity
        resolved_items.append((product, item.quantity, unit_price))

    order = Order(customer_id=data.customer_id, total_amount=total)
    db.add(order)
    db.flush()

    for product, qty, unit_price in resolved_items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=qty,
                unit_price=unit_price,
            )
        )

    db.commit()
    db.refresh(order)
    return order


def delete(db: Session, order_id: int) -> list[int]:
    order = get_by_id(db, order_id)
    product_ids = []
    for item in order.items:
        product = (
            db.query(Product)
            .filter(Product.id == item.product_id)
            .with_for_update()
            .first()
        )
        if product:
            product.quantity_in_stock += item.quantity
            product_ids.append(product.id)
    db.delete(order)
    db.commit()
    return product_ids

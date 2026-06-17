from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate


def get_all(db: Session, q: str | None = None) -> list[Customer]:
    query = db.query(Customer)
    if q:
        query = query.filter(
            Customer.full_name.ilike(f"%{q}%")
            | Customer.email.ilike(f"%{q}%")
            | Customer.phone.ilike(f"%{q}%")
        )
    return query.all()


def get_by_id(db: Session, customer_id: int) -> Customer:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


def create(db: Session, data: CustomerCreate) -> Customer:
    customer = Customer(**data.model_dump())
    db.add(customer)
    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")
    return customer


def delete(db: Session, customer_id: int) -> None:
    customer = get_by_id(db, customer_id)
    try:
        db.delete(customer)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Cannot delete customer with existing orders",
        )

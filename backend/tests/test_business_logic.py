import pytest
from unittest.mock import AsyncMock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app import cache
from app.services import product_service, customer_service, order_service
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.customer import CustomerCreate
from app.schemas.order import OrderCreate, OrderItemCreate

# Setup in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(autouse=True)
def mock_redis_cache():
    # Mock cache methods so unit tests do not try to hit real Redis
    with patch("app.cache.get", new_callable=AsyncMock, return_value=None), \
         patch("app.cache.set", new_callable=AsyncMock), \
         patch("app.cache.delete", new_callable=AsyncMock), \
         patch("app.cache.delete_pattern", new_callable=AsyncMock):
        yield


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


# ─── Service Layer Tests ───────────────────────────────────────────────────────

def test_product_unique_sku(db_session):
    # Test that SKU uniqueness is enforced and raises 409
    p1 = ProductCreate(name="Product A", sku="SKU123", price=10.0, quantity_in_stock=5)
    product_service.create(db_session, p1)

    p2 = ProductCreate(name="Product B", sku="SKU123", price=20.0, quantity_in_stock=10)
    with pytest.raises(HTTPException) as exc_info:
        product_service.create(db_session, p2)
    assert exc_info.value.status_code == 409
    assert "SKU already exists" in exc_info.value.detail


def test_customer_unique_email(db_session):
    # Test that Email uniqueness is enforced and raises 409
    c1 = CustomerCreate(full_name="Alice", email="alice@example.com", phone="1234567")
    customer_service.create(db_session, c1)

    c2 = CustomerCreate(full_name="Bob", email="alice@example.com", phone="7654321")
    with pytest.raises(HTTPException) as exc_info:
        customer_service.create(db_session, c2)
    assert exc_info.value.status_code == 409
    assert "Email already registered" in exc_info.value.detail


def test_insufficient_stock_prevents_order(db_session):
    # Create product and customer
    p = product_service.create(db_session, ProductCreate(name="Product A", sku="SKU1", price=10.0, quantity_in_stock=5))
    c = customer_service.create(db_session, CustomerCreate(full_name="Alice", email="alice@example.com", phone="123"))

    # Place order with quantity exceeding stock
    order_data = OrderCreate(
        customer_id=c.id,
        items=[OrderItemCreate(product_id=p.id, quantity=10)]
    )
    with pytest.raises(HTTPException) as exc_info:
        order_service.create(db_session, order_data)
    assert exc_info.value.status_code == 422
    assert "Insufficient stock" in exc_info.value.detail


def test_order_reduces_stock_and_calculates_total(db_session):
    # Create product and customer
    p = product_service.create(db_session, ProductCreate(name="Product A", sku="SKU1", price=10.50, quantity_in_stock=10))
    c = customer_service.create(db_session, CustomerCreate(full_name="Alice", email="alice@example.com", phone="123"))

    # Place order
    order_data = OrderCreate(
        customer_id=c.id,
        items=[OrderItemCreate(product_id=p.id, quantity=3)]
    )
    order = order_service.create(db_session, order_data)

    # Total should be 10.50 * 3 = 31.50
    assert float(order.total_amount) == 31.50
    # Stock should be reduced to 7
    db_session.refresh(p)
    assert p.quantity_in_stock == 7


def test_order_deletion_restores_stock(db_session):
    # Create product and customer
    p = product_service.create(db_session, ProductCreate(name="Product A", sku="SKU1", price=10.0, quantity_in_stock=10))
    c = customer_service.create(db_session, CustomerCreate(full_name="Alice", email="alice@example.com", phone="123"))

    # Place order
    order_data = OrderCreate(
        customer_id=c.id,
        items=[OrderItemCreate(product_id=p.id, quantity=4)]
    )
    order = order_service.create(db_session, order_data)

    # Verify initial stock reduction
    db_session.refresh(p)
    assert p.quantity_in_stock == 6

    # Delete order
    order_service.delete(db_session, order.id)

    # Stock should be restored to 10
    db_session.refresh(p)
    assert p.quantity_in_stock == 10


# ─── API Router End-To-End Tests ───────────────────────────────────────────────

def test_api_product_crud(client):
    # Create product via API
    resp = client.post("/api/v1/products", json={
        "name": "API Prod",
        "sku": "APISKU",
        "price": 4.99,
        "quantity_in_stock": 20
    })
    assert resp.status_code == 201
    prod_id = resp.json()["id"]

    # Read product
    resp = client.get(f"/api/v1/products/{prod_id}")
    assert resp.status_code == 200
    assert resp.json()["sku"] == "APISKU"

    # Update product
    resp = client.put(f"/api/v1/products/{prod_id}", json={
        "name": "API Prod Updated",
        "sku": "APISKU",
        "price": 5.99,
        "quantity_in_stock": 15
    })
    assert resp.status_code == 200
    assert resp.json()["name"] == "API Prod Updated"
    assert float(resp.json()["price"]) == 5.99

    # Delete product
    resp = client.delete(f"/api/v1/products/{prod_id}")
    assert resp.status_code == 204


def test_api_order_flow(client):
    # 1. Create product and customer
    prod_resp = client.post("/api/v1/products", json={"name": "P1", "sku": "S1", "price": 100.0, "quantity_in_stock": 50})
    cust_resp = client.post("/api/v1/customers", json={"full_name": "John Doe", "email": "john@example.com", "phone": "555-0101"})
    assert prod_resp.status_code == 201
    assert cust_resp.status_code == 201
    p_id = prod_resp.json()["id"]
    c_id = cust_resp.json()["id"]

    # 2. Create order
    order_resp = client.post("/api/v1/orders", json={
        "customer_id": c_id,
        "items": [{"product_id": p_id, "quantity": 10}]
    })
    assert order_resp.status_code == 201
    order_id = order_resp.json()["id"]
    assert float(order_resp.json()["total_amount"]) == 1000.0

    # Verify stock reduction
    p_details = client.get(f"/api/v1/products/{p_id}").json()
    assert p_details["quantity_in_stock"] == 40

    # 3. Delete order
    del_resp = client.delete(f"/api/v1/orders/{order_id}")
    assert del_resp.status_code == 204

    # Verify stock restoration
    p_details = client.get(f"/api/v1/products/{p_id}").json()
    assert p_details["quantity_in_stock"] == 50

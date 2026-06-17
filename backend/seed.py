from decimal import Decimal
from app.database import SessionLocal
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem

products = [
    Product(name="Wireless Mouse", sku="MSE-001", price=Decimal("29.99"), quantity_in_stock=150),
    Product(name="Mechanical Keyboard", sku="KBD-001", price=Decimal("89.99"), quantity_in_stock=75),
    Product(name="USB-C Hub", sku="HUB-001", price=Decimal("49.99"), quantity_in_stock=8),
    Product(name="27\" Monitor", sku="MON-001", price=Decimal("299.99"), quantity_in_stock=30),
    Product(name="Laptop Stand", sku="STD-001", price=Decimal("39.99"), quantity_in_stock=5),
    Product(name="Webcam HD", sku="CAM-001", price=Decimal("69.99"), quantity_in_stock=0),
    Product(name="Desk Lamp", sku="LMP-001", price=Decimal("24.99"), quantity_in_stock=200),
    Product(name="Cable Organizer", sku="CBL-001", price=Decimal("9.99"), quantity_in_stock=3),
]

customers = [
    Customer(full_name="Alice Johnson", email="alice@example.com", phone="+1-555-0101"),
    Customer(full_name="Bob Smith", email="bob@example.com", phone="+1-555-0102"),
    Customer(full_name="Carol White", email="carol@example.com", phone="+1-555-0103"),
    Customer(full_name="David Lee", email="david@example.com", phone="+1-555-0104"),
    Customer(full_name="Eva Martinez", email="eva@example.com", phone=None),
]


def run():
    db = SessionLocal()
    try:
        db.add_all(products)
        db.flush()

        db.add_all(customers)
        db.flush()

        # Order 1: Alice buys a mouse + keyboard
        o1 = Order(
            customer_id=customers[0].id,
            total_amount=Decimal("29.99") + Decimal("89.99"),
        )
        db.add(o1)
        db.flush()
        db.add_all([
            OrderItem(order_id=o1.id, product_id=products[0].id, quantity=1, unit_price=Decimal("29.99")),
            OrderItem(order_id=o1.id, product_id=products[1].id, quantity=1, unit_price=Decimal("89.99")),
        ])
        products[0].quantity_in_stock -= 1
        products[1].quantity_in_stock -= 1

        # Order 2: Bob buys 2 desk lamps
        o2 = Order(
            customer_id=customers[1].id,
            total_amount=Decimal("24.99") * 2,
        )
        db.add(o2)
        db.flush()
        db.add(OrderItem(order_id=o2.id, product_id=products[6].id, quantity=2, unit_price=Decimal("24.99")))
        products[6].quantity_in_stock -= 2

        # Order 3: Carol buys a monitor + hub
        o3 = Order(
            customer_id=customers[2].id,
            total_amount=Decimal("299.99") + Decimal("49.99"),
        )
        db.add(o3)
        db.flush()
        db.add_all([
            OrderItem(order_id=o3.id, product_id=products[3].id, quantity=1, unit_price=Decimal("299.99")),
            OrderItem(order_id=o3.id, product_id=products[2].id, quantity=1, unit_price=Decimal("49.99")),
        ])
        products[3].quantity_in_stock -= 1
        products[2].quantity_in_stock -= 1

        db.commit()
        print(f"✓ {len(products)} products")
        print(f"✓ {len(customers)} customers")
        print("✓ 3 orders")
    except Exception as e:
        db.rollback()
        print(f"✗ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    run()

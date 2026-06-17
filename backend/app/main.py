from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.cache import connect as cache_connect, disconnect as cache_disconnect
from app.routers import products, customers, orders, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    await cache_connect()
    yield
    await cache_disconnect()


app = FastAPI(title="Stockr API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["Customers"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])


@app.get("/")
def health():
    return {"status": "ok", "service": "Stockr API"}

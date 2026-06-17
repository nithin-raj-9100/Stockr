import json
import logging
from typing import Any
import redis.asyncio as aioredis
from app.config import settings

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis | None:
    return _redis


async def connect():
    global _redis
    if not settings.REDIS_URL:
        logger.warning("REDIS_URL not set — caching disabled")
        return
    try:
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        await _redis.ping()
        logger.info("Redis connected")
    except Exception as e:
        logger.warning(f"Redis unavailable: {e} — caching disabled")
        _redis = None


async def disconnect():
    global _redis
    if _redis:
        await _redis.aclose()
        _redis = None


async def get(key: str) -> Any | None:
    if not _redis:
        return None
    try:
        value = await _redis.get(key)
        return json.loads(value) if value else None
    except Exception:
        return None


async def set(key: str, value: Any, ttl: int = 60) -> None:
    if not _redis:
        return
    try:
        await _redis.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass


async def delete(*keys: str) -> None:
    if not _redis:
        return
    try:
        await _redis.delete(*keys)
    except Exception:
        pass


async def delete_pattern(pattern: str) -> None:
    if not _redis:
        return
    try:
        keys = await _redis.keys(pattern)
        if keys:
            await _redis.delete(*keys)
    except Exception:
        pass


# Cache key constants
PRODUCTS_ALL = "products:all"
PRODUCT_ONE = "products:{id}"
CUSTOMERS_ALL = "customers:all"
CUSTOMER_ONE = "customers:{id}"
ORDERS_ALL = "orders:all"
ORDER_ONE = "orders:{id}"
DASHBOARD_STATS = "dashboard:stats"

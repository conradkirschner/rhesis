# rhesis/backend/app/utils/decorators.py
import inspect
from functools import wraps
from typing import Callable, Type, TypeVar, List, Any

from fastapi import Response
from sqlalchemy.orm import Session

from rhesis.backend.app.utils.crud_utils import count_items
from rhesis.backend.logging import logger

T = TypeVar("T")

def with_count_header(model: Type, to_body: bool = False):
    """
    - Keeps existing behavior: sets X-Total-Count header using count_items(...)
    - If to_body=True, also returns an envelope:
      { "data": [...], "pagination": { "totalCount": <int> } }
    """
    def decorator(func: Callable) -> Callable:
        is_async = inspect.iscoroutinefunction(func)

        @wraps(func)
        async def wrapper(*args, **kwargs):
            response: Response = kwargs["response"]
            filter_expr = kwargs.get("filter")

            db: Session | None = kwargs.get("db")
            tenant_context = kwargs.get("tenant_context")

            count = 0
            if db and tenant_context:
                organization_id, user_id = tenant_context
                count = count_items(db, model, filter_expr, organization_id, user_id)
                response.headers["X-Total-Count"] = str(count)  # back-compat
            else:
                logger.warning(f"Cannot count {model.__name__} items without organization context")
                response.headers["X-Total-Count"] = "0"

            result = await func(*args, **kwargs) if is_async else func(*args, **kwargs)

            if not to_body:
                return result

            # Normalize to list for the envelope
            data_list: List[Any] = result if isinstance(result, list) else [result]
            return {"data": data_list, "pagination": {"totalCount": count}}

        return wrapper

    return decorator

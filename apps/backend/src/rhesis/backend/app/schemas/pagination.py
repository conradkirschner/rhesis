from typing import Generic, List, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class Pagination(BaseModel):
    totalCount: int

class Paginated(BaseModel, Generic[T]):
    data: List[T]
    pagination: Pagination
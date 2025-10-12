"""
Base schema for all schemas

This module contains the base schema for all schemas in the application.
Note using Pydantic together with SQLAlchemy leads to a lot of code duplication.
This is a known issue and there are some workarounds. One of them is to use
helper libraries such as pydantic_sqlalchemy as future improvement.

"""

from datetime import datetime
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict, field_serializer


class Base(BaseModel):
    id: Optional[UUID4] = None
    nano_id: Optional[str] = None
    model_config = ConfigDict(
        from_attributes=True,
        use_enum_values=True
    )
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_serializer("*")
    def serialize_datetime(self, value, _info):
        if isinstance(value, datetime):
            return value.isoformat()
        return value

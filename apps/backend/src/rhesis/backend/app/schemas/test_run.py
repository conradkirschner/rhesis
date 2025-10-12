from typing import Optional

from pydantic import UUID4

from rhesis.backend.app.schemas import Base
from rhesis.backend.app.schemas.json_value import Json

class TestRunAttributes(Base):
    """Extra metadata for a test run."""
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    environment: Optional[str] = None
    total_tests: Optional[str] = None

# TestRun schemas
class TestRunBase(Base):
    name: Optional[str] = None
    user_id: Optional[UUID4]
    organization_id: Optional[UUID4] = None
    status_id: Optional[UUID4] = None
    attributes: Optional[TestRunAttributes] = None
    test_configuration_id: UUID4
    owner_id: Optional[UUID4] = None
    assignee_id: Optional[UUID4] = None


class TestRunCreate(TestRunBase):
    pass


class TestRunUpdate(TestRunBase):
    user_id: Optional[UUID4] = None
    test_configuration_id: Optional[UUID4] = None
    pass


class TestRun(TestRunBase):
    pass

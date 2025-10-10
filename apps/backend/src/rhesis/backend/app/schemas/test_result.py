from typing import Dict, Optional, Union

from pydantic import UUID4

from rhesis.backend.app.schemas import Base
from rhesis.backend.app.schemas.json_value import Json


# TestResult schemas
class TestResultBase(Base):
    test_configuration_id: UUID4
    test_run_id: Optional[UUID4] = None
    prompt_id: Optional[UUID4] = None
    test_id: Optional[UUID4] = None
    status_id: Optional[UUID4] = None
    test_metrics: Optional[Dict[str, Json]] = None
    test_output: Optional[Union[str, Dict[str, Json]]] = None
    user_id: Optional[UUID4] = None
    organization_id: Optional[UUID4] = None


class TestResultCreate(TestResultBase):
    pass


class TestResultUpdate(TestResultBase):
    test_configuration_id: Optional[UUID4] = None


class TestResult(TestResultBase):
    pass

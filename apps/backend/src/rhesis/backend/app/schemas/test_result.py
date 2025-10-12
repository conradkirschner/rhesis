from typing import Dict, Optional
from pydantic import UUID4
from rhesis.backend.app.schemas import Base

class MetricResult(Base):
    is_successful: Optional[bool] = None
    reason: Optional[str] = None
    score: Optional[float] = None
    threshold: Optional[float] = None


class TestMetrics(Base):
    metrics: Optional[Dict[str, MetricResult]] = None


class TestOutput(Base):
    output: Optional[str] = None


class TestResultBase(Base):
    test_configuration_id: UUID4
    test_run_id: Optional[UUID4] = None
    prompt_id: Optional[UUID4] = None
    test_id: Optional[UUID4] = None
    status_id: Optional[UUID4] = None
    test_metrics: Optional[TestMetrics] = None
    test_output: Optional[TestOutput] = None
    user_id: Optional[UUID4] = None
    organization_id: Optional[UUID4] = None
    created_at: Optional[str]
    updated_at: Optional[str]

class TestResultCreate(TestResultBase):
    pass


class TestResultUpdate(TestResultBase):
    test_configuration_id: Optional[UUID4] = None


class TestResult(TestResultBase):
    pass

from typing import Dict, List, Optional

from pydantic import BaseModel, Field, RootModel
from rhesis.backend.app.schemas.json_value import Json


class TaskList(BaseModel):
    """Response model for listing available tasks."""

    tasks: List[str]


class TaskPayload(RootModel):
    """Generic payload for task submission."""

    root: Dict[str, Json] = Field(..., description="Task parameters")


class TaskResponse(BaseModel):
    """Response model for task creation."""

    task_id: str


class TaskStatus(BaseModel):
    """Response model for task status."""

    task_id: str
    status: str
    result: Optional[Json] = None
    error: Optional[str] = None


class TaskRevoke(BaseModel):
    """Response model for task revocation."""

    message: str


class WorkerInfo(BaseModel):
    """Information about Celery workers."""

    active: Dict[str, List[Dict[str, Json]]] = Field(default_factory=dict)
    scheduled: Dict[str, List[Dict[str, Json]]] = Field(default_factory=dict)
    reserved: Dict[str, List[Dict[str, Json]]] = Field(default_factory=dict)


class WorkerStats(BaseModel):
    """Statistics about Celery workers."""

    stats: Dict[str, Json] = Field(default_factory=dict)
    registered_tasks: Dict[str, List[str]] = Field(default_factory=dict)
    total_tasks: int


class WorkerStatus(BaseModel):
    """Detailed status of Celery workers."""

    active: Dict[str, Json] = Field(default_factory=dict)
    reserved: Dict[str, Json] = Field(default_factory=dict)
    registered_tasks: Dict[str, Json] = Field(default_factory=dict)
    stats: Dict[str, Json] = Field(default_factory=dict)
    total_tasks: int
    ping: Dict[str, Json] = Field(default_factory=dict)


class HealthCheck(BaseModel):
    """Health check response for Celery workers."""

    status: str
    workers: int
    tasks_registered: int

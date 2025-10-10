"""
Recycle bin management endpoints for soft-deleted records.

These endpoints allow superusers to:
- View soft-deleted records in the recycle bin
- Restore soft-deleted records from the recycle bin
- Permanently delete records (empty recycle bin)
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.inspection import inspect

from rhesis.backend.app import models
from rhesis.backend.app.auth.user_utils import require_current_user_or_token
from rhesis.backend.app.database import get_db
from rhesis.backend.app.models.base import Base
from rhesis.backend.app.utils.crud_utils import (
    get_deleted_items,
    restore_item,
    hard_delete_item,
)
from rhesis.backend.app.schemas.json_value import Json
from rhesis.backend.logging import logger

router = APIRouter(prefix="/recycle", tags=["recycle"])


# ---------- Response Models ----------

class ModelInfo(BaseModel):
    name: str
    class_name: str
    has_organization_id: bool
    has_user_id: bool
    columns: list[str]


class ListModelsResponse(BaseModel):
    count: int
    models: list[ModelInfo]


class RecycledRecordsResponse(BaseModel):
    model: str
    count: int
    items: list[Json]
    has_more: bool


class RestoreResponse(BaseModel):
    message: str
    item: Json


class PermanentlyDeleteResponse(BaseModel):
    message: str
    item_id: str
    warning: str


class CountEntryOk(BaseModel):
    count: int
    class_name: str
    has_more: bool


class CountEntryError(BaseModel):
    # when counting fails for a model
    count: str  # literal "error" in practice
    error: str


class RecycleBinCountsResponse(BaseModel):
    total_models_with_deleted: int
    counts: dict[str, CountEntryOk | CountEntryError]


class FailedItem(BaseModel):
    id: str
    error: str


class BulkRestoreSummary(BaseModel):
    total_requested: int
    restored: int
    failed: int
    not_found: int


class BulkRestoreResults(BaseModel):
    restored: list[str]
    failed: list[FailedItem]
    not_found: list[str]


class BulkRestoreResponse(BaseModel):
    message: str
    summary: BulkRestoreSummary
    results: BulkRestoreResults


class EmptyRecycleBinResponse(BaseModel):
    message: str
    permanently_deleted: int
    failed: int
    warning: str


# ---------- Helpers ----------

def require_superuser(current_user: models.User) -> None:
    """Check if the current user is a superuser."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Only superusers can access this endpoint"
        )


def get_all_models() -> dict[str, type]:
    """
    Automatically discover all SQLAlchemy models that inherit from Base.

    Returns:
        Dictionary mapping lowercase model names to model classes
    """
    model_map: dict[str, type] = {}
    for mapper in Base.registry.mappers:
        model_class = mapper.class_
        # Use the table name as the key (already lowercase)
        table_name = model_class.__tablename__
        model_map[table_name] = model_class
    return model_map


def get_model_by_name(model_name: str) -> type:
    """
    Get a model class by its name.

    Args:
        model_name: Name of the model (table name)

    Returns:
        Model class

    Raises:
        HTTPException: If model not found
    """
    model_map = get_all_models()
    model = model_map.get(model_name.lower())

    if not model:
        available_models = sorted(model_map.keys())
        raise HTTPException(
            status_code=400,
            detail=f"Unknown model: {model_name}. Available models: {', '.join(available_models)}"
        )

    return model


# ---------- Routes ----------

@router.get("/models", response_model=ListModelsResponse)
def list_available_models(
    current_user: models.User = Depends(require_current_user_or_token),
    db: Session = Depends(get_db),
) -> ListModelsResponse:
    """
    List all available models that can be managed (admin only).

    Returns:
        List of model names and their details
    """
    require_superuser(current_user)
    model_map = get_all_models()

    model_info: list[ModelInfo] = []
    for table_name, model_class in sorted(model_map.items()):
        # Get model metadata
        mapper = inspect(model_class)
        model_info.append(
            ModelInfo(
                name=table_name,
                class_name=model_class.__name__,
                has_organization_id=hasattr(model_class, "organization_id"),
                has_user_id=hasattr(model_class, "user_id"),
                columns=[col.name for col in mapper.columns],
            )
        )

    return ListModelsResponse(count=len(model_info), models=model_info)


@router.get("/{model_name}", response_model=RecycledRecordsResponse)
def get_recycled_records(
    model_name: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    organization_id: str | None = Query(None, description="Filter by organization"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_current_user_or_token),
) -> RecycledRecordsResponse:
    """
    Get soft-deleted records in the recycle bin for a specific model (admin only).

    Args:
        model_name: Name of the model (e.g., 'user', 'test', 'project')
        skip: Number of records to skip
        limit: Maximum number of records to return
        organization_id: Optional organization filter

    Returns:
        List of soft-deleted records
    """
    require_superuser(current_user)
    model = get_model_by_name(model_name)

    # Check if model supports organization filtering
    org_id = organization_id if (organization_id and hasattr(model, "organization_id")) else None

    deleted_items = get_deleted_items(
        db, model, skip=skip, limit=limit, organization_id=org_id
    )

    # Convert items to JSON-serializable dicts if needed
    json_items: list[Json] = [item if isinstance(item, dict) else item.__dict__ for item in deleted_items]

    return RecycledRecordsResponse(
        model=model_name,
        count=len(json_items),
        items=json_items,
        has_more=len(json_items) == limit,
    )


@router.post("/{model_name}/{item_id}/restore", response_model=RestoreResponse)
def restore_from_recycle_bin(
    model_name: str,
    item_id: UUID,
    organization_id: str | None = Query(None, description="Organization context"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_current_user_or_token),
) -> RestoreResponse:
    """
    Restore a soft-deleted record from the recycle bin (admin only).

    Args:
        model_name: Name of the model
        item_id: ID of the record to restore
        organization_id: Optional organization context

    Returns:
        Restored record
    """
    require_superuser(current_user)
    model = get_model_by_name(model_name)

    org_id = organization_id if (organization_id and hasattr(model, "organization_id")) else None

    restored_item = restore_item(db, model, item_id, organization_id=org_id)

    if not restored_item:
        raise HTTPException(
            status_code=404,
            detail=f"{model_name} not found in recycle bin or already active",
        )

    logger.info(
        f"Restored {model_name} {item_id} from recycle bin by user {current_user.email}"
    )

    item_json: Json = restored_item if isinstance(restored_item, dict) else restored_item.__dict__
    return RestoreResponse(
        message=f"{model_name} restored successfully from recycle bin",
        item=item_json,
    )


@router.delete("/{model_name}/{item_id}", response_model=PermanentlyDeleteResponse)
def permanently_delete_record(
    model_name: str,
    item_id: UUID,
    confirm: bool = Query(False, description="Must be true to confirm deletion"),
    organization_id: str | None = Query(None, description="Organization context"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_current_user_or_token),
) -> PermanentlyDeleteResponse:
    """
    Permanently delete a record from the recycle bin (admin only).

    WARNING: This action cannot be undone! The record will be permanently
    removed from the database.

    Args:
        model_name: Name of the model
        item_id: ID of the record to delete
        confirm: Must be true to confirm permanent deletion
        organization_id: Optional organization context

    Returns:
        Success message
    """
    require_superuser(current_user)

    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Must set confirm=true to permanently delete records",
        )

    model = get_model_by_name(model_name)

    org_id = organization_id if (organization_id and hasattr(model, "organization_id")) else None

    success = hard_delete_item(db, model, item_id, organization_id=org_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"{model_name} not found in recycle bin",
        )

    logger.warning(
        f"PERMANENT DELETE: {model_name} {item_id} from recycle bin by user {current_user.email}"
    )

    return PermanentlyDeleteResponse(
        message=f"{model_name} permanently deleted from recycle bin",
        item_id=str(item_id),
        warning="This action cannot be undone",
    )


@router.get("/stats/counts", response_model=RecycleBinCountsResponse)
def get_recycle_bin_counts(
    organization_id: str | None = Query(None, description="Filter by organization"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_current_user_or_token),
) -> RecycleBinCountsResponse:
    """
    Get counts of soft-deleted records in the recycle bin for all models (admin only).

    This can take a while for large databases as it queries every table.

    Args:
        organization_id: Optional organization filter

    Returns:
        Dictionary with counts per model
    """
    require_superuser(current_user)
    model_map = get_all_models()
    counts: dict[str, CountEntryOk | CountEntryError] = {}

    for table_name, model in sorted(model_map.items()):
        try:
            # Check if model supports organization filtering
            org_id = organization_id if (organization_id and hasattr(model, "organization_id")) else None

            # Count deleted items (with a reasonable limit)
            deleted_items = get_deleted_items(
                db,
                model,
                limit=10000,  # Max count to avoid performance issues
                organization_id=org_id,
            )
            count_val = len(deleted_items)

            # Only include models that have deleted records
            if count_val > 0:
                counts[table_name] = CountEntryOk(
                    count=count_val,
                    class_name=model.__name__,
                    has_more=count_val >= 10000,
                )
        except Exception as e:
            logger.error(f"Error counting recycled items for {table_name}: {e}")
            counts[table_name] = CountEntryError(count="error", error=str(e))

    total = len(
        [c for c in counts.values() if isinstance(c, CountEntryOk) and c.count > 0]
    )
    return RecycleBinCountsResponse(
        total_models_with_deleted=total,
        counts=counts,
    )


@router.post("/bulk-restore/{model_name}", response_model=BulkRestoreResponse)
def bulk_restore_from_recycle_bin(
    model_name: str,
    item_ids: list[UUID],
    organization_id: str | None = Query(None, description="Organization context"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_current_user_or_token),
) -> BulkRestoreResponse:
    """
    Restore multiple soft-deleted records from the recycle bin at once (admin only).

    Args:
        model_name: Name of the model
        item_ids: List of IDs to restore
        organization_id: Optional organization context

    Returns:
        Summary of restoration results
    """
    require_superuser(current_user)

    if not item_ids:
        raise HTTPException(status_code=400, detail="No item IDs provided")

    if len(item_ids) > 100:
        raise HTTPException(
            status_code=400, detail="Maximum 100 items can be restored at once"
        )

    model = get_model_by_name(model_name)

    org_id = organization_id if (organization_id and hasattr(model, "organization_id")) else None

    restored: list[str] = []
    failed: list[FailedItem] = []
    not_found: list[str] = []

    for item_id in item_ids:
        try:
            restored_item = restore_item(db, model, item_id, organization_id=org_id)
            if restored_item:
                restored.append(str(item_id))
            else:
                not_found.append(str(item_id))
        except Exception as e:
            logger.error(f"Error restoring {model_name} {item_id}: {e}")
            failed.append(FailedItem(id=str(item_id), error=str(e)))

    logger.info(
        f"Bulk restore {model_name} from recycle bin: {len(restored)} restored, "
        f"{len(failed)} failed, {len(not_found)} not found "
        f"by user {current_user.email}"
    )

    return BulkRestoreResponse(
        message=f"Bulk restore completed for {model_name}",
        summary=BulkRestoreSummary(
            total_requested=len(item_ids),
            restored=len(restored),
            failed=len(failed),
            not_found=len(not_found),
        ),
        results=BulkRestoreResults(
            restored=restored,
            failed=failed,
            not_found=not_found,
        ),
    )


@router.delete("/empty/{model_name}", response_model=EmptyRecycleBinResponse)
def empty_recycle_bin_for_model(
    model_name: str,
    confirm: bool = Query(False, description="Must be true to confirm"),
    organization_id: str | None = Query(None, description="Optional organization filter"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_current_user_or_token),
) -> EmptyRecycleBinResponse:
    """
    Empty the recycle bin for a specific model - permanently delete ALL soft-deleted records (admin only).

    WARNING: This action cannot be undone! All soft-deleted records will be
    permanently removed from the database.

    Args:
        model_name: Name of the model
        confirm: Must be true to confirm permanent deletion
        organization_id: Optional organization filter (only delete from this org)

    Returns:
        Count of permanently deleted records
    """
    require_superuser(current_user)

    if not confirm:
        raise HTTPException(
            status_code=400, detail="Must set confirm=true to empty recycle bin"
        )

    model = get_model_by_name(model_name)

    org_id = organization_id if (organization_id and hasattr(model, "organization_id")) else None

    # Get all deleted items
    deleted_items = get_deleted_items(
        db,
        model,
        limit=10000,  # Safety limit
        organization_id=org_id,
    )

    deleted_count = 0
    failed_count = 0

    for item in deleted_items:
        try:
            if hard_delete_item(db, model, item.id, organization_id=org_id):
                deleted_count += 1
            else:
                failed_count += 1
        except Exception as e:
            logger.error(f"Error permanently deleting {model_name} {item.id}: {e}")
            failed_count += 1

    logger.warning(
        f"EMPTY RECYCLE BIN: {model_name} - {deleted_count} permanently deleted, "
        f"{failed_count} failed by user {current_user.email}"
    )

    return EmptyRecycleBinResponse(
        message=f"Recycle bin emptied for {model_name}",
        permanently_deleted=deleted_count,
        failed=failed_count,
        warning="This action cannot be undone",
    )

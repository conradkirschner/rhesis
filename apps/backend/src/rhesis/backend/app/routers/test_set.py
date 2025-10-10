import uuid
from enum import Enum
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from rhesis.backend.app import crud, models, schemas
from rhesis.backend.app.auth.decorators import check_resource_permission
from rhesis.backend.app.auth.permissions import ResourceAction
from rhesis.backend.app.auth.user_utils import require_current_user_or_token
from rhesis.backend.app.dependencies import get_tenant_context, get_tenant_db_session
from rhesis.backend.app.models.test_set import TestSet
from rhesis.backend.app.models.user import User
from rhesis.backend.app.schemas.documents import Document
from rhesis.backend.app.services.prompt import get_prompts_for_test_set, prompts_to_csv
from rhesis.backend.app.services.test import (
    create_test_set_associations,
    remove_test_set_associations,
)
from rhesis.backend.app.services.test_set import (
    bulk_create_test_set,
    execute_test_set_on_endpoint,
    get_test_set_stats,
    get_test_set_test_stats,
    update_test_set_attributes,
)
from rhesis.backend.app.utils.database_exceptions import handle_database_exceptions
from rhesis.backend.app.utils.decorators import with_count_header
from rhesis.backend.app.utils.schema_factory import create_detailed_schema
from rhesis.backend.logging import logger
from rhesis.backend.tasks import task_launcher
from rhesis.backend.tasks.test_set import generate_and_save_test_set

# Create the detailed schema for TestSet and Test
TestSetDetailSchema = create_detailed_schema(schemas.TestSet, models.TestSet)
TestDetailSchema = create_detailed_schema(schemas.Test, models.Test)

router = APIRouter(
    prefix="/test_sets", tags=["test_sets"], responses={404: {"description": "Not found"}}
)


class StatsMode(str, Enum):
    ENTITY = "entity"
    RELATED_ENTITY = "related_entity"


# --- Models ---

class GenerationSample(BaseModel):
    text: str
    behavior: str
    topic: str
    rating: Optional[int] = None
    feedback: Optional[str] = ""


class TestSetGenerationConfig(BaseModel):
    project_name: Optional[str] = None
    behaviors: List[str] = []
    purposes: List[str] = []
    test_type: str = "single_turn"
    response_generation: str = "prompt_only"
    test_coverage: str = "standard"
    tags: List[str] = []
    description: str = ""


class TestSetGenerationRequest(BaseModel):
    config: TestSetGenerationConfig
    samples: List[GenerationSample] = []
    synthesizer_type: str = "prompt"
    num_tests: Optional[int] = None
    batch_size: int = 20
    documents: Optional[List[Document]] = None


class TestSetGenerationResponse(BaseModel):
    task_id: str
    message: str
    estimated_tests: int


class TestSetExecutionResponse(BaseModel):
    status: str
    message: Optional[str] = None
    test_run_id: Optional[uuid.UUID] = None
    task_id: Optional[str] = None


def resolve_test_set_or_raise(identifier: str, db: Session, organization_id: str | None = None) -> TestSet:
    db_test_set = crud.resolve_test_set(identifier, db, organization_id)
    if db_test_set is None:
        raise HTTPException(status_code=404, detail="Test Set not found with provided identifier")
    return db_test_set


def build_generation_prompt(
    config: TestSetGenerationConfig, samples: List[GenerationSample]
) -> str:
    if config.test_type == "single_turn":
        test_type_string = "Single interaction tests"
    else:
        test_type_string = "Multi-turn conversation tests"

    if config.response_generation == "prompt_only":
        output_format_string = "Generate only user inputs"
    else:
        output_format_string = "Generate both user inputs and expected responses"

    prompt_parts = [
        "Generate comprehensive tests based on the following configuration:",
        "",
        "PROJECT CONTEXT:",
        f"- Project: {config.project_name or 'General'}",
        f"- Test Behaviors: {', '.join(config.behaviors)}",
        f"- Test Purposes: {', '.join(config.purposes)}",
        f"- Key Topics: {', '.join(config.tags)}",
        f"- Test Type: {test_type_string}",
        f"- Output Format: {output_format_string}",
        "",
        "SPECIFIC REQUIREMENTS:",
        f"{config.description}",
        "",
    ]

    if samples:
        prompt_parts.extend(
            [
                "SAMPLE EVALUATION FEEDBACK:",
                "The following samples were generated and rated by the user. Use this feedback to improve the quality of new tests:",
                "",
            ]
        )

        for i, sample in enumerate(samples, 1):
            rating_text = f"{sample.rating}/5 stars" if sample.rating is not None else "Not rated"
            prompt_parts.extend(
                [
                    f"Sample {i}:",
                    f'  Text: "{sample.text}"',
                    f"  Behavior: {sample.behavior}",
                    f"  Topic: {sample.topic}",
                    f"  User Rating: {rating_text}",
                ]
            )

            if sample.feedback and sample.feedback.strip():
                prompt_parts.append(f'  User Feedback: "{sample.feedback}"')

            prompt_parts.append("")

        rated_samples = [s for s in samples if s.rating is not None]
        if rated_samples:
            avg_rating = sum(s.rating for s in rated_samples) / len(rated_samples)
            prompt_parts.extend(
                [
                    "QUALITY GUIDANCE:",
                    f"- Average sample rating: {avg_rating:.1f}/5.0",
                ]
            )

            if avg_rating < 3.0:
                prompt_parts.append("- Focus on significant improvements based on the feedback provided")
            elif avg_rating < 4.0:
                prompt_parts.append("- Make moderate improvements based on the feedback while maintaining good aspects")
            else:
                prompt_parts.append("- Maintain the high quality demonstrated in the samples while adding variety")

            prompt_parts.append("")

    prompt_parts.extend(
        [
            "GENERATION INSTRUCTIONS:",
            "Generate tests that:",
            "1. Follow the same format and structure as the samples",
            "2. Address the specific behaviors and purposes listed",
            "3. Incorporate the feedback provided for similar quality improvements",
            "4. Cover the key topics mentioned in the configuration",
            "5. Maintain variety while staying focused on the requirements",
        ]
    )

    return "\n".join(prompt_parts)


def determine_test_count(config: TestSetGenerationConfig, requested_count: Optional[int]) -> int:
    if requested_count is not None and requested_count > 0:
        return requested_count

    coverage_mapping = {
        "focused": 100,
        "standard": 1000,
        "comprehensive": 5000,
    }
    return coverage_mapping.get(config.test_coverage, 1000)


@router.post("/generate", response_model=TestSetGenerationResponse)
async def generate_test_set(
    request: TestSetGenerationRequest,
    db: Session = Depends(get_tenant_db_session),
    current_user: User = Depends(require_current_user_or_token),
) -> TestSetGenerationResponse:
    try:
        if not request.config.behaviors:
            raise HTTPException(status_code=400, detail="At least one behavior must be specified")
        if not request.config.description.strip():
            raise HTTPException(status_code=400, detail="Description is required")

        generation_prompt = build_generation_prompt(request.config, request.samples)
        test_count = determine_test_count(request.config, request.num_tests)

        task_result = task_launcher(
            generate_and_save_test_set,
            request.synthesizer_type,
            current_user=current_user,
            num_tests=test_count,
            batch_size=request.batch_size,
            model="gemini",
            prompt=generation_prompt,
            documents=[doc.dict() for doc in request.documents] if request.documents else None,
        )

        logger.info(
            "Test set generation task launched",
            extra={
                "task_id": task_result.id,
                "user_id": current_user.id,
                "organization_id": current_user.organization_id,
                "synthesizer_type": request.synthesizer_type,
                "test_count": test_count,
                "sample_count": len(request.samples),
            },
        )

        return TestSetGenerationResponse(
            task_id=task_result.id,
            message=f"Test set generation started. You will be notified when {test_count} tests are ready.",
            estimated_tests=test_count,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start test set generation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to start test set generation: {str(e)}")


@router.post("/bulk", response_model=schemas.TestSetBulkResponse)
async def create_test_set_bulk(
    test_set_data: schemas.TestSetBulkCreate,
    db: Session = Depends(get_tenant_db_session),
    current_user: User = Depends(require_current_user_or_token),
) -> schemas.TestSetBulkResponse:
    try:
        test_set = bulk_create_test_set(
            db=db,
            test_set_data=test_set_data,
            organization_id=str(current_user.organization_id),
            user_id=str(current_user.id),
        )
        return test_set
    except Exception as e:
        logger.error(f"Failed to create test set: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create test set: {str(e)}")


@router.post("/", response_model=schemas.TestSet)
@handle_database_exceptions(
    entity_name="test set", custom_unique_message="Test set with this name already exists"
)
async def create_test_set(
    test_set: schemas.TestSetCreate,
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
) -> schemas.TestSet:
    organization_id, user_id = tenant_context
    return crud.create_test_set(db=db, test_set=test_set, organization_id=organization_id, user_id=user_id)


@router.get("/", response_model=list[TestSetDetailSchema])
@with_count_header(model=models.TestSet)
async def read_test_sets(
    response: Response,
    skip: int = 0,
    limit: int = 10,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    filter: str | None = Query(None, alias="$filter", description="OData filter expression"),
    has_runs: bool | None = Query(None, description="Filter test sets by whether they have test runs"),
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
) -> list[TestSetDetailSchema]:
    from rhesis.backend.logging import logger
    logger.info(f"test_sets endpoint called with has_runs={has_runs}")

    organization_id, user_id = tenant_context
    return crud.get_test_sets(
        db=db,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
        filter=filter,
        has_runs=has_runs,
        organization_id=organization_id,
        user_id=user_id,
    )


@router.get("/stats", response_model=schemas.EntityStats)
def generate_test_set_stats(
    top: Optional[int] = None,
    months: Optional[int] = 6,
    mode: StatsMode = StatsMode.ENTITY,
    db: Session = Depends(get_tenant_db_session),
    current_user: User = Depends(require_current_user_or_token),
) -> schemas.EntityStats:
    if mode == StatsMode.ENTITY:
        return get_test_set_stats(
            db=db, current_user_organization_id=current_user.organization_id, top=top, months=months
        )
    else:
        return get_test_set_test_stats(
            db=db,
            test_set_id=None,
            current_user_organization_id=current_user.organization_id,
            top=top,
            months=months,
        )


@router.get("/{test_set_identifier}", response_model=TestSetDetailSchema)
@check_resource_permission(TestSet, ResourceAction.READ)
async def read_test_set(
    test_set_identifier: str,
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
) -> TestSetDetailSchema:
    organization_id, user_id = tenant_context
    return resolve_test_set_or_raise(test_set_identifier, db, organization_id)


@router.delete("/{test_set_id}", response_model=schemas.TestSet)
@check_resource_permission(TestSet, ResourceAction.DELETE)
async def delete_test_set(
    test_set_id: uuid.UUID,
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
) -> schemas.TestSet:
    organization_id, user_id = tenant_context
    db_test_set = crud.delete_test_set(db, test_set_id=test_set_id, organization_id=organization_id, user_id=user_id)
    if db_test_set is None:
        raise HTTPException(status_code=404, detail="Test Set not found")
    return db_test_set


@router.put("/{test_set_id}", response_model=schemas.TestSet)
@check_resource_permission(TestSet, ResourceAction.UPDATE)
@handle_database_exceptions(
    entity_name="test set", custom_unique_message="Test set with this name already exists"
)
async def update_test_set(
    test_set_id: uuid.UUID,
    test_set: schemas.TestSetUpdate,
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
) -> schemas.TestSet:
    organization_id, user_id = tenant_context
    db_test_set = crud.update_test_set(
        db, test_set_id=test_set_id, test_set=test_set, organization_id=organization_id, user_id=user_id
    )
    if db_test_set is None:
        raise HTTPException(status_code=404, detail="Test Set not found")

    try:
        update_test_set_attributes(db=db, test_set_id=str(test_set_id))
    except Exception as e:
        logger.warning(f"Failed to regenerate test set attributes for {test_set_id}: {e}")

    return db_test_set


# ---- CSV download endpoints: declare text/csv so OpenAPI doesn't mark them as JSON ----

@router.get(
    "/{test_set_identifier}/download",
    response_class=StreamingResponse,
    responses={
        200: {
            "content": {"text/csv": {"schema": {"type": "string"}}},
            "description": "CSV export of prompts in the test set",
        },
        404: {"description": "Not found"},
    },
)
def download_test_set_prompts(
    test_set_identifier: str,
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
) -> StreamingResponse:
    try:
        organization_id, user_id = tenant_context
        db_test_set = resolve_test_set_or_raise(test_set_identifier, db, organization_id)
        prompts = get_prompts_for_test_set(db, db_test_set.id, organization_id)

        if not prompts:
            raise HTTPException(status_code=404, detail=f"No prompts found in test set: {test_set_identifier}")

        csv_data = prompts_to_csv(prompts)

        response = StreamingResponse(iter([csv_data]), media_type="text/csv")
        response.headers["Content-Disposition"] = f'attachment; filename="test_set_{test_set_identifier}.csv"'
        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download test set prompts for {test_set_identifier}: {str(e)}")


@router.get(
    "/{test_set_identifier}/prompts/download",
    response_class=StreamingResponse,
    responses={
        200: {
            "content": {"text/csv": {"schema": {"type": "string"}}},
            "description": "CSV export of prompts in the test set",
        },
        404: {"description": "Not found"},
    },
)
def download_test_set_prompts_csv(
    test_set_identifier: str,
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
) -> StreamingResponse:
    try:
        organization_id, user_id = tenant_context
        db_test_set = resolve_test_set_or_raise(test_set_identifier, db, organization_id)
        prompts = get_prompts_for_test_set(db, db_test_set.id, organization_id)

        if not prompts:
            raise HTTPException(status_code=404, detail=f"No prompts found in test set: {test_set_identifier}")

        csv_data = prompts_to_csv(prompts)

        response = StreamingResponse(iter([csv_data]), media_type="text/csv")
        response.headers["Content-Disposition"] = f'attachment; filename="test_set_{test_set_identifier}_prompts.csv"'
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download test set prompts: {str(e)}")


@router.get("/{test_set_identifier}/prompts", response_model=list[schemas.PromptView])
def get_test_set_prompts(
    test_set_identifier: str,
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
) -> list[schemas.PromptView]:
    organization_id, user_id = tenant_context
    db_test_set = resolve_test_set_or_raise(test_set_identifier, db, organization_id)
    return get_prompts_for_test_set(db, db_test_set.id, organization_id)


@router.get("/{test_set_identifier}/tests", response_model=list[TestDetailSchema])
async def get_test_set_tests(
    test_set_identifier: str,
    response: Response,
    skip: int = 0,
    limit: int = 10,
    order_by: str = "created_at",
    order: str = "desc",
    filter: str | None = Query(None, alias="$filter", description="OData filter expression"),
    db: Session = Depends(get_tenant_db_session),
    current_user: User = Depends(require_current_user_or_token),
) -> list[TestDetailSchema]:
    db_test_set = resolve_test_set_or_raise(test_set_identifier, db, str(current_user.organization_id))
    items, count = crud.get_test_set_tests(
        db=db,
        test_set_id=db_test_set.id,
        skip=skip,
        limit=limit,
        sort_by=order_by,
        sort_order=order,
        filter=filter,
    )

    response.headers["X-Total-Count"] = str(count)
    return items


@router.post(
    "/{test_set_identifier}/execute/{endpoint_id}",
    response_model=TestSetExecutionResponse,
)
async def execute_test_set(
    test_set_identifier: str,
    endpoint_id: uuid.UUID,
    test_configuration_attributes: Optional[schemas.TestSetExecutionRequest] = None,
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
) -> TestSetExecutionResponse:
    """Submit a test set for execution against an endpoint."""
    try:
        attributes = None
        if test_configuration_attributes and test_configuration_attributes.execution_options:
            attributes = test_configuration_attributes.execution_options

        organization_id, user_id = tenant_context
        result = execute_test_set_on_endpoint(
            db=db,
            test_set_identifier=test_set_identifier,
            endpoint_id=endpoint_id,
            current_user=current_user,
            test_configuration_attributes=attributes,
            organization_id=organization_id,
            user_id=user_id,
        )

        # Normalize into the typed response
        def _to_uuid(v):
            try:
                return uuid.UUID(str(v)) if v else None
            except Exception:
                return None

        if isinstance(result, dict):
            return TestSetExecutionResponse(
                status=str(result.get("status") or result.get("state") or "queued"),
                message=result.get("message"),
                test_run_id=_to_uuid(result.get("test_run_id")),
                task_id=str(result.get("task_id") or result.get("job_id") or result.get("id") or "") or None,
            )

        return TestSetExecutionResponse(status="queued", message=str(result))

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in test set execution: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to submit test set execution: {str(e)}")


@router.get("/{test_set_identifier}/stats", response_model=schemas.EntityStats)
def generate_test_set_test_stats(
    test_set_identifier: str,
    top: Optional[int] = None,
    months: Optional[int] = 6,
    mode: StatsMode = StatsMode.ENTITY,
    db: Session = Depends(get_tenant_db_session),
    current_user: User = Depends(require_current_user_or_token),
) -> schemas.EntityStats:
    db_test_set = resolve_test_set_or_raise(test_set_identifier, db, str(current_user.organization_id))

    if mode == StatsMode.ENTITY:
        return get_test_set_stats(
            db=db, current_user_organization_id=current_user.organization_id, top=top, months=months
        )
    else:
        return get_test_set_test_stats(
            db=db,
            test_set_id=str(db_test_set.id),
            current_user_organization_id=current_user.organization_id,
            top=top,
            months=months,
        )


@router.post("/{test_set_id}/associate", response_model=schemas.TestSetBulkAssociateResponse)
async def associate_tests_with_test_set(
    test_set_id: uuid.UUID,
    request: schemas.TestSetBulkAssociateRequest,
    db: Session = Depends(get_tenant_db_session),
    current_user: User = Depends(require_current_user_or_token),
) -> schemas.TestSetBulkAssociateResponse:
    result = create_test_set_associations(
        db=db,
        test_set_id=str(test_set_id),
        test_ids=[str(test_id) for test_id in request.test_ids],
        organization_id=str(current_user.organization_id),
        user_id=str(current_user.id),
    )

    if not result["success"]:
        error_detail = {"message": result["message"], "metadata": result["metadata"]}
        raise HTTPException(status_code=400, detail=error_detail)

    return schemas.TestSetBulkAssociateResponse(**result)


@router.post("/{test_set_id}/disassociate", response_model=schemas.TestSetBulkDisassociateResponse)
async def disassociate_tests_from_test_set(
    test_set_id: uuid.UUID,
    request: schemas.TestSetBulkDisassociateRequest,
    db: Session = Depends(get_tenant_db_session),
    current_user: User = Depends(require_current_user_or_token),
) -> schemas.TestSetBulkDisassociateResponse:
    result = remove_test_set_associations(
        db=db,
        test_set_id=str(test_set_id),
        test_ids=[str(test_id) for test_id in request.test_ids],
        organization_id=str(current_user.organization_id),
        user_id=str(current_user.id),
    )

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])

    return schemas.TestSetBulkDisassociateResponse(
        success=result["success"],
        total_tests=result["total_tests"],
        removed_associations=result["removed_associations"],
        message=result["message"],
    )

from rhesis.backend.app.models.user import User
from enum import Enum
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from rhesis.backend.app import crud, models, schemas
from rhesis.backend.app.auth.user_utils import require_current_user_or_token
from rhesis.backend.app.dependencies import get_tenant_context, get_tenant_db_session
from rhesis.backend.app.utils.decorators import with_count_header
from rhesis.backend.app.utils.database_exceptions import handle_database_exceptions
from rhesis.backend.app.utils.schema_factory import create_detailed_schema

TestResultDetailSchema = create_detailed_schema(schemas.TestResult, models.TestResult)


class TestResultStatsMode(str, Enum):
    ALL = "all"
    METRICS = "metrics"
    BEHAVIOR = "behavior"
    CATEGORY = "category"
    TOPIC = "topic"
    OVERALL = "overall"
    TIMELINE = "timeline"
    TEST_RUNS = "test_runs"
    SUMMARY = "summary"  # Overall + metadata only (lightweight)


router = APIRouter(
    prefix="/test_results",
    tags=["test_results"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=schemas.TestResult)
@handle_database_exceptions(
    entity_name="test result", custom_unique_message="test result with this name already exists"
)
def create_test_result(
    test_result: schemas.TestResultCreate,
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
) -> schemas.TestResult:
    """
    Create test result with optimized approach - no session variables needed.

    Performance improvements:
    - Completely bypasses database session variables
    - No SET LOCAL commands needed
    - No SHOW queries during entity creation
    - Direct tenant context injection
    """
    organization_id, user_id = tenant_context

    # Set the user_id to the current user if not provided
    if not test_result.user_id:
        test_result.user_id = current_user.id

    return crud.create_test_result(
        db=db, test_result=test_result, organization_id=organization_id, user_id=user_id
    )


@router.get("/", response_model=List[TestResultDetailSchema])
@with_count_header(model=models.TestResult)
def read_test_results(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    filter: str | None = Query(None, alias="$filter", description="OData filter expression"),
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
) -> List[TestResultDetailSchema]:
    """Get all test results"""
    organization_id, user_id = tenant_context
    test_results = crud.get_test_results(
        db, skip=skip, limit=limit, sort_by=sort_by, sort_order=sort_order, filter=filter, organization_id=organization_id, user_id=user_id
    )
    return test_results


@router.get("/stats", response_model=schemas.TestResultStatsResponse)
def generate_test_result_stats(
    mode: TestResultStatsMode = Query(
        TestResultStatsMode.ALL,
        description="Data mode: 'summary' (lightweight), 'metrics' (individual metrics), "
        "'behavior/category/topic' (dimensional), 'timeline' (trends), "
        "'test_runs' (by run), 'overall' (aggregate), 'all' (complete)"
    ),
    top: Optional[int] = Query(
        None, description="Max items per dimension (e.g., top 10 behaviors)"
    ),
    months: Optional[int] = Query(
        6, description="Months of historical data to include (default: 6)"
    ),
    test_run_id: Optional[UUID] = Query(
        None, description="Filter by specific test run UUID (legacy, use test_run_ids for multiple)"
    ),
    # Test-level filters
    test_set_ids: Optional[List[UUID]] = Query(None, description="Filter by test set IDs"),
    behavior_ids: Optional[List[UUID]] = Query(None, description="Filter by behavior IDs"),
    category_ids: Optional[List[UUID]] = Query(None, description="Filter by category IDs"),
    topic_ids: Optional[List[UUID]] = Query(None, description="Filter by topic IDs"),
    status_ids: Optional[List[UUID]] = Query(None, description="Filter by test status IDs"),
    test_ids: Optional[List[UUID]] = Query(None, description="Filter by specific test IDs"),
    test_type_ids: Optional[List[UUID]] = Query(None, description="Filter by test type IDs"),
    test_run_ids: Optional[List[UUID]] = Query(None, description="Filter by multiple test run IDs"),
    # User-related filters
    user_ids: Optional[List[UUID]] = Query(None, description="Filter by test creator user IDs"),
    assignee_ids: Optional[List[UUID]] = Query(None, description="Filter by assignee user IDs"),
    owner_ids: Optional[List[UUID]] = Query(None, description="Filter by test owner user IDs"),
    # Other filters
    prompt_ids: Optional[List[UUID]] = Query(None, description="Filter by prompt IDs"),
    priority_min: Optional[int] = Query(None, description="Minimum priority level (inclusive)"),
    priority_max: Optional[int] = Query(None, description="Maximum priority level (inclusive)"),
    tags: Optional[List[str]] = Query(
        None, description="Filter by tags (tests must have all specified tags)"
    ),
    # Date range filters
    start_date: Optional[str] = Query(
        None, description="Start date (ISO format, overrides months parameter)"
    ),
    end_date: Optional[str] = Query(
        None, description="End date (ISO format, overrides months parameter)"
    ),
    db: Session = Depends(get_tenant_db_session),
    current_user: User = Depends(require_current_user_or_token),
) -> schemas.TestResultStatsResponse:
    """Get test result statistics with configurable data modes for optimal performance

    ## Available Modes

    ### Performance-Optimized Modes (recommended for specific use cases):

    **`summary`** - Ultra-lightweight (~5% of full data size)
    - Returns: `overall_pass_rates` + `metadata`
    - Use case: Dashboard widgets, quick overviews
    - Response time: ~50ms

    **`metrics`** - Individual metric analysis (~20% of full data size)
    - Returns: `metric_pass_rates` + `metadata`
    - Contains: Pass/fail rates for Answer Fluency, Answer Relevancy, Contextual Recall, etc.
    - Use case: Metric-focused charts, AI model performance analysis

    **`behavior`** - Test behavior analysis (~15% of full data size)
    - Returns: `behavior_pass_rates` + `metadata`
    - Contains: Pass/fail rates grouped by test behavior (Factual Accuracy, Reasoning, etc.)
    - Use case: Behavior performance charts, test strategy optimization

    **`category`** - Test category analysis (~15% of full data size)
    - Returns: `category_pass_rates` + `metadata`
    - Contains: Pass/fail rates grouped by test category (RAG Systems, Chatbots, etc.)
    - Use case: Category performance comparison, domain-specific analysis

    **`topic`** - Test topic analysis (~15% of full data size)
    - Returns: `topic_pass_rates` + `metadata`
    - Contains: Pass/fail rates grouped by topic (Healthcare, Finance, Technology, etc.)
    - Use case: Topic performance insights, domain expertise evaluation

    **`overall`** - High-level overview (~10% of full data size)
    - Returns: `overall_pass_rates` + `metadata`
    - Contains: Aggregate pass/fail rates (test passes only if ALL metrics pass)
    - Use case: Executive dashboards, KPI tracking

    **`timeline`** - Trend analysis (~40% of full data size)
    - Returns: `timeline` + `metadata`
    - Contains: Monthly pass/fail rates over time with metric breakdowns
    - Use case: Trend charts, historical analysis, progress tracking

    **`test_runs`** - Test run comparison (~30% of full data size)
    - Returns: `test_run_summary` + `metadata`
    - Contains: Pass/fail rates grouped by individual test runs
    - Use case: Test run comparison, execution analysis

    ### Complete Dataset Mode:

    **`all`** - Complete dataset (default, full data size)
    - Returns: All sections above combined
    - Use case: Comprehensive dashboards, full analytics
    - Response time: ~200-500ms depending on data volume
    """
    return get_test_result_stats(
        db=db,
        organization_id=str(current_user.organization_id) if current_user.organization_id else None,
        months=months,
        test_run_id=str(test_run_id) if test_run_id else None,
        mode=mode.value,
        # Test-level filters
        test_set_ids=[str(i) for i in test_set_ids] if test_set_ids else None,
        behavior_ids=[str(i) for i in behavior_ids] if behavior_ids else None,
        category_ids=[str(i) for i in category_ids] if category_ids else None,
        topic_ids=[str(i) for i in topic_ids] if topic_ids else None,
        status_ids=[str(i) for i in status_ids] if status_ids else None,
        test_ids=[str(i) for i in test_ids] if test_ids else None,
        test_type_ids=[str(i) for i in test_type_ids] if test_type_ids else None,
        test_run_ids=[str(i) for i in test_run_ids] if test_run_ids else None,
        # User-related filters
        user_ids=[str(i) for i in user_ids] if user_ids else None,
        assignee_ids=[str(i) for i in assignee_ids] if assignee_ids else None,
        owner_ids=[str(i) for i in owner_ids] if owner_ids else None,
        # Other filters
        prompt_ids=[str(i) for i in prompt_ids] if prompt_ids else None,
        priority_min=priority_min,
        priority_max=priority_max,
        tags=tags,
        # Date range filters
        start_date=start_date,
        end_date=end_date,
        top=top,
    )


@router.get("/{test_result_id}", response_model=TestResultDetailSchema)
def read_test_result(
    test_result_id: UUID,
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
) -> TestResultDetailSchema:
    """Get a specific test result by ID"""
    organization_id, user_id = tenant_context
    db_test_result = crud.get_test_result(
        db, test_result_id=test_result_id, organization_id=organization_id, user_id=user_id
    )
    if db_test_result is None:
        raise HTTPException(status_code=404, detail="Test result not found")
    return db_test_result


@router.put("/{test_result_id}", response_model=schemas.TestResult)
def update_test_result(
    test_result_id: UUID,
    test_result: schemas.TestResultUpdate,
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
) -> schemas.TestResult:
    """
    Update test_result with optimized approach - no session variables needed.

    Performance improvements:
    - Completely bypasses database session variables
    - No SET LOCAL commands needed
    - No SHOW queries during update
    - Direct tenant context injection
    """
    organization_id, user_id = tenant_context
    db_test_result = crud.get_test_result(
        db, test_result_id=test_result_id, organization_id=organization_id, user_id=user_id
    )
    if db_test_result is None:
        raise HTTPException(status_code=404, detail="Test result not found")

    # Check if the user has permission to update this test result
    if db_test_result.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to update this test result")

    return crud.update_test_result(
        db=db,
        test_result_id=test_result_id,
        test_result=test_result,
        organization_id=organization_id,
        user_id=user_id,
    )


@router.delete("/{test_result_id}", response_model=schemas.TestResult)
def delete_test_result(
    test_result_id: UUID,
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
) -> schemas.TestResult:
    """Delete a test result"""
    organization_id, user_id = tenant_context
    db_test_result = crud.get_test_result(
        db, test_result_id=test_result_id, organization_id=organization_id, user_id=user_id
    )
    if db_test_result is None:
        raise HTTPException(status_code=404, detail="Test result not found")

    # Check if the user has permission to delete this test result
    if db_test_result.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to delete this test result")

    return crud.delete_test_result(
        db=db, test_result_id=test_result_id, organization_id=organization_id, user_id=user_id
    )

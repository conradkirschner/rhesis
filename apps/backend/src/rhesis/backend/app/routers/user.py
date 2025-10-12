import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy.orm import Session

from rhesis.backend.app import crud, models, schemas
from rhesis.backend.app.auth.user_utils import (
    require_current_user_or_token,
    require_current_user_or_token_without_context,
)
from rhesis.backend.app.dependencies import (
    get_tenant_context,
    get_db_session,
    get_tenant_db_session,
)
from rhesis.backend.app.models.user import User
from rhesis.backend.app.routers.auth import create_session_token
from rhesis.backend.app.utils.decorators import with_count_header
from rhesis.backend.app.utils.database_exceptions import handle_database_exceptions
from rhesis.backend.app.utils.rate_limit import INVITATION_RATE_LIMIT, user_limiter
from rhesis.backend.app.utils.validation import validate_and_normalize_email
from rhesis.backend.logging.rhesis_logger import logger
from rhesis.backend.notifications import email_service
from rhesis.backend.app.schemas.pagination import Paginated

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
    dependencies=[Depends(require_current_user_or_token_without_context)],
)

# ----- Response model used by PUT /users/{user_id} -----
# Put this in your global schemas package if you prefer,
# e.g., schemas.UserUpdateResponse, and import from there.
from pydantic import BaseModel

class UserUpdateResponse(BaseModel):
    user: schemas.User
    session_token: str | None = None


@router.post("/", response_model=schemas.User)
@user_limiter.limit(INVITATION_RATE_LIMIT)
@handle_database_exceptions(
    entity_name="user", custom_unique_message="User with this email already exists"
)
async def create_user(
    request: Request,
    user: schemas.UserCreate,
    db: Session = Depends(get_tenant_db_session),
    current_user: User = Depends(require_current_user_or_token_without_context),
):
    """
    Invite or create a user within the current user's organization.
    - If a user with the same email exists but has no organization, re-invite (re-attach) them.
    - If they belong to another organization, return 409.
    """
    user.organization_id = current_user.organization_id

    try:
        user.email = validate_and_normalize_email(user.email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    existing_user = crud.get_user_by_email(db, user.email)
    if existing_user:
        if existing_user.organization_id is not None:
            raise HTTPException(
                status_code=409,
                detail=(
                    "This user already belongs to an organization. "
                    "They must leave their current organization before joining yours."
                ),
            )

        existing_user.organization_id = current_user.organization_id
        if user.name:
            existing_user.name = user.name
        if user.given_name:
            existing_user.given_name = user.given_name
        if user.family_name:
            existing_user.family_name = user.family_name

        db.commit()
        db.refresh(existing_user)
        created_user = existing_user
        send_invite = user.send_invite
    else:
        send_invite = user.send_invite
        created_user = crud.create_user(db=db, user=user)

    logger.info(f"Email Configured {email_service.is_configured}")

    if send_invite and email_service.is_configured:
        try:
            logger.info(f"Sending invitation email to {created_user.email}")

            organization = None
            if current_user.organization_id:
                organization = (
                    db.query(models.Organization)
                    .filter(models.Organization.id == current_user.organization_id)
                    .first()
                )

            organization_name = organization.name if organization else "Your Organization"
            organization_website = organization.website if organization else None
            inviter_name = (
                current_user.name
                or f"{current_user.given_name or ''} {current_user.family_name or ''}".strip()
                or "Team Member"
            )

            success = email_service.send_team_invitation_email(
                recipient_email=created_user.email,
                recipient_name=created_user.name or created_user.given_name,
                organization_name=organization_name,
                organization_website=organization_website,
                inviter_name=inviter_name,
                inviter_email=current_user.email,
            )
            if success:
                logger.info(f"Successfully sent invitation email to {created_user.email}")
            else:
                logger.warning(f"Failed to send invitation email to {created_user.email}")
        except Exception as e:
            logger.error(f"Error sending invitation email to {created_user.email}: {str(e)}")

    return created_user


@router.get("/", response_model=Paginated[schemas.User])
@with_count_header(model=models.User, to_body=True)
async def read_users(
    response: Response,
    skip: int = 0,
    limit: int = 10,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    filter: str | None = Query(None, alias="$filter", description="OData filter expression"),
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
):
    """Get all users for the tenant with filtering and paging."""
    organization_id, user_id = tenant_context
    return crud.get_users(
        db=db,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
        filter=filter,
        organization_id=organization_id,
        user_id=user_id,
    )


@router.get("/{user_id}", response_model=schemas.User)
def read_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
):
    """Get a specific user by ID (tenant-scoped)."""
    organization_id, user_id_tenant = tenant_context
    db_user = crud.get_user(
        db, user_id=user_id, organization_id=organization_id, tenant_user_id=user_id_tenant
    )
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.delete("/{user_id}", response_model=schemas.User)
def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_tenant_db_session),
    tenant_context=Depends(get_tenant_context),
    current_user: User = Depends(require_current_user_or_token),
):
    """Delete a user (superusers only, tenant-scoped)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to delete users")

    organization_id, user_id_tenant = tenant_context
    try:
        db_user = crud.delete_user(
            db,
            target_user_id=user_id,
            organization_id=organization_id,
            user_id=user_id_tenant,
        )
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return db_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/leave-organization", response_model=schemas.User)
def leave_organization(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user_or_token_without_context),
):
    """
    Allow the current user to leave their organization (sets organization_id to NULL).
    """
    if current_user.organization_id is None:
        raise HTTPException(status_code=400, detail="You are not currently part of any organization")

    db_user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    organization = None
    if db_user.organization_id:
        organization = (
            db.query(models.Organization)
            .filter(models.Organization.id == db_user.organization_id)
            .first()
        )

    db_user.organization_id = None
    db.commit()
    db.refresh(db_user)

    org_name = organization.name if organization else "Unknown"
    logger.info(f"User {db_user.email} left organization {org_name}")

    return db_user


@router.put("/{user_id}", response_model=UserUpdateResponse, response_model_exclude_none=True)
@handle_database_exceptions(
    entity_name="user", custom_unique_message="User with this email already exists"
)
def update_user(
    user_id: uuid.UUID,
    user: schemas.UserUpdate,
    request: Request,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user_or_token_without_context),
) -> UserUpdateResponse:
    """
    Update a user profile. If the current user updates their own profile, include a new session token.

    Returns:
        UserUpdateResponse: {"user": User, "session_token": str | None}
    """
    organization_id = str(current_user.organization_id) if current_user.organization_id else None
    tenant_user_id = str(current_user.id) if current_user.id else None

    db_user = crud.get_user(
        db, user_id=user_id, organization_id=organization_id, tenant_user_id=tenant_user_id
    )
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found or not accessible")

    if str(db_user.id) != str(current_user.id) and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    updated_user = crud.update_user(db, user_id=user_id, user=user)

    session_token = None
    if str(updated_user.id) == str(current_user.id):
        session_token = create_session_token(updated_user)

    return UserUpdateResponse(
        user=schemas.User.model_validate(updated_user),
        session_token=session_token,
    )

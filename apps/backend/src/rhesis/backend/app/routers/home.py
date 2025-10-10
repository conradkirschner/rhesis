from typing import Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from rhesis.backend.app.auth.user_utils import get_current_user, require_current_user
from rhesis.backend.app.models.user import User

router = APIRouter(prefix="/home", tags=["home"])


class HomePublicResponse(BaseModel):
    message: str
    login_url: Optional[str] = None


class HomeProtectedResponse(BaseModel):
    message: str


@router.get("/", response_model=HomePublicResponse)
async def home(request: Request, current_user: Optional[User] = Depends(get_current_user)) -> HomePublicResponse:
    # Public endpoint, user is optional
    base_url = str(request.base_url).rstrip("/")
    if current_user:
        return HomePublicResponse(message=f"Welcome, {current_user.display_name}!")

    return HomePublicResponse(message="Welcome! Please log in.", login_url=f"{base_url}/auth/login")


@router.get("/protected", response_model=HomeProtectedResponse)
async def protected(current_user: User = Depends(require_current_user)) -> HomeProtectedResponse:
    return HomeProtectedResponse(message=f"Welcome, {current_user.display_name}!")

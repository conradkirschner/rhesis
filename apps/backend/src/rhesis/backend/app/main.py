"""
Main module for the FastAPI application.

This module creates the FastAPI application and includes all the routers
defined in the `routers` module. It also creates the database tables
using the `Base` object from the `database` module.

"""

import logging
import os
import time
from typing import Optional
from pydantic import BaseModel

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.sessions import SessionMiddleware

from rhesis.backend import __version__
from rhesis.backend.app.auth.user_utils import require_current_user, require_current_user_or_token
from rhesis.backend.app.utils.git_utils import get_version_info
from rhesis.backend.app.routers import routers
from rhesis.backend.logging import logger

# ---- minimal change start: guard DB import/init by NO_DATABASE --------------
_NO_DB = os.getenv("NO_DATABASE", "").lower() in {"1", "true", "yes"}
if not _NO_DB:
    from rhesis.backend.app.database import Base, engine  # type: ignore

    Base.metadata.create_all(bind=engine)
else:
    logger.info("NO_DATABASE=TRUE → skipping database import and initialization.")
# ---- minimal change end ------------------------------------------------------

# Public routes don't need any authentication
public_routes = [
    "/",
    "/auth/login",
    "/auth/callback",
    "/auth/logout",
    "/home",
    "/docs",
    "/redoc",
    "/openapi.json",
]

# Routes that accept both session and token auth
token_enabled_routes = [
    "/api/",
    "/tokens/",
    "/tasks/",
    "/test_sets/",
    "/topics/",
    "/prompts/",
    "/test_configurations/",
    "/test_results/",
    "/test_runs/",
    "/services/",
    "/organizations/",
    "/demographics/",
    "/dimensions/",
    "/tags/",
    "/users/",
    "/statuses/",
    "/risks/",
    "/projects/",
    "/tests/",
    "/test-contexts/",
    "/comments/",
]


class AuthenticatedAPIRoute(APIRoute):
    def get_dependencies(self):
        if self.path in public_routes:
            # No auth required
            return []
        elif any(self.path.startswith(route) for route in token_enabled_routes):
            # Both session and token auth accepted
            return [Depends(require_current_user_or_token)]
        # Default to session-only auth
        return [Depends(require_current_user)]


def get_api_description():
    """Generate API description with version information."""
    version_info = get_version_info()

    description = "API for testing and evaluating AI models.\n\n## Version Information\n"

    # Add version details
    description += f"- **Version**: {version_info['version']}\n"
    if 'branch' in version_info:
        description += f"- **Branch**: {version_info['branch']}\n"
    if 'commit' in version_info:
        description += f"- **Commit**: {version_info['commit']}\n"

    description += """
## URL Encoding
When using curl, special characters in URLs need to be URL-encoded. For example:
- Encoded: `/tests/?%24filter=prompt_id%20eq%20'89905869-e8e9-4b2f-b362-3598cfe91968'`
- Unencoded: `/tests/?$filter=prompt_id eq '89905869-e8e9-4b2f-b362-3598cfe91968'`

The `$` character must be encoded as `%24` when using curl.
Web browsers handle this automatically.
"""

    return description

app = FastAPI(
    title="Rhesis Backend",
    description=get_api_description(),
    version=__version__,
    servers=[
            {"url": "http://backend:8000"},
            {"url": "http://localhost:8000"}
        ],
    openapi_tags=[
        {"name": "internal", "description": "Operational/internal endpoints"},
        {"name": "frontend", "description": "Used in frontend"}
    ],
    route_class=AuthenticatedAPIRoute,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://frontend:3000",
        "https://app.rhesis.ai",
        "https://dev-app.rhesis.ai",
        "https://dev-api.rhesis.ai",
        "https://stg-app.rhesis.ai",
        "https://stg-api.rhesis.ai",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Test-Header"],
)

# Add session middleware
app.add_middleware(SessionMiddleware, secret_key=os.getenv("AUTH0_SECRET_KEY"))


# Add HTTPS redirect middleware
class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if "X-Forwarded-Proto" in request.headers:
            request.scope["scheme"] = request.headers["X-Forwarded-Proto"]
        return await call_next(request)


app.add_middleware(HTTPSRedirectMiddleware)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Log request
        logger.info(f"Request started: {request.method} {request.url}")
        logger.debug(f"Request headers: {request.headers}")

        try:
            response = await call_next(request)

            # Log response
            process_time = time.time() - start_time
            logger.info(
                f"Request completed: {request.method} {request.url} "
                f"- Status: {response.status_code} - Duration: {process_time:.3f}s"
            )

            return response
        except Exception as e:
            logger.error(
                f"Request failed: {request.method} {request.url} - Error: {str(e)}", exc_info=True
            )
            raise


# Add the middleware to the app
# app.add_middleware(LoggingMiddleware)

# ----- Response models -----
class APIUsageFilteringExample(BaseModel):
    encoded: str
    unencoded: str
    note: str

class APIUsageFiltering(BaseModel):
    note: str
    example: APIUsageFilteringExample

class APIUsage(BaseModel):
    filtering: APIUsageFiltering

class AuthLinks(BaseModel):
    login: str
    callback: str
    logout: str

class RootResponse(BaseModel):
    name: str
    status: str
    # version info can be present or omitted depending on get_version_info()
    version: Optional[str] = None
    branch: Optional[str] = None
    commit: Optional[str] = None

    docs_url: str
    redoc_url: str
    auth: AuthLinks
    home: str
    api_usage: APIUsage

class HealthResponse(BaseModel):
    status: str
# Include routers with custom route class
for router in routers:
    router.route_class = AuthenticatedAPIRoute
    app.include_router(router)


@app.get("/", response_model=RootResponse, include_in_schema=True)
async def root() -> RootResponse:
    """Welcome endpoint with API status"""
    version_info = get_version_info()  # expected keys: version, branch, commit (optional)

    return RootResponse(
        name="Rhesis API",
        status="operational",
        version=version_info.get("version"),
        branch=version_info.get("branch"),
        commit=version_info.get("commit"),
        docs_url="/docs",
        redoc_url="/redoc",
        auth=AuthLinks(
            login="/auth/login",
            callback="/auth/callback",
            logout="/auth/logout",
        ),
        home="/home",
        api_usage=APIUsage(
            filtering=APIUsageFiltering(
                note="When using curl, special characters in URLs need to be URL-encoded. For example:",
                example=APIUsageFilteringExample(
                    encoded="/tests/?%24filter=prompt_id%20eq%20'89905869-e8e9-4b2f-b362-3598cfe91968'",
                    unencoded="/tests/?$filter=prompt_id eq '89905869-e8e9-4b2f-b362-3598cfe91968'",
                    note="The $ character must be encoded as %24 when using curl. Web browsers handle this automatically.",
                ),
            )
        ),
    )

@app.get("/health", response_model=HealthResponse, tags=["internal"])
async def health_check() -> HealthResponse:
    return HealthResponse(status="ok")


# Configure additional FastAPI logging
fastapi_logger = logging.getLogger("fastapi")
fastapi_logger.setLevel(logging.DEBUG)

from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse, JSONResponse, PlainTextResponse, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel

from rhesis.backend.app.auth.user_utils import require_current_user_or_token
from rhesis.backend.app.dependencies import get_tenant_context, get_tenant_db_session
from rhesis.backend.app.models.user import User
from rhesis.backend.app.schemas.json_value import Json
from rhesis.backend.app.schemas.services import (
    ChatRequest,
    DocumentUploadResponse,
    ExtractDocumentRequest,
    ExtractDocumentResponse,
    GenerateContentRequest,
    GenerateTestsRequest,
    GenerateTestsResponse,
    PromptRequest,
    TestConfigRequest,
    TestConfigResponse,
    TextResponse,
)
from rhesis.backend.app.services.document_handler import DocumentHandler, DocumentMetadata
from rhesis.backend.app.services.gemini_client import (
    create_chat_completion,
    get_chat_response,
    get_json_response,
)
from rhesis.backend.app.services.generation import generate_tests
from rhesis.backend.app.services.github import read_repo_contents
from rhesis.backend.app.services.test_config_generator import TestConfigGeneratorService

from rhesis.backend.logging import logger
from rhesis.sdk.services.extractor import DocumentExtractor
from rhesis.sdk.types import Document

router = APIRouter(
    prefix="/services",
    tags=["services"],
    responses={404: {"description": "Not found"}},
    dependencies=[Depends(require_current_user_or_token)],
)


@router.get("/github/contents", response_model=str)
async def get_github_contents(repo_url: str):
    """
    Get the contents of a GitHub repository.
    """
    logger.info(f"Getting GitHub contents for {repo_url}")
    try:
        contents = read_repo_contents(repo_url)
        return contents
    except Exception as e:
        logger.error(f"Failed to get GitHub contents for {repo_url}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail="Failed to retrieve repository contents")


# ----- OpenAI JSON -----
@router.post(
    "/openai/json",
    response_model=Json,
    responses={
        200: {
            "content": {
                "text/event-stream": {
                    "schema": {"type": "string", "example": "data: {\"key\":\"value\"}\\n\\n"}
                }
            }
        }
    },
)
async def get_ai_json_response(prompt_request: PromptRequest):
    """
    Get a JSON response from the LLM (SSE if `stream=True`).
    """
    try:
        if prompt_request.stream:
            async def generate():
                async for chunk in get_json_response(prompt_request.prompt, stream=True):
                    yield f"data: {chunk}\n\n"

            return StreamingResponse(generate(), media_type="text/event-stream")

        result = get_json_response(prompt_request.prompt)
        # Ensure JSON content
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ----- OpenAI Chat (structured JSON OR text) -----
@router.post(
    "/openai/chat",
    # Document both shapes: TextResponse OR arbitrary JSON; plus SSE alternative
    response_model=TextResponse | Json,
    responses={
        200: {
            "content": {
                "text/event-stream": {
                    "schema": {"type": "string", "example": "data: {\"choices\":[...] }\\n\\n"}
                }
            }
        }
    },
)
async def get_ai_chat_response(chat_request: ChatRequest):
    """
    Chat endpoint:
      - SSE stream when `stream=True`
      - JSON shape (LLM-structured) OR TextResponse when not streaming
    """
    try:
        if chat_request.stream:
            return StreamingResponse(
                get_chat_response(
                    messages=[msg.dict() for msg in chat_request.messages],
                    response_format=chat_request.response_format,
                    stream=True,
                ),
                media_type="text/event-stream",
            )

        result = get_chat_response(
            messages=[msg.dict() for msg in chat_request.messages],
            response_format=chat_request.response_format,
            stream=False,
        )

        # If the model returned structured JSON, pass it through;
        # otherwise wrap it in a TextResponse for a stable schema.
        if isinstance(result, (dict, list)):
            return JSONResponse(content=result)
        return TextResponse(text=str(result))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ----- OpenAI-compatible Chat Completions -----
@router.post(
    "/chat/completions",
    response_model=Json,
    responses={
        200: {
            "content": {
                "text/event-stream": {
                    "schema": {"type": "string", "example": "data: {\"id\":\"cmpl_...\"}\\n\\n"}
                }
            }
        }
    },
)
async def create_chat_completion_endpoint(request: Dict[str, Json]):
    """
    OpenAI-compatible Chat Completions API (SSE if `stream=True`).
    """
    try:
        response = create_chat_completion(request)

        if request.get("stream", False):
            return StreamingResponse(response, media_type="text/event-stream")

        # Ensure JSON response
        return JSONResponse(content=response if isinstance(response, (dict, list)) else {"data": response})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ----- Generate Content (either JSON if schema provided, else text) -----
@router.post(
    "/generate/content",
    response_model=TextResponse | Json,
)
async def generate_content_endpoint(request: GenerateContentRequest):
    """
    Generate text using the LLM; if `schema_` is provided, returns validated JSON.
    """
    try:
        from rhesis.sdk.models.providers.gemini import GeminiLLM

        prompt = request.prompt
        schema = request.schema_

        model = GeminiLLM()
        result = model.generate(prompt, schema=schema)

        if isinstance(result, (dict, list)):
            return JSONResponse(content=result)
        return TextResponse(text=str(result))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def _improve_to_generation_payload(p: dict) -> dict:
    """
    Map ImproveTestPrompt -> GenerateTestsPrompt (labels allowed).
    Chooses test_type via a tiny heuristic; default output_format keeps responses.
    """
    original = (p.get("original_test") or "").strip()
    feedback = (p.get("improvement_feedback") or "").strip()
    instruction = (p.get("instruction") or "").strip()
    topic = (p.get("topic") or "").strip()
    behavior_label = (p.get("test_type") or "").strip()  # in ImproveTestPrompt this is a free-text label

    # Heuristic: if it looks like dialogue, treat as multi-turn
    lower = original.lower()
    is_multi = ("user:" in lower) or ("assistant:" in lower) or (original.count("\n") > 2)

    test_type_literal = "Multi-turn conversation tests" if is_multi else "Single interaction tests"

    rating = p.get("user_rating")
    if isinstance(rating, (int, float)):
        rating_str = f"{rating:.1f}/5"
    else:
        rating_str = str(rating or "N/A")

    specific = (
        "Regenerate the test using the original content and feedback.\n\n"
        f"--- Original Test ---\n{original}\n\n"
        f"--- Feedback (rating {rating_str}) ---\n{feedback or 'No detailed feedback provided.'}\n\n"
        f"Instruction: {instruction or 'Please generate a new version that addresses the feedback.'}"
    )

    return {
        "project_context": "Regeneration",
        # We allow labels or UUIDs in these lists; using labels here:
        "test_behaviors": [behavior_label] if behavior_label else [],
        "test_purposes": ["Regenerate existing test from feedback"],
        "key_topics": [topic] if topic else [],
        "specific_requirements": specific,
        "test_type": test_type_literal,  # Literal expected by GenerationConfig
        "output_format": "Generate both user inputs and expected responses",
    }
@router.post("/generate/tests", response_model=GenerateTestsResponse)
async def generate_tests_endpoint(
    request: GenerateTestsRequest,
    db: Session = Depends(get_tenant_db_session),
    current_user: User = Depends(require_current_user_or_token),
):
    """
    Generate test cases using the prompt synthesizer.
    """
    try:
        prompt = request.prompt
        num_tests = request.num_tests
        documents = request.documents

        if not prompt:
            raise HTTPException(status_code=400, detail="prompt is required")

        # --- normalize prompt to a plain dict (JSON-safe) ---
        if isinstance(prompt, BaseModel):
            prompt_payload = prompt.model_dump(mode="json", exclude_none=True)
        else:
            prompt_payload = prompt  # already a dict
        if isinstance(prompt_payload, dict) and "original_test" in prompt_payload:
            prompt_payload = _improve_to_generation_payload(prompt_payload)
        # --- normalize documents (handle pydantic v2/v1) ---
        def to_dict(obj):
            if hasattr(obj, "model_dump"):
                return obj.model_dump(exclude_none=True)
            if hasattr(obj, "dict"):
                return obj.dict(exclude_none=True)
            return obj

        documents_sdk = (
            [Document(**to_dict(doc)) for doc in documents] if documents else None
        )

        # pass plain dict into your synthesizer
        test_cases = await generate_tests(db, current_user, prompt_payload, num_tests, documents_sdk)
        return GenerateTestsResponse(tests=test_cases)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ----- Generate Text (always TextResponse when not streaming) -----
@router.post(
    "/generate/text",
    response_model=TextResponse,
    responses={
        200: {
            "content": {
                "text/event-stream": {
                    "schema": {"type": "string", "example": "data: partial token\\n\\n"}
                }
            }
        }
    },
)
async def generate_text(prompt_request: PromptRequest):
    """
    Generate raw text from a prompt:
      - SSE stream when `stream=True`
      - TextResponse JSON otherwise
    """
    try:
        messages = [{"role": "user", "content": prompt_request.prompt}]

        if prompt_request.stream:
            async def generate():
                response_stream = get_chat_response(
                    messages=messages,
                    response_format="text",
                    stream=True,
                )
                async for chunk in response_stream:
                    if chunk["choices"][0]["delta"]["content"]:
                        yield f"data: {chunk['choices'][0]['delta']['content']}\n\n"

            return StreamingResponse(generate(), media_type="text/event-stream")

        result = get_chat_response(
            messages=messages,
            response_format="text",
            stream=False,
        )

        return TextResponse(text=str(result))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    document: UploadFile = File(...),
    tenant_context=Depends(get_tenant_context),
):
    organization_id, user_id = tenant_context
    handler = DocumentHandler()

    metadata: DocumentMetadata = await handler.save_document(document, organization_id, user_id)
    path = metadata.get("path")
    if not path:
        raise HTTPException(status_code=500, detail="Storage did not return a path")

    return DocumentUploadResponse(path=path)

# ----- Documents: extract -----
@router.post("/documents/extract", response_model=ExtractDocumentResponse)
async def extract_document_content(request: ExtractDocumentRequest):
    """
    Extract text content from an uploaded document.
    """
    try:
        extractor = DocumentExtractor()
        file_extension = Path(request.path).suffix.lower()

        if file_extension not in extractor.supported_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {file_extension}. "
                f"Supported formats: {', '.join(extractor.supported_extensions)}",
            )

        document = Document(name="document", description="Uploaded document", path=request.path)
        extracted_texts = extractor.extract([document])
        content = next(iter(extracted_texts.values()))

        return ExtractDocumentResponse(
            content=content,
            format=file_extension.lstrip("."),
        )

    except FileNotFoundError:
        raise HTTPException(
            status_code=404, detail="Document not found. Please check the file path."
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract document content: {str(e)}")


# ----- Generate Test Config -----
@router.post("/generate/test_config", response_model=TestConfigResponse)
async def generate_test_config(request: TestConfigRequest):
    """
    Generate test configuration JSON based on user description.
    """
    try:
        logger.info(f"Test config generation request for prompt: {request.prompt[:100]}...")
        service = TestConfigGeneratorService()
        result = service.generate_config(request.prompt)
        logger.info("Test config generation successful")
        return result
    except ValueError:
        logger.warning("Invalid request for test config generation")
        raise HTTPException(status_code=400, detail="Invalid request parameters")
    except RuntimeError as e:
        logger.error(f"Test config generation failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate test configuration")
    except Exception as e:
        logger.error(f"Unexpected error in test config generation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

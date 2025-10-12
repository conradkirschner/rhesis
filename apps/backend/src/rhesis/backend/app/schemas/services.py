from typing import Dict, List, Optional, Iterable, Any, Literal, Union

from pydantic import BaseModel, Field, UUID4, field_validator
from uuid import UUID
from rhesis.backend.app.schemas.documents import Document
from rhesis.backend.app.schemas.json_value import Json


class PromptRequest(BaseModel):
    prompt: str
    stream: bool = False


class TextResponse(BaseModel):
    text: str


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    response_format: Optional[str] = None
    stream: bool = False


# ---- Strongly typed prompt for test generation ----
TestType = Literal[
    "Single interaction tests",
    "Multi-turn conversation tests",
]

OutputFormat = Literal[
    "Generate only user inputs",
    "Generate both user inputs and expected responses",
]

IdsOrLabels = List[Union[UUID4, str]]

class GenerateTestsPrompt(BaseModel):
    project_context: str = Field(default="General", min_length=1, max_length=120)
    test_behaviors: IdsOrLabels = Field(default_factory=list)
    test_purposes: IdsOrLabels = Field(default_factory=list)
    key_topics: IdsOrLabels = Field(default_factory=list)
    specific_requirements: Optional[str] = Field(default=None, max_length=10_000)
    test_type: TestType
    output_format: OutputFormat


class ImproveTestPrompt(BaseModel):
    original_test: str = Field(min_length=1, max_length=20_000)
    # Free text (e.g., behavior label like "Politeness"), not the 2-value Literal from the other prompt
    test_type: str = Field(min_length=1, max_length=200)
    topic: str = Field(min_length=1, max_length=200)

    # Frontend sends strings like "4/5 stars"; accept number or string and normalize to float 0..5
    user_rating: str = Field(default='', max_length=10_0)
    improvement_feedback: Optional[str] = Field(default=None, max_length=10_000)
    instruction: str = Field(
        default="Please generate a new version of this test that addresses the feedback.",
        min_length=1,
        max_length=500,
    )


class GenerateTestsRequest(BaseModel):
    prompt: Union[GenerateTestsPrompt, ImproveTestPrompt]  # forward ref okay if defined below; else reorder
    num_tests: int = Field(default=5, ge=1, le=100)
    documents: Optional[List[Document]] = None

class TestPrompt(BaseModel):
    content: str
    language_code: str = "en"


class TestMetadata(BaseModel):
    generated_by: str
    additional_info: Optional[dict[str, Json]] = None


class Test(BaseModel):
    prompt: TestPrompt
    behavior: str
    category: str
    topic: str
    metadata: TestMetadata


class GenerateTestsResponse(BaseModel):
    tests: List[Test]


class DocumentUploadResponse(BaseModel):
    path: str


class ExtractDocumentRequest(BaseModel):
    path: str


class ExtractDocumentResponse(BaseModel):
    content: str
    format: str


class GenerateContentRequest(BaseModel):
    prompt: str
    schema_: Optional[dict[str, Json]] = Field(None, alias="schema")


class TestConfigRequest(BaseModel):
    prompt: str


class TestConfigResponse(BaseModel):
    behaviors: List[str]
    topics: List[str]
    categories: List[str]
    scenarios: List[str]

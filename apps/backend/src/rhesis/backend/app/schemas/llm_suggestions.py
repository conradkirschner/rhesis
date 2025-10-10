from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict
from rhesis.backend.app.schemas.json_value import Json

class LLMSuggestionsModel(BaseModel):
    # Typed hooks you likely emit/consume, but still allow extra keys
    request_headers: Optional[Dict[str, str]] = None
    query_params: Optional[dict[str, Json]] = None
    request_body_template: Optional[Json] = None
    input_mappings: Optional[dict[str, Json]] = None
    notes: Optional[List[str]] = None
    examples: Optional[List[Dict[str, Json]]] = None

    model_config = ConfigDict(extra="forbid")

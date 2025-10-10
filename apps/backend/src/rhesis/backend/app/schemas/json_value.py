# rhesis/backend/app/schemas/json_value.py
from typing import Union
from typing_extensions import TypeAliasType  # pip install typing_extensions>=4.12

Json = TypeAliasType(
    'Json',
    'Union[dict[str, Json], list[Json], str, int, bool, None]',
)

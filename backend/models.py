from pydantic import BaseModel
from typing import Literal, Optional


class VibrateMessage(BaseModel):
    type: Literal["vibrate"]
    pattern: int  # 1-5 (5 = correct, 5 seconds)


class SessionMessage(BaseModel):
    type: Literal["create_session", "join_session"]
    session_code: Optional[str] = None


class StatusMessage(BaseModel):
    type: Literal[
        "partner_connected",
        "partner_disconnected",
        "session_created",
        "session_joined",
        "error"
    ]
    session_code: Optional[str] = None
    message: Optional[str] = None
    user_count: Optional[int] = None


class WebSocketMessage(BaseModel):
    type: str
    pattern: Optional[int] = None
    session_code: Optional[str] = None
    message: Optional[str] = None
    user_count: Optional[int] = None


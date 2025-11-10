import asyncio
import random
import time
from typing import Dict, List, Optional, Tuple
from fastapi import WebSocket
import json


class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, List[WebSocket]] = {}
        self.session_metadata: Dict[str, Dict] = {}
        self.connection_to_session: Dict[WebSocket, str] = {}
        self._cleanup_task: Optional[asyncio.Task] = None
        self._start_cleanup_task()

    def _start_cleanup_task(self):
        """Start background task to clean up inactive sessions"""
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._cleanup_inactive_sessions())

    async def _cleanup_inactive_sessions(self):
        """Background task that runs every 5 minutes to clean up inactive sessions"""
        while True:
            try:
                await asyncio.sleep(300)  # 5 minutes
                current_time = time.time()
                sessions_to_remove = []

                for session_code, metadata in self.session_metadata.items():
                    last_activity = metadata.get("last_activity", 0)
                    # Remove sessions inactive for 1 hour
                    if current_time - last_activity > 3600:
                        sessions_to_remove.append(session_code)

                for session_code in sessions_to_remove:
                    await self._remove_session(session_code)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in cleanup task: {e}")

    def generate_session_code(self) -> str:
        """Generate a unique 6-digit session code"""
        while True:
            code = f"{random.randint(100000, 999999)}"
            if code not in self.sessions:
                return code

    async def create_session(self, connection: WebSocket) -> str:
        """Create a new session and return the session code"""
        session_code = self.generate_session_code()
        self.sessions[session_code] = [connection]
        self.connection_to_session[connection] = session_code
        self.session_metadata[session_code] = {
            "created_at": time.time(),
            "last_activity": time.time()
        }
        return session_code

    async def join_session(self, session_code: str, connection: WebSocket) -> Tuple[bool, Optional[str]]:
        """
        Join an existing session. Returns (success, error_message)
        """
        if session_code not in self.sessions:
            return False, "Session not found"

        session = self.sessions[session_code]
        
        if len(session) >= 2:
            return False, "Session is full (maximum 2 users)"

        if connection in session:
            return False, "Already in this session"

        session.append(connection)
        self.connection_to_session[connection] = session_code
        self.session_metadata[session_code]["last_activity"] = time.time()

        # Notify both users if session is now full (2 users)
        if len(session) == 2:
            # Notify the existing user that a partner has connected
            other_connection = session[0]
            try:
                await other_connection.send_json({
                    "type": "partner_connected",
                    "session_code": session_code
                })
            except Exception as e:
                print(f"Error notifying partner: {e}")
            
            # Notify the newly joined user that there's already a partner
            try:
                await connection.send_json({
                    "type": "partner_connected",
                    "session_code": session_code
                })
            except Exception as e:
                print(f"Error notifying new user: {e}")

        return True, None

    async def broadcast_vibration(self, session_code: str, pattern: int, sender: WebSocket):
        """Broadcast vibration pattern to partner (exclude sender)"""
        if session_code not in self.sessions:
            return

        session = self.sessions[session_code]
        self.session_metadata[session_code]["last_activity"] = time.time()

        # Send to all connections in session except sender
        for connection in session:
            if connection != sender:
                try:
                    await connection.send_json({
                        "type": "vibrate",
                        "pattern": pattern
                    })
                except Exception as e:
                    print(f"Error broadcasting vibration: {e}")

    async def remove_connection(self, connection: WebSocket):
        """Remove a connection from its session"""
        if connection not in self.connection_to_session:
            return

        session_code = self.connection_to_session[connection]
        
        if session_code in self.sessions:
            session = self.sessions[session_code]
            if connection in session:
                session.remove(connection)

            # Notify partner if they were connected
            if len(session) > 0:
                other_connection = session[0]
                try:
                    await other_connection.send_json({
                        "type": "partner_disconnected",
                        "session_code": session_code
                    })
                except Exception as e:
                    print(f"Error notifying partner of disconnect: {e}")

            # Remove session if empty
            if len(session) == 0:
                await self._remove_session(session_code)

        del self.connection_to_session[connection]

    async def _remove_session(self, session_code: str):
        """Remove a session completely"""
        if session_code in self.sessions:
            # Close all connections in the session
            for connection in self.sessions[session_code]:
                if connection in self.connection_to_session:
                    del self.connection_to_session[connection]
            del self.sessions[session_code]
        
        if session_code in self.session_metadata:
            del self.session_metadata[session_code]

    def get_session_code(self, connection: WebSocket) -> Optional[str]:
        """Get the session code for a connection"""
        return self.connection_to_session.get(connection)


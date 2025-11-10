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
        print(f"DEBUG: Created new session {session_code} with 1 connection")
        return session_code

    async def join_session(self, session_code: str, connection: WebSocket) -> Tuple[bool, Optional[str]]:
        """
        Join an existing session. Returns (success, error_message)
        Maximum 5 users per session.
        """
        if session_code not in self.sessions:
            return False, "Session not found"

        session = self.sessions[session_code]
        
        if len(session) >= 5:
            return False, "Session is full (maximum 5 users)"

        if connection in session:
            return False, "Already in this session"

        session.append(connection)
        self.connection_to_session[connection] = session_code
        self.session_metadata[session_code]["last_activity"] = time.time()

        print(f"DEBUG: User joined session {session_code}. Total connections: {len(session)}")

        # Notify all users in the session about the new connection
        # Send partner_connected to all existing users (excluding the new one)
        for existing_connection in session:
            if existing_connection != connection:
                try:
                    await existing_connection.send_json({
                        "type": "partner_connected",
                        "session_code": session_code,
                        "user_count": len(session)
                    })
                    print(f"DEBUG: Sent partner_connected to existing user (total: {len(session)})")
                except Exception as e:
                    print(f"ERROR: Error notifying existing user: {e}")
        
        # Notify the newly joined user about existing connections
        if len(session) > 1:
            try:
                await connection.send_json({
                    "type": "partner_connected",
                    "session_code": session_code,
                    "user_count": len(session)
                })
                print(f"DEBUG: Sent partner_connected to new user (total: {len(session)})")
            except Exception as e:
                print(f"ERROR: Error notifying new user: {e}")
        
        print(f"DEBUG: Session {session_code} now has {len(session)} user(s)")

        return True, None

    async def broadcast_vibration(self, session_code: str, pattern: int, sender: WebSocket):
        """Broadcast vibration pattern to partner (exclude sender)"""
        if session_code not in self.sessions:
            print(f"ERROR: Session {session_code} not found in sessions")
            return

        session = self.sessions[session_code]
        self.session_metadata[session_code]["last_activity"] = time.time()

        print(f"DEBUG: Broadcasting vibration pattern {pattern} in session {session_code}")
        print(f"DEBUG: Session has {len(session)} connection(s)")
        print(f"DEBUG: Sender is in session: {sender in session}")

        # Send to all connections in session except sender
        sent_count = 0
        for i, connection in enumerate(session):
            print(f"DEBUG: Checking connection {i}: {id(connection)} (sender: {id(sender)})")
            if connection != sender:
                try:
                    # Check if connection is still open by trying to send
                    print(f"DEBUG: Attempting to send vibration to partner connection {i}")
                    await connection.send_json({
                        "type": "vibrate",
                        "pattern": pattern
                    })
                    sent_count += 1
                    print(f"DEBUG: ✓ Successfully sent vibration message to partner")
                except Exception as e:
                    print(f"ERROR: ✗ Failed to send vibration to partner: {type(e).__name__}: {e}")
                    print(f"ERROR: Connection {i} may be closed or invalid - removing from session")
                    # Remove dead connection from session
                    try:
                        session.remove(connection)
                        if connection in self.connection_to_session:
                            del self.connection_to_session[connection]
                    except:
                        pass
            else:
                print(f"DEBUG: Skipping sender connection {i}")
        
        if sent_count == 0:
            print(f"WARNING: ⚠ No vibration messages were sent!")
            print(f"WARNING: Session {session_code} has {len(session)} connection(s)")
            if len(session) == 1:
                print(f"WARNING: Only 1 connection in session - sender has no partner!")
            elif len(session) == 2:
                print(f"WARNING: Session has 2 connections but message wasn't sent - possible connection issue")

    async def remove_connection(self, connection: WebSocket):
        """Remove a connection from its session"""
        if connection not in self.connection_to_session:
            return

        session_code = self.connection_to_session[connection]
        
        if session_code in self.sessions:
            session = self.sessions[session_code]
            if connection in session:
                session.remove(connection)

            # Notify all remaining users in the session about the disconnection
            if len(session) > 0:
                for remaining_connection in session:
                    try:
                        await remaining_connection.send_json({
                            "type": "partner_disconnected",
                            "session_code": session_code,
                            "user_count": len(session)
                        })
                    except Exception as e:
                        print(f"Error notifying user of disconnect: {e}")

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


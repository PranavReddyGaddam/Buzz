import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from session_manager import SessionManager
from models import VibrateMessage, SessionMessage, StatusMessage, WebSocketMessage

load_dotenv()

# Initialize session manager
session_manager = SessionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    if session_manager._cleanup_task:
        session_manager._cleanup_task.cancel()
        try:
            await session_manager._cleanup_task
        except asyncio.CancelledError:
            pass


app = FastAPI(lifespan=lifespan)

# CORS configuration
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


@app.websocket("/ws/{session_code}")
async def websocket_endpoint(websocket: WebSocket, session_code: str):
    """WebSocket endpoint for session communication"""
    await websocket.accept()

    connection_session_code = None

    try:
        # Handle initial connection
        if session_code == "new":
            # Create new session
            connection_session_code = await session_manager.create_session(websocket)
            await websocket.send_json({
                "type": "session_created",
                "session_code": connection_session_code,
                "user_count": 1
            })
        else:
            # Validate session code format
            if not session_code.isdigit() or len(session_code) != 6:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid session code format"
                })
                await websocket.close()
                return

            # Try to join existing session
            success, error_message = await session_manager.join_session(session_code, websocket)
            if not success:
                await websocket.send_json({
                    "type": "error",
                    "message": error_message or "Failed to join session"
                })
                await websocket.close()
                return

            connection_session_code = session_code
            # Get current user count from session
            session = session_manager.sessions.get(connection_session_code, [])
            current_user_count = len(session)
            
            await websocket.send_json({
                "type": "session_joined",
                "session_code": connection_session_code,
                "user_count": current_user_count
            })

        # Handle incoming messages
        while True:
            try:
                data = await websocket.receive_json()
                
                # Validate message structure
                try:
                    message = WebSocketMessage(**data)
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Invalid message format: {str(e)}"
                    })
                    continue

                # Handle different message types
                if message.type == "create_session":
                    # Already handled in connection phase
                    continue
                
                elif message.type == "join_session":
                    # Already handled in connection phase
                    continue
                
                elif message.type == "vibrate":
                    if message.pattern is None:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Vibration pattern is required"
                        })
                        continue
                    
                    if message.pattern not in [1, 2, 3, 4, 5]:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Vibration pattern must be 1, 2, 3, 4, or 5"
                        })
                        continue

                    # Get session code for this connection
                    session_code_for_vibrate = session_manager.get_session_code(websocket)
                    print(f"DEBUG: Received vibration message - pattern: {message.pattern}, session_code: {session_code_for_vibrate}")
                    if session_code_for_vibrate:
                        await session_manager.broadcast_vibration(
                            session_code_for_vibrate,
                            message.pattern,
                            websocket
                        )
                    else:
                        print(f"ERROR: No session code found for this WebSocket connection")
                        await websocket.send_json({
                            "type": "error",
                            "message": "Not connected to a session"
                        })
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown message type: {message.type}"
                    })

            except WebSocketDisconnect:
                break
            except Exception as e:
                print(f"Error handling message: {e}")
                try:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Error processing message: {str(e)}"
                    })
                except:
                    break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        # Clean up connection
        await session_manager.remove_connection(websocket)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
else:
    # For Railway and other platforms that set PORT automatically
    # The app will be run via: uvicorn main:app --host 0.0.0.0 --port $PORT
    pass


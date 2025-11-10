#!/usr/bin/env python3
"""
Quick test script to verify backend WebSocket connection.
Run this while the backend server is running.
"""

import asyncio
import websockets
import json
import sys


async def test_websocket():
    """Test WebSocket connection to the backend"""
    uri = "ws://localhost:8000/ws/new"
    
    try:
        print(f"Connecting to {uri}...")
        async with websockets.connect(uri) as websocket:
            print("✓ Connected successfully!")
            
            # Wait for session_created message
            print("Waiting for session creation...")
            response = await websocket.recv()
            data = json.loads(response)
            
            if data.get("type") == "session_created":
                session_code = data.get("session_code")
                print(f"✓ Session created: {session_code}")
                print(f"\nYou can now join this session with code: {session_code}")
                return session_code
            else:
                print(f"✗ Unexpected response: {data}")
                return None
                
    except ConnectionRefusedError:
        print("✗ Connection refused. Is the backend server running?")
        print("  Start it with: python main.py")
        return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None


async def test_join_session(session_code: str):
    """Test joining an existing session"""
    uri = f"ws://localhost:8000/ws/{session_code}"
    
    try:
        print(f"\nConnecting to session {session_code}...")
        async with websockets.connect(uri) as websocket:
            print("✓ Connected to session!")
            
            # Wait for session_joined message
            response = await websocket.recv()
            data = json.loads(response)
            
            if data.get("type") == "session_joined":
                print("✓ Successfully joined session!")
                
                # Wait for partner_connected message
                print("Waiting for partner connection...")
                response = await websocket.recv()
                data = json.loads(response)
                
                if data.get("type") == "partner_connected":
                    print("✓ Partner connected!")
                    return True
            else:
                print(f"✗ Unexpected response: {data}")
                return False
                
    except Exception as e:
        print(f"✗ Error joining session: {e}")
        return False


async def test_vibration(session_code: str):
    """Test sending a vibration message"""
    uri = f"ws://localhost:8000/ws/{session_code}"
    
    try:
        async with websockets.connect(uri) as websocket:
            # Send vibration message
            message = {"type": "vibrate", "pattern": 1}
            await websocket.send(json.dumps(message))
            print("✓ Vibration message sent!")
            return True
    except Exception as e:
        print(f"✗ Error sending vibration: {e}")
        return False


def test_health():
    """Test health endpoint"""
    import urllib.request
    import json
    
    try:
        with urllib.request.urlopen("http://localhost:8000/health") as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                if data.get("status") == "ok":
                    print("✓ Health endpoint is working!")
                    return True
                else:
                    print(f"✗ Health endpoint returned: {data}")
                    return False
            else:
                print(f"✗ Health endpoint returned status: {response.status}")
                return False
    except urllib.error.URLError as e:
        print(f"✗ Error checking health: {e}")
        print("  Make sure the backend server is running on port 8000")
        return False
    except Exception as e:
        print(f"✗ Error checking health: {e}")
        return False


async def main():
    print("=" * 50)
    print("Backend Connection Test")
    print("=" * 50)
    
    # Test health endpoint
    print("\n1. Testing health endpoint...")
    test_health()
    
    # Test WebSocket connection and session creation
    print("\n2. Testing WebSocket connection...")
    session_code = await test_websocket()
    
    if not session_code:
        print("\n✗ Tests failed. Make sure the backend server is running.")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✓ Basic tests passed!")
    print("=" * 50)
    print("\nTo test full functionality:")
    print("1. Open http://localhost:5173 in your browser")
    print("2. Create a session in one window")
    print("3. Join the session in another window")
    print("4. Test vibration buttons")
    print(f"\nOr test joining this session: {session_code}")


if __name__ == "__main__":
    asyncio.run(main())


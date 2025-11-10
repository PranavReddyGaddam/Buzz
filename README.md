# Vibration Communication Webapp

A real-time vibration communication webapp that connects two people in a session. When one person clicks a button (A/B/C/D), the other person's device vibrates with different patterns (1/2/3/4 times respectively).

## Quick Start Testing

**To test the app locally before deployment:**

1. **Start backend:** `cd backend && python main.py` (runs on port 8000)
2. **Start frontend:** `cd frontend && npm run dev` (runs on port 5173)
3. **Open browser:** Go to `http://localhost:5173`
4. **Test with 2 browser windows:** Create session in one, join in the other
5. **Check WebSocket:** Open DevTools (F12) → Network → WS to see connections
6. **Test on mobile:** 
   - **Android:** Use your local IP address for full vibration testing
   - **iOS:** Works in browser but haptic feedback is limited (see [iOS Setup Guide](./IOS_SETUP.md) for native app)

**See [Testing Locally](#testing-locally-before-deployment) section for detailed instructions.**

**For full iOS support with haptic feedback, see [iOS Setup Guide](./IOS_SETUP.md).**

## Tech Stack

- **Backend**: FastAPI (Python) with WebSockets
- **Frontend**: React + TypeScript + Vite with Tailwind CSS 3.4.x
- **Vibration API**: Browser native Vibration API

### Why TypeScript for Frontend and Python for Backend?

**Frontend (TypeScript/JavaScript):**
- Browsers natively execute JavaScript - Python cannot run directly in browsers
- Browser APIs (Vibration, WebSocket, DOM) are JavaScript APIs
- React and modern web frameworks are built for JavaScript/TypeScript
- TypeScript provides type safety and better developer experience
- Industry standard for web frontend development

**Backend (Python):**
- Excellent for server-side logic, APIs, and WebSocket handling
- FastAPI provides great async WebSocket support
- Python is perfect for session management and backend services
- Can run on any server (not limited to browsers)

**Could we use Python for frontend?**
- Technically possible with transpilers (Brython, Pyodide), but:
  - Adds complexity and performance overhead
  - Limited ecosystem and tooling support
  - Not standard practice (harder to maintain/hire)
  - Browser APIs still need JavaScript translation
- **Conclusion**: TypeScript/JavaScript is the right choice for web frontend

### How Vibration Works: Backend vs Frontend

**Important distinction:** The backend (FastAPI) does NOT trigger vibrations. It only routes messages!

**Flow:**
1. **User 1 clicks button** → Frontend (TypeScript) sends WebSocket message: `{"type": "vibrate", "pattern": 1}`
2. **Backend (FastAPI)** receives message and broadcasts it to User 2's WebSocket connection
3. **User 2's Frontend (TypeScript)** receives the message via WebSocket
4. **User 2's Frontend** calls `navigator.vibrate()` - **THIS is where the actual vibration happens** (in the browser)
5. **User 2's device vibrates** - This happens entirely in the browser, not on the server!

**Backend's Role:**
- ✅ Manages WebSocket connections
- ✅ Routes messages between users
- ✅ Handles session management
- ❌ Does NOT trigger vibrations (can't access device hardware)

**Frontend's Role:**
- ✅ Sends vibration messages via WebSocket
- ✅ Receives vibration messages via WebSocket
- ✅ **Actually triggers device vibration** using browser's Vibration API
- ✅ Handles UI and user interactions

**Why this matters:**
- The Vibration API (`navigator.vibrate()`) is a **browser API**, not a server API
- The backend server has no access to the user's device hardware
- Vibration must happen in the browser (frontend) where the device is
- The backend is just a "messenger" that routes messages between clients

## Features

- Session code generation and validation (6-digit codes)
- Real-time connection status indicators
- Vibration patterns trigger on partner's device
- Handle edge cases (3rd person tries to join, disconnections, etc.)
- Clean, minimal UI with Tailwind CSS
- Auto-cleanup of inactive sessions (1 hour timeout)
- Automatic reconnection with exponential backoff

## Project Structure

```
.
├── backend/
│   ├── main.py              # FastAPI app with WebSocket endpoint
│   ├── session_manager.py   # Session pairing and message routing
│   ├── models.py           # Pydantic models
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # Main component with session logic
│   │   ├── components/
│   │   │   ├── SessionCreate.tsx    # Create session UI
│   │   │   ├── SessionJoin.tsx      # Join session UI
│   │   │   └── VibrationControl.tsx # A/B/C/D buttons
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts      # WebSocket connection hook
│   │   └── types/
│   │       └── websocket.ts         # TypeScript type definitions
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create a `.env` file** (optional, defaults are provided):
   ```bash
   PORT=8000
   CORS_ORIGINS=http://localhost:5173
   ```

5. **Run the backend server:**
   ```bash
   python main.py
   ```
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   The backend will be running at `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file** (optional, defaults are provided):
   ```bash
   VITE_WS_URL=ws://localhost:8000/ws
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

   The frontend will be running at `http://localhost:5173`

## Usage

1. **Start the backend server** (see Backend Setup)
2. **Start the frontend server** (see Frontend Setup)
3. **Open the webapp** in your browser at `http://localhost:5173`
4. **Create a session:**
   - Click "Create Session" to generate a 6-digit session code
   - Share the session code with another person
5. **Join a session:**
   - Click "Join Session"
   - Enter the 6-digit session code
   - Click "Join"
6. **Send vibrations:**
   - Once both users are connected, click buttons A, B, C, or D
   - Button A: 1 vibration (200ms)
   - Button B: 2 vibrations (200ms, pause 100ms, 200ms)
   - Button C: 3 vibrations (200ms, pause 100ms, 200ms, pause 100ms, 200ms)
   - Button D: 4 vibrations (200ms, pause 100ms, 200ms, pause 100ms, 200ms, pause 100ms, 200ms)
   - The partner's device will vibrate with the corresponding pattern

## Environment Variables

### Backend

- `PORT` (default: 8000): Port number for the backend server
- `CORS_ORIGINS` (default: http://localhost:5173): Comma-separated list of allowed CORS origins

### Frontend

- `VITE_WS_URL` (default: ws://localhost:8000/ws): WebSocket URL for the backend server

## Known Limitations & iOS Support

### Vibration/Haptic Feedback Support

**Android (Web Browser):**
- ✅ Full support - vibration works on button presses AND when receiving messages
- ✅ Works in Chrome, Firefox, Edge, and other Android browsers

**iOS (Web Browser):**
- ⚠️ **Limited support** - haptic feedback works on button presses (automatic iOS feature)
- ❌ **Does NOT work when receiving vibration messages** (iOS Safari limitation)
- ✅ All other features work (WebSocket, UI, session management)
- 📱 **For full iOS support**: Use the native iOS app (see [iOS Setup Guide](./IOS_SETUP.md))

**Why iOS Web Browser is Limited:**
- iOS Safari does not support the Vibration API
- All iOS browsers use WebKit (Apple restriction)
- Programmatic haptic feedback requires user interaction in iOS Safari
- Solution: Wrap the app with Capacitor to create a native iOS app

**Desktop:**
- ❌ No vibration hardware
- ✅ All other features work (WebSocket, UI, testing)

### Full Platform Support Matrix

| Platform | Button Haptics | Receive Message Haptics | WebSocket | Session Management |
|----------|---------------|------------------------|-----------|-------------------|
| Android Web | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| iOS Web | ✅ Yes* | ❌ No | ✅ Yes | ✅ Yes |
| iOS Native (Capacitor) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Desktop | ❌ No | ❌ No | ✅ Yes | ✅ Yes |

*iOS Web: Haptic feedback only works on direct button presses, not programmatically when receiving messages.

- **Session Limit**: Maximum 5 users per session. If a 6th person tries to join, they will receive an error message.

- **Session Cleanup**: Sessions are automatically cleaned up after 1 hour of inactivity.

## API Endpoints

### WebSocket Endpoint

- `WS /ws/{session_code}`: WebSocket endpoint for session communication
  - `{session_code}`: 6-digit session code or "new" to create a new session

### HTTP Endpoints

- `GET /health`: Health check endpoint

## Message Types

### Client to Server

- `create_session`: Create a new session (sent when connecting to `/ws/new`)
- `join_session`: Join an existing session
- `vibrate`: Send vibration pattern to partner
  ```json
  {
    "type": "vibrate",
    "pattern": 1  // 1-4
  }
  ```

### Server to Client

- `session_created`: Session created successfully
  ```json
  {
    "type": "session_created",
    "session_code": "123456"
  }
  ```

- `session_joined`: Session joined successfully
  ```json
  {
    "type": "session_joined",
    "session_code": "123456"
  }
  ```

- `partner_connected`: Partner has connected to the session
- `partner_disconnected`: Partner has disconnected from the session
- `vibrate`: Receive vibration pattern from partner
  ```json
  {
    "type": "vibrate",
    "pattern": 1  // 1-4
  }
  ```

- `error`: Error message
  ```json
  {
    "type": "error",
    "message": "Error message here"
  }
  ```

## Development

### Backend Development

- The backend uses FastAPI with WebSockets
- Session management is handled by the `SessionManager` class
- Sessions are stored in memory (no database required)
- Background task runs every 5 minutes to clean up inactive sessions

### Frontend Development

- The frontend uses React with TypeScript
- Tailwind CSS 3.4.x is used for styling
- WebSocket connection is managed by the `useWebSocket` hook
- Automatic reconnection with exponential backoff on disconnect

## Testing Locally (Before Deployment)

### Prerequisites Check

1. **Verify backend dependencies:**
   ```bash
   cd backend
   pip list | grep -E "fastapi|uvicorn|websockets|pydantic"
   ```
   You should see all required packages installed.

2. **Verify frontend dependencies:**
   ```bash
   cd frontend
   npm list --depth=0
   ```
   You should see React, TypeScript, Vite, and Tailwind CSS installed.

### Step 1: Start the Backend Server

1. **Open a terminal and navigate to backend:**
   ```bash
   cd backend
   source venv/bin/activate  # Activate virtual environment
   python main.py
   ```

2. **Verify backend is running:**
   - You should see: `Uvicorn running on http://0.0.0.0:8000`
   - Test the health endpoint:
     ```bash
     curl http://localhost:8000/health
     ```
     Should return: `{"status":"ok"}`

### Step 2: Start the Frontend Server

1. **Open a NEW terminal and navigate to frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Verify frontend is running:**
   - You should see: `Local: http://localhost:5173/`
   - Open `http://localhost:5173` in your browser
   - You should see the landing page with "Create Session" and "Join Session" buttons

### Step 3: Test Session Creation and Joining (Desktop Browser)

**Note:** Vibration won't work on desktop, but you can test the WebSocket connection and UI.

1. **Open two browser windows/tabs:**
   - Window 1: `http://localhost:5173` (will be User 1)
   - Window 2: `http://localhost:5173` (will be User 2)

2. **Test session creation (User 1):**
   - Click "Create Session"
   - Wait for connection (you should see "Creating session...")
   - You should see a 6-digit session code displayed
   - Status should show "Waiting for Partner" (yellow indicator)

3. **Test session joining (User 2):**
   - Click "Join Session"
   - Enter the 6-digit session code from User 1
   - Click "Join"
   - You should see the session view with the same session code
   - Status should show "Partner Connected" (green indicator) on BOTH windows

4. **Verify WebSocket connection in browser DevTools:**
   - Open DevTools (F12) → Network tab → WS (WebSocket) filter
   - You should see WebSocket connection to `ws://localhost:8000/ws/...`
   - Click on it to see messages being exchanged
   - In the Messages tab, you should see:
     - `session_created` / `session_joined` messages
     - `partner_connected` messages when User 2 joins

### Step 4: Test Vibration Buttons (Desktop - UI Only)

1. **With both users connected:**
   - Click button A, B, C, or D on User 1's window
   - Check browser console (F12 → Console) for any errors
   - Buttons should have visual feedback (scale animation)
   - Note: Vibration won't work on desktop, but the WebSocket messages should be sent

2. **Check WebSocket messages:**
   - In DevTools → Network → WS → Messages
   - You should see `{"type":"vibrate","pattern":1}` (or 2, 3, 4) messages
   - The receiving user should see the message in their WebSocket connection

### Step 5: Test on Mobile Device (For Actual Vibration)

**Important:** Vibration API only works on Android mobile browsers. **It does NOT work on iOS devices** (including Chrome, Safari, Firefox, or any other browser on iPhone/iPad) due to Apple's WebKit restrictions.

1. **Find your local IP address:**
   ```bash
   # On macOS/Linux:
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # On Windows:
   ipconfig
   ```
   Example: `192.168.1.100`

2. **Update backend CORS (if needed):**
   - Edit `backend/main.py` or create `.env` file:
     ```bash
     CORS_ORIGINS=http://localhost:5173,http://192.168.1.100:5173
     ```
   - Restart backend server

3. **Update frontend WebSocket URL:**
   - Create `frontend/.env` file:
     ```bash
     VITE_WS_URL=ws://192.168.1.100:8000/ws
     ```
   - Restart frontend server
   - Or use your local IP in the frontend code temporarily

4. **Access from mobile device:**
   - Connect mobile device to same Wi-Fi network
   - **Android:** Open Chrome, Firefox, or Edge browser
   - **iOS:** Will NOT work - vibration API is not supported on any iOS browser
   - Navigate to: `http://192.168.1.100:5173`

5. **Test vibration:**
   - Create session on one Android mobile device
   - Join session on another Android mobile device (or desktop for UI testing)
   - Click vibration buttons - the receiving Android device should vibrate!
   - **Note:** If testing on iOS, the app will work (WebSocket, UI, buttons) but vibration will NOT work

### Step 6: Test Error Cases

1. **Test invalid session code:**
   - Try joining with code "12345" (5 digits) → Should show error
   - Try joining with code "abcdef" → Should show error

2. **Test non-existent session:**
   - Try joining with code "999999" → Should show "Session not found" error

3. **Test session full:**
   - Create session with User 1
   - Join with User 2
   - Try joining with User 3 (in a third window) → Should show "Session is full" error

4. **Test disconnection:**
   - Connect User 1 and User 2
   - Close User 2's browser tab
   - User 1 should see "Partner Disconnected" status change

### Step 7: Verify Backend Logs

Check the backend terminal for:
- WebSocket connection messages
- Session creation/joining logs
- Any error messages
- Cleanup task running (every 5 minutes)

### Step 8: Test Health Endpoint

```bash
curl http://localhost:8000/health
```

Should return: `{"status":"ok"}`

### Step 9: Automated Backend Test (Optional)

A test script is provided to quickly verify the backend is working:

```bash
cd backend
python test_connection.py
```

This will test:
- Health endpoint
- WebSocket connection
- Session creation
- Message handling

**Note:** The test script uses only Python standard library - no additional dependencies needed!

### Quick Test Checklist

- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Landing page loads correctly
- [ ] Session creation generates 6-digit code
- [ ] Session joining works with valid code
- [ ] Both users show "Partner Connected" status
- [ ] WebSocket connection visible in DevTools
- [ ] Vibration buttons send WebSocket messages
- [ ] Error handling works (invalid code, full session, etc.)
- [ ] Partner disconnection is detected
- [ ] Mobile device can connect (if testing vibration)
- [ ] Vibration works on Android mobile device (Chrome/Firefox/Edge)
- [ ] App works on iOS (UI/WebSocket) but shows vibration warning

### Browser Console Checks

Open browser DevTools (F12) and check:

1. **Console tab:**
   - No red error messages
   - WebSocket connection messages (if logged)

2. **Network tab → WS (WebSocket):**
   - Connection status: "101 Switching Protocols"
   - Messages being sent/received
   - Connection stays open

3. **Application tab → Storage:**
   - Check if any data is being stored (should be minimal)

### Common Issues and Solutions

1. **"WebSocket connection failed":**
   - Verify backend is running on port 8000
   - Check `VITE_WS_URL` in frontend `.env` file
   - Check browser console for CORS errors

2. **"Session not found" when joining:**
   - Verify session code is exactly 6 digits
   - Check that backend server is running
   - Verify both frontend and backend are using same server

3. **Vibration not working:**
   - Must use Android mobile browser (Chrome, Firefox, or Edge)
   - **iOS devices (iPhone/iPad) do NOT support Vibration API** - this includes Chrome, Safari, Firefox, and all other browsers on iOS due to Apple's WebKit restrictions
   - Desktop browsers don't have vibration hardware
   - Check browser console for vibration API errors
   - The app will show a warning message if vibration API is not supported

4. **CORS errors:**
   - Update `CORS_ORIGINS` in backend `.env` file
   - Include both `http://localhost:5173` and your local IP
   - Restart backend server after changes

## Troubleshooting

- **WebSocket connection fails:**
  - Check that the backend server is running
  - Verify the `VITE_WS_URL` environment variable is correct
  - Check browser console for errors

- **Vibration not working:**
  - Verify you're using a mobile browser (not desktop)
  - Check that the device supports vibration
  - Note that iOS Safari does not support the Vibration API

- **Session not found:**
  - Verify the session code is correct (6 digits)
  - Check that the session hasn't expired (1 hour timeout)
  - Verify the backend server is running

## License

This project is open source and available under the MIT License.


import { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import SessionJoin from './components/SessionJoin';
import VibrationControl from './components/VibrationControl';

type View = 'landing' | 'create' | 'join' | 'session';

// localStorage keys
const SESSION_CODE_KEY = 'buzz_session_code';
const SESSION_TYPE_KEY = 'buzz_session_type'; // 'created' or 'joined'

function App() {
  const [view, setView] = useState<View>('landing');
  const [sessionCode, setSessionCode] = useState<string>(() => {
    // Try to restore session code from localStorage on mount
    return localStorage.getItem(SESSION_CODE_KEY) || '';
  });
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [userCount, setUserCount] = useState<number>(1);
  const [wsUrl, setWsUrl] = useState<string | null>(null);

  // Get WebSocket URL from environment variable
  // In production: wss://buzz-production.up.railway.app/ws (or just wss://buzz-production.up.railway.app)
  // In development: ws://localhost:8000/ws (fallback)
  const rawWsUrl = import.meta.env.VITE_WS_URL || (import.meta.env.DEV ? 'ws://localhost:8000/ws' : undefined);
  
  // Ensure the URL ends with /ws for the WebSocket endpoint
  // If user provided just the base URL (e.g., wss://buzz-production.up.railway.app),
  // automatically append /ws
  const wsBaseUrl = rawWsUrl
    ? rawWsUrl.endsWith('/ws')
      ? rawWsUrl
      : rawWsUrl.endsWith('/')
      ? `${rawWsUrl}ws`
      : `${rawWsUrl}/ws`
    : undefined;

  const { sendMessage, lastMessage, connectionStatus, error } = useWebSocket(wsUrl);

  // Save session code to localStorage whenever it changes
  useEffect(() => {
    if (sessionCode) {
      localStorage.setItem(SESSION_CODE_KEY, sessionCode);
    } else {
      localStorage.removeItem(SESSION_CODE_KEY);
      localStorage.removeItem(SESSION_TYPE_KEY);
    }
  }, [sessionCode]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'session_created':
        if (lastMessage.session_code) {
          setSessionCode(lastMessage.session_code);
          setUserCount(1);
          setPartnerConnected(false);
          localStorage.setItem(SESSION_TYPE_KEY, 'created');
          setView('session');
        }
        break;

      case 'session_joined':
        if (lastMessage.session_code) {
          setSessionCode(lastMessage.session_code);
          localStorage.setItem(SESSION_TYPE_KEY, 'joined');
          // When joining, user_count will be set by partner_connected message
          setView('session');
        }
        break;

      case 'partner_connected':
        setPartnerConnected(true);
        if (lastMessage.user_count !== undefined) {
          setUserCount(lastMessage.user_count);
        } else {
          // Fallback: increment if we don't have user_count
          setUserCount(prev => Math.min(prev + 1, 5));
        }
        break;

      case 'partner_disconnected':
        if (lastMessage.user_count !== undefined) {
          setUserCount(lastMessage.user_count);
          setPartnerConnected(lastMessage.user_count > 1);
        } else {
          // Fallback: decrement if we don't have user_count
          setUserCount(prev => {
            const newCount = Math.max(prev - 1, 1);
            setPartnerConnected(newCount > 1);
            return newCount;
          });
        }
        break;

      case 'error':
        console.error('WebSocket error:', lastMessage.message);
        if (lastMessage.message?.includes('Session is full')) {
          alert('Session is full. Maximum 5 users allowed.');
          setView('landing');
          setWsUrl(null);
          // Clear saved session if session is full
          localStorage.removeItem(SESSION_CODE_KEY);
          localStorage.removeItem(SESSION_TYPE_KEY);
        } else if (lastMessage.message?.includes('Session not found')) {
          alert('Session not found. The session may have expired. Please create or join a new session.');
          setView('landing');
          setWsUrl(null);
          // Clear saved session if not found
          localStorage.removeItem(SESSION_CODE_KEY);
          localStorage.removeItem(SESSION_TYPE_KEY);
        }
        break;

      default:
        break;
    }
  }, [lastMessage]);

  const handleCreateSession = () => {
    if (!wsBaseUrl) {
      alert('WebSocket URL is not configured. Please set VITE_WS_URL environment variable in Vercel.');
      return;
    }
    setView('create');
    // Connect to WebSocket with "new" endpoint
    const url = `${wsBaseUrl}/new`;
    setWsUrl(url);
  };

  const handleJoinSession = (code: string) => {
    if (!wsBaseUrl) {
      alert('WebSocket URL is not configured. Please set VITE_WS_URL environment variable in Vercel.');
      return;
    }
    // Connect to WebSocket with session code
    const url = `${wsBaseUrl}/${code}`;
    setWsUrl(url);
    // The session_joined message will trigger view change
  };

  const handleBackToLanding = () => {
    setView('landing');
    setSessionCode('');
    setPartnerConnected(false);
    setUserCount(1);
    setWsUrl(null);
    // Clear localStorage when explicitly leaving
    localStorage.removeItem(SESSION_CODE_KEY);
    localStorage.removeItem(SESSION_TYPE_KEY);
  };

  // Try to reconnect to existing session on mount or when wsBaseUrl becomes available
  useEffect(() => {
    const savedSessionCode = localStorage.getItem(SESSION_CODE_KEY);
    
    if (savedSessionCode && wsBaseUrl && !wsUrl && view === 'landing') {
      console.log('Found saved session code, attempting to reconnect:', savedSessionCode);
      // Set session code first so it displays immediately
      setSessionCode(savedSessionCode);
      
      // Reconnect to the session (this will rejoin the existing session)
      const url = `${wsBaseUrl}/${savedSessionCode}`;
      setWsUrl(url);
      setView('session'); // Show session view while reconnecting
    }
  }, [wsBaseUrl, wsUrl, view]); // Re-run if wsBaseUrl changes or wsUrl is not set

  const handleVibrate = (pattern: number) => {
    console.log('Sending vibration message:', { type: 'vibrate', pattern });
    sendMessage({
      type: 'vibrate',
      pattern,
    });
  };

  // Show landing page
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Vibration Communication
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Connect with someone and send vibrations in real-time
          </p>
          <div className="space-y-4">
            <button
              onClick={handleCreateSession}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              Create Session
            </button>
            <button
              onClick={() => setView('join')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-4 px-6 rounded-lg transition-colors duration-200"
            >
              Join Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show join session view
  if (view === 'join') {
    return (
      <SessionJoin
        onJoinSession={handleJoinSession}
        onBack={handleBackToLanding}
      />
    );
  }

  // Show session view (create or joined)
  if (view === 'session' && sessionCode) {
    return (
      <VibrationControl
        sessionCode={sessionCode}
        connectionStatus={connectionStatus}
        partnerConnected={partnerConnected}
        userCount={userCount}
        onVibrate={handleVibrate}
        lastMessage={lastMessage}
        onExit={handleBackToLanding}
      />
    );
  }

  // Show loading/connecting state for create session
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {connectionStatus === 'connecting' ? 'Creating session...' : 'Connecting...'}
          </p>
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default App;


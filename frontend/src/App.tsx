import { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { WebSocketMessage } from './types/websocket';
import SessionCreate from './components/SessionCreate';
import SessionJoin from './components/SessionJoin';
import VibrationControl from './components/VibrationControl';

type View = 'landing' | 'create' | 'join' | 'session';

function App() {
  const [view, setView] = useState<View>('landing');
  const [sessionCode, setSessionCode] = useState<string>('');
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [wsUrl, setWsUrl] = useState<string | null>(null);

  // Get WebSocket URL from environment variable
  const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

  const { sendMessage, lastMessage, connectionStatus, error } = useWebSocket(wsUrl);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'session_created':
        if (lastMessage.session_code) {
          setSessionCode(lastMessage.session_code);
          setView('session');
        }
        break;

      case 'session_joined':
        if (lastMessage.session_code) {
          setSessionCode(lastMessage.session_code);
          setView('session');
        }
        break;

      case 'partner_connected':
        setPartnerConnected(true);
        break;

      case 'partner_disconnected':
        setPartnerConnected(false);
        break;

      case 'error':
        console.error('WebSocket error:', lastMessage.message);
        if (lastMessage.message?.includes('Session is full')) {
          alert('Session is full. Maximum 2 users allowed.');
          setView('landing');
          setWsUrl(null);
        } else if (lastMessage.message?.includes('Session not found')) {
          alert('Session not found. Please check the session code.');
          setView('join');
        }
        break;

      default:
        break;
    }
  }, [lastMessage]);

  const handleCreateSession = () => {
    setView('create');
    // Connect to WebSocket with "new" endpoint
    const url = `${wsBaseUrl}/new`;
    setWsUrl(url);
  };

  const handleJoinSession = (code: string) => {
    // Connect to WebSocket with session code
    const url = `${wsBaseUrl}/${code}`;
    setWsUrl(url);
    // The session_joined message will trigger view change
  };

  const handleBackToLanding = () => {
    setView('landing');
    setSessionCode('');
    setPartnerConnected(false);
    setWsUrl(null);
  };

  const handleVibrate = (pattern: number) => {
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
        onVibrate={handleVibrate}
        lastMessage={lastMessage}
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


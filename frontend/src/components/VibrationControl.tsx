import { useEffect, useState } from 'react';
import { WebSocketMessage, ConnectionStatus } from '../types/websocket';
import { triggerHaptic, getHapticSupport, triggerButtonHaptic } from '../utils/haptic';

interface VibrationControlProps {
  sessionCode: string;
  connectionStatus: ConnectionStatus;
  partnerConnected: boolean;
  userCount: number;
  onVibrate: (pattern: number) => void;
  lastMessage: WebSocketMessage | null;
  onExit: () => void;
}

export default function VibrationControl({
  sessionCode,
  connectionStatus,
  partnerConnected,
  userCount,
  onVibrate,
  lastMessage,
  onExit,
}: VibrationControlProps) {
  const [hapticSupport, setHapticSupport] = useState(getHapticSupport());
  const [pressedButton, setPressedButton] = useState<number | null>(null);
  const [receivedVibration, setReceivedVibration] = useState<number | null>(null);

  useEffect(() => {
    // Check haptic support on mount
    setHapticSupport(getHapticSupport());
  }, []);

  // Handle incoming vibration messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'vibrate' && lastMessage.pattern) {
      console.log('Received vibration message, pattern:', lastMessage.pattern);
      console.log('Haptic support:', hapticSupport);
      console.log('Platform:', navigator.userAgent);
      console.log('Is iOS:', /iPhone|iPad|iPod/.test(navigator.userAgent));
      console.log('Vibration API available:', 'vibrate' in navigator);
      
      // Show visual indicator immediately
      setReceivedVibration(lastMessage.pattern);
      setTimeout(() => {
        setReceivedVibration(null);
      }, 2000); // Show longer so user can see it
      
      // Trigger haptic feedback when receiving vibration message
      // On iOS, this will attempt vibration but may be blocked by browser
      triggerHaptic(lastMessage.pattern).then(() => {
        console.log('Vibration triggered successfully');
      }).catch(err => {
        console.warn('Failed to trigger haptic feedback:', err);
      });
    }
  }, [lastMessage, hapticSupport]);

  const handleButtonClick = async (pattern: number) => {
    console.log('Button clicked, pattern:', pattern);
    console.log('Connection status:', connectionStatus);
    console.log('Partner connected:', partnerConnected);
    console.log('User count:', userCount);
    
    setPressedButton(pattern);
    
    // Trigger haptic feedback on button press (for iOS)
    // On iOS, this will provide haptic feedback automatically when button is pressed
    triggerButtonHaptic();
    
    // Send vibration message to partner
    console.log('Calling onVibrate with pattern:', pattern);
    onVibrate(pattern);
    
    // Reset pressed state after animation
    setTimeout(() => {
      setPressedButton(null);
    }, 300);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return userCount >= 2 ? 'bg-green-500' : 'bg-yellow-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        if (partnerConnected) {
          if (userCount > 1) {
            return `${userCount} Users Connected`;
          }
          return 'Partner Connected';
        }
        return 'Waiting for Others';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="relative">
            {/* Exit Button - Top Right */}
            <button
              onClick={onExit}
              className="absolute top-0 right-0 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 border border-red-200 hover:border-red-300 active:bg-red-200"
            >
              Exit Session
            </button>
            
            {/* Session Info - Centered */}
            <div className="text-center pt-1">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Session Code
              </h1>
              <p className="text-4xl font-mono font-bold text-indigo-600 mb-4 tracking-widest">
                {sessionCode}
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
                <span className="text-sm text-gray-600">{getStatusText()}</span>
              </div>
              {connectionStatus === 'connecting' && (
                <p className="text-xs text-gray-500 mt-2">Reconnecting to session...</p>
              )}
            </div>
          </div>
        </div>

        {/* Haptic Support Info */}
        {!hapticSupport.supported && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 text-center">
              ⚠️ Haptic feedback is not supported on this device. For best experience, use a mobile device.
            </p>
          </div>
        )}
        {hapticSupport.supported && hapticSupport.method === 'ios-haptic' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 text-center">
              ℹ️ <strong>iOS Limitation:</strong> Chrome and Safari on iOS use WebKit and restrict programmatic vibration. 
              Haptics work when <strong>you press buttons</strong>, but <strong>not when receiving messages</strong> from your partner. 
              The app will still attempt to vibrate - check if you feel anything when the green "Vibration Received" message appears.
            </p>
          </div>
        )}

        {/* Received Vibration Indicator */}
        {receivedVibration && (
          <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 mb-6 animate-pulse">
            <p className="text-green-800 text-center font-semibold text-lg">
              📳 Vibration Received! Pattern: {receivedVibration}
            </p>
            {hapticSupport.method === 'ios-haptic' && (
              <p className="text-sm text-green-700 mt-2 text-center">
                ⚠️ iOS browsers (Chrome/Safari) block vibration from WebSocket messages.<br/>
                Check your device - vibration may not have occurred due to browser restrictions.
              </p>
            )}
            {hapticSupport.method === 'vibration' && (
              <p className="text-sm text-green-700 mt-2 text-center">
                ✅ Vibration should have triggered on your device
              </p>
            )}
          </div>
        )}

        {/* Vibration Buttons */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Send Vibration
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'A', pattern: 1, description: '1 vibration' },
              { label: 'B', pattern: 2, description: '2 vibrations' },
              { label: 'C', pattern: 3, description: '3 vibrations' },
              { label: 'D', pattern: 4, description: '4 vibrations' },
            ].map(({ label, pattern, description }) => (
              <button
                key={pattern}
                onClick={() => handleButtonClick(pattern)}
                disabled={connectionStatus !== 'connected' || userCount < 2}
                className={`
                  relative py-12 px-6 rounded-xl font-bold text-2xl
                  transition-all duration-200 transform
                  ${
                    pressedButton === pattern
                      ? 'scale-95 bg-indigo-700'
                      : receivedVibration === pattern
                      ? 'scale-105 bg-green-400 ring-4 ring-green-300'
                      : 'scale-100 hover:scale-105 active:scale-95'
                  }
                  ${
                    connectionStatus === 'connected' && userCount >= 2
                      ? receivedVibration === pattern
                        ? 'bg-green-400 text-white shadow-lg'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <div className="text-4xl mb-2">{label}</div>
                <div className="text-sm font-normal opacity-90">
                  {description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


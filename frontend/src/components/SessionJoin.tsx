import { useState } from 'react';

interface SessionJoinProps {
  onJoinSession: (sessionCode: string) => void;
  onBack: () => void;
}

export default function SessionJoin({ onJoinSession, onBack }: SessionJoinProps) {
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate session code (6 digits)
    if (!/^\d{6}$/.test(sessionCode)) {
      setError('Please enter a valid 6-digit session code');
      return;
    }

    onJoinSession(sessionCode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Join Session
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Enter the 6-digit session code
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={sessionCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setSessionCode(value);
                setError('');
              }}
              placeholder="000000"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none text-center text-2xl font-mono tracking-widest"
              maxLength={6}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
            )}
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={sessionCode.length !== 6}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Join
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


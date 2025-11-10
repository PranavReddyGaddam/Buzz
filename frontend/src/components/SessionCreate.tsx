interface SessionCreateProps {
  onCreateSession: () => void;
}

export default function SessionCreate({ onCreateSession }: SessionCreateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Vibration Communication
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Connect with someone and send vibrations in real-time
        </p>
        <button
          onClick={onCreateSession}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
        >
          Create Session
        </button>
      </div>
    </div>
  );
}


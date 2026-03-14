import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSocket, joinRoom } from '../lib/socket.js';
import { useRoomStore } from '../stores/room-store.js';

export default function JoinPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [roomName, setRoomName] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setIdentity = useRoomStore((s) => s.setIdentity);
  const setRoom = useRoomStore((s) => s.setRoom);

  useEffect(() => {
    if (!roomId) return;
    fetch(`/api/rooms/${roomId}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
        } else {
          return r.json().then((data: { name: string }) => setRoomName(data.name));
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setChecking(false));
  }, [roomId]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !roomId) return;
    setLoading(true);
    setError('');
    const result = await joinRoom(roomId, name.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const participantId =
      result.room.participants.find((p) => p.name === name.trim())?.id ?? '';
    setIdentity(participantId, roomId, result.token);
    setRoom(result.room);
    localStorage.setItem(`room-token-${roomId}`, result.token);

    const s = getSocket(result.token);
    s.on('room:updated', (updatedRoom) => {
      useRoomStore.getState().setRoom(updatedRoom);
    });

    navigate(`/room/${roomId}`);
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center">
        <p className="text-gray-500">Loading room info...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm w-full">
          <p className="text-4xl mb-4">😕</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Room not found</h2>
          <p className="text-gray-500 mb-6">
            The invite link may be invalid or the room has expired.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors"
          >
            Create a new room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="text-2xl">♠</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join "{roomName}"</h1>
          <p className="text-gray-500 mt-1">Enter your name to join the session</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Your name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bob"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-semibold rounded-xl shadow-sm transition-colors"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
}

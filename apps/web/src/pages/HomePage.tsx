import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../lib/socket.js';
import { useRoomStore } from '../stores/room-store.js';

export default function HomePage() {
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setIdentity = useRoomStore((s) => s.setIdentity);
  const setRoom = useRoomStore((s) => s.setRoom);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !roomName.trim()) return;
    setLoading(true);
    setError('');
    const result = await createRoom(roomName.trim(), name.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setIdentity(result.room.participants[0].id, result.roomId, result.token);
    setRoom(result.room);
    localStorage.setItem(`room-token-${result.roomId}`, result.token);
    navigate(`/room/${result.roomId}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="text-2xl">♠</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Mighty Poker</h1>
          <p className="text-gray-500 mt-1">Plan together, estimate better</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Your name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alice"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
              Room name
            </label>
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Sprint 42"
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
            disabled={loading || !name.trim() || !roomName.trim()}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-semibold rounded-xl shadow-sm transition-colors"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
}

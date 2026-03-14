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
    <div>
      <h1>Mighty Poker</h1>
      <h2>Create a Room</h2>
      <form onSubmit={handleCreate}>
        <div>
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alice"
            required
          />
        </div>
        <div>
          <label htmlFor="roomName">Room name</label>
          <input
            id="roomName"
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Sprint 42"
            required
          />
        </div>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Room'}
        </button>
      </form>
    </div>
  );
}

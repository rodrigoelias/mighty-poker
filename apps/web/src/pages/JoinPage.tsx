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

    // Subscribe to room updates
    const s = getSocket(result.token);
    s.on('room:updated', (updatedRoom) => {
      useRoomStore.getState().setRoom(updatedRoom);
    });

    navigate(`/room/${roomId}`);
  }

  if (checking) return <p>Loading room info...</p>;
  if (notFound) return <p>Room not found. The link may be invalid or expired.</p>;

  return (
    <div>
      <h1>Join "{roomName}"</h1>
      <form onSubmit={handleJoin}>
        <div>
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bob"
            required
          />
        </div>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Joining...' : 'Join Room'}
        </button>
      </form>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BpkButton from '@skyscanner/backpack-web/bpk-component-button';
import BpkText, { TEXT_STYLES } from '@skyscanner/backpack-web/bpk-component-text';
import BpkInput from '@skyscanner/backpack-web/bpk-component-input';
import BpkLabel from '@skyscanner/backpack-web/bpk-component-label';
import BpkInfoBanner, { ALERT_TYPES } from '@skyscanner/backpack-web/bpk-component-info-banner';
import { canvasDay, corePrimaryDay, surfaceDefaultDay, textOnDarkDay } from '@skyscanner/bpk-foundations-web/tokens/base.es6';
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
    try {
      const result = await createRoom(roomName.trim(), name.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      setIdentity(result.room.participants[0].id, result.roomId, result.token);
      setRoom(result.room);
      localStorage.setItem(`room-token-${result.roomId}`, result.token);
      navigate(`/room/${result.roomId}`);
    } catch {
      setError('Connection timed out. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: canvasDay }}
    >
      <div className="rounded-2xl shadow-lg p-8 w-full max-w-md" style={{ backgroundColor: surfaceDefaultDay }}>
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md"
            style={{ backgroundColor: corePrimaryDay }}
          >
            <span className="text-2xl" style={{ color: textOnDarkDay }}>&#9824;</span>
          </div>
          <BpkText textStyle={TEXT_STYLES.heading2} tagName="h1">
            Mighty Poker
          </BpkText>
          <BpkText textStyle={TEXT_STYLES.bodyDefault} tagName="p" className="mt-1">
            Plan together, estimate better
          </BpkText>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <BpkLabel htmlFor="name" className="mb-1">
              Your name
            </BpkLabel>
            <BpkInput
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="Alice"
              required
            />
          </div>
          <div>
            <BpkLabel htmlFor="roomName" className="mb-1">
              Room name
            </BpkLabel>
            <BpkInput
              id="roomName"
              name="roomName"
              type="text"
              value={roomName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomName(e.target.value)}
              placeholder="Sprint 42"
              required
            />
          </div>

          {error && (
            <BpkInfoBanner
              type={ALERT_TYPES.ERROR}
              message={error}
              role="alert"
            />
          )}

          <BpkButton
            submit
            disabled={loading || !name.trim() || !roomName.trim()}
            fullWidth
          >
            {loading ? 'Creating...' : 'Create Room'}
          </BpkButton>
        </form>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BpkButton, { BUTTON_TYPES } from '@skyscanner/backpack-web/bpk-component-button';
import BpkText, { TEXT_STYLES } from '@skyscanner/backpack-web/bpk-component-text';
import BpkInput from '@skyscanner/backpack-web/bpk-component-input';
import BpkLabel from '@skyscanner/backpack-web/bpk-component-label';
import BpkInfoBanner, { ALERT_TYPES } from '@skyscanner/backpack-web/bpk-component-info-banner';
import { BpkSpinner, SPINNER_TYPES } from '@skyscanner/backpack-web/bpk-component-spinner';
import { canvasDay, corePrimaryDay, surfaceDefaultDay, textOnDarkDay } from '@skyscanner/bpk-foundations-web/tokens/base.es6';
import { joinRoom } from '../lib/socket.js';
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
    try {
      const result = await joinRoom(roomId, name.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      const participantId =
        result.room.participants.find((p) => p.name === name.trim())?.id ?? '';
      setIdentity(participantId, roomId, result.token);
      setRoom(result.room);
      localStorage.setItem(`room-token-${roomId}`, result.token);
      navigate(`/room/${roomId}`);
    } catch {
      setError('Connection timed out. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: canvasDay }}
      >
        <BpkSpinner type={SPINNER_TYPES.primary} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: canvasDay }}
      >
        <div className="rounded-2xl shadow-lg p-8 text-center max-w-sm w-full" style={{ backgroundColor: surfaceDefaultDay }}>
          <p className="text-4xl mb-4">😕</p>
          <BpkText textStyle={TEXT_STYLES.heading3} tagName="h2">
            Room not found
          </BpkText>
          <BpkText textStyle={TEXT_STYLES.bodyDefault} tagName="p" className="mb-6 mt-2">
            The invite link may be invalid or the room has expired.
          </BpkText>
          <BpkButton
            type={BUTTON_TYPES.secondary}
            onClick={() => navigate('/')}
          >
            Create a new room
          </BpkButton>
        </div>
      </div>
    );
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
          <BpkText textStyle={TEXT_STYLES.heading3} tagName="h1">
            Join &ldquo;{roomName}&rdquo;
          </BpkText>
          <BpkText textStyle={TEXT_STYLES.bodyDefault} tagName="p" className="mt-1">
            Enter your name to join the session
          </BpkText>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
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
              placeholder="Bob"
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
            disabled={loading || !name.trim()}
            fullWidth
          >
            {loading ? 'Joining...' : 'Join Room'}
          </BpkButton>
        </form>
      </div>
    </div>
  );
}

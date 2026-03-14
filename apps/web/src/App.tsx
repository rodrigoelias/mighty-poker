import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getSocket } from './lib/socket.js';
import { useRoomStore } from './stores/room-store.js';
import HomePage from './pages/HomePage.js';
import JoinPage from './pages/JoinPage.js';
import RoomPage from './pages/RoomPage.js';

function SocketProvider({ children }: { children: React.ReactNode }) {
  const { setConnected, setRoom } = useRoomStore();

  useEffect(() => {
    const s = getSocket();
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('room:updated', setRoom);
    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('room:updated', setRoom);
    };
  }, [setConnected, setRoom]);

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId/join" element={<JoinPage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}

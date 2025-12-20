import { useEffect } from 'react';
import { io } from 'socket.io-client';

// Use DOMAIN — this is correct
const SOCKET_URL = 'https://www.nystai.in';

export default function useDeviceSocket(onUpdate) {
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('device_update', data => {
      console.log('🔥 Live update received:', data);
      onUpdate(data);
    });

    socket.on('disconnect', () => {
      console.log('⚠️ Socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [onUpdate]);

  // 👇 IMPORTANT: return something
  return null;
}

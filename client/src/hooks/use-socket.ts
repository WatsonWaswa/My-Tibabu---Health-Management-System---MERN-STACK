import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketProps {
  userId?: string;
  onMessageReceived?: (message: any) => void;
  onMessageSent?: (message: any) => void;
  onUserTyping?: (data: { userId: string; isTyping: boolean }) => void;
}

export const useSocket = ({ 
  userId, 
  onMessageReceived, 
  onMessageSent, 
  onUserTyping 
}: UseSocketProps) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Clear any existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnecting(true);
    
    // Create socket connection
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002';
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: false, // Disable auto-reconnection to prevent loops
      timeout: 10000
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      setIsConnected(true);
      setIsConnecting(false);
      
      // Authenticate user
      socket.emit('authenticate', userId);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
      setIsConnecting(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setIsConnecting(false);
    });

    // Message events
    socket.on('message-received', (message) => {
      console.log('📨 Message received:', message);
      onMessageReceived?.(message);
    });

    socket.on('message-sent', (message) => {
      console.log('📤 Message sent:', message);
      onMessageSent?.(message);
    });

    socket.on('user-typing', (data) => {
      console.log('⌨️ User typing:', data);
      onUserTyping?.(data);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [userId]); // Only depend on userId, not the callback functions

  const joinConversation = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-conversation', conversationId);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-conversation', conversationId);
    }
  };

  const sendMessage = (conversationId: string, message: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('new-message', { conversationId, message });
    }
  };

  const sendTypingIndicator = (conversationId: string, isTyping: boolean) => {
    if (socketRef.current && isConnected && userId) {
      socketRef.current.emit('typing', { conversationId, userId, isTyping });
    }
  };

  return {
    isConnected,
    isConnecting,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTypingIndicator
  };
}; 
/**
 * useWebSocketStore.ts
 *
 * Manages the STOMP WebSocket connection for real-time messaging.
 *
 * Multi-tenant isolation:
 *   - Each tenant has a unique tenantId (their user UUID from backend).
 *   - They subscribe to: /topic/{tenantId}/messages
 *   - Only messages for THEIR WhatsApp number get pushed to them.
 *
 * Usage:
 *   const { connect, disconnect } = useWebSocketStore();
 *   connect(userToken, tenantId);
 */

import { create } from 'zustand';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { useChatStore } from './useChatStore';
import { SERVER_HOST } from '../services/api';

const WS_URL = `${SERVER_HOST}/ws`; 

interface WebSocketState {
  client: Client | null;
  isConnected: boolean;
  retryCount: number;
  connect: (token: string, tenantId: string) => void;
  disconnect: () => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  client: null,
  isConnected: false,
  retryCount: 0,

  connect: (token: string, tenantId: string) => {
    // Don't reconnect if already connected
    if (get().isConnected) return;

    const stompClient = new Client({
      // SockJS creates a WebSocket-like object with HTTP fallback
      webSocketFactory: () => new SockJS(WS_URL),

      // Authenticate via STOMP headers (not HTTP headers)
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      // Initial reconnect delay
      reconnectDelay: 2000,

      onConnect: () => {
        console.log('✅ WebSocket connected for tenant:', tenantId);
        set({ isConnected: true, retryCount: 0 }); // Reset retry count on success
        
        // Reset reconnectDelay on success
        if (stompClient) {
          stompClient.reconnectDelay = 2000;
        }

        // ── Subscribe to tenant-specific topic ──────────────────────
        // ONLY messages for this tenant's WhatsApp number come here.
        // 100 tenants = 100 separate channels. Zero cross-contamination.
        stompClient.subscribe(
          `/topic/${tenantId}/messages`,
          (frame: IMessage) => {
            const incoming = JSON.parse(frame.body);
            console.log('📩 Real-time message received:', incoming);

            // Map to the format ChatRoomScreen expects
            const newMsg = {
              id: incoming.id,
              text: incoming.content,
              sender: 'contact' as const,
              timestamp: new Date(incoming.timestamp).toLocaleTimeString(
                [], { hour: '2-digit', minute: '2-digit' }
              ),
            };

            // ── Multi-Route Real-time Handling ───────────────────────────
            const { chats, setChats, currentMessages, setMessages, activeChatId } = useChatStore.getState();
            
            // 1. Update the chat list (Inbox) regardless of which room is open
            // This ensures the "Last Message" and "Time" update everywhere
            setChats(chats.map(chat => 
              chat.id === incoming.contactId 
                ? { ...chat, lastMessage: incoming.content, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } 
                : chat
            ));

            // 2. ONLY push to chat history if the user is looking at THAT specific chat
            // This prevents messages from Customer A leaking into Customer B's window.
            if (activeChatId === incoming.contactId) {
              console.log('✅ Porting message to active chat window');
              setMessages([...currentMessages, newMsg]);
            }
          }
        );
      },

      onDisconnect: () => {
        console.log('🔴 WebSocket disconnected');
        set({ isConnected: false });
      },

      onWebSocketClose: () => {
        const currentRetry = get().retryCount;
        if (currentRetry >= 10) {
          console.error('❌ WebSocket max retries reached. Stopping reconnection.');
          stompClient.deactivate();
          return;
        }

        const nextDelay = Math.min(stompClient.reconnectDelay * 1.5, 30000);
        stompClient.reconnectDelay = nextDelay;
        
        console.warn(`⚠️ WebSocket closed. Retry ${currentRetry + 1}/10 in ${nextDelay}ms`);
        set({ retryCount: currentRetry + 1 });
      },

      onStompError: (frame) => {
        const errMsg = frame.headers['message'] || '';
        console.error('WebSocket STOMP Error:', errMsg);

        // Stop reconnecting if server rejected us (auth/subscription error)
        if (
          errMsg.toLowerCase().includes('unauthenticated') ||
          errMsg.toLowerCase().includes('access denied') ||
          errMsg.toLowerCase().includes('unauthorized')
        ) {
          console.warn('🔴 Auth-related STOMP error — stopping reconnection to avoid log spam.');
          stompClient.deactivate();
          set({ isConnected: false, retryCount: 0 });
        }
      },
    });

    stompClient.activate();
    set({ client: stompClient });
  },

  disconnect: () => {
    const { client } = get();
    if (client) {
      client.deactivate();
      set({ client: null, isConnected: false, retryCount: 0 });
    }
  },
}));

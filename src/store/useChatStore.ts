import { create } from 'zustand';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'contact';
  timestamp: string;
}

export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  status: 'NEW' | 'INTERESTED' | 'FOLLOW_UP' | 'CLOSED';
  unread: number;
}

interface ChatState {
  chats: Chat[];
  currentMessages: Message[];
  activeChatId: string | null;
  isLoading: boolean;
  setChats: (chats: Chat[]) => void;
  setMessages: (messages: Message[]) => void;
  setActiveChatId: (id: string | null) => void;
  updateChatStatus: (chatId: string, status: Chat['status']) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  currentMessages: [],
  activeChatId: null,
  isLoading: false,

  setChats: (chats) => set({ chats }),
  setMessages: (messages) => set({ currentMessages: messages }),
  setActiveChatId: (id) => set({ activeChatId: id }),
  
  updateChatStatus: (chatId, status) => set((state) => ({
    chats: state.chats.map((chat) => 
      chat.id === chatId ? { ...chat, status } : chat
    ),
  })),
}));

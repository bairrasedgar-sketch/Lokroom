// apps/web/src/hooks/useMessages.ts
"use client";

import useSWR, { SWRConfiguration } from 'swr';
import { fetcher, realtimeConfig } from '@/lib/swr-config';

type Message = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  createdAt: string;
  read: boolean;
  sender: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
};

type Conversation = {
  id: string;
  participants: Array<{
    id: string;
    name: string | null;
    avatarUrl: string | null;
  }>;
  lastMessage: Message | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
};

type ConversationsResponse = {
  conversations: Conversation[];
};

type MessagesResponse = {
  messages: Message[];
};

/**
 * Hook to fetch user's conversations with real-time updates
 */
export function useConversations(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<ConversationsResponse>(
    '/api/messages/conversations',
    fetcher,
    {
      ...realtimeConfig,
      refreshInterval: 30000, // Refresh every 30s for real-time feel
      ...config,
    }
  );

  return {
    conversations: data?.conversations || [],
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}

/**
 * Hook to fetch messages for a specific conversation
 */
export function useConversationMessages(
  conversationId: string | null,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, mutate } = useSWR<MessagesResponse>(
    conversationId ? `/api/messages/conversations/${conversationId}` : null,
    fetcher,
    {
      ...realtimeConfig,
      refreshInterval: 10000, // Refresh every 10s for active conversations
      ...config,
    }
  );

  return {
    messages: data?.messages || [],
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}

/**
 * Hook to fetch unread message count
 */
export function useUnreadCount(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ count: number }>(
    '/api/messages/unread-count',
    fetcher,
    {
      ...realtimeConfig,
      refreshInterval: 30000,
      ...config,
    }
  );

  return {
    unreadCount: data?.count || 0,
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}

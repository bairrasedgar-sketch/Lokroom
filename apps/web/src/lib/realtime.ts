// Utilitaire pour la communication temps réel avec Pusher
// Alternative gratuite: on utilise Server-Sent Events (SSE) natif

import { useEffect, useState, useCallback } from "react";
import { logger } from "@/lib/logger";


// Types pour les événements temps réel
export type RealtimeEvent =
  | { type: "message"; data: MessageEvent }
  | { type: "typing"; data: TypingEvent }
  | { type: "read"; data: ReadEvent }
  | { type: "presence"; data: PresenceEvent };

export type MessageEvent = {
  conversationId: string;
  message: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    createdAt: string;
    attachments?: Array<{
      id: string;
      url: string;
      type: string;
      name: string;
    }>;
  };
};

export type TypingEvent = {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
};

export type ReadEvent = {
  conversationId: string;
  userId: string;
  lastReadMessageId: string;
  readAt: string;
};

export type PresenceEvent = {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
};

// Hook pour les événements temps réel via SSE
export function useRealtimeMessages(conversationId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingEvent>>(new Map());
  const [readReceipts, setReadReceipts] = useState<Map<string, ReadEvent>>(new Map());

  // Callback pour les nouveaux messages
  const [onMessage, setOnMessage] = useState<((event: MessageEvent) => void) | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    let eventSource: EventSource | null = null;
    let retryCount = 0;
    const maxRetries = 5;

    function connect() {
      eventSource = new EventSource(`/api/messages/stream?conversationId=${conversationId}`);

      eventSource.onopen = () => {
        setIsConnected(true);
        retryCount = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RealtimeEvent;

          switch (data.type) {
            case "message":
              onMessage?.(data.data);
              break;
            case "typing":
              setTypingUsers((prev) => {
                const next = new Map(prev);
                if (data.data.isTyping) {
                  next.set(data.data.userId, data.data);
                } else {
                  next.delete(data.data.userId);
                }
                return next;
              });
              break;
            case "read":
              setReadReceipts((prev) => {
                const next = new Map(prev);
                next.set(data.data.userId, data.data);
                return next;
              });
              break;
          }
        } catch (error) {
          logger.error("Error parsing SSE event:", error);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();

        // Reconnexion automatique avec backoff exponentiel
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
          retryCount++;
          setTimeout(connect, delay);
        }
      };
    }

    connect();

    return () => {
      eventSource?.close();
      setIsConnected(false);
    };
  }, [conversationId, onMessage]);

  // Envoyer un événement "en train d'écrire"
  const sendTyping = useCallback(
    async (isTyping: boolean) => {
      if (!conversationId) return;

      try {
        await fetch("/api/messages/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, isTyping }),
        });
      } catch (error) {
        logger.error("Error sending typing event:", error);
      }
    },
    [conversationId]
  );

  // Marquer les messages comme lus
  const markAsRead = useCallback(
    async (messageId: string) => {
      if (!conversationId) return;

      try {
        await fetch("/api/messages/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, messageId }),
        });
      } catch (error) {
        logger.error("Error marking as read:", error);
      }
    },
    [conversationId]
  );

  return {
    isConnected,
    typingUsers: Array.from(typingUsers.values()),
    readReceipts,
    sendTyping,
    markAsRead,
    setOnMessage,
  };
}

// Hook pour gérer le debounce du "typing"
export function useTypingIndicator(sendTyping: (isTyping: boolean) => void) {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isTyping) {
      sendTyping(true);
      timeout = setTimeout(() => {
        setIsTyping(false);
        sendTyping(false);
      }, 3000);
    }

    return () => clearTimeout(timeout);
  }, [isTyping, sendTyping]);

  const handleTyping = useCallback(() => {
    setIsTyping(true);
  }, []);

  const stopTyping = useCallback(() => {
    setIsTyping(false);
    sendTyping(false);
  }, [sendTyping]);

  return { handleTyping, stopTyping };
}

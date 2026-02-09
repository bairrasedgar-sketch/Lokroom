import { useState, useCallback, useEffect, useRef } from "react";

export interface ChatMessage {
  id: string;
  content: string;
  type: "user" | "bot" | "system";
  timestamp: Date;
  escalatedToAgent?: boolean;
  requiresLogin?: boolean;
  suggestAgent?: boolean;
}

interface UseChatbotReturn {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  isTyping: boolean;
  sendMessage: (message: string, requestAgent?: boolean) => Promise<void>;
  toggleChat: () => void;
  requestAgent: () => Promise<void>;
  clearMessages: () => void;
}

const STORAGE_KEY = "lokroom_chat_messages";
const STORAGE_OPEN_KEY = "lokroom_chat_open";

export function useChatbot(): UseChatbotReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const hasInitialized = useRef(false);

  // Load messages from localStorage on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedOpen = localStorage.getItem(STORAGE_OPEN_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);
        setMessages(
          parsed.map((msg: ChatMessage) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        );
      } else {
        // Welcome message
        setMessages([
          {
            id: "welcome",
            content:
              "Bonjour ! Je suis l'assistant virtuel de Lok'Room. Comment puis-je vous aider aujourd'hui ?",
            type: "bot",
            timestamp: new Date(),
          },
        ]);
      }

      if (storedOpen === "true") {
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Error loading chat messages:", error);
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (!hasInitialized.current) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving chat messages:", error);
    }
  }, [messages]);

  // Save open state
  useEffect(() => {
    if (!hasInitialized.current) return;

    try {
      localStorage.setItem(STORAGE_OPEN_KEY, String(isOpen));
    } catch (error) {
      console.error("Error saving chat open state:", error);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (message: string, requestAgent = false) => {
      if (!message.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        content: message.trim(),
        type: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setIsTyping(true);

      try {
        const response = await fetch("/api/support/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message.trim(),
            requestAgent,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Erreur lors de l'envoi du message");
        }

        const data = await response.json();

        // Simulate typing delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (data.response) {
          const botMessage: ChatMessage = {
            id: `bot-${Date.now()}`,
            content: data.response,
            type: "bot",
            timestamp: new Date(data.timestamp),
            escalatedToAgent: data.escalatedToAgent,
            requiresLogin: data.requiresLogin,
            suggestAgent: data.suggestAgent,
          };

          setMessages((prev) => [...prev, botMessage]);
        } else if (data.messageSent) {
          // Message sent to agent, no auto-response
          const systemMessage: ChatMessage = {
            id: `system-${Date.now()}`,
            content: "Votre message a été envoyé à un agent. Vous recevrez une réponse sous peu.",
            type: "system",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, systemMessage]);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          content:
            "Désolé, une erreur s'est produite. Veuillez réessayer dans quelques instants.",
          type: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setIsTyping(false);
      }
    },
    [isLoading]
  );

  const requestAgent = useCallback(async () => {
    await sendMessage("Je souhaite parler à un agent", true);
  }, [sendMessage]);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        content:
          "Bonjour ! Je suis l'assistant virtuel de Lok'Room. Comment puis-je vous aider aujourd'hui ?",
        type: "bot",
        timestamp: new Date(),
      },
    ]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    messages,
    isOpen,
    isLoading,
    isTyping,
    sendMessage,
    toggleChat,
    requestAgent,
    clearMessages,
  };
}

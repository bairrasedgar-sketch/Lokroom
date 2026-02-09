"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { ChatMessage as ChatMessageType } from "@/hooks/useChatbot";

interface ChatWindowProps {
  isOpen: boolean;
  messages: ChatMessageType[];
  isLoading: boolean;
  isTyping: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
  onRequestAgent: () => void;
}

export default function ChatWindow({
  isOpen,
  messages,
  isLoading,
  isTyping,
  onClose,
  onSendMessage,
  onRequestAgent,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[9998] md:hidden"
            onClick={onClose}
          />

          {/* Chat Window */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[9999] bg-white shadow-2xl rounded-2xl flex flex-col
                       bottom-0 right-0 left-0 top-0 md:bottom-24 md:right-6 md:left-auto md:top-auto
                       md:w-[400px] md:h-[600px] md:max-h-[calc(100vh-120px)]"
          >
            <ChatHeader onClose={onClose} />

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
              style={{ scrollBehavior: "smooth" }}
            >
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onRequestAgent={onRequestAgent}
                />
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <TypingIndicator />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <ChatInput
              onSendMessage={onSendMessage}
              onRequestAgent={onRequestAgent}
              isLoading={isLoading}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useChatbot } from "@/hooks/useChatbot";
import ChatButton from "./ChatButton";
import ChatWindow from "./ChatWindow";

export default function ChatWidget() {
  const {
    messages,
    isOpen,
    isLoading,
    isTyping,
    sendMessage,
    toggleChat,
    requestAgent,
  } = useChatbot();

  return (
    <>
      <ChatButton isOpen={isOpen} onClick={toggleChat} />
      <ChatWindow
        isOpen={isOpen}
        messages={messages}
        isLoading={isLoading}
        isTyping={isTyping}
        onClose={toggleChat}
        onSendMessage={sendMessage}
        onRequestAgent={requestAgent}
      />
    </>
  );
}

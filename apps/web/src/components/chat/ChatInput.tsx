import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Send, UserPlus } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onRequestAgent: () => void;
  isLoading: boolean;
}

export default function ChatInput({
  onSendMessage,
  onRequestAgent,
  isLoading,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white rounded-b-2xl">
      <div className="px-4 py-3">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent max-h-32 text-sm"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              aria-label="Envoyer le message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button
          onClick={onRequestAgent}
          disabled={isLoading}
          className="mt-2 w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-4 h-4" />
          <span>Parler à un agent</span>
        </button>
      </div>
    </div>
  );
}

import { ChatMessage as ChatMessageType } from "@/hooks/useChatbot";
import { Bot, User, Info } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
  onRequestAgent?: () => void;
}

export default function ChatMessage({ message, onRequestAgent }: ChatMessageProps) {
  const isUser = message.type === "user";
  const isSystem = message.type === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm">
          <Info className="w-4 h-4" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex ${isUser ? "flex-row-reverse" : "flex-row"} items-end space-x-2 max-w-[80%]`}>
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? "bg-black ml-2" : "bg-gray-200 mr-2"
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-gray-600" />
          )}
        </div>
        <div>
          <div
            className={`px-4 py-3 rounded-2xl ${
              isUser
                ? "bg-black text-white rounded-br-sm"
                : "bg-gray-100 text-gray-900 rounded-bl-sm"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          {message.suggestAgent && onRequestAgent && (
            <button
              onClick={onRequestAgent}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium underline"
            >
              Parler à un agent
            </button>
          )}
          {message.requiresLogin && (
            <a
              href="/auth/signin"
              className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-700 font-medium underline"
            >
              Se connecter
            </a>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {message.timestamp.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

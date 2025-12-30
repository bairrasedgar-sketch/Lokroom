"use client";

import { useEffect, useState } from "react";

type TypingUser = {
  userId: string;
  userName: string;
};

type TypingIndicatorProps = {
  users: TypingUser[];
  currentUserId: string;
};

export default function TypingIndicator({ users, currentUserId }: TypingIndicatorProps) {
  // Filtrer l'utilisateur actuel
  const otherTypingUsers = users.filter((u) => u.userId !== currentUserId);

  if (otherTypingUsers.length === 0) return null;

  // Construire le message
  let message = "";
  if (otherTypingUsers.length === 1) {
    message = `${otherTypingUsers[0].userName} est en train d'écrire`;
  } else if (otherTypingUsers.length === 2) {
    message = `${otherTypingUsers[0].userName} et ${otherTypingUsers[1].userName} sont en train d'écrire`;
  } else {
    message = `${otherTypingUsers.length} personnes sont en train d'écrire`;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      {/* Animation des points */}
      <div className="flex items-center gap-1">
        <span
          className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span className="text-xs text-gray-500">{message}...</span>
    </div>
  );
}

// Hook pour gérer l'état "en train d'écrire"
export function useTyping(
  conversationId: string | null,
  sendTyping: (isTyping: boolean) => void
) {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!conversationId) return;

    let timeout: NodeJS.Timeout;

    if (isTyping) {
      sendTyping(true);
      // Stop après 3 secondes d'inactivité
      timeout = setTimeout(() => {
        setIsTyping(false);
        sendTyping(false);
      }, 3000);
    } else {
      sendTyping(false);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [isTyping, conversationId, sendTyping]);

  const handleTyping = () => setIsTyping(true);
  const stopTyping = () => setIsTyping(false);

  return { handleTyping, stopTyping };
}

"use client";

import { useEffect, useRef, useState } from "react";

type Sender = {
  id: string;
  name: string | null;
  image: string | null;
};

type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender: Sender;
};

type Props = {
  conversationId: string;
  // pour l'affichage (qui est "moi")
  currentUserId: string;
  pollIntervalMs?: number;
};

export function ConversationPanel({
  conversationId,
  currentUserId,
  pollIntervalMs = 4000,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 🔄 fetch messages
  async function fetchMessages() {
    try {
      const res = await fetch(
        `/api/messages/list?conversationId=${conversationId}`,
      );
      if (!res.ok) return;
      const json = await res.json();
      setMessages(json.messages ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    void fetchMessages();

    const id = setInterval(fetchMessages, pollIntervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // 🎯 auto-scroll
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      setSending(true);
      setText("");

      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: trimmed,
        }),
      });

      if (!res.ok) {
        console.error(await res.text());
        return;
      }

      const json = await res.json();
      const newMsg = json.message as Message;

      // ajout optimiste
      setMessages((prev) => [...prev, newMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex h-[480px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading && messages.length === 0 ? (
          <p className="text-sm text-gray-400">Chargement des messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-400">
            Pas encore de messages. Dis bonjour 👋
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender.id === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-xs rounded-2xl px-3 py-2 text-sm",
                    isMine
                      ? "bg-gray-900 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-900 rounded-bl-sm",
                  ].join(" ")}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className="mt-1 text-[10px] opacity-70">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écris un message…"
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-2xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900/30"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || !text.trim()}
            className="inline-flex items-center rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

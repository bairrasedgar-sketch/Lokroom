"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TranslatedMessage } from "@/components/TranslatedMessage";
import { TranslationToggle } from "@/components/TranslationToggle";

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
  originalLanguage?: string | null;
  translations?: Record<string, string> | null;
};

type TranslationPrefs = {
  preferredLanguage: string;
  autoTranslate: boolean;
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
  const [translationPrefs, setTranslationPrefs] = useState<TranslationPrefs>({
    preferredLanguage: "fr",
    autoTranslate: true,
  });
  const [showTranslationSettings, setShowTranslationSettings] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Charger les preferences de traduction
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const res = await fetch("/api/account/preferences/translation");
        if (res.ok) {
          const data = await res.json();
          setTranslationPrefs({
            preferredLanguage: data.preferredLanguage || "fr",
            autoTranslate: data.autoTranslate ?? true,
          });
        }
      } catch (e) {
        console.error("Erreur chargement preferences traduction:", e);
      }
    };
    void loadPrefs();
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
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
  }, [conversationId]);

  useEffect(() => {
    setLoading(true);
    void fetchMessages();

    const id = setInterval(fetchMessages, pollIntervalMs);
    return () => clearInterval(id);
  }, [conversationId, pollIntervalMs, fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Gestion du changement de preferences
  const handlePreferencesChange = useCallback((prefs: TranslationPrefs) => {
    setTranslationPrefs(prefs);
  }, []);

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
          content: trimmed,
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
      {/* Header avec options de traduction */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <span className="text-sm font-medium text-gray-700">Messages</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTranslationSettings(!showTranslationSettings)}
            className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 transition"
            title="Parametres de traduction"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
            <span>
              {translationPrefs.autoTranslate ? "Auto" : "Manuel"} -{" "}
              {translationPrefs.preferredLanguage.toUpperCase()}
            </span>
          </button>

          {/* Dropdown des parametres de traduction */}
          {showTranslationSettings && (
            <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  Traduction
                </span>
                <button
                  type="button"
                  onClick={() => setShowTranslationSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <TranslationToggle
                onPreferencesChange={handlePreferencesChange}
                compact={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading && messages.length === 0 ? (
          <p className="text-sm text-gray-400">Chargement des messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-400">
            Pas encore de messages. Dis bonjour!
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender.id === currentUserId;
            return (
              <TranslatedMessage
                key={m.id}
                messageId={m.id}
                originalContent={m.content}
                originalLanguage={m.originalLanguage}
                translations={m.translations}
                preferredLanguage={translationPrefs.preferredLanguage}
                autoTranslate={translationPrefs.autoTranslate}
                isMine={isMine}
                createdAt={m.createdAt}
              />
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
            placeholder="Ecris un message..."
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

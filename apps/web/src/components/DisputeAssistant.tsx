// apps/web/src/components/DisputeAssistant.tsx
// Assistant IA pour aider à formuler les litiges
"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type Summary = {
  category: string;
  problem: string;
  details: string;
  hasEvidence: boolean;
  contactedHost: boolean;
  priority: string;
};

type BookingContext = {
  listingTitle?: string;
  startDate?: string;
  endDate?: string;
  hostName?: string;
  totalPrice?: number;
};

type DisputeAssistantProps = {
  bookingContext?: BookingContext;
  onSummaryReady?: (summary: Summary) => void;
  initialMessage?: string;
};

// Mapping des catégories IA vers les codes API
const CATEGORY_MAP: Record<string, string> = {
  "PROPERTY_NOT_AS_DESCRIBED": "PROPERTY_NOT_AS_DESCRIBED",
  "CLEANLINESS_ISSUE": "CLEANLINESS_ISSUE",
  "AMENITIES_MISSING": "AMENITIES_MISSING",
  "HOST_UNRESPONSIVE": "HOST_UNRESPONSIVE",
  "GUEST_DAMAGE": "GUEST_DAMAGE",
  "GUEST_VIOLATION": "GUEST_VIOLATION",
  "PAYMENT_ISSUE": "PAYMENT_ISSUE",
  "CANCELLATION_DISPUTE": "CANCELLATION_DISPUTE",
  "SAFETY_CONCERN": "SAFETY_CONCERN",
  "NOISE_COMPLAINT": "NOISE_COMPLAINT",
  "UNAUTHORIZED_GUESTS": "UNAUTHORIZED_GUESTS",
  "OTHER": "OTHER",
};

export default function DisputeAssistant({
  bookingContext,
  onSummaryReady,
  initialMessage,
}: DisputeAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Message d'accueil
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: `Bonjour ! Je suis l'assistant Lok'Room. Je vais vous aider à décrire votre problème de manière claire pour que notre équipe puisse le traiter rapidement.

${bookingContext?.listingTitle ? `Je vois que vous avez une réservation pour "${bookingContext.listingTitle}".` : ""}

Pouvez-vous me décrire en quelques mots ce qui s'est passé ?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);

      // Si un message initial est fourni, l'envoyer automatiquement
      if (initialMessage) {
        setTimeout(() => {
          setInput(initialMessage);
        }, 500);
      }
    }
  }, [isOpen, bookingContext, initialMessage, messages.length]);

  // Scroll vers le bas
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus sur l'input quand ouvert
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/disputes/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          bookingContext,
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur API");
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Si un résumé est disponible
      if (data.summary) {
        setSummary(data.summary);
        if (onSummaryReady) {
          onSummaryReady(data.summary);
        }
      }
    } catch (error) {
      console.error("Erreur assistant:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Désolé, une erreur s'est produite. Veuillez réessayer ou continuer manuellement.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const useSummary = () => {
    if (summary && onSummaryReady) {
      onSummaryReady(summary);
      setIsOpen(false);
    }
  };

  // Bouton flottant pour ouvrir l'assistant
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
                <SparklesIcon className="w-5 h-5" />
        <span className="font-medium">Aide IA</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all ${
        isMinimized ? "w-72" : "w-96 max-w-[calc(100vw-3rem)]"
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-t-2xl cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2 text-white">
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          <span className="font-medium">Assistant Lok'Room</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="p-1 hover:bg-white/20 rounded transition"
          >
            {isMinimized ? (
              <ChevronUpIcon className="w-4 h-4 text-white" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-white" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="p-1 hover:bg-white/20 rounded transition"
          >
            <XMarkIcon className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div ref={messagesContainerRef} className="h-80 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Résumé si disponible */}
          {summary && (
            <div className="mx-4 mb-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 text-green-700 font-medium text-sm mb-2">
                <SparklesIcon className="w-4 h-4" />
                Résumé prêt
              </div>
              <p className="text-xs text-green-600 mb-2">
                Catégorie: {summary.category}
              </p>
              <button
                onClick={useSummary}
                className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
              >
                Utiliser ce résumé
              </button>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Décrivez votre problème..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                style={{ maxHeight: "100px" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="p-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              L'IA vous aide à formuler, elle ne résout pas les litiges
            </p>
          </div>
        </>
      )}
    </div>
  );
}

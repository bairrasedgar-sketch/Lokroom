"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ClockIcon,
  BoltIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";

type SupportMessage = {
  id: string;
  content: string;
  type: "USER" | "AI" | "ADMIN" | "SYSTEM";
  senderId: string | null;
  sender: {
    id: string;
    name: string | null;
  } | null;
  createdAt: string;
};

type SupportConversation = {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  assignedAdminId: string | null;
  assignedAdmin: {
    id: string;
    name: string | null;
  } | null;
  status: "WITH_AI" | "WAITING_AGENT" | "WITH_AGENT" | "RESOLVED" | "CLOSED";
  subject: string | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
};

// Réponses rapides
const QUICK_RESPONSES = [
  {
    id: "greeting",
    label: "Bonjour",
    template: (name: string) => `Bonjour ! Je suis ${name} de l'équipe Lok'Room. Comment puis-je vous aider ?`,
  },
  {
    id: "understand",
    label: "Je comprends",
    template: () => `Je comprends votre situation. Pouvez-vous me donner plus de détails ?`,
  },
  {
    id: "working",
    label: "Je m'en occupe",
    template: () => `Je m'occupe de votre demande. Je reviens vers vous rapidement.`,
  },
  {
    id: "checking",
    label: "Je vérifie",
    template: () => `Je vérifie cela dans notre système. Un instant s'il vous plaît.`,
  },
  {
    id: "resolved",
    label: "Problème résolu",
    template: () => `Votre problème a été résolu. N'hésitez pas si vous avez d'autres questions !`,
  },
  {
    id: "thanks",
    label: "Merci",
    template: () => `Merci pour votre patience. Puis-je vous aider pour autre chose ?`,
  },
];

export default function AdminSupportConversationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialLoad = useRef(true);

  const user = session?.user as { id?: string; name?: string; role?: string } | undefined;
  const adminName = user?.name || "Support";

  const fetchConversation = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/support/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setConversation(data.conversation);
      } else if (res.status === 404) {
        router.push("/admin/support");
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, router]);

  useEffect(() => {
    if (status === "authenticated" && conversationId) {
      fetchConversation();
      const interval = setInterval(fetchConversation, 5000);
      return () => clearInterval(interval);
    }
  }, [status, conversationId, fetchConversation]);

  useEffect(() => {
    if (status === "authenticated" && user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, user, router]);

  useEffect(() => {
    // Ne pas scroller automatiquement au chargement initial
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  const handleAssign = async () => {
    if (!conversation || assigning) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/support/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversation.id }),
      });
      if (res.ok) {
        toast.success("Conversation prise en charge");
        fetchConversation();
      } else {
        const data = await res.json();
        toast.error(res.status === 409 ? `Déjà assignée à ${data.assignedTo}` : data.error || "Erreur");
      }
    } catch {
      toast.error("Erreur lors de l'assignation");
    } finally {
      setAssigning(false);
    }
  };

  const handleSend = async (content?: string) => {
    const messageContent = (content || newMessage).trim();
    if (!messageContent || !conversation || sending) return;
    setNewMessage("");
    setShowQuickResponses(false);
    setSending(true);
    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversation.id, content: messageContent }),
      });
      if (res.ok) {
        fetchConversation();
      } else {
        toast.error("Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!conversation) return;
    try {
      const res = await fetch(`/api/admin/support/conversations/${conversation.id}/resolve`, { method: "POST" });
      if (res.ok) {
        toast.success("Conversation marquée comme résolue");
        fetchConversation();
      }
    } catch {
      toast.error("Erreur");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <p className="text-gray-500">Conversation non trouvée</p>
        <Link href="/admin/support" className="mt-4 text-sm text-red-600 hover:underline">
          Retour au support
        </Link>
      </div>
    );
  }

  const isAssignedToMe = conversation.assignedAdminId === user?.id;
  const canSendMessage = isAssignedToMe && conversation.status === "WITH_AGENT";

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/support"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {conversation.user.name || conversation.user.email}
            </h1>
            <p className="text-xs text-gray-500">{conversation.user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
            conversation.status === "WAITING_AGENT" ? "bg-amber-100 text-amber-700" :
            conversation.status === "WITH_AGENT" ? "bg-emerald-100 text-emerald-700" :
            conversation.status === "RESOLVED" ? "bg-blue-100 text-blue-700" :
            "bg-gray-100 text-gray-600"
          }`}>
            {conversation.status === "WAITING_AGENT" ? "En attente" :
             conversation.status === "WITH_AGENT" ? "En cours" :
             conversation.status === "RESOLVED" ? "Résolu" : "Fermé"}
          </span>

          {conversation.status === "WAITING_AGENT" && (
            <button
              onClick={handleAssign}
              disabled={assigning}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {assigning ? "..." : "Prendre en charge"}
            </button>
          )}

          {isAssignedToMe && conversation.status === "WITH_AGENT" && (
            <button
              onClick={handleResolve}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Résolu
            </button>
          )}
        </div>
      </div>

      {/* Sujet */}
      {conversation.subject && (
        <div className="mb-3 rounded-lg bg-gray-100 px-3 py-2">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Sujet :</span> {conversation.subject}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div ref={messagesContainerRef} className="h-[calc(100vh-280px)] min-h-[300px] max-h-[500px] overflow-y-auto p-4">
          {/* Date */}
          <div className="mb-4 text-center">
            <span className="text-xs text-gray-400">{formatDate(conversation.createdAt)}</span>
          </div>

          <div className="space-y-4">
            {conversation.messages.map((msg) => {
              if (msg.type === "SYSTEM") {
                return (
                  <div key={msg.id} className="text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <ClockIcon className="h-3 w-3" />
                      {msg.content}
                    </span>
                  </div>
                );
              }

              // Côté admin : messages USER à gauche, messages ADMIN/IA à droite
              const isFromUser = msg.type === "USER";
              const isAI = msg.type === "AI";
              const isAdmin = msg.type === "ADMIN";

              return (
                <div key={msg.id} className={`flex ${isFromUser ? "justify-start" : "justify-end"}`}>
                  <div className="max-w-[70%]">
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isFromUser
                          ? "bg-gray-200/70 text-gray-900"
                          : isAI
                            ? "bg-violet-500/80 text-white"
                            : "bg-gray-700/90 text-white"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    </div>
                    <p className={`mt-1 text-xs text-gray-400 ${isFromUser ? "text-left" : "text-right"}`}>
                      {isFromUser && `${conversation.user.name || "Utilisateur"} • `}
                      {isAI && "IA • "}
                      {isAdmin && `${msg.sender?.name || "Support"} • `}
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        {canSendMessage ? (
          <div className="border-t border-gray-200 p-3">
            {/* Réponses rapides */}
            {showQuickResponses && (
              <div className="mb-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Réponses rapides</span>
                  <button onClick={() => setShowQuickResponses(false)} className="text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_RESPONSES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSend(r.template(adminName))}
                      disabled={sending}
                      className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowQuickResponses(!showQuickResponses)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  showQuickResponses ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title="Réponses rapides"
              >
                <BoltIcon className="h-4 w-4" />
              </button>

              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Votre message..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                style={{ maxHeight: "80px" }}
              />

              <button
                onClick={() => handleSend()}
                disabled={!newMessage.trim() || sending}
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  newMessage.trim() ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-100 text-gray-400"
                }`}
              >
                {sending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <PaperAirplaneIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-200 p-4 text-center">
            {conversation.status === "WAITING_AGENT" ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-gray-500">
                  Cette conversation attend d'être prise en charge
                </p>
                <button
                  onClick={handleAssign}
                  disabled={assigning}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {assigning ? "Assignation..." : "Prendre en charge"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {conversation.assignedAdminId && !isAssignedToMe
                  ? `Gérée par ${conversation.assignedAdmin?.name || "un autre admin"}`
                  : `Conversation ${conversation.status === "RESOLVED" ? "résolue" : "fermée"}`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

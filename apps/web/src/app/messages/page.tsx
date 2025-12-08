"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  HomeIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  StarIcon,
  CurrencyEuroIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { findFAQResponse, defaultResponse, quickReplies } from "@/lib/faq-bot";

// Support bot ID
const SUPPORT_BOT_ID = "lokroom-support";

// Types
type Conversation = {
  id: string;
  userRole: "host" | "guest";
  isHost: boolean;
  otherUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
  } | null;
  updatedAt: string;
  isUnread: boolean;
  hasBooking: boolean;
  listing: {
    id: string;
    title: string;
    city: string | null;
    country: string;
    imageUrl: string | null;
  } | null;
  booking: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    totalPrice: number | null;
  } | null;
};

type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    profile?: {
      avatarUrl: string | null;
    } | null;
  };
};

type ViewMode = "all" | "host" | "guest" | "support";

// Bot message type
type BotMessage = {
  id: string;
  content: string;
  createdAt: string;
  isBot: boolean;
  followUp?: string[];
};

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentUserId = session?.user?.id;

  // Auto-open support bot if ?support=true
  useEffect(() => {
    const supportParam = searchParams.get("support");
    if (supportParam === "true") {
      setViewMode("support");
      setSelectedConvId(SUPPORT_BOT_ID);
      setShowMobileChat(true);
    }
  }, [searchParams]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/list?conversationId=${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (status === "authenticated") {
      fetchConversations();
    }
  }, [status, fetchConversations]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConvId === SUPPORT_BOT_ID) {
      // Initialize bot conversation
      setMessages([]);
      setBotMessages([
        {
          id: "welcome",
          content: `Bonjour ! 👋 Je suis l'assistant Lok'Room.

Comment puis-je vous aider aujourd'hui ?

Posez-moi vos questions sur :
• 📅 Les réservations
• ❌ L'annulation et les remboursements
• 💳 Les paiements
• 🏠 Devenir hôte
• 🔒 La sécurité du compte`,
          createdAt: new Date().toISOString(),
          isBot: true,
          followUp: quickReplies.slice(0, 3),
        },
      ]);
    } else if (selectedConvId) {
      setBotMessages([]);
      fetchMessages(selectedConvId);
    }
  }, [selectedConvId, fetchMessages]);

  // Poll for new messages (skip for bot)
  useEffect(() => {
    if (!selectedConvId || selectedConvId === SUPPORT_BOT_ID) return;

    const interval = setInterval(() => {
      fetchMessages(selectedConvId);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedConvId, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botMessages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConvId || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Handle bot conversation
    if (selectedConvId === SUPPORT_BOT_ID) {
      // Add user message
      const userMessage: BotMessage = {
        id: `user-${Date.now()}`,
        content: messageContent,
        createdAt: new Date().toISOString(),
        isBot: false,
      };
      setBotMessages((prev) => [...prev, userMessage]);

      // Show typing indicator
      setBotTyping(true);

      // Simulate bot thinking time
      setTimeout(() => {
        const faqResponse = findFAQResponse(messageContent);
        const response = faqResponse || defaultResponse;

        const botReply: BotMessage = {
          id: `bot-${Date.now()}`,
          content: response.answer,
          createdAt: new Date().toISOString(),
          isBot: true,
          followUp: response.followUp,
        };

        setBotMessages((prev) => [...prev, botReply]);
        setBotTyping(false);
      }, 800 + Math.random() * 700);

      setSending(false);
      return;
    }

    // Optimistic update for real conversations
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUserId || "",
        name: session?.user?.name || null,
        profile: { avatarUrl: null },
      },
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConvId,
          content: messageContent,
        }),
      });

      if (res.ok) {
        await fetchMessages(selectedConvId);
        fetchConversations(); // Refresh conversation list
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  // Handle quick reply click
  const handleQuickReply = (reply: string) => {
    setNewMessage(reply);
    // Focus textarea
    textareaRef.current?.focus();
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    // View mode filter
    if (viewMode === "host" && !conv.isHost) return false;
    if (viewMode === "guest" && conv.isHost) return false;
    if (viewMode === "support") return false; // Support mode shows only bot

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !conv.otherUser.name.toLowerCase().includes(query) &&
        !conv.listing?.title.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    return true;
  });

  // Get selected conversation details
  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  // Counts
  const hostCount = conversations.filter((c) => c.isHost).length;
  const guestCount = conversations.filter((c) => !c.isHost).length;
  const unreadCount = conversations.filter((c) => c.isUnread).length;

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return date.toLocaleDateString("fr-FR", { weekday: "short" });
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  // Format dates for booking
  const formatBookingDates = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `${startDate.toLocaleDateString("fr-FR", options)} → ${endDate.toLocaleDateString("fr-FR", options)}`;
  };

  // Booking status config
  const getBookingStatus = (status: string) => {
    const configs: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
      PENDING: {
        label: "En attente",
        color: "text-amber-700",
        bgColor: "bg-amber-50 border-amber-200",
        icon: <ClockIcon className="h-4 w-4" />,
      },
      CONFIRMED: {
        label: "Confirmée",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50 border-emerald-200",
        icon: <CheckCircleIcon className="h-4 w-4" />,
      },
      CANCELLED: {
        label: "Annulée",
        color: "text-red-700",
        bgColor: "bg-red-50 border-red-200",
        icon: <XCircleIcon className="h-4 w-4" />,
      },
      COMPLETED: {
        label: "Terminée",
        color: "text-gray-700",
        bgColor: "bg-gray-50 border-gray-200",
        icon: <CheckCircleIcon className="h-4 w-4" />,
      },
    };
    return configs[status] || configs.PENDING;
  };

  // Loading state
  if (status === "loading") {
    return (
      <main className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-2 border-gray-100" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-gray-900" />
          </div>
          <p className="text-sm text-gray-500">Chargement de vos messages...</p>
        </div>
      </main>
    );
  }

  // Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <main className="flex h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <ChatBubbleLeftRightIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-gray-900">Messages</h1>
          <p className="mt-2 text-gray-500">Connectez-vous pour accéder à vos conversations</p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-gray-900 px-8 py-3 text-sm font-medium text-white transition-all hover:bg-black hover:shadow-lg"
          >
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="h-[calc(100vh-64px)] bg-white">
      <div className="mx-auto flex h-full max-w-7xl">
        {/* Sidebar - Conversations List */}
        <aside
          className={`flex h-full w-full flex-col border-r border-gray-100 bg-white lg:w-[400px] ${
            showMobileChat ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              {unreadCount > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-900 px-2 text-xs font-medium text-white">
                  {unreadCount}
                </span>
              )}
            </div>

            {/* Role Tabs */}
            <div className="mt-5 flex gap-1 rounded-xl bg-gray-100 p-1">
              {[
                { id: "all" as ViewMode, label: "Tout", count: conversations.length },
                { id: "host" as ViewMode, label: "En tant qu'hôte", count: hostCount },
                { id: "guest" as ViewMode, label: "En tant que voyageur", count: guestCount },
                { id: "support" as ViewMode, label: "Support", count: 1 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all ${
                    viewMode === tab.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`text-xs ${viewMode === tab.id ? "text-gray-400" : "text-gray-400"}`}
                    >
                      ({tab.count})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mt-4">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full rounded-xl border-0 bg-gray-100 py-3 pl-12 pr-4 text-sm placeholder-gray-500 transition-colors focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-3">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
              </div>
            ) : viewMode === "support" ? (
              <div className="space-y-1 pb-4">
                {/* Support Bot - Only in support mode */}
                <button
                  onClick={() => {
                    setSelectedConvId(SUPPORT_BOT_ID);
                    setShowMobileChat(true);
                  }}
                  className={`group flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-all ${
                    selectedConvId === SUPPORT_BOT_ID
                      ? "bg-gradient-to-r from-violet-50 to-purple-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                      <SparklesIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Assistant Lok&apos;Room</h3>
                      <span className="text-xs text-emerald-600">En ligne</span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      FAQ, aide et support 24/7
                    </p>
                  </div>
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 font-medium text-gray-900">
                  {viewMode === "host"
                    ? "Aucune demande de voyageur"
                    : viewMode === "guest"
                      ? "Aucune conversation avec un hôte"
                      : "Aucune conversation"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {viewMode === "host"
                    ? "Les messages de vos voyageurs apparaîtront ici"
                    : viewMode === "guest"
                      ? "Contactez un hôte pour démarrer"
                      : "Vos conversations apparaîtront ici"}
                </p>
              </div>
            ) : (
              <div className="space-y-1 pb-4">
                {/* Support Bot - Always on top */}
                <button
                  onClick={() => {
                    setSelectedConvId(SUPPORT_BOT_ID);
                    setShowMobileChat(true);
                  }}
                  className={`group flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-all ${
                    selectedConvId === SUPPORT_BOT_ID
                      ? "bg-gradient-to-r from-violet-50 to-purple-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                      <SparklesIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Assistant Lok&apos;Room</h3>
                      <span className="text-xs text-emerald-600">En ligne</span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      FAQ, aide et support 24/7
                    </p>
                  </div>
                </button>

                {/* Divider */}
                {filteredConversations.length > 0 && (
                  <div className="my-2 border-t border-gray-100" />
                )}

                {/* User conversations */}
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConvId(conv.id);
                      setShowMobileChat(true);
                    }}
                    className={`group flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-all ${
                      selectedConvId === conv.id
                        ? "bg-gray-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {conv.otherUser.avatarUrl ? (
                        <Image
                          src={conv.otherUser.avatarUrl}
                          alt={conv.otherUser.name}
                          width={52}
                          height={52}
                          className="h-13 w-13 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                          <span className="text-lg font-semibold text-gray-600">
                            {conv.otherUser.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {/* Role badge */}
                      <div
                        className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${
                          conv.isHost ? "bg-emerald-500" : "bg-blue-500"
                        }`}
                      >
                        {conv.isHost ? (
                          <HomeIcon className="h-2.5 w-2.5 text-white" />
                        ) : (
                          <UserCircleIcon className="h-2.5 w-2.5 text-white" />
                        )}
                      </div>
                      {/* Unread indicator */}
                      {conv.isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3
                            className={`truncate font-semibold ${
                              conv.isUnread ? "text-gray-900" : "text-gray-700"
                            }`}
                          >
                            {conv.otherUser.name}
                          </h3>
                          {conv.listing && (
                            <p className="truncate text-xs text-gray-500">
                              {conv.listing.title}
                            </p>
                          )}
                        </div>
                        <span className="flex-shrink-0 text-xs text-gray-400">
                          {conv.lastMessage
                            ? formatRelativeTime(conv.lastMessage.createdAt)
                            : formatRelativeTime(conv.updatedAt)}
                        </span>
                      </div>

                      {/* Last message */}
                      {conv.lastMessage && (
                        <p
                          className={`mt-1 line-clamp-2 text-sm ${
                            conv.isUnread ? "font-medium text-gray-900" : "text-gray-500"
                          }`}
                        >
                          {conv.lastMessage.isFromMe && (
                            <span className="text-gray-400">Vous: </span>
                          )}
                          {conv.lastMessage.content}
                        </p>
                      )}

                      {/* Booking badge */}
                      {conv.booking && (
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                              getBookingStatus(conv.booking.status).bgColor
                            } ${getBookingStatus(conv.booking.status).color}`}
                          >
                            {getBookingStatus(conv.booking.status).icon}
                            {getBookingStatus(conv.booking.status).label}
                          </span>
                          {conv.booking.totalPrice && (
                            <span className="text-xs font-medium text-gray-900">
                              {conv.booking.totalPrice}€
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <section
          className={`flex flex-1 flex-col bg-gray-50 ${
            showMobileChat ? "flex" : "hidden lg:flex"
          }`}
        >
          {!selectedConvId ? (
            // Empty state
            <div className="flex flex-1 flex-col items-center justify-center px-8">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300" />
              </div>
              <h2 className="mt-6 text-xl font-semibold text-gray-900">Vos messages</h2>
              <p className="mt-2 max-w-sm text-center text-gray-500">
                Sélectionnez une conversation pour voir les messages et communiquer avec vos
                {viewMode === "host" ? " voyageurs" : viewMode === "guest" ? " hôtes" : " contacts"}
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 py-3 lg:px-6">
                <div className="flex items-center gap-3">
                  {/* Back button mobile */}
                  <button
                    onClick={() => {
                      setShowMobileChat(false);
                      setSelectedConvId(null);
                    }}
                    className="rounded-full p-2 hover:bg-gray-100 lg:hidden"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>

                  {/* Bot Avatar */}
                  {selectedConvId === SUPPORT_BOT_ID ? (
                    <>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                        <SparklesIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">Assistant Lok&apos;Room</h2>
                        <p className="flex items-center gap-1 text-xs text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          En ligne - Réponse instantanée
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* User Avatar */}
                      {selectedConv?.otherUser.avatarUrl ? (
                        <Image
                          src={selectedConv.otherUser.avatarUrl}
                          alt={selectedConv.otherUser.name}
                          width={44}
                          height={44}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                          <span className="text-base font-semibold text-gray-600">
                            {selectedConv?.otherUser.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Info */}
                      <div>
                        <h2 className="font-semibold text-gray-900">{selectedConv?.otherUser.name}</h2>
                        <p className="text-xs text-gray-500">
                          {selectedConv?.isHost ? (
                            <span className="flex items-center gap-1">
                              <UserCircleIcon className="h-3 w-3" />
                              Voyageur
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <HomeIcon className="h-3 w-3" />
                              Hôte
                            </span>
                          )}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                {selectedConvId === SUPPORT_BOT_ID ? (
                  <Link
                    href="/help"
                    className="hidden items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 sm:flex"
                  >
                    Centre d&apos;aide
                  </Link>
                ) : selectedConv?.listing ? (
                  <Link
                    href={`/listings/${selectedConv.listing.id}`}
                    className="hidden items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 sm:flex"
                  >
                    <HomeIcon className="h-4 w-4" />
                    Voir l&apos;annonce
                  </Link>
                ) : null}
              </div>

              {/* Context Card - Booking/Listing Info */}
              {selectedConv && (selectedConv.booking || selectedConv.listing) && (
                <div className="flex-shrink-0 border-b border-gray-100 bg-white px-4 py-3 lg:px-6">
                  <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-3">
                    {/* Listing Image */}
                    {selectedConv.listing?.imageUrl && (
                      <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={selectedConv.listing.imageUrl}
                          alt={selectedConv.listing.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-medium text-gray-900">
                        {selectedConv.listing?.title}
                      </h4>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        {selectedConv.listing?.city && (
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="h-3.5 w-3.5" />
                            {selectedConv.listing.city}
                          </span>
                        )}
                        {selectedConv.booking && (
                          <>
                            <span className="flex items-center gap-1">
                              <CalendarDaysIcon className="h-3.5 w-3.5" />
                              {formatBookingDates(
                                selectedConv.booking.startDate,
                                selectedConv.booking.endDate
                              )}
                            </span>
                            {selectedConv.booking.totalPrice && (
                              <span className="flex items-center gap-1 font-medium text-gray-900">
                                <CurrencyEuroIcon className="h-3.5 w-3.5" />
                                {selectedConv.booking.totalPrice}€
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Booking Status */}
                    {selectedConv.booking && (
                      <div
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                          getBookingStatus(selectedConv.booking.status).bgColor
                        } ${getBookingStatus(selectedConv.booking.status).color}`}
                      >
                        {getBookingStatus(selectedConv.booking.status).icon}
                        {getBookingStatus(selectedConv.booking.status).label}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
                {/* Bot Messages */}
                {selectedConvId === SUPPORT_BOT_ID ? (
                  <div className="space-y-4">
                    {botMessages.map((msg, index) => (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${!msg.isBot ? "flex-row-reverse" : ""}`}
                      >
                        {/* Bot Avatar */}
                        {msg.isBot && (
                          <div className="w-8 flex-shrink-0">
                            {(index === 0 || !botMessages[index - 1].isBot) && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                                <SparklesIcon className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div className={`max-w-[80%] ${!msg.isBot ? "items-end" : "items-start"}`}>
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              !msg.isBot
                                ? "rounded-br-md bg-gray-900 text-white"
                                : "rounded-bl-md bg-white text-gray-900 shadow-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                              {msg.content}
                            </p>
                          </div>

                          {/* Follow-up suggestions */}
                          {msg.isBot && msg.followUp && msg.followUp.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {msg.followUp.map((suggestion) => (
                                <button
                                  key={suggestion}
                                  onClick={() => handleQuickReply(suggestion)}
                                  className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}

                          <p
                            className={`mt-1 text-[11px] text-gray-400 ${
                              !msg.isBot ? "text-right" : "text-left"
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {botTyping && (
                      <div className="flex items-end gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                          <SparklesIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
                          <div className="flex gap-1">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                ) : loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                      <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="mt-4 font-medium text-gray-900">Démarrez la conversation</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedConv?.isHost
                        ? "Répondez au voyageur pour confirmer la disponibilité"
                        : "Posez vos questions sur le logement"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, index) => {
                      const isMine = msg.sender.id === currentUserId;
                      const showAvatar =
                        !isMine &&
                        (index === 0 || messages[index - 1].sender.id !== msg.sender.id);
                      const showTime =
                        index === messages.length - 1 ||
                        messages[index + 1].sender.id !== msg.sender.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}
                        >
                          {/* Avatar */}
                          {!isMine && (
                            <div className="w-8 flex-shrink-0">
                              {showAvatar &&
                                (msg.sender.profile?.avatarUrl ? (
                                  <Image
                                    src={msg.sender.profile.avatarUrl}
                                    alt=""
                                    width={32}
                                    height={32}
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                                    <span className="text-xs font-medium text-gray-600">
                                      {msg.sender.name?.charAt(0).toUpperCase() || "?"}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
                            <div
                              className={`rounded-2xl px-4 py-2.5 ${
                                isMine
                                  ? "rounded-br-md bg-gray-900 text-white"
                                  : "rounded-bl-md bg-white text-gray-900 shadow-sm"
                              }`}
                            >
                              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                                {msg.content}
                              </p>
                            </div>
                            {showTime && (
                              <div
                                className={`mt-1 flex items-center gap-1 text-[11px] text-gray-400 ${
                                  isMine ? "justify-end" : "justify-start"
                                }`}
                              >
                                <span>
                                  {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {isMine && (
                                  <CheckIcon className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-4 lg:px-6">
                {/* Quick Replies for Host */}
                {selectedConv?.isHost && selectedConv?.booking?.status === "PENDING" && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {[
                      "Le logement est disponible !",
                      "Je confirme votre réservation",
                      "Pouvez-vous me donner plus de détails ?",
                    ].map((reply) => (
                      <button
                        key={reply}
                        onClick={() => setNewMessage(reply)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Replies for Guest */}
                {!selectedConv?.isHost && !messages.length && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {[
                      "Bonjour, le logement est-il disponible ?",
                      "Quels sont les équipements inclus ?",
                      "Y a-t-il un parking ?",
                    ].map((reply) => (
                      <button
                        key={reply}
                        onClick={() => setNewMessage(reply)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Écrivez votre message..."
                      rows={1}
                      className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] placeholder-gray-400 transition-all focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/5"
                      style={{ maxHeight: "120px" }}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                      newMessage.trim()
                        ? "bg-gray-900 text-white hover:bg-black hover:shadow-lg"
                        : "bg-gray-100 text-gray-400"
                    } disabled:cursor-not-allowed`}
                  >
                    {sending ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Right Panel - Details (Desktop only) */}
        <aside className="hidden w-[320px] flex-col border-l border-gray-100 bg-white xl:flex">
          {selectedConv ? (
            <div className="flex h-full flex-col overflow-y-auto">
              {/* Profile Section */}
              <div className="flex flex-col items-center border-b border-gray-100 px-6 py-8">
                {selectedConv.otherUser.avatarUrl ? (
                  <Image
                    src={selectedConv.otherUser.avatarUrl}
                    alt={selectedConv.otherUser.name}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                    <span className="text-2xl font-bold text-gray-600">
                      {selectedConv.otherUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {selectedConv.otherUser.name}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                  {selectedConv.isHost ? (
                    <>
                      <UserCircleIcon className="h-4 w-4" />
                      Voyageur
                    </>
                  ) : (
                    <>
                      <HomeIcon className="h-4 w-4" />
                      Hôte
                    </>
                  )}
                </p>
                <div className="mt-3 flex items-center gap-1 text-sm text-gray-400">
                  <StarIcon className="h-4 w-4 text-amber-400" />
                  <span>Membre Lok&apos;Room</span>
                </div>
              </div>

              {/* Listing Section */}
              {selectedConv.listing && (
                <div className="border-b border-gray-100 p-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Annonce concernée
                  </h4>
                  <Link
                    href={`/listings/${selectedConv.listing.id}`}
                    className="mt-3 block overflow-hidden rounded-xl border border-gray-100 transition-shadow hover:shadow-md"
                  >
                    {selectedConv.listing.imageUrl ? (
                      <div className="relative h-32 w-full">
                        <Image
                          src={selectedConv.listing.imageUrl}
                          alt={selectedConv.listing.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-32 items-center justify-center bg-gray-100">
                        <HomeIcon className="h-10 w-10 text-gray-300" />
                      </div>
                    )}
                    <div className="p-3">
                      <h5 className="font-medium text-gray-900">{selectedConv.listing.title}</h5>
                      {selectedConv.listing.city && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                          <MapPinIcon className="h-3 w-3" />
                          {selectedConv.listing.city}, {selectedConv.listing.country}
                        </p>
                      )}
                    </div>
                  </Link>
                </div>
              )}

              {/* Booking Section */}
              {selectedConv.booking && (
                <div className="border-b border-gray-100 p-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Réservation
                  </h4>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Statut</span>
                      <span
                        className={`flex items-center gap-1 text-sm font-medium ${
                          getBookingStatus(selectedConv.booking.status).color
                        }`}
                      >
                        {getBookingStatus(selectedConv.booking.status).icon}
                        {getBookingStatus(selectedConv.booking.status).label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Dates</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatBookingDates(
                          selectedConv.booking.startDate,
                          selectedConv.booking.endDate
                        )}
                      </span>
                    </div>
                    {selectedConv.booking.totalPrice && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Total</span>
                        <span className="text-lg font-bold text-gray-900">
                          {selectedConv.booking.totalPrice}€
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons for Host */}
                  {selectedConv.isHost && selectedConv.booking.status === "PENDING" && (
                    <div className="mt-4 flex gap-2">
                      <button className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600">
                        Accepter
                      </button>
                      <button className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                        Refuser
                      </button>
                    </div>
                  )}

                  <Link
                    href={`/bookings/${selectedConv.booking.id}`}
                    className="mt-3 block w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    Voir la réservation
                  </Link>
                </div>
              )}

              {/* Quick Info */}
              <div className="p-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Informations
                </h4>
                <div className="mt-4 space-y-3 text-sm text-gray-500">
                  <p>
                    Conversation démarrée le{" "}
                    {new Date(selectedConv.updatedAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="mt-4 font-medium text-gray-900">Détails</h3>
              <p className="mt-1 text-sm text-gray-500">
                Sélectionnez une conversation pour voir les détails
              </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

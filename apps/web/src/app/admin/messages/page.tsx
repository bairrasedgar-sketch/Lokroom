/**
 * Page Admin - Messaging admin vers utilisateurs
 * Envoyer des messages/notifications à un ou plusieurs utilisateurs
 * + Visualisation des conversations entre utilisateurs
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  PaperAirplaneIcon,
  UserGroupIcon,
  UserCircleIcon,
  MegaphoneIcon,
  EnvelopeIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UsersIcon,
  HomeModernIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

type Stats = {
  totalSent: number;
  thisWeek: number;
  readCount: number;
  totalUsers: number;
};

type Broadcast = {
  title: string;
  message: string;
  createdAt: string;
  recipients: number;
  readCount: number;
};

type UserSearchResult = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  profile: { avatarUrl: string | null } | null;
};

type ConversationUser = {
  id: string;
  name: string | null;
  email: string;
  profile: { avatarUrl: string | null } | null;
};

type Conversation = {
  id: string;
  host: ConversationUser;
  guest: ConversationUser;
  listing: { id: string; title: string; city: string } | null;
  lastMessage: { id: string; content: string; createdAt: string; senderId: string } | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  id: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender: ConversationUser;
  MessageAttachment: { id: string; url: string; type: string }[];
};

type ConversationDetail = {
  id: string;
  host: ConversationUser;
  guest: ConversationUser;
  listing: { id: string; title: string; city: string; country: string } | null;
  booking: { id: string; startDate: string; endDate: string; status: string; totalPrice: number; currency: string } | null;
  messages: Message[];
};

const RECIPIENT_TYPES = [
  { id: "single", label: "Un utilisateur", icon: UserCircleIcon, description: "Envoyer à un utilisateur spécifique" },
  { id: "hosts", label: "Tous les hôtes", icon: HomeModernIcon, description: "Utilisateurs avec au moins une annonce" },
  { id: "guests", label: "Tous les voyageurs", icon: UsersIcon, description: "Utilisateurs avec au moins une réservation" },
  { id: "verified", label: "Utilisateurs vérifiés", icon: ShieldCheckIcon, description: "Identité vérifiée uniquement" },
  { id: "all", label: "Tout le monde", icon: MegaphoneIcon, description: "Tous les utilisateurs (hors admins)" },
];

const MESSAGE_TEMPLATES = [
  {
    id: "maintenance",
    title: "Maintenance prévue",
    message: "Une maintenance est prévue le [DATE]. Le site sera temporairement indisponible pendant environ [DURÉE]. Nous nous excusons pour la gêne occasionnée.",
  },
  {
    id: "new_feature",
    title: "Nouvelle fonctionnalité",
    message: "Nous sommes ravis de vous annoncer le lancement de [FONCTIONNALITÉ]. Découvrez-la dès maintenant dans votre compte !",
  },
  {
    id: "promotion",
    title: "Offre spéciale",
    message: "Profitez de [RÉDUCTION] sur votre prochaine réservation avec le code [CODE]. Offre valable jusqu'au [DATE].",
  },
  {
    id: "reminder",
    title: "Rappel important",
    message: "N'oubliez pas de [ACTION]. Si vous avez des questions, notre équipe support est là pour vous aider.",
  },
];

export default function AdminMessagesPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<"broadcast" | "conversations">("broadcast");

  const [stats, setStats] = useState<Stats | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");
  const [conversationPage, setConversationPage] = useState(1);
  const [conversationPagination, setConversationPagination] = useState({ total: 0, totalPages: 1 });

  // Conversation detail state
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [conversationDetailLoading, setConversationDetailLoading] = useState(false);

  // Delete confirmation
  const [deleteModal, setDeleteModal] = useState<{ type: "conversation" | "message"; id: string; conversationId?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [recipientType, setRecipientType] = useState<string>("single");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionUrl, setActionUrl] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchMessages(controller.signal);
    return () => controller.abort();
  }, []);

  // User search with debounce
  useEffect(() => {
    if (!userSearch.trim() || userSearch.length < 2) {
      setUserSearchResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(userSearch)}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setUserSearchResults(data.users || []);
          setShowUserSearch(true);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [userSearch]);

  const fetchMessages = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/messages", { signal });
      const data = await res.json();

      setStats(data.stats);
      setBroadcasts(data.broadcasts || []);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch conversations
  const fetchConversations = useCallback(async (page = 1, search = "") => {
    setConversationsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/conversations?${params}`);
      const data = await res.json();

      setConversations(data.conversations || []);
      setConversationPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  // Fetch conversation detail
  const fetchConversationDetail = async (id: string) => {
    setConversationDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/conversations/${id}`);
      const data = await res.json();
      setSelectedConversation(data.conversation || null);
    } catch (error) {
      console.error("Error fetching conversation detail:", error);
    } finally {
      setConversationDetailLoading(false);
    }
  };

  // Delete conversation or message
  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      let url = "";
      if (deleteModal.type === "conversation") {
        url = `/api/admin/conversations/${deleteModal.id}`;
      } else {
        url = `/api/admin/conversations/${deleteModal.conversationId}/messages/${deleteModal.id}`;
      }

      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        if (deleteModal.type === "conversation") {
          setConversations((prev) => prev.filter((c) => c.id !== deleteModal.id));
          if (selectedConversation?.id === deleteModal.id) {
            setSelectedConversation(null);
          }
        } else if (selectedConversation) {
          setSelectedConversation({
            ...selectedConversation,
            messages: selectedConversation.messages.filter((m) => m.id !== deleteModal.id),
          });
        }
        setDeleteModal(null);
      }
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setDeleting(false);
    }
  };

  // Load conversations when tab changes
  useEffect(() => {
    if (activeTab === "conversations" && conversations.length === 0) {
      fetchConversations(1, "");
    }
  }, [activeTab, conversations.length, fetchConversations]);

  // Search conversations with debounce
  useEffect(() => {
    if (activeTab !== "conversations") return;
    const timer = setTimeout(() => {
      setConversationPage(1);
      fetchConversations(1, conversationSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [conversationSearch, activeTab, fetchConversations]);

  // Format date helper
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Hier";
    } else if (days < 7) {
      return date.toLocaleDateString("fr-FR", { weekday: "long" });
    } else {
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    if (recipientType === "single" && !selectedUserId) return;

    setSending(true);
    setSent(false);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: recipientType,
          userId: recipientType === "single" ? selectedUserId : undefined,
          title,
          message,
          actionUrl: actionUrl || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSent(true);
        setSentCount(data.sent);
        // Reset form
        setTitle("");
        setMessage("");
        setActionUrl("");
        setSelectedUser(null);
        setSelectedUserId("");
        // Refresh data
        fetchMessages();
      }
    } finally {
      setSending(false);
    }
  };

  const selectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setSelectedUserId(user.id);
    setUserSearch("");
    setShowUserSearch(false);
  };

  const applyTemplate = (template: typeof MESSAGE_TEMPLATES[0]) => {
    setTitle(template.title);
    setMessage(template.message);
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmer la suppression
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              {deleteModal.type === "conversation"
                ? "Êtes-vous sûr de vouloir supprimer cette conversation ? Tous les messages seront supprimés définitivement."
                : "Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible."}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messagerie Admin</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez les communications de la plateforme
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("broadcast")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "broadcast"
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <MegaphoneIcon className="h-5 w-5" />
              Diffusion
            </div>
          </button>
          <button
            onClick={() => setActiveTab("conversations")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "conversations"
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              Conversations utilisateurs
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "broadcast" ? (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <EnvelopeIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalSent || 0}</p>
              <p className="text-sm text-gray-500">Messages envoyés</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-xl">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.readCount || 0}</p>
              <p className="text-sm text-gray-500">Lus</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-100 rounded-xl">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.thisWeek || 0}</p>
              <p className="text-sm text-gray-500">Cette semaine</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 rounded-xl">
              <UserGroupIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
              <p className="text-sm text-gray-500">Utilisateurs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Compose Message */}
        <div className="lg:col-span-2 space-y-6">
          {/* Success Alert */}
          {sent && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-semibold text-green-800">Message envoyé !</p>
                <p className="text-sm text-green-600">{sentCount} utilisateur(s) notifié(s)</p>
              </div>
              <button
                onClick={() => setSent(false)}
                className="ml-auto text-green-600 hover:text-green-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Recipient Type */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Destinataires</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {RECIPIENT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = recipientType === type.id;

                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setRecipientType(type.id);
                      if (type.id !== "single") {
                        setSelectedUser(null);
                        setSelectedUserId("");
                      }
                    }}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-red-500 bg-red-50 ring-2 ring-red-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-5 w-5 ${isSelected ? "text-red-500" : "text-gray-400"}`} />
                      <span className={`font-medium ${isSelected ? "text-red-700" : "text-gray-900"}`}>
                        {type.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </button>
                );
              })}
            </div>

            {/* User Search for single recipient */}
            {recipientType === "single" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher l&apos;utilisateur
                </label>
                {selectedUser ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {selectedUser.profile?.avatarUrl ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image src={selectedUser.profile.avatarUrl} alt={`Avatar de ${selectedUser.name || "utilisateur"}`} fill className="object-cover" sizes="40px" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {selectedUser.name?.charAt(0) || "?"}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{selectedUser.name || "Sans nom"}</p>
                      <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setSelectedUserId("");
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      onFocus={() => userSearchResults.length > 0 && setShowUserSearch(true)}
                      placeholder="Rechercher par nom ou email..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                    {searchLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                      </div>
                    )}

                    {/* Search Results */}
                    {showUserSearch && userSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-10">
                        {userSearchResults.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => selectUser(user)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
                          >
                            {user.profile?.avatarUrl ? (
                              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                                <Image src={user.profile.avatarUrl} alt={`Avatar de ${user.name || "utilisateur"}`} fill className="object-cover" sizes="32px" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                                {user.name?.charAt(0) || "?"}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{user.name || "Sans nom"}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Message Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Message</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de la notification *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Nouvelle fonctionnalité disponible"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Écrivez votre message ici..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lien d&apos;action (optionnel)
                </label>
                <input
                  type="text"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="Ex: /account/settings"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  L&apos;utilisateur pourra cliquer sur la notification pour accéder à cette page
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  {recipientType === "single"
                    ? selectedUser
                      ? `Sera envoyé à ${selectedUser.email}`
                      : "Sélectionnez un destinataire"
                    : `Sera envoyé à tous les ${
                        recipientType === "hosts"
                          ? "hôtes"
                          : recipientType === "guests"
                          ? "voyageurs"
                          : recipientType === "verified"
                          ? "utilisateurs vérifiés"
                          : "utilisateurs"
                      }`}
                </p>
                <button
                  onClick={handleSend}
                  disabled={
                    sending ||
                    !title.trim() ||
                    !message.trim() ||
                    (recipientType === "single" && !selectedUserId)
                  }
                  className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-5 w-5" />
                      Envoyer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Templates */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-yellow-500" />
              Modèles
            </h3>
            <div className="space-y-2">
              {MESSAGE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                >
                  <p className="font-medium text-gray-900 text-sm">{template.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.message}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Broadcasts */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
              Envois récents
            </h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
              </div>
            ) : broadcasts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucun envoi récent</p>
            ) : (
              <div className="space-y-3">
                {broadcasts.slice(0, 5).map((broadcast, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 text-sm">{broadcast.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{broadcast.message}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>{broadcast.recipients} destinataires</span>
                      <span>{broadcast.readCount} lus</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      ) : (
        /* Conversations Tab */
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className={`${selectedConversation ? "hidden lg:block" : ""} lg:col-span-1`}>
            <div className="bg-white rounded-xl border border-gray-200">
              {/* Search */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={conversationSearch}
                    onChange={(e) => setConversationSearch(e.target.value)}
                    placeholder="Rechercher une conversation..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {conversationsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">Aucune conversation trouvée</p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedConversation?.id === conv.id ? "bg-red-50" : ""
                      }`}
                      onClick={() => fetchConversationDetail(conv.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex -space-x-2">
                          {conv.host.profile?.avatarUrl ? (
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                              <Image src={conv.host.profile.avatarUrl} alt="" fill className="object-cover" sizes="32px" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs border-2 border-white">
                              {conv.host.name?.charAt(0) || "?"}
                            </div>
                          )}
                          {conv.guest.profile?.avatarUrl ? (
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                              <Image src={conv.guest.profile.avatarUrl} alt="" fill className="object-cover" sizes="32px" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs border-2 border-white">
                              {conv.guest.name?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {conv.host.name || conv.host.email} ↔ {conv.guest.name || conv.guest.email}
                            </p>
                            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                              {formatDate(conv.updatedAt)}
                            </span>
                          </div>
                          {conv.listing && (
                            <p className="text-xs text-gray-500 truncate">{conv.listing.title}</p>
                          )}
                          {conv.lastMessage && (
                            <p className="text-xs text-gray-400 truncate mt-1">{conv.lastMessage.content}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">{conv.messageCount} messages</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {conversationPagination.totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      const newPage = conversationPage - 1;
                      setConversationPage(newPage);
                      fetchConversations(newPage, conversationSearch);
                    }}
                    disabled={conversationPage === 1}
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <span className="text-sm text-gray-500">
                    {conversationPage} / {conversationPagination.totalPages}
                  </span>
                  <button
                    onClick={() => {
                      const newPage = conversationPage + 1;
                      setConversationPage(newPage);
                      fetchConversations(newPage, conversationSearch);
                    }}
                    disabled={conversationPage === conversationPagination.totalPages}
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Conversation Detail */}
          <div className={`${selectedConversation ? "" : "hidden lg:block"} lg:col-span-2`}>
            {conversationDetailLoading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
              </div>
            ) : selectedConversation ? (
              <div className="bg-white rounded-xl border border-gray-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <ArrowLeftIcon className="h-5 w-5" />
                      </button>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedConversation.host.name || selectedConversation.host.email} ↔{" "}
                          {selectedConversation.guest.name || selectedConversation.guest.email}
                        </h3>
                        {selectedConversation.listing && (
                          <p className="text-sm text-gray-500">
                            {selectedConversation.listing.title} - {selectedConversation.listing.city}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteModal({ type: "conversation", id: selectedConversation.id })}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Supprimer la conversation"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Booking info */}
                  {selectedConversation.booking && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium text-gray-700">Réservation associée</p>
                      <p className="text-gray-500">
                        {new Date(selectedConversation.booking.startDate).toLocaleDateString("fr-FR")} -{" "}
                        {new Date(selectedConversation.booking.endDate).toLocaleDateString("fr-FR")} •{" "}
                        {selectedConversation.booking.totalPrice} {selectedConversation.booking.currency} •{" "}
                        <span className={`font-medium ${
                          selectedConversation.booking.status === "CONFIRMED" ? "text-green-600" :
                          selectedConversation.booking.status === "CANCELLED" ? "text-red-600" : "text-yellow-600"
                        }`}>
                          {selectedConversation.booking.status}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                  {selectedConversation.messages.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Aucun message dans cette conversation</p>
                  ) : (
                    selectedConversation.messages.map((msg) => {
                      const isHost = msg.sender.id === selectedConversation.host.id;
                      return (
                        <div key={msg.id} className={`flex ${isHost ? "justify-start" : "justify-end"}`}>
                          <div className={`max-w-[70%] ${isHost ? "order-2" : "order-1"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              {isHost ? (
                                <>
                                  {msg.sender.profile?.avatarUrl ? (
                                    <div className="relative w-6 h-6 rounded-full overflow-hidden">
                                      <Image src={msg.sender.profile.avatarUrl} alt="" fill className="object-cover" sizes="24px" />
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                                      {msg.sender.name?.charAt(0) || "?"}
                                    </div>
                                  )}
                                  <span className="text-xs font-medium text-gray-700">{msg.sender.name || msg.sender.email}</span>
                                  <span className="text-xs text-gray-400">{formatDate(msg.createdAt)}</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-xs text-gray-400">{formatDate(msg.createdAt)}</span>
                                  <span className="text-xs font-medium text-gray-700">{msg.sender.name || msg.sender.email}</span>
                                  {msg.sender.profile?.avatarUrl ? (
                                    <div className="relative w-6 h-6 rounded-full overflow-hidden">
                                      <Image src={msg.sender.profile.avatarUrl} alt="" fill className="object-cover" sizes="24px" />
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                                      {msg.sender.name?.charAt(0) || "?"}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            <div className={`p-3 rounded-lg ${isHost ? "bg-gray-100" : "bg-red-50"}`}>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                              {msg.MessageAttachment && msg.MessageAttachment.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {msg.MessageAttachment.map((att) => (
                                    <a
                                      key={att.id}
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline"
                                    >
                                      Pièce jointe
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end mt-1">
                              <button
                                onClick={() => setDeleteModal({
                                  type: "message",
                                  id: msg.id,
                                  conversationId: selectedConversation.id,
                                })}
                                className="p-1 text-gray-400 hover:text-red-500 rounded"
                                title="Supprimer ce message"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Sélectionnez une conversation pour voir les messages</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

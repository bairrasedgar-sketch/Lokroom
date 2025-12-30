/**
 * Page Admin - Messaging admin vers utilisateurs
 * Envoyer des messages/notifications à un ou plusieurs utilisateurs
 */
"use client";

import { useState, useEffect } from "react";
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
  const [stats, setStats] = useState<Stats | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentCount, setSentCount] = useState(0);

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
    fetchMessages();
  }, []);

  // User search with debounce
  useEffect(() => {
    if (!userSearch.trim() || userSearch.length < 2) {
      setUserSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(userSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setUserSearchResults(data.users || []);
          setShowUserSearch(true);
        }
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearch]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/messages");
      const data = await res.json();

      setStats(data.stats);
      setBroadcasts(data.broadcasts || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messagerie Admin</h1>
        <p className="text-sm text-gray-500 mt-1">
          Envoyez des notifications aux utilisateurs de la plateforme
        </p>
      </div>

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
                      <img src={selectedUser.profile.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
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
                              <img src={user.profile.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
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
    </div>
  );
}

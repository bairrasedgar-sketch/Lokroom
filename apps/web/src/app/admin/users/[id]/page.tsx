/**
 * Page Admin - Détail utilisateur
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeftIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  StarIcon,
  HomeModernIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { logger } from "@/lib/logger";


type UserProfile = {
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  birthDate: string | null;
  ratingAvg: number;
  ratingCount: number;
};

type HostProfile = {
  bio: string | null;
  superhost: boolean;
  verifiedEmail: boolean;
  verifiedPhone: boolean;
  languages: string[];
  responseTimeCategory: string | null;
};

type Badge = {
  id: string;
  type: string;
  earnedAt: string;
};

type Listing = {
  id: string;
  title: string;
  city: string;
  country: string;
  price: number;
  currency: string;
  isActive: boolean;
  rating: number;
  viewCount: number;
  coverImage: string | null;
  status: string;
  createdAt: string;
};

type Booking = {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  currency: string;
  status: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    city: string;
  };
  coverImage: string | null;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  listing?: { title: string };
  author?: { name: string | null };
};

type Dispute = {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
};

type AdminNote = {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  author: { name: string | null };
};

type AuditLog = {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  admin: { name: string | null; email: string };
};

type UserStats = {
  Listing: number;
  bookings: number;
  reviewsWritten: number;
  reviewsReceived: number;
  disputesOpened: number;
  messages: number;
  favorites: number;
  totalRevenueAsHost: number;
  totalBookingsAsHost: number;
  totalSpentAsGuest: number;
  totalBookingsAsGuest: number;
  avgRatingReceived: number;
  ratingCount: number;
};

type UserData = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  country: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  emailVerified: string | null;
  identityStatus: string;
  profile: UserProfile | null;
  hostProfile: HostProfile | null;
  wallet: { balanceCents: number } | null;
  badges: Badge[];
  listings: Listing[];
  bookings: Booking[];
  reviewsWritten: Review[];
  reviewsReceived: Review[];
  disputes: Dispute[];
  ban: { id: string; reason: string; expiresAt: string | null; createdAt: string } | null;
  stats: UserStats;
  adminNotes: AdminNote[];
  auditHistory: AuditLog[];
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800 border-red-200",
  HOST: "bg-blue-100 text-blue-800 border-blue-200",
  GUEST: "bg-green-100 text-green-800 border-green-200",
  BOTH: "bg-purple-100 text-purple-800 border-purple-200",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  HOST: "Hôte",
  GUEST: "Voyageur",
  BOTH: "Hôte & Voyageur",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
};

const IDENTITY_STATUS: Record<string, { label: string; color: string }> = {
  UNVERIFIED: { label: "Non vérifié", color: "text-gray-500" },
  PENDING: { label: "En cours", color: "text-yellow-600" },
  VERIFIED: { label: "Vérifié", color: "text-green-600" },
  REJECTED: { label: "Rejeté", color: "text-red-600" },
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "bookings" | "reviews" | "disputes" | "notes" | "history">("overview");
  const [showBanModal, setShowBanModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<"permanent" | "7" | "30" | "90">("permanent");
  const [noteContent, setNoteContent] = useState("");
  const [saving, setSaving] = useState(false);

  // États pour le formulaire d'édition
  const [editEmail, setEditEmail] = useState("");
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editIdentityStatus, setEditIdentityStatus] = useState("");

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();
      if (data.user) setUser(data.user);
    } catch (error) {
      logger.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleBan = async () => {
    if (!banReason.trim()) return;
    setSaving(true);
    try {
      const expiresAt = banDuration === "permanent"
        ? null
        : new Date(Date.now() + parseInt(banDuration) * 24 * 60 * 60 * 1000).toISOString();

      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: banReason, expiresAt }),
      });

      if (res.ok) {
        fetchUser();
        setShowBanModal(false);
        setBanReason("");
      }
    } catch (error) {
      logger.error("Error banning user:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleUnban = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchUser();
      }
    } catch (error) {
      logger.error("Error unbanning user:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "User",
          targetId: userId,
          content: noteContent,
        }),
      });

      if (res.ok) {
        fetchUser();
        setShowNoteModal(false);
        setNoteContent("");
      }
    } catch (error) {
      logger.error("Error adding note:", error);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    if (user) {
      setEditEmail(user.email);
      setEditName(user.name || "");
      setEditRole(user.role);
      setEditCountry(user.country || "");
      setEditIdentityStatus(user.identityStatus);
      setShowEditModal(true);
    }
  };

  const handleEditUser = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: editEmail,
          name: editName,
          role: editRole,
          country: editCountry,
          identityStatus: editIdentityStatus,
        }),
      });

      if (res.ok) {
        fetchUser();
        setShowEditModal(false);
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      logger.error("Error updating user:", error);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number, currency = "EUR") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <UserCircleIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Utilisateur non trouvé</h2>
        <Link href="/admin/users" className="text-red-600 hover:text-red-700 mt-2 inline-block">
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {user.name || "Utilisateur sans nom"}
          </h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {user.ban ? (
            <button
              onClick={handleUnban}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <CheckCircleIcon className="h-5 w-5" />
              Débannir
            </button>
          ) : (
            <button
              onClick={() => setShowBanModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <NoSymbolIcon className="h-5 w-5" />
              Bannir
            </button>
          )}
          <button
            onClick={openEditModal}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <PencilIcon className="h-5 w-5" />
            Modifier
          </button>
        </div>
      </div>

      {/* Ban Alert */}
      {user.ban && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldExclamationIcon className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Utilisateur banni</p>
            <p className="text-sm text-red-600 mt-1">Raison : {user.ban.reason}</p>
            <p className="text-xs text-red-500 mt-1">
              Depuis le {formatDate(user.ban.createdAt)}
              {user.ban.expiresAt && ` • Expire le ${formatDate(user.ban.expiresAt)}`}
            </p>
          </div>
        </div>
      )}

      {/* User Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.profile?.avatarUrl ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100">
                <Image
                  src={user.profile.avatarUrl}
                  alt={`Avatar de ${user.name || "utilisateur"}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-3xl font-bold">
                {user.name?.charAt(0) || "U"}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${ROLE_COLORS[user.role] || "bg-gray-100"}`}>
                  {ROLE_LABELS[user.role] || user.role}
                </span>
                {user.hostProfile?.superhost && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    Superhost
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <EnvelopeIcon className="h-4 w-4" />
                {user.email}
                {user.emailVerified && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
              </div>
              {user.profile?.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <PhoneIcon className="h-4 w-4" />
                  {user.profile.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPinIcon className="h-4 w-4" />
                {user.profile?.city || "-"}, {user.country || "-"}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheckIcon className="h-4 w-4 text-gray-400" />
                <span className={IDENTITY_STATUS[user.identityStatus]?.color}>
                  Identité : {IDENTITY_STATUS[user.identityStatus]?.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CalendarDaysIcon className="h-4 w-4" />
                Inscrit le {formatDate(user.createdAt)}
              </div>
              {user.lastLoginAt && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4" />
                  Dernière connexion : {formatDateTime(user.lastLoginAt)}
                </div>
              )}
              {user.stats.avgRatingReceived > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <StarIconSolid className="h-4 w-4 text-yellow-500" />
                  {user.stats.avgRatingReceived.toFixed(1)} ({user.stats.ratingCount} avis)
                </div>
              )}
            </div>

            <div className="space-y-3">
              {user.wallet && (
                <div className="flex items-center gap-2 text-sm">
                  <CurrencyDollarIcon className="h-4 w-4 text-green-500" />
                  Solde : {formatCurrency(user.wallet.balanceCents / 100)}
                </div>
              )}
              {user.badges.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {user.badges.slice(0, 3).map((badge) => (
                    <span
                      key={badge.id}
                      className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                    >
                      {badge.type.replace(/_/g, " ")}
                    </span>
                  ))}
                  {user.badges.length > 3 && (
                    <span className="text-xs text-gray-500">+{user.badges.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <HomeModernIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{user.stats.Listing}</p>
              <p className="text-sm text-gray-500">Annonces</p>
            </div>
          </div>
          {user.stats.totalRevenueAsHost > 0 && (
            <p className="mt-2 text-xs text-green-600">
              {formatCurrency(user.stats.totalRevenueAsHost)} générés
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{user.stats.bookings}</p>
              <p className="text-sm text-gray-500">Réservations</p>
            </div>
          </div>
          {user.stats.totalSpentAsGuest > 0 && (
            <p className="mt-2 text-xs text-blue-600">
              {formatCurrency(user.stats.totalSpentAsGuest)} dépensés
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <StarIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {user.stats.reviewsWritten + user.stats.reviewsReceived}
              </p>
              <p className="text-sm text-gray-500">Avis</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {user.stats.reviewsWritten} écrits • {user.stats.reviewsReceived} reçus
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{user.stats.disputesOpened}</p>
              <p className="text-sm text-gray-500">Litiges</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 -mb-px">
          {[
            { id: "overview", label: "Aperçu" },
            { id: "listings", label: `Annonces (${user.listings.length})` },
            { id: "bookings", label: `Réservations (${user.bookings.length})` },
            { id: "reviews", label: `Avis (${user.reviewsWritten.length + user.reviewsReceived.length})` },
            { id: "disputes", label: `Litiges (${user.disputes.length})` },
            { id: "notes", label: `Notes (${user.adminNotes.length})` },
            { id: "history", label: "Historique" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="p-6 space-y-6">
            {/* Bio */}
            {user.hostProfile?.bio && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
                <p className="text-gray-600">{user.hostProfile.bio}</p>
              </div>
            )}

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Listings */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Dernières annonces</h3>
                {user.listings.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune annonce</p>
                ) : (
                  <div className="space-y-2">
                    {user.listings.slice(0, 3).map((listing) => (
                      <Link
                        key={listing.id}
                        href={`/admin/listings/${listing.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                      >
                        {listing.coverImage ? (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                            <Image src={listing.coverImage} alt={`Photo de ${listing.title}`} fill className="object-cover" sizes="48px" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
                          <p className="text-xs text-gray-500">{listing.city}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[listing.status] || "bg-gray-100"}`}>
                          {listing.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Bookings */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Dernières réservations</h3>
                {user.bookings.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune réservation</p>
                ) : (
                  <div className="space-y-2">
                    {user.bookings.slice(0, 3).map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/admin/bookings/${booking.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                      >
                        {booking.coverImage ? (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                            <Image src={booking.coverImage} alt={`Photo de ${booking.listing.title}`} fill className="object-cover" sizes="48px" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{booking.listing.title}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[booking.status] || "bg-gray-100"}`}>
                          {booking.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === "listings" && (
          <div className="divide-y divide-gray-100">
            {user.listings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <HomeModernIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p>Aucune annonce</p>
              </div>
            ) : (
              user.listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/admin/listings/${listing.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50"
                >
                  {listing.coverImage ? (
                    <div className="relative w-20 h-14 rounded-lg overflow-hidden">
                      <Image src={listing.coverImage} alt={`Photo de ${listing.title}`} fill className="object-cover" sizes="80px" />
                    </div>
                  ) : (
                    <div className="w-20 h-14 rounded-lg bg-gray-200" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{listing.title}</p>
                    <p className="text-sm text-gray-500">{listing.city}, {listing.country}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{formatCurrency(listing.price, listing.currency)}/nuit</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <StarIconSolid className="h-3 w-3 text-yellow-500" />
                        {listing.rating.toFixed(1)}
                      </span>
                      <span>•</span>
                      <span>{listing.viewCount} vues</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[listing.status] || "bg-gray-100"}`}>
                      {listing.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(listing.createdAt)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="divide-y divide-gray-100">
            {user.bookings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p>Aucune réservation</p>
              </div>
            ) : (
              user.bookings.map((booking) => (
                <div key={booking.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                  {booking.coverImage ? (
                    <div className="relative w-20 h-14 rounded-lg overflow-hidden">
                      <Image src={booking.coverImage} alt={`Photo de ${booking.listing.title}`} fill className="object-cover" sizes="80px" />
                    </div>
                  ) : (
                    <div className="w-20 h-14 rounded-lg bg-gray-200" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{booking.listing.title}</p>
                    <p className="text-sm text-gray-500">{booking.listing.city}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(booking.totalPrice, booking.currency)}
                    </p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${STATUS_COLORS[booking.status] || "bg-gray-100"}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Avis reçus ({user.reviewsReceived.length})</h3>
              {user.reviewsReceived.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun avis reçu</p>
              ) : (
                <div className="space-y-3">
                  {user.reviewsReceived.map((review) => (
                    <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIconSolid
                              key={star}
                              className={`h-4 w-4 ${star <= review.rating ? "text-yellow-500" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">par {review.author?.name || "Anonyme"}</span>
                        <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                      </div>
                      {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Avis écrits ({user.reviewsWritten.length})</h3>
              {user.reviewsWritten.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun avis écrit</p>
              ) : (
                <div className="space-y-3">
                  {user.reviewsWritten.map((review) => (
                    <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIconSolid
                              key={star}
                              className={`h-4 w-4 ${star <= review.rating ? "text-yellow-500" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">sur {review.listing?.title}</span>
                        <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                      </div>
                      {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === "disputes" && (
          <div className="divide-y divide-gray-100">
            {user.disputes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p>Aucun litige</p>
              </div>
            ) : (
              user.disputes.map((dispute) => (
                <Link
                  key={dispute.id}
                  href={`/admin/disputes/${dispute.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{dispute.reason.replace(/_/g, " ")}</p>
                    <p className="text-sm text-gray-500">Ouvert le {formatDate(dispute.createdAt)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    dispute.status.includes("RESOLVED") ? "bg-green-100 text-green-800" :
                    dispute.status === "OPEN" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {dispute.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === "notes" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Notes administratives</h3>
              <button
                onClick={() => setShowNoteModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <PlusIcon className="h-4 w-4" />
                Ajouter
              </button>
            </div>
            {user.adminNotes.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune note</p>
            ) : (
              <div className="space-y-3">
                {user.adminNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                    <p className="text-sm text-gray-700">{note.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Par {note.author.name || "Admin"} • {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="divide-y divide-gray-100">
            {user.auditHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p>Aucun historique</p>
              </div>
            ) : (
              user.auditHistory.map((log) => (
                <div key={log.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-gray-100 rounded-full">
                      <DocumentTextIcon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-500">
                        Par {log.admin.name || log.admin.email}
                      </p>
                      {log.details && (
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bannir l&apos;utilisateur</h3>
              <button onClick={() => setShowBanModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison du ban</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Décrivez la raison..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durée</label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value as typeof banDuration)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="7">7 jours</option>
                  <option value="30">30 jours</option>
                  <option value="90">90 jours</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowBanModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleBan}
                  disabled={!banReason.trim() || saving}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {saving ? "..." : "Bannir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ajouter une note</h3>
              <button onClick={() => setShowNoteModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Écrivez votre note..."
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={!noteContent.trim() || saving}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {saving ? "..." : "Ajouter"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Modifier l&apos;utilisateur</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="email@exemple.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Nom de l'utilisateur"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="GUEST">Voyageur</option>
                  <option value="HOST">Hôte</option>
                  <option value="BOTH">Hôte & Voyageur</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                <input
                  type="text"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Pays"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut d&apos;identité</label>
                <select
                  value={editIdentityStatus}
                  onChange={(e) => setEditIdentityStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="UNVERIFIED">Non vérifié</option>
                  <option value="PENDING">En cours</option>
                  <option value="VERIFIED">Vérifié</option>
                  <option value="REJECTED">Rejeté</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleEditUser}
                  disabled={saving}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {saving ? "..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

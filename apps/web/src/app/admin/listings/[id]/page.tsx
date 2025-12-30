/**
 * Page Admin - Détail annonce avec modération
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  MapPinIcon,
  CalendarDaysIcon,
  StarIcon,
  EyeIcon,
  HeartIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  SparklesIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  FlagIcon,
  PencilIcon,
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

type Owner = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  profile: {
    avatarUrl: string | null;
    ratingAvg: number;
    ratingCount: number;
  } | null;
  hostProfile: {
    superhost: boolean;
    verifiedEmail: boolean;
    verifiedPhone: boolean;
  } | null;
  _count: {
    Listing: number;
    bookings: number;
  };
};

type Image = {
  id: string;
  url: string;
  isCover: boolean;
  position: number;
};

type Amenity = {
  amenity: {
    id: string;
    name: string;
    icon: string | null;
    category: string;
  };
};

type Moderation = {
  id: string;
  status: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  isFeatured: boolean;
  featuredUntil: string | null;
  adminNotes: string | null;
  User: {
    name: string | null;
    email: string;
  } | null;
};

type Report = {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  User: {
    id: string;
    name: string | null;
    email: string;
  };
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    profile: { avatarUrl: string | null } | null;
  };
};

type Booking = {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  currency: string;
  status: string;
  createdAt: string;
  guest: {
    id: string;
    name: string | null;
    email: string;
  };
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

type ListingData = {
  id: string;
  title: string;
  description: string;
  type: string;
  city: string;
  country: string;
  address: string | null;
  lat: number;
  lng: number;
  price: number;
  currency: string;
  minHours: number;
  maxGuests: number;
  size: number | null;
  isActive: boolean;
  rating: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  owner: Owner;
  images: Image[];
  amenities: Amenity[];
  ListingModeration: Moderation | null;
  ListingReport: Report[];
  reviews: Review[];
  bookings: Booking[];
  stats: {
    bookings: number;
    reviews: number;
    favorites: number;
    conversations: number;
    totalRevenue: number;
    confirmedBookings: number;
  };
  adminNotes: AdminNote[];
  auditHistory: AuditLog[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  APPROVED: { label: "Approuvée", color: "text-green-700", bgColor: "bg-green-100", icon: CheckCircleIcon },
  PENDING_REVIEW: { label: "En attente", color: "text-yellow-700", bgColor: "bg-yellow-100", icon: ExclamationTriangleIcon },
  REJECTED: { label: "Rejetée", color: "text-red-700", bgColor: "bg-red-100", icon: XCircleIcon },
  SUSPENDED: { label: "Suspendue", color: "text-orange-700", bgColor: "bg-orange-100", icon: PauseCircleIcon },
  DRAFT: { label: "Brouillon", color: "text-gray-700", bgColor: "bg-gray-100", icon: DocumentTextIcon },
};

const TYPE_LABELS: Record<string, string> = {
  STUDIO: "Studio Photo",
  OFFICE: "Bureau",
  EVENT_SPACE: "Espace Événementiel",
  COWORKING: "Coworking",
  MEETING_ROOM: "Salle de Réunion",
  OTHER: "Autre",
};

const BOOKING_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmée", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Annulée", color: "bg-red-100 text-red-800" },
};

export default function AdminListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "images" | "bookings" | "reviews" | "reports" | "notes" | "history">("overview");
  const [showActionModal, setShowActionModal] = useState<"approve" | "reject" | "suspend" | "feature" | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [featuredDays, setFeaturedDays] = useState(7);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchListing = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`);
      const data = await res.json();
      if (data.listing) setListing(data.listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const handleAction = async (action: "approve" | "reject" | "suspend" | "unsuspend") => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: actionReason || undefined,
        }),
      });

      if (res.ok) {
        fetchListing();
        setShowActionModal(null);
        setActionReason("");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeatured = async () => {
    setSaving(true);
    try {
      const isFeatured = !listing?.ListingModeration?.isFeatured;
      const featuredUntil = isFeatured
        ? new Date(Date.now() + featuredDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured, featuredUntil }),
      });

      if (res.ok) {
        fetchListing();
        setShowActionModal(null);
      }
    } catch (error) {
      console.error("Error:", error);
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
          targetType: "Listing",
          targetId: listingId,
          content: noteContent,
        }),
      });

      if (res.ok) {
        fetchListing();
        setShowNoteModal(false);
        setNoteContent("");
      }
    } catch (error) {
      console.error("Error:", error);
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

  if (!listing) {
    return (
      <div className="text-center py-12">
        <PhotoIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Annonce non trouvée</h2>
        <Link href="/admin/listings" className="text-red-600 hover:text-red-700 mt-2 inline-block">
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  const status = listing.ListingModeration?.status || "DRAFT";
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg mt-1"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{listing.title}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
              <StatusIcon className="h-4 w-4" />
              {statusConfig.label}
            </span>
            {listing.ListingModeration?.isFeatured && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <SparklesIcon className="h-4 w-4" />
                Mise en avant
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPinIcon className="h-4 w-4" />
              {listing.city}, {listing.country}
            </span>
            <span>{TYPE_LABELS[listing.type] || listing.type}</span>
            <span className="flex items-center gap-1">
              <CalendarDaysIcon className="h-4 w-4" />
              Créée le {formatDate(listing.createdAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {status === "PENDING_REVIEW" && (
            <>
              <button
                onClick={() => handleAction("approve")}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Approuver
              </button>
              <button
                onClick={() => setShowActionModal("reject")}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <XCircleIcon className="h-5 w-5" />
                Rejeter
              </button>
            </>
          )}
          {status === "APPROVED" && (
            <button
              onClick={() => setShowActionModal("suspend")}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <PauseCircleIcon className="h-5 w-5" />
              Suspendre
            </button>
          )}
          {status === "SUSPENDED" && (
            <button
              onClick={() => handleAction("unsuspend")}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <PlayCircleIcon className="h-5 w-5" />
              Réactiver
            </button>
          )}
          <button
            onClick={() => setShowActionModal("feature")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              listing.ListingModeration?.isFeatured
                ? "border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <SparklesIcon className="h-5 w-5" />
            {listing.ListingModeration?.isFeatured ? "Retirer" : "Mettre en avant"}
          </button>
          <Link
            href={`/listings/${listing.id}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <EyeIcon className="h-5 w-5" />
            Voir
          </Link>
        </div>
      </div>

      {/* Rejection/Suspension Alert */}
      {(status === "REJECTED" || status === "SUSPENDED") && listing.ListingModeration?.rejectionReason && (
        <div className={`rounded-xl p-4 flex items-start gap-3 ${status === "REJECTED" ? "bg-red-50 border border-red-200" : "bg-orange-50 border border-orange-200"}`}>
          <StatusIcon className={`h-6 w-6 flex-shrink-0 mt-0.5 ${status === "REJECTED" ? "text-red-500" : "text-orange-500"}`} />
          <div>
            <p className={`font-semibold ${status === "REJECTED" ? "text-red-800" : "text-orange-800"}`}>
              {status === "REJECTED" ? "Annonce rejetée" : "Annonce suspendue"}
            </p>
            <p className={`text-sm mt-1 ${status === "REJECTED" ? "text-red-600" : "text-orange-600"}`}>
              Raison : {listing.ListingModeration.rejectionReason}
            </p>
            {listing.ListingModeration.reviewedAt && (
              <p className={`text-xs mt-1 ${status === "REJECTED" ? "text-red-500" : "text-orange-500"}`}>
                Par {listing.ListingModeration.User?.name || listing.ListingModeration.User?.email} le {formatDate(listing.ListingModeration.reviewedAt)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Reports Alert */}
      {listing.ListingReport.filter(r => r.status === "OPEN").length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <FlagIcon className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">
              {listing.ListingReport.filter(r => r.status === "OPEN").length} signalement(s) en attente
            </p>
            <button
              onClick={() => setActiveTab("reports")}
              className="text-sm text-red-600 hover:text-red-700 mt-1"
            >
              Voir les signalements →
            </button>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Images & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover Image */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {listing.images.length > 0 ? (
              <div className="relative aspect-[16/9]">
                <img
                  src={selectedImage || listing.images.find(i => i.isCover)?.url || listing.images[0]?.url}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center">
                <PhotoIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
            {listing.images.length > 1 && (
              <div className="p-3 flex gap-2 overflow-x-auto">
                {listing.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.url)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      (selectedImage || listing.images.find(i => i.isCover)?.url) === img.url
                        ? "border-red-500"
                        : "border-transparent"
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <EyeIcon className="h-4 w-4" />
                <span className="text-xs">Vues</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{listing.viewCount.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <CalendarDaysIcon className="h-4 w-4" />
                <span className="text-xs">Réservations</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{listing.stats.bookings}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <HeartIcon className="h-4 w-4" />
                <span className="text-xs">Favoris</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{listing.stats.favorites}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <CurrencyDollarIcon className="h-4 w-4" />
                <span className="text-xs">Revenus</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(listing.stats.totalRevenue)}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-6 -mb-px overflow-x-auto">
              {[
                { id: "overview", label: "Aperçu" },
                { id: "images", label: `Images (${listing.images.length})` },
                { id: "bookings", label: `Réservations (${listing.bookings.length})` },
                { id: "reviews", label: `Avis (${listing.reviews.length})` },
                { id: "reports", label: `Signalements (${listing.ListingReport.length})`, alert: listing.ListingReport.filter(r => r.status === "OPEN").length > 0 },
                { id: "notes", label: `Notes (${listing.adminNotes.length})` },
                { id: "history", label: "Historique" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                    activeTab === tab.id
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  {"alert" in tab && tab.alert && (
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl border border-gray-200">
            {activeTab === "overview" && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Détails</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Prix</dt>
                        <dd className="font-medium">{formatCurrency(listing.price, listing.currency)}/h</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Durée minimum</dt>
                        <dd className="font-medium">{listing.minHours}h</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Capacité max</dt>
                        <dd className="font-medium">{listing.maxGuests} pers.</dd>
                      </div>
                      {listing.size && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Surface</dt>
                          <dd className="font-medium">{listing.size} m²</dd>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Note moyenne</dt>
                        <dd className="flex items-center gap-1 font-medium">
                          <StarIconSolid className="h-4 w-4 text-yellow-500" />
                          {listing.rating.toFixed(1)} ({listing.stats.reviews} avis)
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {listing.amenities.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Équipements</h3>
                      <div className="flex flex-wrap gap-2">
                        {listing.amenities.map((a) => (
                          <span
                            key={a.amenity.id}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                          >
                            {a.amenity.icon} {a.amenity.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {listing.address && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Adresse</h3>
                    <p className="text-gray-600">{listing.address}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Coordonnées : {listing.lat.toFixed(6)}, {listing.lng.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "images" && (
              <div className="p-6">
                {listing.images.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <PhotoIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p>Aucune image</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {listing.images.map((img) => (
                      <div key={img.id} className="relative aspect-[4/3] rounded-lg overflow-hidden group">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        {img.isCover && (
                          <span className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                            Couverture
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="divide-y divide-gray-100">
                {listing.bookings.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p>Aucune réservation</p>
                  </div>
                ) : (
                  listing.bookings.map((booking) => (
                    <div key={booking.id} className="flex items-center gap-4 p-4">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/admin/users/${booking.guest.id}`}
                          className="font-medium text-gray-900 hover:text-red-600"
                        >
                          {booking.guest.name || booking.guest.email}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(booking.totalPrice, booking.currency)}
                        </p>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${BOOKING_STATUS[booking.status]?.color || "bg-gray-100"}`}>
                          {BOOKING_STATUS[booking.status]?.label || booking.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="divide-y divide-gray-100">
                {listing.reviews.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <StarIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p>Aucun avis</p>
                  </div>
                ) : (
                  listing.reviews.map((review) => (
                    <div key={review.id} className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        {review.author.profile?.avatarUrl ? (
                          <img src={review.author.profile.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                            {review.author.name?.charAt(0) || "?"}
                          </div>
                        )}
                        <div className="flex-1">
                          <Link
                            href={`/admin/users/${review.author.id}`}
                            className="font-medium text-gray-900 hover:text-red-600"
                          >
                            {review.author.name || "Anonyme"}
                          </Link>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <StarIconSolid
                                  key={star}
                                  className={`h-3 w-3 ${star <= review.rating ? "text-yellow-500" : "text-gray-300"}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "reports" && (
              <div className="divide-y divide-gray-100">
                {listing.ListingReport.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FlagIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p>Aucun signalement</p>
                  </div>
                ) : (
                  listing.ListingReport.map((report) => (
                    <div key={report.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <FlagIcon className={`h-5 w-5 mt-0.5 ${report.status === "OPEN" ? "text-red-500" : "text-gray-400"}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{report.reason.replace(/_/g, " ")}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              report.status === "OPEN" ? "bg-red-100 text-red-700" :
                              report.status === "RESOLVED" ? "bg-green-100 text-green-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {report.status}
                            </span>
                          </div>
                          {report.description && (
                            <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Signalé par{" "}
                            <Link href={`/admin/users/${report.User.id}`} className="text-red-600 hover:underline">
                              {report.User.name || report.User.email}
                            </Link>
                            {" "}le {formatDate(report.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

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
                {listing.adminNotes.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune note</p>
                ) : (
                  <div className="space-y-3">
                    {listing.adminNotes.map((note) => (
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

            {activeTab === "history" && (
              <div className="divide-y divide-gray-100">
                {listing.auditHistory.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p>Aucun historique</p>
                  </div>
                ) : (
                  listing.auditHistory.map((log) => (
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
        </div>

        {/* Right Column - Owner & Quick Info */}
        <div className="space-y-6">
          {/* Owner Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Propriétaire</h3>
            <Link href={`/admin/users/${listing.owner.id}`} className="flex items-center gap-3 hover:bg-gray-50 -mx-2 p-2 rounded-lg">
              {listing.owner.profile?.avatarUrl ? (
                <img src={listing.owner.profile.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-lg font-bold">
                  {listing.owner.name?.charAt(0) || "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {listing.owner.name || "Sans nom"}
                </p>
                <p className="text-sm text-gray-500 truncate">{listing.owner.email}</p>
              </div>
            </Link>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
              {listing.owner.hostProfile?.superhost && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <SparklesIcon className="h-4 w-4" />
                  Superhost
                </div>
              )}
              {listing.owner.profile && (
                <div className="flex items-center gap-2">
                  <StarIconSolid className="h-4 w-4 text-yellow-500" />
                  <span>{listing.owner.profile.ratingAvg.toFixed(1)} ({listing.owner.profile.ratingCount} avis)</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Annonces</span>
                <span className="font-medium text-gray-900">{listing.owner._count.Listing}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Inscrit le</span>
                <span className="font-medium text-gray-900">{formatDate(listing.owner.createdAt)}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/admin/users/${listing.owner.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                <UserCircleIcon className="h-4 w-4" />
                Profil
              </Link>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                Contacter
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Statistiques rapides</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Taux de conversion</span>
                <span className="font-semibold text-gray-900">
                  {listing.viewCount > 0
                    ? ((listing.stats.bookings / listing.viewCount) * 100).toFixed(2)
                    : "0.00"}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Revenu moyen</span>
                <span className="font-semibold text-gray-900">
                  {listing.stats.confirmedBookings > 0
                    ? formatCurrency(listing.stats.totalRevenue / listing.stats.confirmedBookings)
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Conversations</span>
                <span className="font-semibold text-gray-900">{listing.stats.conversations}</span>
              </div>
            </div>
          </div>

          {/* Moderation Info */}
          {listing.ListingModeration && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Modération</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Statut</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>
                {listing.ListingModeration.reviewedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Modéré le</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(listing.ListingModeration.reviewedAt)}
                    </span>
                  </div>
                )}
                {listing.ListingModeration.User && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Par</span>
                    <span className="font-medium text-gray-900">
                      {listing.ListingModeration.User.name || listing.ListingModeration.User.email}
                    </span>
                  </div>
                )}
                {listing.ListingModeration.isFeatured && listing.ListingModeration.featuredUntil && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Mise en avant jusqu&apos;au</span>
                    <span className="font-medium text-yellow-600">
                      {formatDate(listing.ListingModeration.featuredUntil)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject/Suspend Modal */}
      {(showActionModal === "reject" || showActionModal === "suspend") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {showActionModal === "reject" ? "Rejeter l'annonce" : "Suspendre l'annonce"}
              </h3>
              <button onClick={() => setShowActionModal(null)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison {showActionModal === "reject" ? "du rejet" : "de la suspension"}
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Décrivez la raison..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowActionModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleAction(showActionModal)}
                  disabled={!actionReason.trim() || saving}
                  className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                    showActionModal === "reject" ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {saving ? "..." : showActionModal === "reject" ? "Rejeter" : "Suspendre"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Modal */}
      {showActionModal === "feature" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {listing.ListingModeration?.isFeatured ? "Retirer la mise en avant" : "Mettre en avant l'annonce"}
              </h3>
              <button onClick={() => setShowActionModal(null)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              {!listing.ListingModeration?.isFeatured && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée</label>
                  <select
                    value={featuredDays}
                    onChange={(e) => setFeaturedDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value={7}>7 jours</option>
                    <option value={14}>14 jours</option>
                    <option value={30}>30 jours</option>
                    <option value={90}>90 jours</option>
                  </select>
                </div>
              )}
              <p className="text-sm text-gray-600">
                {listing.ListingModeration?.isFeatured
                  ? "L'annonce ne sera plus mise en avant sur la page d'accueil."
                  : "L'annonce apparaîtra en priorité dans les résultats de recherche et sur la page d'accueil."}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowActionModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleToggleFeatured}
                  disabled={saving}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                >
                  {saving ? "..." : listing.ListingModeration?.isFeatured ? "Retirer" : "Mettre en avant"}
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
    </div>
  );
}

/**
 * Page Admin - Détail réservation
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  FlagIcon,
  PlusIcon,
  XMarkIcon,
  BanknotesIcon,
  ReceiptRefundIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

type Listing = {
  id: string;
  title: string;
  city: string;
  country: string;
  price: number;
  currency: string;
  type: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    profile: { avatarUrl: string | null; phone: string | null } | null;
    hostProfile: { stripeAccountId: string | null; payoutsEnabled: boolean } | null;
  };
  images: Array<{ url: string }>;
};

type Guest = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  profile: { avatarUrl: string | null; phone: string | null } | null;
  _count: { bookings: number };
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: { id: string; name: string | null };
};

type Dispute = {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
};

type AdminNote = {
  id: string;
  content: string;
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

type BookingData = {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  currency: string;
  status: string;
  createdAt: string;
  pricingMode: string;
  startTimeMinutes: number | null;
  endTimeMinutes: number | null;
  timezone: string | null;
  cancelledAt: string | null;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  listing: Listing;
  guest: Guest;
  cancelledByUser: { id: string; name: string | null; email: string } | null;
  reviews: Review[];
  disputes: Dispute[];
  conversations: Array<{ id: string; _count: { messages: number } }>;
  coverImage: string | null;
  calculations: {
    basePrice: number;
    guestFee: number;
    hostFee: number;
    platformNet: number;
    stripeFee: number;
    taxOnGuestFee: number;
    totalCharged: number;
    hostPayout: number;
    refunded: number;
  };
  adminNotes: AdminNote[];
  auditHistory: AuditLog[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  PENDING: { label: "En attente", color: "text-yellow-700", bgColor: "bg-yellow-100", icon: ClockIcon },
  CONFIRMED: { label: "Confirmée", color: "text-green-700", bgColor: "bg-green-100", icon: CheckCircleIcon },
  CANCELLED: { label: "Annulée", color: "text-red-700", bgColor: "bg-red-100", icon: XCircleIcon },
};

export default function AdminBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "payments" | "notes" | "history">("overview");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`);
      const data = await res.json();
      if (data.booking) {
        setBooking(data.booking);
        // Initialiser le montant de remboursement au maximum
        const maxRefund = data.booking.calculations.totalCharged - data.booking.calculations.refunded;
        setRefundAmount(maxRefund / 100);
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: cancelReason }),
      });
      if (res.ok) {
        fetchBooking();
        setShowCancelModal(false);
        setCancelReason("");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });
      if (res.ok) {
        fetchBooking();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRefund = async () => {
    if (refundAmount <= 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refund",
          refundAmount: Math.round(refundAmount * 100),
          reason: refundReason,
        }),
      });
      if (res.ok) {
        fetchBooking();
        setShowRefundModal(false);
        setRefundReason("");
      }
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
          targetType: "Booking",
          targetId: bookingId,
          content: noteContent,
        }),
      });
      if (res.ok) {
        fetchBooking();
        setShowNoteModal(false);
        setNoteContent("");
      }
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (cents: number, currency = "EUR") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(cents / 100);
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

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <CalendarDaysIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Réservation non trouvée</h2>
        <Link href="/admin/bookings" className="text-red-600 hover:text-red-700 mt-2 inline-block">
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;
  const maxRefundable = (booking.calculations.totalCharged - booking.calculations.refunded) / 100;

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
            <h1 className="text-2xl font-bold text-gray-900">
              Réservation #{booking.id.slice(-8).toUpperCase()}
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
              <StatusIcon className="h-4 w-4" />
              {statusConfig.label}
            </span>
            {booking.calculations.refunded > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                <ReceiptRefundIcon className="h-4 w-4" />
                Remboursé: {formatCurrency(booking.calculations.refunded)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Créée le {formatDateTime(booking.createdAt)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {booking.status === "PENDING" && (
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <CheckCircleIcon className="h-5 w-5" />
              Confirmer
            </button>
          )}
          {booking.status !== "CANCELLED" && (
            <>
              <button
                onClick={() => setShowRefundModal(true)}
                disabled={maxRefundable <= 0}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                <ArrowPathIcon className="h-5 w-5" />
                Rembourser
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <XCircleIcon className="h-5 w-5" />
                Annuler
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cancellation Alert */}
      {booking.status === "CANCELLED" && booking.cancelledAt && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <XCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Réservation annulée</p>
            <p className="text-sm text-red-600 mt-1">
              Annulée le {formatDateTime(booking.cancelledAt)}
              {booking.cancelledByUser && ` par ${booking.cancelledByUser.name || booking.cancelledByUser.email}`}
            </p>
          </div>
        </div>
      )}

      {/* Disputes Alert */}
      {booking.disputes.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <FlagIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800">
              {booking.disputes.length} litige(s) associé(s)
            </p>
            <div className="mt-2 space-y-1">
              {booking.disputes.map((d) => (
                <Link
                  key={d.id}
                  href={`/admin/disputes/${d.id}`}
                  className="text-sm text-yellow-700 hover:text-yellow-800 block"
                >
                  → {d.reason.replace(/_/g, " ")} ({d.status})
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Details Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-start gap-4 p-5 border-b border-gray-100">
              {booking.coverImage ? (
                <img
                  src={booking.coverImage}
                  alt=""
                  className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gray-200 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/admin/listings/${booking.listing.id}`}
                  className="text-lg font-semibold text-gray-900 hover:text-red-600"
                >
                  {booking.listing.title}
                </Link>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPinIcon className="h-4 w-4" />
                  {booking.listing.city}, {booking.listing.country}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {booking.listing.type.replace(/_/g, " ")}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(booking.calculations.totalCharged)}
                </p>
                <p className="text-sm text-gray-500">Total facturé</p>
              </div>
            </div>

            <div className="p-5 grid sm:grid-cols-2 gap-6">
              {/* Dates */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                  Dates
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Arrivée</span>
                    <span className="font-medium">{formatDate(booking.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Départ</span>
                    <span className="font-medium">{formatDate(booking.endDate)}</span>
                  </div>
                  {booking.pricingMode === "HOURLY" && booking.startTimeMinutes !== null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Horaires</span>
                      <span className="font-medium">
                        {formatTime(booking.startTimeMinutes)} - {formatTime(booking.endTimeMinutes || 0)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mode</span>
                    <span className="font-medium">
                      {booking.pricingMode === "HOURLY" ? "À l'heure" : "À la journée"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Guest */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <UserCircleIcon className="h-5 w-5 text-gray-400" />
                  Voyageur
                </h3>
                <Link
                  href={`/admin/users/${booking.guest.id}`}
                  className="flex items-center gap-3 hover:bg-gray-50 -mx-2 p-2 rounded-lg"
                >
                  {booking.guest.profile?.avatarUrl ? (
                    <img src={booking.guest.profile.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      {booking.guest.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{booking.guest.name || "Sans nom"}</p>
                    <p className="text-sm text-gray-500">{booking.guest.email}</p>
                  </div>
                </Link>
                <div className="mt-2 text-xs text-gray-500">
                  {booking.guest._count.bookings} réservation(s) • Membre depuis {formatDate(booking.guest.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-6 -mb-px">
              {[
                { id: "overview", label: "Aperçu" },
                { id: "payments", label: "Paiements" },
                { id: "notes", label: `Notes (${booking.adminNotes.length})` },
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
            {activeTab === "overview" && (
              <div className="p-6 space-y-6">
                {/* Reviews */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Avis</h3>
                  {booking.reviews.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucun avis</p>
                  ) : (
                    <div className="space-y-3">
                      {booking.reviews.map((review) => (
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
                            <span className="text-sm text-gray-500">par {review.author.name || "Anonyme"}</span>
                          </div>
                          {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Conversations */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Conversations</h3>
                  {booking.conversations.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucune conversation</p>
                  ) : (
                    <div className="space-y-2">
                      {booking.conversations.map((conv) => (
                        <div key={conv.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {conv._count.messages} message(s)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Détail des paiements</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Prix de base</span>
                    <span className="font-medium">{formatCurrency(booking.calculations.basePrice)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Frais voyageur</span>
                    <span className="font-medium">+{formatCurrency(booking.calculations.guestFee)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 font-semibold">
                    <span>Total facturé</span>
                    <span>{formatCurrency(booking.calculations.totalCharged)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 text-sm text-gray-500">
                    <span>Frais hôte</span>
                    <span>-{formatCurrency(booking.calculations.hostFee)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 text-sm text-gray-500">
                    <span>Frais Stripe (estimé)</span>
                    <span>-{formatCurrency(booking.calculations.stripeFee)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-green-600 font-medium">Revenus plateforme</span>
                    <span className="text-green-600 font-medium">{formatCurrency(booking.calculations.platformNet)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-blue-600 font-medium">Versement hôte</span>
                    <span className="text-blue-600 font-medium">{formatCurrency(booking.calculations.hostPayout)}</span>
                  </div>
                  {booking.calculations.refunded > 0 && (
                    <div className="flex justify-between py-2 text-orange-600 font-medium">
                      <span>Remboursé</span>
                      <span>-{formatCurrency(booking.calculations.refunded)}</span>
                    </div>
                  )}
                </div>

                {booking.stripePaymentIntentId && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Références Stripe</h4>
                    <div className="text-sm space-y-1">
                      <p className="text-gray-600">
                        Payment Intent: <code className="bg-gray-200 px-1 rounded">{booking.stripePaymentIntentId}</code>
                      </p>
                      {booking.stripeChargeId && (
                        <p className="text-gray-600">
                          Charge: <code className="bg-gray-200 px-1 rounded">{booking.stripeChargeId}</code>
                        </p>
                      )}
                    </div>
                  </div>
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
                {booking.adminNotes.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune note</p>
                ) : (
                  <div className="space-y-3">
                    {booking.adminNotes.map((note) => (
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
                {booking.auditHistory.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p>Aucun historique</p>
                  </div>
                ) : (
                  booking.auditHistory.map((log) => (
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

        {/* Right Column - Host */}
        <div className="space-y-6">
          {/* Host Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Hôte</h3>
            <Link
              href={`/admin/users/${booking.listing.owner.id}`}
              className="flex items-center gap-3 hover:bg-gray-50 -mx-2 p-2 rounded-lg"
            >
              {booking.listing.owner.profile?.avatarUrl ? (
                <img src={booking.listing.owner.profile.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold">
                  {booking.listing.owner.name?.charAt(0) || "?"}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{booking.listing.owner.name || "Sans nom"}</p>
                <p className="text-sm text-gray-500">{booking.listing.owner.email}</p>
              </div>
            </Link>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Payouts activés</span>
                <span className={booking.listing.owner.hostProfile?.payoutsEnabled ? "text-green-600" : "text-red-600"}>
                  {booking.listing.owner.hostProfile?.payoutsEnabled ? "Oui" : "Non"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Versement prévu</span>
                <span className="font-medium text-blue-600">
                  {formatCurrency(booking.calculations.hostPayout - (booking.calculations.refunded > 0 ? booking.calculations.refunded / 2 : 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Résumé financier</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BanknotesIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(booking.calculations.platformNet)}
                  </p>
                  <p className="text-xs text-gray-500">Revenus plateforme</p>
                </div>
              </div>
              {booking.calculations.refunded > 0 && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ReceiptRefundIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-orange-600">
                      -{formatCurrency(booking.calculations.refunded)}
                    </p>
                    <p className="text-xs text-gray-500">Total remboursé</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Annuler la réservation</h3>
              <button onClick={() => setShowCancelModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Cette action annulera la réservation. Le voyageur sera notifié.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Raison de l'annulation..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!cancelReason.trim() || saving}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {saving ? "..." : "Annuler la réservation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Rembourser</h3>
              <button onClick={() => setShowRefundModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Total facturé</span>
                  <span>{formatCurrency(booking.calculations.totalCharged)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Déjà remboursé</span>
                  <span>{formatCurrency(booking.calculations.refunded)}</span>
                </div>
                <div className="flex justify-between font-medium border-t border-gray-200 pt-1 mt-1">
                  <span>Maximum remboursable</span>
                  <span>{formatCurrency(maxRefundable * 100)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant à rembourser (€)
                </label>
                <input
                  type="number"
                  min="0.01"
                  max={maxRefundable}
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setRefundAmount(maxRefundable * 0.5)}
                    className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundAmount(maxRefundable)}
                    className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                  >
                    100%
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison (optionnel)</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Raison du remboursement..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRefund}
                  disabled={refundAmount <= 0 || refundAmount > maxRefundable || saving}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {saving ? "..." : `Rembourser ${refundAmount.toFixed(2)}€`}
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

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

type NotificationType =
  | "BOOKING_REQUEST"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_REMINDER"
  | "MESSAGE_NEW"
  | "REVIEW_RECEIVED"
  | "REVIEW_REMINDER"
  | "PAYOUT_SENT"
  | "PAYOUT_FAILED"
  | "LISTING_APPROVED"
  | "LISTING_REJECTED"
  | "LISTING_SUSPENDED"
  | "DISPUTE_OPENED"
  | "DISPUTE_UPDATE"
  | "DISPUTE_RESOLVED"
  | "IDENTITY_VERIFIED"
  | "IDENTITY_REJECTED"
  | "SUPERHOST_EARNED"
  | "SUPERHOST_LOST"
  | "PROMO_CODE"
  | "SYSTEM_ANNOUNCEMENT"
  | "REFERRAL_BONUS";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt: string | null;
  actionUrl?: string;
  createdAt: string;
}

// Icônes et couleurs par type de notification
const notificationConfig: Record<
  NotificationType,
  { icon: string; bgColor: string; label: string }
> = {
  BOOKING_REQUEST: { icon: "📥", bgColor: "bg-blue-100", label: "Demande de réservation" },
  BOOKING_CONFIRMED: { icon: "✅", bgColor: "bg-green-100", label: "Réservation confirmée" },
  BOOKING_CANCELLED: { icon: "❌", bgColor: "bg-red-100", label: "Réservation annulée" },
  BOOKING_REMINDER: { icon: "⏰", bgColor: "bg-yellow-100", label: "Rappel de réservation" },
  MESSAGE_NEW: { icon: "💬", bgColor: "bg-indigo-100", label: "Nouveau message" },
  REVIEW_RECEIVED: { icon: "⭐", bgColor: "bg-amber-100", label: "Avis reçu" },
  REVIEW_REMINDER: { icon: "📝", bgColor: "bg-orange-100", label: "Rappel d'avis" },
  PAYOUT_SENT: { icon: "💸", bgColor: "bg-emerald-100", label: "Paiement envoyé" },
  PAYOUT_FAILED: { icon: "⚠️", bgColor: "bg-red-100", label: "Échec du paiement" },
  LISTING_APPROVED: { icon: "🎉", bgColor: "bg-green-100", label: "Annonce approuvée" },
  LISTING_REJECTED: { icon: "🚫", bgColor: "bg-red-100", label: "Annonce refusée" },
  LISTING_SUSPENDED: { icon: "⛔", bgColor: "bg-red-100", label: "Annonce suspendue" },
  DISPUTE_OPENED: { icon: "⚖️", bgColor: "bg-purple-100", label: "Litige ouvert" },
  DISPUTE_UPDATE: { icon: "📋", bgColor: "bg-purple-100", label: "Mise à jour litige" },
  DISPUTE_RESOLVED: { icon: "✔️", bgColor: "bg-green-100", label: "Litige résolu" },
  IDENTITY_VERIFIED: { icon: "🛡️", bgColor: "bg-green-100", label: "Identité vérifiée" },
  IDENTITY_REJECTED: { icon: "🔒", bgColor: "bg-red-100", label: "Vérification refusée" },
  SUPERHOST_EARNED: { icon: "🏆", bgColor: "bg-yellow-100", label: "Statut Superhost" },
  SUPERHOST_LOST: { icon: "📉", bgColor: "bg-gray-100", label: "Statut Superhost perdu" },
  PROMO_CODE: { icon: "🎁", bgColor: "bg-pink-100", label: "Code promo" },
  SYSTEM_ANNOUNCEMENT: { icon: "📢", bgColor: "bg-blue-100", label: "Annonce système" },
  REFERRAL_BONUS: { icon: "🤝", bgColor: "bg-teal-100", label: "Bonus parrainage" },
};

type FilterType = "all" | "unread" | NotificationType;

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const LIMIT = 20;

  // Rediriger si non connecté
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Charger les notifications
  const fetchNotifications = useCallback(
    async (reset = false) => {
      try {
        setIsLoading(true);
        const currentOffset = reset ? 0 : offset;
        const unreadOnly = filter === "unread";

        const params = new URLSearchParams({
          limit: String(LIMIT),
          offset: String(currentOffset),
        });

        if (unreadOnly) {
          params.set("unread", "true");
        }

        const res = await fetch(`/api/notifications?${params}`);
        if (res.ok) {
          const data = await res.json();

          // Filtrer par type si nécessaire
          let filteredNotifications = data.notifications || [];
          if (filter !== "all" && filter !== "unread") {
            filteredNotifications = filteredNotifications.filter(
              (n: Notification) => n.type === filter
            );
          }

          if (reset) {
            setNotifications(filteredNotifications);
            setOffset(LIMIT);
          } else {
            setNotifications((prev) => [...prev, ...filteredNotifications]);
            setOffset((prev) => prev + LIMIT);
          }

          setTotal(data.total || 0);
          setUnreadCount(data.unreadCount || 0);
          setHasMore(data.hasMore || false);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [filter, offset]
  );

  // Charger au montage et quand le filtre change
  useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, filter]);

  // Marquer une notification comme lue
  async function markAsRead(notificationId: string) {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  // Marquer toutes comme lues
  async function markAllAsRead() {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }

  // Supprimer une notification
  async function deleteNotification(notificationId: string) {
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: "DELETE",
      });

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setTotal((prev) => prev - 1);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }

  // Supprimer toutes les notifications
  async function deleteAllNotifications() {
    if (!confirm("Supprimer toutes les notifications ?")) return;

    try {
      await fetch("/api/notifications?all=true", {
        method: "DELETE",
      });

      setNotifications([]);
      setTotal(0);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  // Grouper les notifications par date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey: string;
    if (date.toDateString() === today.toDateString()) {
      groupKey = "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = "Hier";
    } else {
      groupKey = format(date, "EEEE d MMMM yyyy", { locale: fr });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount > 0
                ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                : "Tout est à jour"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Tout marquer comme lu
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={deleteAllNotifications}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Tout supprimer
              </button>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filter === "all"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            Toutes ({total})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filter === "unread"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            Non lues ({unreadCount})
          </button>
          <div className="w-px h-8 bg-gray-200 mx-2" />
          {(
            [
              "BOOKING_REQUEST",
              "MESSAGE_NEW",
              "REVIEW_RECEIVED",
              "PAYOUT_SENT",
            ] as NotificationType[]
          ).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filter === type
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {notificationConfig[type].icon} {notificationConfig[type].label}
            </button>
          ))}
        </div>

        {/* Liste des notifications */}
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune notification
            </h3>
            <p className="text-gray-500">
              {filter === "unread"
                ? "Toutes vos notifications ont été lues."
                : "Vous n'avez pas encore de notifications."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([date, items]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-gray-500 mb-3 capitalize">
                  {date}
                </h3>
                <div className="bg-white rounded-2xl divide-y divide-gray-100 overflow-hidden shadow-sm">
                  {items.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Charger plus */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => fetchNotifications(false)}
                  disabled={isLoading}
                  className="px-6 py-3 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Chargement..." : "Charger plus"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Composant pour une notification individuelle
function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = notificationConfig[notification.type] || {
    icon: "🔔",
    bgColor: "bg-gray-100",
    label: "Notification",
  };

  const content = (
    <div className="flex gap-4 p-4 hover:bg-gray-50 transition-colors">
      {/* Icône */}
      <div
        className={`flex-shrink-0 h-12 w-12 rounded-full ${config.bgColor} flex items-center justify-center text-xl`}
      >
        {config.icon}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className={`text-sm font-medium ${
                !notification.read ? "text-gray-900" : "text-gray-700"
              }`}
            >
              {notification.title}
            </p>
            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {!notification.read && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Marquer comme lu"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Supprimer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Méta */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
          <span className="text-xs text-gray-300">•</span>
          <span className="text-xs text-gray-500">{config.label}</span>
          {!notification.read && (
            <>
              <span className="text-xs text-gray-300">•</span>
              <span className="h-2 w-2 rounded-full bg-blue-500" />
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (notification.actionUrl) {
    return (
      <Link
        href={notification.actionUrl}
        onClick={() => {
          if (!notification.read) onMarkAsRead(notification.id);
        }}
        className="block"
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      onClick={() => {
        if (!notification.read) onMarkAsRead(notification.id);
      }}
      className="cursor-pointer"
    >
      {content}
    </div>
  );
}

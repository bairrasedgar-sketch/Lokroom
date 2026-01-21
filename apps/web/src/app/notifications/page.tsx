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

// ═══════════════════════════════════════════════════════════════════════════════
// ICÔNES SVG POUR LES NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const NotificationIcons = {
  // Demande de réservation - Calendrier avec flèche entrante
  BOOKING_REQUEST: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M16 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 14L12 18M12 18L14 16M12 18L10 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // Réservation confirmée - Check dans un cercle
  BOOKING_CONFIRMED: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // Réservation annulée - X dans un cercle
  BOOKING_CANCELLED: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),

  // Rappel de réservation - Horloge
  BOOKING_REMINDER: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 7V12L15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // Nouveau message - Bulle de chat
  MESSAGE_NEW: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 11H8.01M12 11H12.01M16 11H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),

  // Avis reçu - Étoile
  REVIEW_RECEIVED: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L14.9 8.6L22 9.3L17 14.1L18.2 21.2L12 17.8L5.8 21.2L7 14.1L2 9.3L9.1 8.6L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),

  // Rappel d'avis - Étoile avec crayon
  REVIEW_REMINDER: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L14.2 7.4L20 8L15.8 12L17 18L12 15L7 18L8.2 12L4 8L9.8 7.4L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M18 14L21 17M21 17L18 20M21 17H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // Paiement envoyé - Billet/argent
  PAYOUT_SENT: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 9V9.01M18 15V15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),

  // Échec du paiement - Triangle d'alerte
  PAYOUT_FAILED: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 9V13M12 17H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10.2 3.9L2.4 17.4C1.7 18.6 2.6 20 4 20H20C21.4 20 22.3 18.6 21.6 17.4L13.8 3.9C13.1 2.7 11.4 2.7 10.2 3.9Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),

  // Annonce approuvée - Badge avec check
  LISTING_APPROVED: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L15.1 5.1L19.5 4.5L18.9 8.9L22 12L18.9 15.1L19.5 19.5L15.1 18.9L12 22L8.9 18.9L4.5 19.5L5.1 15.1L2 12L5.1 8.9L4.5 4.5L8.9 5.1L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // Annonce refusée - Badge avec X
  LISTING_REJECTED: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 4L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),

  // Annonce suspendue - Pause
  LISTING_SUSPENDED: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 9V15M14 9V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),

  // Litige ouvert - Balance
  DISPUTE_OPENED: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3V21M12 3L3 8L6 14H3L12 21M12 3L21 8L18 14H21L12 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // Mise à jour litige - Document avec flèche
  DISPUTE_UPDATE: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 12V18M12 18L15 15M12 18L9 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // Litige résolu - Check double
  DISPUTE_RESOLVED: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 12L7 17L17 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 12L12 17L22 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // Identité vérifiée - Bouclier avec check
  IDENTITY_VERIFIED: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L4 6V12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12V6L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  // Vérification refusée - Bouclier avec X
  IDENTITY_REJECTED: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L4 6V12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12V6L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 9L15 15M15 9L9 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),

  // Statut Superhost - Trophée
  SUPERHOST_EARNED: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 15C15.866 15 19 11.866 19 8V3H5V8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 3H3V6C3 7.65685 4.34315 9 6 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M19 3H21V6C21 7.65685 19.6569 9 18 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 15V18" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 21H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 18H14V21H10V18Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),

  // Statut Superhost perdu - Trophée barré
  SUPERHOST_LOST: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 15C15.866 15 19 11.866 19 8V3H5V8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 15V18M8 21H16M10 18H14V21H10V18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 3L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),

  // Code promo - Ticket/coupon
  PROMO_CODE: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 8V6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M20 8C18.8954 8 18 8.89543 18 10V14C18 15.1046 18.8954 16 20 16" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 8C5.10457 8 6 8.89543 6 10V14C6 15.1046 5.10457 16 4 16" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 10L14 14M14 10L10 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),

  // Annonce système - Mégaphone
  SYSTEM_ANNOUNCEMENT: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M18 8C19.6569 8 21 9.34315 21 11C21 12.6569 19.6569 14 18 14" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 9V13C3 14.1046 3.89543 15 5 15H6L11 19V5L6 9H5C3.89543 9 3 9.89543 3 11V9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),

  // Bonus parrainage - Personnes avec lien
  REFERRAL_BONUS: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="7" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="17" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 20C3 16.6863 5.68629 14 9 14H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M21 20C21 16.6863 18.3137 14 15 14H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 11H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),

  // Icône par défaut - Cloche
  DEFAULT: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// Configuration des couleurs par type
const notificationConfig: Record<
  NotificationType,
  { bgColor: string; iconColor: string; label: string }
> = {
  BOOKING_REQUEST: { bgColor: "bg-blue-100", iconColor: "text-blue-600", label: "Demande de réservation" },
  BOOKING_CONFIRMED: { bgColor: "bg-green-100", iconColor: "text-green-600", label: "Réservation confirmée" },
  BOOKING_CANCELLED: { bgColor: "bg-red-100", iconColor: "text-red-600", label: "Réservation annulée" },
  BOOKING_REMINDER: { bgColor: "bg-yellow-100", iconColor: "text-yellow-600", label: "Rappel de réservation" },
  MESSAGE_NEW: { bgColor: "bg-indigo-100", iconColor: "text-indigo-600", label: "Nouveau message" },
  REVIEW_RECEIVED: { bgColor: "bg-amber-100", iconColor: "text-amber-600", label: "Avis reçu" },
  REVIEW_REMINDER: { bgColor: "bg-orange-100", iconColor: "text-orange-600", label: "Rappel d'avis" },
  PAYOUT_SENT: { bgColor: "bg-emerald-100", iconColor: "text-emerald-600", label: "Paiement envoyé" },
  PAYOUT_FAILED: { bgColor: "bg-red-100", iconColor: "text-red-600", label: "Échec du paiement" },
  LISTING_APPROVED: { bgColor: "bg-green-100", iconColor: "text-green-600", label: "Annonce approuvée" },
  LISTING_REJECTED: { bgColor: "bg-red-100", iconColor: "text-red-600", label: "Annonce refusée" },
  LISTING_SUSPENDED: { bgColor: "bg-red-100", iconColor: "text-red-600", label: "Annonce suspendue" },
  DISPUTE_OPENED: { bgColor: "bg-purple-100", iconColor: "text-purple-600", label: "Litige ouvert" },
  DISPUTE_UPDATE: { bgColor: "bg-purple-100", iconColor: "text-purple-600", label: "Mise à jour litige" },
  DISPUTE_RESOLVED: { bgColor: "bg-green-100", iconColor: "text-green-600", label: "Litige résolu" },
  IDENTITY_VERIFIED: { bgColor: "bg-green-100", iconColor: "text-green-600", label: "Identité vérifiée" },
  IDENTITY_REJECTED: { bgColor: "bg-red-100", iconColor: "text-red-600", label: "Vérification refusée" },
  SUPERHOST_EARNED: { bgColor: "bg-yellow-100", iconColor: "text-yellow-600", label: "Statut Superhost" },
  SUPERHOST_LOST: { bgColor: "bg-gray-100", iconColor: "text-gray-600", label: "Statut Superhost perdu" },
  PROMO_CODE: { bgColor: "bg-pink-100", iconColor: "text-pink-600", label: "Code promo" },
  SYSTEM_ANNOUNCEMENT: { bgColor: "bg-blue-100", iconColor: "text-blue-600", label: "Annonce système" },
  REFERRAL_BONUS: { bgColor: "bg-teal-100", iconColor: "text-teal-600", label: "Bonus parrainage" },
};

// Fonction pour obtenir le composant d'icône
function getNotificationIcon(type: NotificationType, className?: string) {
  const IconComponent = NotificationIcons[type] || NotificationIcons.DEFAULT;
  return <IconComponent className={className || "h-6 w-6"} />;
}

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
    async (reset = false, signal?: AbortSignal) => {
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

        const res = await fetch(`/api/notifications?${params}`, { signal });
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
        if (error instanceof Error && error.name === 'AbortError') return;
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
      const controller = new AbortController();
      fetchNotifications(true, controller.signal);
      return () => controller.abort();
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
      <div className="max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              {getNotificationIcon(type)} {notificationConfig[type].label}
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
    bgColor: "bg-gray-100",
    iconColor: "text-gray-600",
    label: "Notification",
  };

  const content = (
    <div className="flex gap-4 p-4 hover:bg-gray-50 transition-colors">
      {/* Icône */}
      <div
        className={`flex-shrink-0 h-12 w-12 rounded-full ${config.bgColor} flex items-center justify-center ${config.iconColor}`}
      >
        {getNotificationIcon(notification.type)}
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

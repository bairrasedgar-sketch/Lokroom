"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useNotifications } from "@/hooks/useUser";

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

// Icônes par type de notification
function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    BOOKING_REQUEST: "📥",
    BOOKING_CONFIRMED: "✅",
    BOOKING_CANCELLED: "❌",
    BOOKING_REMINDER: "⏰",
    MESSAGE_NEW: "💬",
    REVIEW_RECEIVED: "⭐",
    REVIEW_REMINDER: "📝",
    PAYOUT_SENT: "💸",
    PAYOUT_FAILED: "⚠️",
    LISTING_APPROVED: "🎉",
    LISTING_REJECTED: "🚫",
    LISTING_SUSPENDED: "⛔",
    DISPUTE_OPENED: "⚖️",
    DISPUTE_UPDATE: "📋",
    DISPUTE_RESOLVED: "✔️",
    IDENTITY_VERIFIED: "🛡️",
    IDENTITY_REJECTED: "🔒",
    SUPERHOST_EARNED: "🏆",
    SUPERHOST_LOST: "📉",
    PROMO_CODE: "🎁",
    SYSTEM_ANNOUNCEMENT: "📢",
    REFERRAL_BONUS: "🤝",
  };
  return icons[type] || "🔔";
}

export default function NotificationBell() {
  const { status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = status === "authenticated";

  // Use SWR hook for notifications
  const { notifications: swrNotifications, loading: isLoading, mutate: refreshNotifications } = useNotifications();

  const notifications = swrNotifications || [];
  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Marquer une notification comme lue
  async function markAsRead(notificationId: string) {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      // Refresh notifications
      refreshNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  // Marquer toutes comme lues
  async function markAllAsRead() {
    try {
      const unreadIds = notifications.filter((n: Notification) => !n.read).map((n: Notification) => n.id);
      if (unreadIds.length === 0) return;

      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: unreadIds }),
      });

      // Refresh notifications
      refreshNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }

  // Ne pas afficher si non connecté
  if (!isLoggedIn) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <svg
          className="h-5 w-5 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {/* Badge de compteur */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown des notifications */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Liste des notifications */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <svg
                    className="h-6 w-6 text-gray-400"
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
                <p className="text-sm text-gray-500">Aucune notification</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className={`relative ${!notification.read ? "bg-blue-50/50" : ""}`}
                  >
                    {notification.actionUrl ? (
                      <Link
                        href={notification.actionUrl}
                        onClick={() => {
                          if (!notification.read) markAsRead(notification.id);
                          setIsOpen(false);
                        }}
                        className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <NotificationContent notification={notification} />
                      </Link>
                    ) : (
                      <div
                        onClick={() => {
                          if (!notification.read) markAsRead(notification.id);
                        }}
                        className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <NotificationContent notification={notification} />
                      </div>
                    )}

                    {/* Indicateur non lu */}
                    {!notification.read && (
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-center text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant pour le contenu d'une notification
function NotificationContent({ notification }: { notification: Notification }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 text-xl">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {notification.title}
        </p>
        <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: fr,
          })}
        </p>
      </div>
    </div>
  );
}

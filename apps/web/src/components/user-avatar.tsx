"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ProfileRes = {
  user?: {
    email: string | null;
    profile?: { avatarUrl?: string | null } | null;
  };
};

export default function UserAvatar() {
  const [img, setImg] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok) return; // pas connecté
        const data: ProfileRes = await res.json();
        setEmail(data.user?.email ?? "");
        setImg(data.user?.profile?.avatarUrl ?? null);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("UserAvatar: échec fetch /api/profile:", err);
        }
      }
    })();
  }, []);

  if (!email) {
    return (
      <a href="/login" className="text-sm text-gray-600 hover:underline">
        Login
      </a>
    );
  }

  return (
    <a href="/profile" className="flex items-center gap-2">
      {img ? (
        <span className="block h-8 w-8 overflow-hidden rounded-full">
          <Image
            src={img}
            alt="avatar"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover border"
          />
        </span>
      ) : (
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
          {email[0]?.toUpperCase() ?? "?"}
        </div>
      )}
      <span className="text-sm text-gray-700">Mon profil</span>
    </a>
  );
}

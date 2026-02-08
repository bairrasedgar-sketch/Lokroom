'use client';

import { useEffect, useState } from 'react';
import { isNativeMobile } from '@/lib/capacitor';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(isNativeMobile());

    // Masquer le splash screen après l'animation
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000); // 3 secondes (durée de ton animation)

    return () => clearTimeout(timer);
  }, []);

  // Ne pas afficher sur web
  if (!isNative || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
      <video
        autoPlay
        muted
        playsInline
        className="w-full h-full object-contain"
        onEnded={() => setIsVisible(false)}
      >
        <source src="/Animation Logo LokRoom.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

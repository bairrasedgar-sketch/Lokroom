"use client";

type CategoryIconProps = {
  category: string;
  isActive: boolean;
  isAnimating: boolean;
};

export default function CategoryIcon({ category, isActive, isAnimating }: CategoryIconProps) {
  const color = isActive ? "#111827" : "#9CA3AF";

  // Animation wrapper classes
  const wrapperClass = `relative transition-all duration-300 ${isAnimating ? "scale-110" : ""}`;

  const icons: Record<string, React.ReactNode> = {
    // TOUS - Grille avec carrés qui s'assemblent
    ALL: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          <rect
            x="3" y="3" width="7" height="7" rx="1.5"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-grid-tl" : ""}
          />
          <rect
            x="14" y="3" width="7" height="7" rx="1.5"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-grid-tr" : ""}
          />
          <rect
            x="3" y="14" width="7" height="7" rx="1.5"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-grid-bl" : ""}
          />
          <rect
            x="14" y="14" width="7" height="7" rx="1.5"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-grid-br" : ""}
          />
        </svg>
      </div>
    ),

    // APPARTEMENT - Building avec fenêtres qui s'allument
    APARTMENT: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Building structure */}
          <path
            d="M3 21V5a2 2 0 012-2h8a2 2 0 012 2v16"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isAnimating ? "animate-building-rise" : ""}
          />
          <path
            d="M15 21V10a2 2 0 012-2h2a2 2 0 012 2v11"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isAnimating ? "animate-building-rise-delay" : ""}
          />
          <line x1="3" y1="21" x2="21" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          {/* Windows that light up */}
          <rect x="6" y="6" width="2" height="2" rx="0.5" fill={color} className={isAnimating ? "animate-window-1" : ""} />
          <rect x="10" y="6" width="2" height="2" rx="0.5" fill={color} className={isAnimating ? "animate-window-2" : ""} />
          <rect x="6" y="10" width="2" height="2" rx="0.5" fill={color} className={isAnimating ? "animate-window-3" : ""} />
          <rect x="10" y="10" width="2" height="2" rx="0.5" fill={color} className={isAnimating ? "animate-window-4" : ""} />
          <rect x="6" y="14" width="2" height="2" rx="0.5" fill={color} className={isAnimating ? "animate-window-5" : ""} />
          <rect x="10" y="14" width="2" height="2" rx="0.5" fill={color} className={isAnimating ? "animate-window-6" : ""} />
        </svg>
      </div>
    ),

    // MAISON - Toit qui se pose, porte qui s'ouvre
    HOUSE: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Roof */}
          <path
            d="M3 11L12 3L21 11"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isAnimating ? "animate-roof-drop" : ""}
          />
          {/* House body */}
          <path
            d="M5 10V19a2 2 0 002 2h10a2 2 0 002-2V10"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isAnimating ? "animate-house-body" : ""}
          />
          {/* Door that opens */}
          <path
            d="M10 21V15a2 2 0 012-2h0a2 2 0 012 2v6"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-door-open" : ""}
          />
          {/* Chimney with smoke */}
          <path
            d="M16 6V3"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isAnimating ? "animate-chimney" : ""}
          />
          {isAnimating && (
            <>
              <circle cx="16" cy="1" r="0.5" fill={color} className="animate-smoke-1" />
              <circle cx="17" cy="-1" r="0.5" fill={color} className="animate-smoke-2" />
              <circle cx="15" cy="-2" r="0.5" fill={color} className="animate-smoke-3" />
            </>
          )}
        </svg>
      </div>
    ),

    // STUDIO - Pinceau qui dessine puis revient
    STUDIO: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Canvas/Chevalet */}
          <rect
            x="3" y="6" width="12" height="14" rx="1"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-canvas-appear" : ""}
          />
          {/* Pieds du chevalet */}
          <path d="M5 20L3 23" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M13 20L15 23" stroke={color} strokeWidth="1.5" strokeLinecap="round" />

          {/* Trait en train d'être dessiné */}
          <path
            d="M5 10C6 11 7 9 8 10C9 11 10 9 11 10C12 11 13 9 13 10"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isAnimating ? "animate-paint-line" : ""}
            strokeDasharray="20"
            strokeDashoffset={isAnimating ? "0" : "20"}
          />

          {/* Pinceau */}
          <g className={isAnimating ? "animate-brush-draw" : ""} style={{ transformOrigin: "19px 8px" }}>
            {/* Manche du pinceau */}
            <rect x="17" y="2" width="4" height="10" rx="1" stroke={color} strokeWidth="1.5" fill="none" />
            {/* Virole (partie métallique) */}
            <rect x="17" y="10" width="4" height="2" fill={color} />
            {/* Poils du pinceau */}
            <path d="M17.5 12L17 15L19 16L21 15L20.5 12" stroke={color} strokeWidth="1" fill={color} />
          </g>

          {/* Gouttes de peinture */}
          {isAnimating && (
            <>
              <circle cx="19" cy="18" r="0.8" fill={color} className="animate-drop-1" />
              <circle cx="17" cy="19" r="0.5" fill={color} className="animate-drop-2" />
            </>
          )}
        </svg>
      </div>
    ),

    // BUREAU - Valise qui s'ouvre avec documents
    OFFICE: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Briefcase body */}
          <rect
            x="2" y="7" width="20" height="13" rx="2"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-briefcase" : ""}
          />
          {/* Handle */}
          <path
            d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-handle" : ""}
          />
          {/* Center line (opening) */}
          <path
            d="M2 12h20"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-briefcase-open" : ""}
          />
          {/* Documents flying out */}
          {isAnimating && (
            <>
              <rect x="9" y="9" width="6" height="4" rx="0.5" fill={color} className="animate-doc-1" />
              <rect x="10" y="10" width="4" height="3" rx="0.5" fill={color} className="animate-doc-2" />
            </>
          )}
        </svg>
      </div>
    ),

    // COWORKING - Personnes qui se connectent
    COWORKING: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Center person */}
          <circle cx="12" cy="7" r="2.5" stroke={color} strokeWidth="1.5" className={isAnimating ? "animate-person-center" : ""} />
          <path d="M8 21v-2a4 4 0 014-4h0a4 4 0 014 4v2" stroke={color} strokeWidth="1.5" className={isAnimating ? "animate-person-center" : ""} />

          {/* Left person */}
          <circle cx="5" cy="9" r="2" stroke={color} strokeWidth="1.5" className={isAnimating ? "animate-person-left" : ""} />
          <path d="M1 21v-1a3 3 0 013-3h2" stroke={color} strokeWidth="1.5" className={isAnimating ? "animate-person-left" : ""} />

          {/* Right person */}
          <circle cx="19" cy="9" r="2" stroke={color} strokeWidth="1.5" className={isAnimating ? "animate-person-right" : ""} />
          <path d="M23 21v-1a3 3 0 00-3-3h-2" stroke={color} strokeWidth="1.5" className={isAnimating ? "animate-person-right" : ""} />

          {/* Connection lines */}
          {isAnimating && (
            <>
              <line x1="7" y1="8" x2="9.5" y2="7" stroke={color} strokeWidth="1" className="animate-connect-left" />
              <line x1="17" y1="8" x2="14.5" y2="7" stroke={color} strokeWidth="1" className="animate-connect-right" />
            </>
          )}
        </svg>
      </div>
    ),

    // PARKING - Voiture bien visible qui se gare
    PARKING: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Panneau P */}
          <rect x="2" y="2" width="8" height="10" rx="1" stroke={color} strokeWidth="1.5" />
          <text x="6" y="9" textAnchor="middle" fontSize="7" fontWeight="bold" fill={color}>P</text>

          {/* Voiture bien dessinée */}
          <g className={isAnimating ? "animate-car-arrive" : ""}>
            {/* Carrosserie */}
            <path
              d="M8 18H20C21 18 22 17 22 16V15C22 14 21.5 13.5 21 13.5L19 13L18 11H12L10 13L9 13.5C8.5 13.5 8 14 8 15V16C8 17 8 18 8 18Z"
              stroke={color}
              strokeWidth="1.5"
              fill="none"
              strokeLinejoin="round"
            />
            {/* Toit/Vitres */}
            <path d="M12 11L13 9H17L18 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Pare-brise */}
            <path d="M13.5 10L16.5 10" stroke={color} strokeWidth="1" strokeLinecap="round" />
            {/* Roue avant */}
            <circle cx="11" cy="18" r="1.5" stroke={color} strokeWidth="1.5" />
            <circle cx="11" cy="18" r="0.5" fill={color} />
            {/* Roue arrière */}
            <circle cx="19" cy="18" r="1.5" stroke={color} strokeWidth="1.5" />
            <circle cx="19" cy="18" r="0.5" fill={color} />
            {/* Phares */}
            <circle cx="9" cy="15" r="0.5" fill={color} className={isAnimating ? "animate-headlight-blink" : ""} />
            <circle cx="21" cy="15" r="0.5" fill={color} />
            {/* Rétroviseur */}
            <path d="M12.5 11L11.5 10.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
          </g>

          {/* Lignes de mouvement quand la voiture arrive */}
          {isAnimating && (
            <>
              <path d="M4 15H6" stroke={color} strokeWidth="1" strokeLinecap="round" className="animate-motion-line-1" />
              <path d="M3 17H5" stroke={color} strokeWidth="1" strokeLinecap="round" className="animate-motion-line-2" />
            </>
          )}
        </svg>
      </div>
    ),

    // EVENT SPACE - Feu d'artifice bien visible
    EVENT_SPACE: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Fusée de feu d'artifice (base) */}
          <path
            d="M12 22V16"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            className={isAnimating ? "animate-rocket-launch" : ""}
          />
          <path
            d="M10 22L12 20L14 22"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Centre de l'explosion */}
          <circle
            cx="12" cy="8" r="2"
            stroke={color}
            strokeWidth="1.5"
            fill={isAnimating ? color : "none"}
            className={isAnimating ? "animate-explosion-center" : ""}
          />

          {/* Rayons de l'explosion - étoile à 8 branches */}
          <g className={isAnimating ? "animate-firework-rays" : ""}>
            {/* Haut */}
            <path d="M12 6V2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="1" r="1" fill={color} />
            {/* Bas */}
            <path d="M12 10V12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            {/* Gauche */}
            <path d="M10 8H5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="4" cy="8" r="1" fill={color} />
            {/* Droite */}
            <path d="M14 8H19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="20" cy="8" r="1" fill={color} />
            {/* Diagonales */}
            <path d="M9.5 5.5L7 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="6" cy="2" r="0.8" fill={color} />
            <path d="M14.5 5.5L17 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="18" cy="2" r="0.8" fill={color} />
            <path d="M9.5 10.5L7 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14.5 10.5L17 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Étincelles */}
          {isAnimating && (
            <>
              <circle cx="8" cy="5" r="0.5" fill={color} className="animate-sparkle-1" />
              <circle cx="16" cy="5" r="0.5" fill={color} className="animate-sparkle-2" />
              <circle cx="6" cy="10" r="0.5" fill={color} className="animate-sparkle-3" />
              <circle cx="18" cy="10" r="0.5" fill={color} className="animate-sparkle-4" />
              <circle cx="10" cy="3" r="0.4" fill={color} className="animate-sparkle-5" />
              <circle cx="14" cy="3" r="0.4" fill={color} className="animate-sparkle-6" />
            </>
          )}
        </svg>
      </div>
    ),

    // RECORDING STUDIO - Micro avec ondes sonores
    RECORDING_STUDIO: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Microphone */}
          <rect
            x="9" y="2" width="6" height="10" rx="3"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-mic-pulse" : ""}
          />
          <path d="M12 14v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 18h8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M5 10a7 7 0 0014 0"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isAnimating ? "animate-mic-stand" : ""}
          />

          {/* Sound waves */}
          {isAnimating && (
            <>
              <path d="M2 8v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="animate-wave-1" />
              <path d="M4 6v8" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="animate-wave-2" />
              <path d="M20 6v8" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="animate-wave-3" />
              <path d="M22 8v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="animate-wave-4" />
            </>
          )}
        </svg>
      </div>
    ),

    // ROOM - Chambre avec lit
    ROOM: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Lit */}
          <path
            d="M3 18V12a2 2 0 012-2h14a2 2 0 012 2v6"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isAnimating ? "animate-building-rise" : ""}
          />
          {/* Matelas */}
          <path
            d="M3 18h18"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Tête de lit */}
          <path
            d="M5 10V6a2 2 0 012-2h10a2 2 0 012 2v4"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isAnimating ? "animate-roof-drop" : ""}
          />
          {/* Oreiller */}
          <rect
            x="6" y="7" width="5" height="3" rx="1"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-window-1" : ""}
          />
          <rect
            x="13" y="7" width="5" height="3" rx="1"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-window-2" : ""}
          />
          {/* Pieds du lit */}
          <path d="M5 18v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M19 18v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    ),

    // GARAGE - Garage avec porte
    GARAGE: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Structure du garage */}
          <path
            d="M3 21V9l9-6 9 6v12"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isAnimating ? "animate-building-rise" : ""}
          />
          {/* Porte du garage */}
          <rect
            x="6" y="12" width="12" height="9" rx="1"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-door-open" : ""}
          />
          {/* Lignes de la porte */}
          <path d="M6 15h12" stroke={color} strokeWidth="1" className={isAnimating ? "animate-window-1" : ""} />
          <path d="M6 18h12" stroke={color} strokeWidth="1" className={isAnimating ? "animate-window-2" : ""} />
          {/* Poignée */}
          <circle cx="16" cy="16.5" r="0.75" fill={color} />
        </svg>
      </div>
    ),

    // STORAGE - Boîtes de stockage
    STORAGE: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Grande boîte */}
          <rect
            x="3" y="10" width="10" height="10" rx="1"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-building-rise" : ""}
          />
          {/* Petite boîte dessus */}
          <rect
            x="5" y="4" width="6" height="6" rx="1"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-roof-drop" : ""}
          />
          {/* Boîte à droite */}
          <rect
            x="14" y="13" width="7" height="7" rx="1"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-building-rise-delay" : ""}
          />
          {/* Lignes de fermeture */}
          <path d="M5 7h4" stroke={color} strokeWidth="1" strokeLinecap="round" className={isAnimating ? "animate-window-1" : ""} />
          <path d="M5 15h6" stroke={color} strokeWidth="1" strokeLinecap="round" className={isAnimating ? "animate-window-2" : ""} />
          <path d="M16 16.5h3" stroke={color} strokeWidth="1" strokeLinecap="round" className={isAnimating ? "animate-window-3" : ""} />
        </svg>
      </div>
    ),

    // MEETING_ROOM - Salle de réunion avec table
    MEETING_ROOM: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Table */}
          <rect
            x="4" y="10" width="16" height="6" rx="1"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-building-rise" : ""}
          />
          {/* Pieds de table */}
          <path d="M6 16v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M18 16v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          {/* Chaises (personnes stylisées) */}
          <circle cx="6" cy="6" r="2" stroke={color} strokeWidth="1.5" className={isAnimating ? "animate-person-left" : ""} />
          <circle cx="12" cy="5" r="2" stroke={color} strokeWidth="1.5" className={isAnimating ? "animate-person-center" : ""} />
          <circle cx="18" cy="6" r="2" stroke={color} strokeWidth="1.5" className={isAnimating ? "animate-person-right" : ""} />
          {/* Écran/Tableau */}
          <rect
            x="9" y="1" width="6" height="3" rx="0.5"
            stroke={color}
            strokeWidth="1"
            className={isAnimating ? "animate-canvas-appear" : ""}
          />
        </svg>
      </div>
    ),

    // OTHER - Étoile/Autre
    OTHER: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isAnimating ? "animate-explosion-center" : ""}
          />
        </svg>
      </div>
    ),
  };

  return icons[category] || icons.ALL;
}

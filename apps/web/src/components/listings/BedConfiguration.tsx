"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export interface BedConfig {
  roomName: string;
  beds: {
    type: "single" | "double" | "queen" | "king" | "sofa" | "bunk";
    count: number;
  }[];
}

interface BedConfigurationProps {
  bedrooms: number;
  value: BedConfig[];
  onChange: (config: BedConfig[]) => void;
}

const BED_TYPES = [
  { value: "single", label: "Lit simple", icon: "🛏️" },
  { value: "double", label: "Lit double", icon: "🛏️" },
  { value: "queen", label: "Lit queen", icon: "🛏️" },
  { value: "king", label: "Lit king", icon: "🛏️" },
  { value: "sofa", label: "Canapé-lit", icon: "🛋️" },
  { value: "bunk", label: "Lit superposé", icon: "🪜" },
] as const;

export default function BedConfiguration({
  bedrooms,
  value,
  onChange,
}: BedConfigurationProps) {
  // Initialiser avec le bon nombre de chambres
  const initializeRooms = () => {
    const rooms: BedConfig[] = [];
    for (let i = 0; i < bedrooms; i++) {
      const existingRoom = value[i];
      rooms.push(
        existingRoom || {
          roomName: `Chambre ${i + 1}`,
          beds: [{ type: "double", count: 1 }],
        }
      );
    }
    return rooms;
  };

  const [rooms, setRooms] = useState<BedConfig[]>(initializeRooms());

  // Mettre à jour quand le nombre de chambres change
  if (rooms.length !== bedrooms) {
    const newRooms = initializeRooms();
    setRooms(newRooms);
    onChange(newRooms);
  }

  const updateRoom = (index: number, updates: Partial<BedConfig>) => {
    const newRooms = [...rooms];
    newRooms[index] = { ...newRooms[index], ...updates };
    setRooms(newRooms);
    onChange(newRooms);
  };

  const addBed = (roomIndex: number) => {
    const newRooms = [...rooms];
    newRooms[roomIndex].beds.push({ type: "single", count: 1 });
    setRooms(newRooms);
    onChange(newRooms);
  };

  const removeBed = (roomIndex: number, bedIndex: number) => {
    const newRooms = [...rooms];
    newRooms[roomIndex].beds.splice(bedIndex, 1);
    setRooms(newRooms);
    onChange(newRooms);
  };

  const updateBed = (
    roomIndex: number,
    bedIndex: number,
    field: "type" | "count",
    value: string | number
  ) => {
    const newRooms = [...rooms];
    if (field === "type") {
      newRooms[roomIndex].beds[bedIndex].type = value as BedConfig["beds"][0]["type"];
    } else {
      newRooms[roomIndex].beds[bedIndex].count = Number(value);
    }
    setRooms(newRooms);
    onChange(newRooms);
  };

  const getTotalBeds = () => {
    return rooms.reduce(
      (total, room) =>
        total + room.beds.reduce((sum, bed) => sum + bed.count, 0),
      0
    );
  };

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">{getTotalBeds()}</span> lit
          {getTotalBeds() > 1 ? "s" : ""} au total dans{" "}
          <span className="font-semibold">{bedrooms}</span> chambre
          {bedrooms > 1 ? "s" : ""}
        </p>
      </div>

      {/* Configuration par chambre */}
      {rooms.map((room, roomIndex) => (
        <div
          key={roomIndex}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          {/* Nom de la chambre */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nom de la chambre
            </label>
            <input
              type="text"
              value={room.roomName}
              onChange={(e) =>
                updateRoom(roomIndex, { roomName: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Chambre ${roomIndex + 1}`}
            />
          </div>

          {/* Lits */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Lits dans cette chambre
            </label>

            {room.beds.map((bed, bedIndex) => (
              <div
                key={bedIndex}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                {/* Type de lit */}
                <select
                  value={bed.type}
                  onChange={(e) =>
                    updateBed(roomIndex, bedIndex, "type", e.target.value)
                  }
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {BED_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>

                {/* Nombre */}
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={bed.count}
                  onChange={(e) =>
                    updateBed(roomIndex, bedIndex, "count", e.target.value)
                  }
                  className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Supprimer */}
                {room.beds.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBed(roomIndex, bedIndex)}
                    className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}

            {/* Ajouter un lit */}
            <button
              type="button"
              onClick={() => addBed(roomIndex)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-blue-500 hover:text-blue-600"
            >
              <Plus className="h-5 w-5" />
              Ajouter un lit
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

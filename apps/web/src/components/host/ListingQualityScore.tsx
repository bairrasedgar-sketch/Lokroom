"use client";

import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

interface QualityItem {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
}

interface ListingQualityScoreProps {
  items: QualityItem[];
  score: number;
}

export default function ListingQualityScore({ items, score }: ListingQualityScoreProps) {
  const requiredItems = items.filter(item => item.required);
  const optionalItems = items.filter(item => !item.required);
  const completedRequired = requiredItems.filter(item => item.completed).length;
  const completedOptional = optionalItems.filter(item => item.completed).length;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 60) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${getScoreBgColor(score)}`}>
      {/* Score Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Qualité de l'annonce</h3>
          <p className="text-sm text-gray-600 mt-1">
            {score >= 80 ? "Excellente annonce !" : score >= 60 ? "Bonne annonce, quelques améliorations possibles" : "Complétez votre annonce pour la publier"}
          </p>
        </div>
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
            {score}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Score</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Required Items */}
      {requiredItems.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <h4 className="text-sm font-semibold text-gray-900">
              Obligatoire ({completedRequired}/{requiredItems.length})
            </h4>
          </div>
          <div className="space-y-2">
            {requiredItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
                <span className={`text-sm ${item.completed ? "text-gray-700" : "text-gray-500"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Items */}
      {optionalItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-gray-900">
              Recommandé ({completedOptional}/{optionalItems.length})
            </h4>
          </div>
          <div className="space-y-2">
            {optionalItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
                <span className={`text-sm ${item.completed ? "text-gray-700" : "text-gray-500"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {score < 100 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            💡 <strong>Astuce :</strong> Les annonces complètes reçoivent 3x plus de réservations !
          </p>
        </div>
      )}
    </div>
  );
}

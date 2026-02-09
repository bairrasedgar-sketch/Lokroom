"use client";

import { useState } from "react";
import { Bot, Send, Loader2 } from "lucide-react";

export default function TestChatPage() {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  const testChat = async (message: string) => {
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testCases = [
    { label: "Bonjour", message: "Bonjour" },
    { label: "Comment créer une annonce ?", message: "Comment créer une annonce ?" },
    { label: "Devenir hôte", message: "Comment devenir hôte ?" },
    { label: "Politique d'annulation", message: "Quelle est la politique d'annulation ?" },
    { label: "Frais de service", message: "Quels sont les frais de service ?" },
    { label: "Changer email (escalade)", message: "Je veux changer mon email" },
    { label: "Supprimer compte (escalade)", message: "Je veux supprimer mon compte" },
    { label: "Parler à un agent", message: "Je veux parler à un agent humain" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-8">
            <Bot className="w-10 h-10 text-black" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Test Chatbot IA</h1>
              <p className="text-gray-600">Testez les différentes fonctionnalités du chatbot Lok'Room</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Test Cases */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Cas de test prédéfinis</h2>
              <div className="space-y-2">
                {testCases.map((testCase, index) => (
                  <button
                    key={index}
                    onClick={() => testChat(testCase.message)}
                    disabled={loading}
                    className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group"
                  >
                    <span className="text-sm font-medium text-gray-900">{testCase.label}</span>
                    <Send className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Message personnalisé</h2>
              <div className="space-y-4">
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Tapez votre message de test..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  rows={4}
                  disabled={loading}
                />
                <button
                  onClick={() => testChat(customMessage)}
                  disabled={!customMessage.trim() || loading}
                  className="w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Envoyer</span>
                    </>
                  )}
                </button>
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">À propos des tests</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Les réponses prédéfinies sont instantanées (pas d'appel API)</li>
                  <li>• Les questions complexes utilisent Gemini AI</li>
                  <li>• Les demandes critiques déclenchent une escalade vers un agent</li>
                  <li>• Le cache réduit les coûts pour les questions fréquentes</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Response Display */}
          {response && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Réponse de l'API</h2>
              <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-auto max-h-96">
                <pre className="text-sm font-mono whitespace-pre-wrap">{response}</pre>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-3 text-lg">Instructions de test</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-purple-800">
              <div>
                <h4 className="font-semibold mb-2">Réponses instantanées (cache)</h4>
                <ul className="space-y-1">
                  <li>• Bonjour, salut, merci</li>
                  <li>• Créer une annonce</li>
                  <li>• Devenir hôte</li>
                  <li>• Mes réservations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Escalade vers agent</h4>
                <ul className="space-y-1">
                  <li>• Changer mon email</li>
                  <li>• Supprimer mon compte</li>
                  <li>• Fraude, arnaque, litige</li>
                  <li>• Parler à un agent</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Widget Info */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Le widget de chat est actif sur toutes les pages.</strong> Cliquez sur le bouton en bas à droite pour tester l'interface complète.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

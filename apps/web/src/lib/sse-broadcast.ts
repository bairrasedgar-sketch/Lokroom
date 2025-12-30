// Utilitaire pour la diffusion de messages temps réel via SSE
// Ce fichier est séparé de la route API pour éviter les erreurs d'export Next.js

// Store pour les connexions SSE actives (en mémoire - pour production utiliser Redis)
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

// Ajouter un message à diffuser
export function broadcastMessage(conversationId: string, event: unknown) {
  const controllers = connections.get(conversationId);
  if (!controllers) return;

  const data = `data: ${JSON.stringify(event)}\n\n`;

  controllers.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(data));
    } catch {
      // Controller fermé, on le supprime
      controllers.delete(controller);
    }
  });
}

// Ajouter une connexion
export function addConnection(conversationId: string, controller: ReadableStreamDefaultController) {
  if (!connections.has(conversationId)) {
    connections.set(conversationId, new Set());
  }
  connections.get(conversationId)!.add(controller);
}

// Supprimer toutes les connexions pour une conversation
export function removeConnections(conversationId: string) {
  const controllers = connections.get(conversationId);
  if (controllers) {
    controllers.forEach((c) => {
      try {
        c.close();
      } catch {
        // Ignorer
      }
    });
    connections.delete(conversationId);
  }
}

// Vérifier si des connexions existent
export function hasConnections(conversationId: string): boolean {
  return connections.has(conversationId) && connections.get(conversationId)!.size > 0;
}

// FAQ Bot responses for Lok'Room support
export type FAQResponse = {
  keywords: string[];
  question: string;
  answer: string;
  followUp?: string[];
};

export const faqResponses: FAQResponse[] = [
  // Annulation
  {
    keywords: ["annuler", "annulation", "rembours", "cancel"],
    question: "Comment annuler une réservation ?",
    answer: `Pour annuler une réservation, rendez-vous dans "Mes réservations" et cliquez sur la réservation concernée. Vous y trouverez le bouton "Annuler la réservation".

📋 **Politique d'annulation (réservations ≥ 24h) :**
• ≥ 72h avant : 100% remboursé (frais de service de 5% retenus, max 2,50€)
• 24h-72h avant : 50% remboursé
• < 24h avant : Aucun remboursement

📋 **Réservations à l'heure (< 24h) :**
• ≥ 6h avant : 100% remboursé (hors frais de service)
• 2h-6h avant : 50% remboursé
• < 2h avant : Aucun remboursement`,
    followUp: ["Voir mes réservations", "Délai de remboursement"],
  },
  {
    keywords: ["remboursement", "argent", "recevoir", "délai"],
    question: "Quand vais-je recevoir mon remboursement ?",
    answer: `Les remboursements sont traités automatiquement après l'annulation :

⏰ **Délais de remboursement :**
• Traitement par Lok'Room : Immédiat
• Apparition sur votre compte : 5 à 10 jours ouvrés

Le délai exact dépend de votre banque. En cas de problème après 10 jours ouvrés, contactez-nous avec votre numéro de réservation.`,
    followUp: ["Annuler une réservation", "Contacter le support"],
  },

  // Réservation
  {
    keywords: ["réserver", "réservation", "book", "louer"],
    question: "Comment faire une réservation ?",
    answer: `Pour réserver un espace sur Lok'Room :

1️⃣ Recherchez votre destination
2️⃣ Sélectionnez les dates/heures souhaitées
3️⃣ Cliquez sur "Réserver"
4️⃣ Complétez le paiement sécurisé

💳 Modes de paiement acceptés : Carte bancaire, Apple Pay, Google Pay

Votre réservation sera confirmée dès validation du paiement.`,
    followUp: ["Modifier ma réservation", "Politique d'annulation"],
  },
  {
    keywords: ["modifier", "changer", "date", "modification"],
    question: "Puis-je modifier ma réservation ?",
    answer: `Les modifications de réservation sont possibles sous certaines conditions :

📝 **Pour modifier votre réservation :**
1. Contactez l'hôte via la messagerie
2. Discutez des nouvelles dates/heures
3. L'hôte peut accepter ou refuser la modification

⚠️ **À noter :**
• Les changements de dates peuvent entraîner des ajustements de prix
• Si l'hôte refuse, vous pouvez annuler selon notre politique d'annulation`,
    followUp: ["Contacter l'hôte", "Annuler la réservation"],
  },

  // Paiement
  {
    keywords: ["paiement", "payer", "carte", "prix", "frais"],
    question: "Comment fonctionne le paiement ?",
    answer: `Le paiement sur Lok'Room est 100% sécurisé via Stripe :

💳 **Modes de paiement :**
• Cartes bancaires (Visa, Mastercard, Amex)
• Apple Pay / Google Pay

💰 **Frais de service :**
• Voyageurs : 5% du montant (max 2,50€)
• Hôtes : 3% de commission

🔒 Vos données bancaires ne sont jamais stockées sur nos serveurs.`,
    followUp: ["Facturation", "Remboursement"],
  },
  {
    keywords: ["hôte", "paiement hôte", "recevoir argent", "versement"],
    question: "Quand l'hôte reçoit-il son paiement ?",
    answer: `En tant qu'hôte, voici comment vous êtes payé :

⏰ **Délai de versement :**
• 24h après le début de la réservation
• Après confirmation de l'arrivée du voyageur

💳 **Méthode :**
• Virement sur votre compte Stripe Connect
• Puis vers votre compte bancaire (2-3 jours)

📊 Commission Lok'Room : 3% du montant`,
    followUp: ["Configurer mes paiements", "Tableau de bord hôte"],
  },

  // Hôte
  {
    keywords: ["devenir hôte", "publier", "annonce", "créer annonce"],
    question: "Comment devenir hôte sur Lok'Room ?",
    answer: `Pour devenir hôte et publier votre espace :

1️⃣ Créez un compte Lok'Room
2️⃣ Allez dans "Devenir hôte"
3️⃣ Complétez la vérification d'identité
4️⃣ Ajoutez votre première annonce
5️⃣ Connectez votre compte Stripe

✅ C'est gratuit ! Vous ne payez que 3% de commission sur les réservations.`,
    followUp: ["Créer une annonce", "Frais pour les hôtes"],
  },

  // Problèmes
  {
    keywords: ["problème", "aide", "urgence", "litige", "plainte"],
    question: "J'ai un problème avec ma réservation",
    answer: `En cas de problème avec une réservation :

1️⃣ **Contactez d'abord l'hôte** via la messagerie
2️⃣ **Si pas de réponse sous 24h**, contactez notre support
3️⃣ **En cas d'urgence**, appelez notre ligne d'assistance

🛡️ **Protection Lok'Room :**
• Médiation en cas de litige
• Remboursement si l'espace ne correspond pas
• Assistance 7j/7

Décrivez votre problème et nous vous aiderons dans les plus brefs délais.`,
    followUp: ["Signaler un problème", "Demander un remboursement"],
  },

  // Compte
  {
    keywords: ["compte", "profil", "mot de passe", "email", "connexion"],
    question: "Comment gérer mon compte ?",
    answer: `Pour gérer votre compte Lok'Room :

👤 **Paramètres du profil :**
• Photo, nom, biographie
• Numéro de téléphone
• Adresse email

🔐 **Sécurité :**
• Modification du mot de passe
• Authentification à deux facteurs
• Historique des connexions

Rendez-vous dans "Mon profil" pour accéder à tous les paramètres.`,
    followUp: ["Modifier mon profil", "Vérifier mon identité"],
  },

  // Général
  {
    keywords: ["bonjour", "salut", "hello", "hi", "coucou"],
    question: "Salutations",
    answer: `Bonjour ! 👋

Je suis l'assistant Lok'Room. Comment puis-je vous aider aujourd'hui ?

Voici les sujets les plus fréquents :
• 📅 Réservations
• ❌ Annulation et remboursement
• 💳 Paiements
• 🏠 Devenir hôte
• 🔒 Sécurité du compte`,
    followUp: ["Faire une réservation", "Annuler une réservation", "Devenir hôte"],
  },
  {
    keywords: ["merci", "thanks", "parfait", "super", "ok"],
    question: "Remerciements",
    answer: `Avec plaisir ! 😊

N'hésitez pas si vous avez d'autres questions. Je suis là pour vous aider.

Bonne journée sur Lok'Room ! 🏠`,
  },
];

// Find the best matching FAQ response
export function findFAQResponse(message: string): FAQResponse | null {
  const lowerMessage = message.toLowerCase();

  // Find the response with the most matching keywords
  let bestMatch: FAQResponse | null = null;
  let bestScore = 0;

  for (const response of faqResponses) {
    let score = 0;
    for (const keyword of response.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = response;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

// Default response when no match is found
export const defaultResponse: FAQResponse = {
  keywords: [],
  question: "Question non reconnue",
  answer: `Je ne suis pas sûr de comprendre votre question. 🤔

Voici ce que je peux vous aider avec :
• 📅 **Réservations** : faire, modifier, annuler
• 💳 **Paiements** : modes de paiement, remboursements
• 🏠 **Hôtes** : devenir hôte, gérer vos annonces
• 🔒 **Compte** : profil, sécurité

Vous pouvez aussi consulter notre **Centre d'aide** pour plus d'informations, ou contacter un conseiller humain.`,
  followUp: ["Voir le centre d'aide", "Parler à un conseiller"],
};

// Quick replies suggestions
export const quickReplies = [
  "Comment annuler ma réservation ?",
  "Quand vais-je être remboursé ?",
  "Comment contacter l'hôte ?",
  "Comment devenir hôte ?",
  "J'ai un problème",
];

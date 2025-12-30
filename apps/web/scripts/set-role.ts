/**
 * Script pour changer le rôle d'un utilisateur
 * Usage: npx tsx scripts/set-role.ts <email> <role>
 *
 * Rôles valides: GUEST, HOST, BOTH, ADMIN
 */

import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const VALID_ROLES: Role[] = ["GUEST", "HOST", "BOTH", "ADMIN"];

async function setRole(email: string, role: Role) {
  console.log(`\n🔍 Recherche de l'utilisateur: ${email}\n`);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
    process.exit(1);
  }

  console.log(`✅ Utilisateur trouvé:`);
  console.log(`   - ID: ${user.id}`);
  console.log(`   - Nom: ${user.name || "(non renseigné)"}`);
  console.log(`   - Rôle actuel: ${user.role}`);

  if (user.role === role) {
    console.log(`\n⚠️  L'utilisateur a déjà le rôle ${role}.\n`);
    process.exit(0);
  }

  console.log(`\n🔄 Changement de rôle: ${user.role} → ${role}...`);

  await prisma.user.update({
    where: { id: user.id },
    data: { role },
  });

  console.log(`\n✅ ${user.email} a maintenant le rôle ${role}!`);

  // Afficher les permissions selon le rôle
  const permissions: Record<string, string[]> = {
    ADMIN: ["Accès complet à tout le panel admin", "Gestion users/annonces/config"],
    GUEST: ["Utilisateur voyageur - réservation d'hébergements"],
    HOST: ["Utilisateur hôte - publication d'annonces"],
    BOTH: ["Utilisateur guest + hôte - toutes fonctionnalités utilisateur"],
  };

  console.log(`\n📋 Permissions:`);
  permissions[role]?.forEach(p => console.log(`   • ${p}`));
  console.log();
}

async function main() {
  const email = process.argv[2];
  const role = process.argv[3]?.toUpperCase() as Role;

  if (!email || !role) {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║         Lok'Room - Changement de rôle                     ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Usage: npx tsx scripts/set-role.ts <email> <role>        ║
║                                                           ║
║  Exemple:                                                 ║
║    npx tsx scripts/set-role.ts john@example.com ADMIN     ║
║                                                           ║
║  Rôles disponibles:                                       ║
║    - ADMIN: Super admin (accès complet)                   ║
║    - HOST: Hôte (publication d'annonces)                  ║
║    - GUEST: Voyageur (réservations)                       ║
║    - BOTH: Hôte + Voyageur                                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }

  if (!VALID_ROLES.includes(role)) {
    console.error(`\n❌ Rôle invalide: ${role}`);
    console.log(`   Rôles valides: ${VALID_ROLES.join(", ")}\n`);
    process.exit(1);
  }

  try {
    await setRole(email, role);
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

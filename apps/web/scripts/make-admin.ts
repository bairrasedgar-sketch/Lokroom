/**
 * Script pour promouvoir un utilisateur en Admin
 * Usage: npx tsx scripts/make-admin.ts <email>
 *
 * Ce script doit être exécuté avec les variables d'environnement DATABASE_URL configurées
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
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
    console.log("\n💡 Vérifiez que l'utilisateur est inscrit sur la plateforme.\n");
    process.exit(1);
  }

  console.log(`✅ Utilisateur trouvé:`);
  console.log(`   - ID: ${user.id}`);
  console.log(`   - Nom: ${user.name || "(non renseigné)"}`);
  console.log(`   - Email: ${user.email}`);
  console.log(`   - Rôle actuel: ${user.role}`);

  if (user.role === "ADMIN") {
    console.log(`\n⚠️  Cet utilisateur est déjà ADMIN.\n`);
    process.exit(0);
  }

  console.log(`\n🚀 Promotion en ADMIN...`);

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
  });

  console.log(`\n✅ ${user.email} est maintenant ADMIN!`);
  console.log(`\n📌 L'utilisateur peut accéder au panel admin: /admin\n`);
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║         Lok'Room - Promotion Admin                        ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Usage: npx tsx scripts/make-admin.ts <email>             ║
║                                                           ║
║  Exemple:                                                 ║
║    npx tsx scripts/make-admin.ts admin@lokroom.com        ║
║                                                           ║
║  Rôles disponibles:                                       ║
║    - ADMIN: Accès complet (super admin)                   ║
║    - MODERATOR: Modération users/annonces                 ║
║    - SUPPORT: Gestion litiges/messages                    ║
║    - FINANCE: Stats financières (lecture seule)           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }

  try {
    await makeAdmin(email);
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

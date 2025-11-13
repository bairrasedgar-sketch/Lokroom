export default function Home() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Bienvenue 👋</h2>
      <p>
        Starter Lok’Room (Semaine 1). Prochaines étapes : Auth, BDD, Uploads,
        Santé.
      </p>
      <ul className="list-disc pl-5 text-sm text-gray-700">
        <li>
          Vérifie <code>/api/health</code> pour la route de santé.
        </li>
        <li>
          Configure <code>.env.local</code> avec ta base Neon.
        </li>
        <li>
          Lance <code>npm install</code> puis <code>npm run dev</code> et ouvre{" "}
          <code>http://localhost:3000</code>.
        </li>
      </ul>
    </section>
  );
}

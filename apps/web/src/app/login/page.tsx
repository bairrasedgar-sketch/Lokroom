import LoginForm from "./login-form";

export default function Page() {
  return (
    <section className="max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-semibold">Sign in to Lokroom</h2>
      <p className="text-sm text-gray-600">
        Enter your email and we’ll send you a magic link.
      </p>
      <LoginForm />
    </section>
  );
}

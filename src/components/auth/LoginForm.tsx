"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Alert, Field, buttonClass, inputClass } from "@/components/ui";
import { STAFF_ONLY, useAuth } from "@/lib/auth";
import { safeNext } from "@/lib/format";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNext(search.get("next"));
  const { user, ready, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(search.get("reason") === "staff" ? STAFF_ONLY : null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, next, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="flex flex-col justify-between bg-hoarding px-6 py-8 text-paper sm:px-10 sm:py-12 lg:min-h-dvh">
        <div>
          <div className="hazard-bar mb-8 w-24" />
          <p className="font-display text-3xl tracking-wide">SITEWORKS</p>
          <p className="mt-1 text-sm uppercase tracking-[0.18em] text-paper/70">Yard office</p>
        </div>
        <div className="my-10">
          <h1 className="max-w-md font-display text-5xl leading-[0.95] sm:text-6xl">Staff tools for the yard.</h1>
          <p className="mt-4 max-w-md text-lg text-paper/80">
            Cement stock and orders, equipment rentals, construction sites, and the crew sent to them.
          </p>
        </div>
        <p className="max-w-sm text-sm text-paper/70">Customer accounts stay on the client site. This door accepts an Admin role only.</p>
      </aside>
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-5 py-10 sm:px-6">
        <h2 className="font-display text-4xl leading-none lg:text-5xl">Sign in</h2>
        <p className="mt-3 text-muted">Use the staff account for this yard.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field label="Email">
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />
          </Field>
          {error ? <Alert>{error}</Alert> : null}
          <button type="submit" className={`${buttonClass()} w-full`} disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        {process.env.NODE_ENV === "development" ? (
          <p className="mt-6 text-sm text-muted">Local staff account: admin@construction.local / Admin@12345</p>
        ) : null}
      </div>
    </div>
  );
}

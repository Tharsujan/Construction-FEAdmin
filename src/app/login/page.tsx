import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="grid min-h-dvh place-items-center text-muted">Opening sign in…</p>}>
      <LoginForm />
    </Suspense>
  );
}

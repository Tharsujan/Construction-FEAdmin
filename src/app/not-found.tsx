import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Yard office</p>
      <h1 className="mt-2 font-display text-5xl leading-none">That page is not in the office.</h1>
      <p className="mt-4 text-lg text-muted">The link does not match a staff screen.</p>
      <Link href="/" className="mt-8 inline-flex min-h-11 w-fit items-center bg-clay px-4 text-sm font-semibold text-card">
        Back to the dashboard
      </Link>
    </div>
  );
}

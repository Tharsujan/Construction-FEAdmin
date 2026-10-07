"use client";

import Link from "next/link";
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { label } from "@/lib/format";

export function buttonClass(variant: "primary" | "secondary" | "quiet" | "danger" = "primary") {
  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 text-sm font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary: "bg-clay text-card hover:bg-clay-deep",
    secondary: "border border-ink text-ink hover:bg-ink hover:text-paper",
    quiet: "border border-line bg-card text-ink hover:border-ink",
    danger: "bg-danger text-card hover:bg-[#742424]",
  };
  return `${base} ${variants[variant]}`;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet" | "danger" }) {
  return <button type={type} className={`${buttonClass(variant)} ${className}`} {...props} />;
}

export const inputClass =
  "w-full border border-line bg-card px-3 py-2.5 text-base text-ink outline-none focus:border-clay";

export function PageHeading({
  kicker,
  title,
  lede,
  action,
}: {
  kicker: string;
  title: string;
  lede?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">{kicker}</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight sm:text-5xl">{title}</h1>
        {lede ? <p className="mt-3 text-base text-muted sm:text-lg">{lede}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Field({
  label: fieldLabel,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{fieldLabel}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-sm text-muted">{hint}</span> : null}
    </label>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="border border-[#e7c4bc] bg-[#fbf1ee] px-3 py-2 text-sm text-danger">
      {children}
    </p>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <p className="border border-line bg-sand/70 px-3 py-2 text-sm text-ink">{children}</p>;
}

const BADGE_TONES: Record<string, string> = {
  Pending: "bg-[#f3e2c4] text-[#6a4a12]",
  Confirmed: "bg-[#dce8df] text-[#1e3a32]",
  OutForDelivery: "bg-[#f6d7c8] text-[#8a3412]",
  Delivered: "bg-hoarding text-paper",
  Cancelled: "bg-sand text-muted",
  Unpaid: "bg-[#f8e4e1] text-danger",
  Paid: "bg-[#dce8df] text-[#1e3a32]",
  Requested: "bg-[#f3e2c4] text-[#6a4a12]",
  Active: "bg-hoarding text-paper",
  Returned: "bg-sand text-ink",
  Available: "bg-[#dce8df] text-[#1e3a32]",
  Rented: "bg-[#f6d7c8] text-[#8a3412]",
  Maintenance: "bg-[#f3e2c4] text-[#6a4a12]",
  Planned: "bg-[#f3e2c4] text-[#6a4a12]",
  InProgress: "bg-hoarding text-paper",
  Completed: "bg-sand text-ink",
  OnHold: "bg-sand text-muted",
  Finished: "bg-sand text-muted",
  Scheduled: "bg-[#f3e2c4] text-[#6a4a12]",
  "On site": "bg-hoarding text-paper",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = BADGE_TONES[status] ?? "bg-sand text-ink";
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${tone}`}>
      {label(status)}
    </span>
  );
}

export function Flag({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
        on ? "bg-[#dce8df] text-[#1e3a32]" : "bg-sand text-muted"
      }`}
    >
      {on ? onLabel : offLabel}
    </span>
  );
}

export function LoadState({
  loading,
  error,
  ready = false,
  onRetry,
  label: loadingLabel,
  children,
}: {
  loading: boolean;
  error: string | null;
  ready?: boolean;
  onRetry?: () => void;
  label: string;
  children: ReactNode;
}) {
  if (!ready && loading) {
    return (
      <p className="py-16 text-muted" role="status">
        {loadingLabel}
      </p>
    );
  }

  if (!ready && error) {
    return (
      <div className="border border-[#e7c4bc] bg-[#fbf1ee] p-5" role="alert">
        <p className="font-semibold text-danger">{error}</p>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="mt-3 text-sm font-semibold underline">
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={loading ? "opacity-70" : undefined}>
      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-line bg-card px-5 py-8">
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="mt-2 max-w-xl text-muted">{body}</p>
    </div>
  );
}

export function Missing({ title, body, href, action }: { title: string; body: string; href: string; action: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Not found</p>
      <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">{body}</p>
      <Link href={href} className={`${buttonClass("secondary")} mt-8`}>
        {action}
      </Link>
    </div>
  );
}

export function FilterBar({
  value,
  options,
  onChange,
  label: groupLabel,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={groupLabel}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value || "all"}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={
              selected
                ? "shrink-0 bg-ink px-3 py-2 text-sm font-semibold text-paper"
                : "shrink-0 border border-line bg-card px-3 py-2 text-sm text-muted hover:border-ink hover:text-ink"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center text-sm font-semibold text-muted hover:text-ink">
      {children}
    </Link>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-3xl tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function MetaGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="border border-line bg-card px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{item.label}</dt>
          <dd className="mt-1 break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
};

export function Records<T>({ rows, columns, rowKey }: { rows: T[]; columns: Column<T>[]; rowKey: (row: T) => string }) {
  return (
    <>
      <div className="hidden md:block">
        <div className="overflow-x-auto border border-line bg-card">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-[0.14em] text-muted">
                {columns.map((column) => (
                  <th key={column.key} className="px-3 py-3 font-semibold">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={rowKey(row)} className="border-b border-line/80 align-top last:border-b-0 hover:bg-sand/40">
                  {columns.map((column) => (
                    <td key={column.key} className="px-3 py-3">
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="border border-line bg-card p-4">
            <div className="font-semibold">{columns[0]?.cell(row)}</div>
            <dl className="mt-3 space-y-2">
              {columns.slice(1).map((column) => (
                <div key={column.key} className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-3 text-sm">
                  <dt className="text-muted">{column.header}</dt>
                  <dd className="min-w-0 break-words">{column.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <h2 id={titleId} className="font-display text-3xl leading-none">
            {title}
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} className="min-h-11 px-2 text-sm font-semibold">
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">{children}</div>
      </div>
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-line bg-card p-4 sm:p-5">
      <h2 className="font-display text-2xl leading-none">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function CheckField({
  checked,
  onChange,
  label: fieldLabel,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 accent-clay"
      />
      <span>
        <span className="block text-sm font-semibold">{fieldLabel}</span>
        {hint ? <span className="mt-1 block text-sm text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

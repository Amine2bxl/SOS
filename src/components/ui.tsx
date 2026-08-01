import type { ReactNode } from "react";
import type { Option } from "@/lib/constants";
import type { Status } from "@/lib/audit";

export function PageHead({ kicker, title, intro }: { kicker?: string; title: string; intro?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {kicker && (
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">{kicker}</p>
      )}
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
        {title}
      </h1>
      {intro && <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{intro}</p>}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-line bg-card p-5 shadow-sm sm:p-6 ${className}`}>
      {title && (
        <h2 className="font-display text-lg font-bold text-navy-900">{title}</h2>
      )}
      {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      <div className={title || subtitle ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-semibold text-navy-900">
        {label} {required && <span className="text-danger-600">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink shadow-inner outline-none transition focus:border-navy-700 focus:ring-2 focus:ring-navy-700/20";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} min-h-28 ${props.className ?? ""}`} />;
}

export function SelectInput({
  options,
  placeholder,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: Option[]; placeholder?: string }) {
  return (
    <select {...props} className={`${inputCls} ${props.className ?? ""}`}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function RadioCards({
  options,
  value,
  onChange,
  columns = 1,
}: {
  options: Option[];
  value?: string | null;
  onChange: (v: string) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className={`grid gap-2 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            type="button"
            key={o.value}
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`flex items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition ${
              active
                ? "border-navy-700 bg-navy-50 ring-2 ring-navy-700/25"
                : "border-line bg-white hover:border-navy-600/50"
            }`}
          >
            <span
              className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 ${
                active ? "border-navy-700" : "border-line"
              }`}
            >
              {active && <span className="h-2 w-2 rounded-full bg-navy-700" />}
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">{o.label}</span>
              {o.hint && <span className="mt-0.5 block text-xs text-ink-soft">{o.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function CheckGrid({
  options,
  values,
  onToggle,
  columns = 2,
}: {
  options: Option[];
  values: string[];
  onToggle: (v: string) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className={`grid gap-2 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
      {options.map((o) => {
        const active = values.includes(o.value);
        return (
          <button
            type="button"
            key={o.value}
            onClick={() => onToggle(o.value)}
            aria-pressed={active}
            className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition ${
              active ? "border-navy-700 bg-navy-50 text-navy-900" : "border-line bg-white text-ink hover:border-navy-600/50"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                active ? "border-navy-700 bg-navy-700 text-white" : "border-line bg-white"
              }`}
            >
              {active && (
                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M2.5 6.5 5 9l4.5-6" />
                </svg>
              )}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function EduBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="rounded-lg border-l-4 border-gold-400 bg-gold-100/70 p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-gold-600" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3 2 8l10 5 10-5-10-5Z" />
          <path d="M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5" />
        </svg>
        {title}
      </h3>
      <div className="mt-2 text-sm leading-relaxed text-ink">{children}</div>
    </aside>
  );
}

export function LearnedBox({ items }: { items: string[] }) {
  return (
    <aside className="rounded-lg border border-navy-100 bg-navy-50 p-4">
      <h3 className="text-sm font-bold text-navy-900">Ce que vous venez d'apprendre</h3>
      <ul className="mt-2 space-y-1.5 text-sm text-ink">
        {items.map((it) => (
          <li key={it} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
            {it}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function StatusBadge({ status }: { status: Status | string }) {
  const map: Record<string, string> = {
    ok: "bg-ok-100 text-ok-700 border-ok-600/30",
    partial: "bg-warn-100 text-warn-700 border-warn-600/30",
    risk: "bg-danger-100 text-danger-700 border-danger-600/30",
    info: "bg-navy-50 text-navy-700 border-navy-600/30",
  };
  const labels: Record<string, string> = { ok: "OK", partial: "À vérifier", risk: "Risque", info: "Info" };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${map[status] ?? map.info}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function Btn({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "gold" | "ghost";
}) {
  const styles = {
    primary: "bg-navy-900 text-white hover:bg-navy-800 shadow-sm",
    secondary: "border border-line bg-white text-navy-900 hover:border-navy-600/50 hover:bg-navy-50",
    gold: "bg-gold-400 text-navy-950 hover:bg-gold-300 shadow-sm font-bold",
    ghost: "text-navy-700 hover:bg-navy-50",
  } as const;
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function LinkBtn({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "gold" | "ghost";
  className?: string;
}) {
  const styles = {
    primary: "bg-navy-900 text-white hover:bg-navy-800 shadow-sm",
    secondary: "border border-line bg-white text-navy-900 hover:border-navy-600/50 hover:bg-navy-50",
    gold: "bg-gold-400 text-navy-950 hover:bg-gold-300 shadow-sm font-bold",
    ghost: "text-navy-700 hover:bg-navy-50",
  } as const;
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition ${styles[variant]} ${className}`}
    >
      {children}
    </a>
  );
}

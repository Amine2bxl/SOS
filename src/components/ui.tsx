import Link from "next/link";
import type { ReactNode } from "react";

export function PageHead({
  kicker,
  title,
  intro,
}: {
  kicker?: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {kicker && <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">{kicker}</p>}
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
        {title}
      </h1>
      {intro && <p className="mt-4 text-base leading-relaxed text-ink-soft">{intro}</p>}
    </div>
  );
}

export function Card({
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
      {title && <h2 className="font-display text-lg font-bold text-navy-900">{title}</h2>}
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
      <span className="mb-1.5 block text-sm font-semibold text-navy-900">
        {label} {required && <span className="text-danger-600">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-700 focus:ring-2 focus:ring-navy-700/20";

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
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
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

/** Encadré pédagogique : le point à retenir. */
export function KeyBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="rounded-lg border-l-4 border-gold-400 bg-gold-100/70 p-4">
      <h3 className="font-display text-sm font-bold text-navy-900">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-ink">{children}</div>
    </aside>
  );
}

export function Check({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
      <path d="M10 0a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.7 7.7-5.4 6a1 1 0 0 1-1.5 0l-2.5-2.8a1 1 0 1 1 1.5-1.3l1.7 2 4.7-5.2a1 1 0 0 1 1.5 1.3Z" />
    </svg>
  );
}

export function Cross({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
      <path d="M10 0a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.5 12.1-1.4 1.4L10 11.4l-2.1 2.1-1.4-1.4L8.6 10 6.5 7.9l1.4-1.4L10 8.6l2.1-2.1 1.4 1.4L11.4 10l2.1 2.1Z" />
    </svg>
  );
}

const btnStyles = {
  primary: "bg-navy-900 text-white hover:bg-navy-800 shadow-sm",
  gold: "bg-gold-400 text-navy-950 hover:bg-gold-300 shadow-sm font-bold",
  secondary: "border border-line bg-white text-navy-900 hover:border-navy-600/50 hover:bg-navy-50",
  /** Variante à utiliser sur les fonds sombres (bleu marine). */
  outline: "border border-navy-600 bg-transparent text-white hover:bg-navy-800",
  ghost: "text-navy-700 hover:bg-navy-50",
} as const;

type Variant = keyof typeof btnStyles;

export function Btn({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${btnStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/** Barre de progression simple (ex. quota de contestations utilisé). */
export function BarreProgression({
  utilise,
  total,
  label,
}: {
  utilise: number;
  total: number;
  label?: string;
}) {
  const pourcentage = total > 0 ? Math.max(0, Math.min(100, Math.round((utilise / total) * 100))) : 0;
  const presqueEpuise = pourcentage >= 80;
  return (
    <div>
      {label && (
        <p className="mb-1.5 text-xs font-semibold text-ink-soft">
          {label} — {utilise}/{total}
        </p>
      )}
      <div className="h-2.5 overflow-hidden rounded-full bg-line-soft">
        <div
          className={`h-full rounded-full transition-[width] ${
            presqueEpuise ? "bg-danger-600" : "bg-gold-400"
          }`}
          style={{ width: `${pourcentage}%` }}
        />
      </div>
    </div>
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
  variant?: Variant;
  className?: string;
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition ${btnStyles[variant]} ${className}`;
  // Les liens externes (tel:, mailto:, http) ne passent pas par le routeur.
  if (/^(https?:|tel:|mailto:)/.test(href)) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/**
 * Carte de module : icône, nom, une phrase qui dit à quoi il sert, un bouton.
 * Utilisée partout où l'on doit faire comprendre la différence entre deux
 * fonctionnalités sans avoir à cliquer.
 */
export function CarteModule({
  href,
  titre,
  phrase,
  cta,
  icone,
  accent = false,
}: {
  href: string;
  titre: string;
  phrase: string;
  cta: string;
  icone?: ReactNode;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        accent ? "border-gold-400 bg-gold-100/50" : "border-line bg-card hover:border-navy-600/40"
      }`}
    >
      {icone && (
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            accent ? "bg-gold-400 text-navy-950" : "bg-navy-900 text-gold-300"
          }`}
        >
          {icone}
        </span>
      )}
      <h3 className="mt-3.5 font-display text-base font-bold text-navy-900">{titre}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-soft">{phrase}</p>
      <span className="mt-4 text-sm font-semibold text-navy-700 group-hover:text-navy-900">
        {cta} <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}

/** Chiffre clé, avec son libellé. */
export function Stat({
  valeur,
  label,
  detail,
}: {
  valeur: string;
  label: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-card p-5">
      <p className="font-display text-3xl font-black text-navy-900">{valeur}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{label}</p>
      {detail && <p className="mt-0.5 text-xs text-ink-soft">{detail}</p>}
    </div>
  );
}

/** Titre de section dans l'espace membre : un intitulé, une phrase, une action. */
export function SectionApp({
  titre,
  intro,
  action,
  children,
}: {
  titre: string;
  intro?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-9">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-navy-900">{titre}</h2>
          {intro && <p className="mt-1 text-sm text-ink-soft">{intro}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** État vide : on explique et on propose la première action, jamais un écran nu. */
export function EtatVide({
  titre,
  texte,
  children,
}: {
  titre: string;
  texte: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-card/60 p-8 text-center">
      <p className="font-display text-lg font-bold text-navy-900">{titre}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">{texte}</p>
      {children && <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

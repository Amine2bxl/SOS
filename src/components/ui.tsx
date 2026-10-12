/**
 * Les composants de base de SOS Citizens.
 *
 * Trois principes, tenus partout :
 *  - des boutons en PILULE, larges et francs, faits pour le pouce : la plupart
 *    des gens arrivent ici avec leur courrier dans une main et leur téléphone
 *    dans l'autre ;
 *  - une seule action en JAUNE par écran : celle qu'on veut voir faire ;
 *  - des cartes blanches posées sur un fond froid, avec une ombre douce : la
 *    hiérarchie se lit sans effort.
 */

import Link from "next/link";
import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Boutons                                                                   */
/* -------------------------------------------------------------------------- */

const btnStyles = {
  primary: "bg-navy-900 text-white hover:bg-navy-800 shadow-bouton",
  gold: "bg-gold-400 text-navy-950 hover:bg-gold-300 shadow-bouton font-bold",
  secondary: "border border-line bg-white text-navy-900 hover:border-navy-200 hover:bg-navy-50",
  /** Sur les fonds sombres (encre). */
  outline: "border border-white/25 bg-white/5 text-white hover:bg-white/10",
  ghost: "text-navy-700 hover:bg-navy-50",
  /** Action destructrice : elle doit se voir, et ne jamais être le bouton par défaut. */
  danger: "bg-danger-600 text-white hover:bg-danger-700 shadow-bouton",
} as const;

const btnTailles = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-14 px-7 text-base",
} as const;

type Variant = keyof typeof btnStyles;
type Taille = keyof typeof btnTailles;

const btnBase =
  "inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

export function Btn({
  children,
  variant = "primary",
  taille = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; taille?: Taille }) {
  return (
    <button {...props} className={`${btnBase} ${btnTailles[taille]} ${btnStyles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function LinkBtn({
  href,
  children,
  variant = "primary",
  taille = "md",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  taille?: Taille;
  className?: string;
}) {
  const cls = `${btnBase} ${btnTailles[taille]} ${btnStyles[variant]} ${className}`;
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

/* -------------------------------------------------------------------------- */
/*  Mise en page                                                              */
/* -------------------------------------------------------------------------- */

/** Petit libellé au-dessus d'un titre. */
export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[0.7rem] font-bold uppercase tracking-[0.16em] text-gold-700 ${className}`}>
      {children}
    </p>
  );
}

export function PageHead({
  kicker,
  title,
  intro,
  aligne = "centre",
}: {
  kicker?: string;
  title: string;
  intro?: string;
  aligne?: "centre" | "gauche";
}) {
  return (
    <div className={aligne === "centre" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {kicker && <Kicker>{kicker}</Kicker>}
      <h1 className="mt-2 font-display text-[2rem] font-extrabold leading-[1.08] text-navy-900 sm:text-[2.6rem]">
        {title}
      </h1>
      {intro && <p className="mt-4 text-[1.05rem] leading-relaxed text-ink-soft">{intro}</p>}
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
    <section className={`rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte sm:p-6 ${className}`}>
      {title && <h2 className="font-display text-lg font-bold text-navy-900">{title}</h2>}
      {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      <div className={title || subtitle ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

/** Titre de section dans l'espace membre : un intitulé, une phrase, une action. */
export function SectionApp({
  titre,
  intro,
  action,
  children,
  className = "",
}: {
  titre: string;
  intro?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mt-9 ${className}`}>
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
  icone,
  children,
}: {
  titre: string;
  texte: string;
  icone?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-carte)] border-2 border-dashed border-line bg-card/70 p-8 text-center">
      {icone && <div className="mx-auto mb-3 flex justify-center text-navy-900">{icone}</div>}
      <p className="font-display text-lg font-bold text-navy-900">{titre}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">{texte}</p>
      {children && <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Formulaires                                                               */
/* -------------------------------------------------------------------------- */

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
      {hint && <span className="mt-1.5 block text-xs leading-relaxed text-ink-soft">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-[0.95rem] text-ink outline-none transition placeholder:text-ink-faint focus:border-navy-600 focus:ring-4 focus:ring-gold-300/40";

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

/* -------------------------------------------------------------------------- */
/*  Signes                                                                    */
/* -------------------------------------------------------------------------- */

const tonsPastille = {
  neutre: "bg-navy-50 text-navy-700",
  info: "bg-azur-100 text-azur-700",
  ok: "bg-ok-100 text-ok-700",
  attention: "bg-warn-100 text-warn-700",
  danger: "bg-danger-100 text-danger-700",
  signal: "bg-gold-100 text-gold-700",
  encre: "bg-navy-900 text-white",
} as const;

export type TonPastille = keyof typeof tonsPastille;

/** Petite étiquette d'état : « Lettre prête », « Solide », « 3 jours ». */
export function Pastille({
  ton = "neutre",
  children,
  className = "",
}: {
  ton?: TonPastille;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${tonsPastille[ton]} ${className}`}>
      {children}
    </span>
  );
}

/** Encadré pédagogique : le point à retenir. */
export function KeyBox({
  title,
  children,
  ton = "signal",
}: {
  title: string;
  children: ReactNode;
  ton?: "signal" | "info" | "danger";
}) {
  const styles = {
    signal: "border-gold-400 bg-gold-50",
    info: "border-azur-600 bg-azur-50",
    danger: "border-danger-600 bg-danger-50",
  }[ton];
  return (
    <aside className={`rounded-2xl border-l-4 p-4 ${styles}`}>
      <h3 className="font-display text-sm font-bold text-navy-900">{title}</h3>
      <div className="mt-1.5 text-sm leading-relaxed text-ink">{children}</div>
    </aside>
  );
}

/**
 * Une plaque d'immatriculation à la belge : caractères rouges sur fond blanc,
 * bande européenne bleue. Le détail qui fait qu'on reconnaît SA voiture.
 */
export function Plaque({ valeur, className = "" }: { valeur: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-stretch overflow-hidden rounded-md border-2 border-plaque/80 bg-white font-mono text-sm font-bold tracking-[0.12em] text-plaque shadow-sm ${className}`}
    >
      <span className="flex w-4 items-end justify-center bg-azur-600 pb-0.5 text-[8px] font-bold tracking-normal text-white">B</span>
      <span className="px-2 py-0.5">{valeur.toUpperCase()}</span>
    </span>
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

/** Barre de progression simple (quota de contestations utilisé, étapes). */
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
          className={`h-full rounded-full transition-[width] ${presqueEpuise ? "bg-danger-600" : "bg-gold-400"}`}
          style={{ width: `${pourcentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Carte de module : icône, nom, une phrase qui dit à quoi il sert, un lien.
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
      className={`group flex flex-col rounded-[var(--radius-carte)] border p-5 shadow-carte transition hover:-translate-y-0.5 hover:shadow-flotte ${
        accent ? "border-gold-300 bg-gold-50" : "border-line/80 bg-card"
      }`}
    >
      {icone && <span className="text-navy-900">{icone}</span>}
      <h3 className="mt-3 font-display text-base font-bold text-navy-900">{titre}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-soft">{phrase}</p>
      <span className="mt-4 text-sm font-semibold text-navy-700 group-hover:text-navy-900">
        {cta} <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}

/** Chiffre clé, avec son libellé. */
export function Stat({ valeur, label, detail }: { valeur: string; label: string; detail?: string }) {
  return (
    <div className="rounded-[var(--radius-carte)] border border-line/80 bg-card p-5 shadow-carte">
      <p className="font-display text-3xl font-extrabold text-navy-900">{valeur}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{label}</p>
      {detail && <p className="mt-0.5 text-xs text-ink-soft">{detail}</p>}
    </div>
  );
}

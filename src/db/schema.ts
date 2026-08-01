import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  jsonb,
  varchar,
  integer,
} from "drizzle-orm/pg-core";

export const dossiers = pgTable("dossiers", {
  id: serial("id").primaryKey(),
  ref: varchar("ref", { length: 32 }).notNull().unique(),
  etape: integer("etape").notNull().default(1),

  // Étape 1 — identification
  natureDossier: text("nature_dossier"),
  documentRecu: text("document_recu"),
  destinataireType: text("destinataire_type"),
  conducteur: text("conducteur"),
  prenom: text("prenom"),
  nom: text("nom"),
  adresse: text("adresse"),
  codePostal: text("code_postal"),
  communeResidence: text("commune_residence"),
  email: text("email"),
  telephone: text("telephone"),
  representeSos: boolean("represente_sos").notNull().default(false),
  documentsRepresentation: jsonb("documents_representation")
    .$type<string[]>()
    .notNull()
    .default([]),
  refRedevance: text("ref_redevance"),
  refContestation: text("ref_contestation"),
  refHuissier: text("ref_huissier"),
  plaque: text("plaque"),
  autorite: text("autorite"),
  communeConstat: text("commune_constat"),
  montantReclame: text("montant_reclame"),
  documentFileName: text("document_file_name"),

  // Étape 2 — chronologie
  chronologie: jsonb("chronologie")
    .$type<Record<string, string>>()
    .notNull()
    .default({}),

  // Étape 3 — faits & preuves
  motifPrincipal: text("motif_principal"),
  reponsesMotif: jsonb("reponses_motif")
    .$type<Record<string, string>>()
    .notNull()
    .default({}),
  faits: text("faits"),
  pieces: jsonb("pieces").$type<string[]>().notNull().default([]),

  // Étape 4 — audit documentaire
  auditDoc: jsonb("audit_doc")
    .$type<{
      inventaire: Record<string, string>;
      techniques: string[];
      administratives: string[];
      juridiques: string[];
      donnees: string[];
      demandes: string[];
    }>()
    .notNull()
    .default({
      inventaire: {},
      techniques: [],
      administratives: [],
      juridiques: [],
      donnees: [],
      demandes: [],
    }),

  // État du dossier
  statut: text("statut").notNull().default("en_analyse"),
  letterType: text("letter_type"),
  letterGeneratedAt: timestamp("letter_generated_at"),
  letterSentAt: timestamp("letter_sent_at"),
  suivi: jsonb("suivi")
    .$type<
      {
        key: string;
        date: string;
        fait: boolean;
        note?: string;
      }[]
    >()
    .notNull()
    .default([]),
  reponseAdministration: text("reponse_administration"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Dossier = typeof dossiers.$inferSelect;

export const communes = pgTable("communes", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  nom: varchar("nom", { length: 120 }).notNull(),
  gestionnaire: text("gestionnaire"),
  zones: text("zones"),
  paiement: text("paiement"),
  cartes: text("cartes"),
  contestation: text("contestation"),
  recouvrement: text("recouvrement"),
  coordonnees: text("coordonnees"),
  documents: text("documents"),
  reglements: text("reglements"),
  derniereVerification: varchar("derniere_verification", { length: 40 }),
  alertes: text("alertes"),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  titre: text("titre").notNull(),
  auteurMedia: text("auteur_media"),
  datePub: varchar("date_pub", { length: 120 }),
  resume: text("resume"),
  theme: text("theme"),
  type: text("type").notNull(),
  sourceUrl: text("source_url"),
  dateVerification: varchar("date_verification", { length: 40 }),
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  reponse: text("reponse").notNull(),
  categorie: text("categorie"),
  ordre: integer("ordre").notNull().default(0),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("contact"),
  nom: text("nom"),
  email: text("email"),
  sujet: text("sujet"),
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dons = pgTable("dons", {
  id: serial("id").primaryKey(),
  prenom: text("prenom"),
  nom: text("nom"),
  email: text("email"),
  montant: text("montant"),
  frequence: text("frequence"),
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"titre" text NOT NULL,
	"auteur_media" text,
	"date_pub" varchar(120),
	"resume" text,
	"theme" text,
	"type" text NOT NULL,
	"source_url" text,
	"date_verification" varchar(40)
);
--> statement-breakpoint
CREATE TABLE "communes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"nom" varchar(120) NOT NULL,
	"gestionnaire" text,
	"zones" text,
	"paiement" text,
	"cartes" text,
	"contestation" text,
	"recouvrement" text,
	"coordonnees" text,
	"documents" text,
	"reglements" text,
	"derniere_verification" varchar(40),
	"alertes" text,
	CONSTRAINT "communes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text DEFAULT 'contact' NOT NULL,
	"nom" text,
	"email" text,
	"sujet" text,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dons" (
	"id" serial PRIMARY KEY NOT NULL,
	"prenom" text,
	"nom" text,
	"email" text,
	"montant" text,
	"frequence" text,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dossiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref" varchar(32) NOT NULL,
	"etape" integer DEFAULT 1 NOT NULL,
	"nature_dossier" text,
	"document_recu" text,
	"destinataire_type" text,
	"conducteur" text,
	"prenom" text,
	"nom" text,
	"adresse" text,
	"code_postal" text,
	"commune_residence" text,
	"email" text,
	"telephone" text,
	"represente_sos" boolean DEFAULT false NOT NULL,
	"documents_representation" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ref_redevance" text,
	"ref_contestation" text,
	"ref_huissier" text,
	"plaque" text,
	"autorite" text,
	"commune_constat" text,
	"montant_reclame" text,
	"document_file_name" text,
	"chronologie" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"motif_principal" text,
	"reponses_motif" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"faits" text,
	"pieces" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"audit_doc" jsonb DEFAULT '{"inventaire":{},"techniques":[],"administratives":[],"juridiques":[],"donnees":[],"demandes":[]}'::jsonb NOT NULL,
	"statut" text DEFAULT 'en_analyse' NOT NULL,
	"letter_type" text,
	"letter_generated_at" timestamp,
	"letter_sent_at" timestamp,
	"suivi" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reponse_administration" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dossiers_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"reponse" text NOT NULL,
	"categorie" text,
	"ordre" integer DEFAULT 0 NOT NULL
);

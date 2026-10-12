/**
 * Traduction des erreurs Supabase en français compréhensible.
 *
 * Partageable entre le serveur (actions) et le navigateur : aucune dépendance
 * serveur. Chaque message dit ce qui s'est passé et quoi faire — « erreur »
 * tout court n'aide personne.
 */

export function traduireErreur(message: string): string {
  const m = message.toLowerCase();

  // L'ordre compte : « rate limit » doit passer avant les messages qui
  // contiennent aussi « otp » ou « email ».
  if (m.includes("rate limit") || m.includes("too many requests") || m.includes("over_email_send_rate_limit"))
    return "Trop d'e-mails envoyés en peu de temps. Patientez quelques minutes avant de redemander un code.";
  if (m.includes("otp expired") || m.includes("token has expired") || m.includes("expired"))
    return "Ce code a expiré. Demandez-en un nouveau.";
  if (m.includes("invalid token") || m.includes("invalid otp") || m.includes("token") || m.includes("otp"))
    return "Code incorrect. Vérifiez le code du dernier e-mail reçu.";
  if (m.includes("signups not allowed") || m.includes("signup is disabled"))
    return "La création de compte est momentanément fermée. Réessayez plus tard.";
  if (m.includes("unable to validate email") || m.includes("invalid email") || m.includes("email address") && m.includes("invalid"))
    return "Cette adresse e-mail ne semble pas valide.";
  if (m.includes("database error saving new user"))
    return "Un compte existe déjà pour une variante de cette adresse. Utilisez l'adresse de votre inscription.";
  if (m.includes("email not confirmed")) return "Confirmez d'abord votre adresse : un code vous a été envoyé.";
  if (m.includes("user already registered")) return "Un compte existe déjà avec cette adresse.";
  return "Une erreur est survenue. Réessayez dans un instant.";
}

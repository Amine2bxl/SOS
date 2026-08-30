/**
 * Traduction des erreurs Supabase en français. Partageable entre le serveur
 * (actions) et le navigateur (connexion rapide) : aucune dépendance serveur.
 */

/** Traduit les messages d'erreur Supabase en français compréhensible. */
export function traduireErreur(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed")) return "Confirmez d'abord votre adresse e-mail : vérifiez votre boîte de réception.";
  if (m.includes("user already registered")) return "Un compte existe déjà avec cette adresse. Connectez-vous.";
  if (m.includes("password should be at least")) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (m.includes("unable to validate email")) return "Cette adresse e-mail ne semble pas valide.";
  if (m.includes("otp expired") || m.includes("token has expired") || m.includes("too many requests"))
    return "Ce code a expiré. Demandez-en un nouveau.";
  if (m.includes("invalid token") || m.includes("invalid otp") || m.includes("email otp") || m.includes("otp"))
    return "Code incorrect. Regardez le code du dernier e-mail reçu.";
  if (m.includes("rate limit") || m.includes("too many")) return "Trop de tentatives. Réessayez dans quelques minutes.";
  return "Une erreur est survenue. Réessayez, ou appelez-nous si cela persiste.";
}
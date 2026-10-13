/** À synchroniser avec Auth > Email > Email OTP length dans Supabase. */
export const LONGUEUR_CODE_AUTH = 8;

export const MOTIF_CODE_AUTH = `[0-9]{${LONGUEUR_CODE_AUTH}}`;

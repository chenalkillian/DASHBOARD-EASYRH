/**
 * Traduit un message d'erreur Supabase Auth en libellé utilisateur (FR).
 * @param {string} message
 * @returns {string}
 */
export function formatAuthError(message) {
  const mapping = {
    'Invalid login credentials':
      'Email ou mot de passe incorrect. Veuillez réessayer.',
    'JWT expired': 'Votre session a expiré. Veuillez vous reconnecter.',
    'Email not confirmed':
      'Veuillez confirmer votre adresse email avant de vous connecter.',
  };
  return (
    mapping[message] ??
    'Une erreur inattendue est survenue. Veuillez réessayer.'
  );
}

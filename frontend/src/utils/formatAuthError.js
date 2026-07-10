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
    'User already registered': 'Un compte existe déjà avec cette adresse email.',
    'Aucun compte trouvé avec cet email':
      'Aucun compte trouvé avec cet email. Vérifiez l’adresse ou créez d’abord le compte utilisateur.',
    'Signup requires a valid password':
      'Le mot de passe ne respecte pas les critères de sécurité.',
    'Password should be at least 6 characters':
      'Le mot de passe doit contenir au moins 6 caractères.',
    'New password should be different from the old password':
      'Le nouveau mot de passe doit être différent de l’ancien.',
    'Auth session missing!':
      'Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.',
  };
  return (
    mapping[message] ??
    'Une erreur inattendue est survenue. Veuillez réessayer.'
  );
}

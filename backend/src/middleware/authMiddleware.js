// Middleware d'authentification + autorisation basé sur Supabase.
// Objectif : centraliser la vérification du token JWT Supabase et enrichir req.user avec le rôle métier.
const supabase = require('../db/supabaseClient');
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: 'Token invalide' });
  // On récupère ici le rôle dans la table profiles via la service_role key (bypass RLS côté API).
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Profile error:', profileError);
    return res.status(500).json({ error: 'Erreur profil' });
  }

  let role;
  if (!profile) {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: user.id, role: 'Collaborateur' })
      .select('role')
      .maybeSingle();

    if (insertError || !newProfile) {
      console.error('Profile creation error:', insertError);
      return res.status(500).json({ error: 'Erreur profil' });
    }
    role = newProfile.role;
  } else {
    role = profile.role || 'Collaborateur';
  }

  // Vérification de l'existence d'une fiche collaborateur liée (RH exemptés).
 let hasAccount = role === 'RH';

if (!hasAccount) {
  const { data: fiche, error } = await supabase
    .from('collaborateurs')
    .select('id')
    .eq('user_id', user.id)
    .eq('email', user.email)
    .maybeSingle();
  if (error) {
    console.error('Erreur recherche collaborateur:', error);
    return res.status(500).json({ error: 'Erreur collaborateur' });
  }


  hasAccount = !!fiche;
}
  req.user = { ...user, role, hasAccount };
  next();
};

// Nouveau middleware à appliquer sur les routes métier (pas sur /api/auth/me)
const requireAccount = (req, res, next) => {
  if (req.user?.role === 'RH') return next();

  if (!req.user?.hasAccount) {
    return res.status(403).json({
      error: 'compte_en_attente',
      message: 'Votre compte est en attente de validation par le service RH.',
    });
  }

  next();
};
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  next();
};


module.exports = { authenticate, authorize, requireAccount };
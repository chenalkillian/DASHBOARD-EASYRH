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

  // Je récupère ici le rôle dans la table profiles via la service_role key (bypass RLS côté API).
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Profile error:', profileError);
    return res.status(500).json({ error: 'Erreur profil' });
  }

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

    req.user = {
      ...user,
      role: newProfile.role,
    };
    return next();
  }

  req.user = {
    ...user,
    role: profile.role || 'Collaborateur',
  };
  next();
};


const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  next();
};

module.exports = { authenticate, authorize };

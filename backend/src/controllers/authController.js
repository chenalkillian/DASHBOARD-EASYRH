const supabase = require('../db/supabaseClient');

// Liaison auto fiche ↔ compte à l'inscription.
// Utilise supabaseClient (SUPABASE_SERVICE_ROLE_KEY) : bypass RLS Postgres.
// L'appelant (POST /api/auth/register) est public ; le JWT du nouvel utilisateur
// n'est pas transmis ici — la mise à jour user_id ne dépend donc pas des policies RLS.
const linkCollaborateurByEmail = async (userId, email) => {
  const { data: collab, error: findError } = await supabase
    .from('collaborateurs')
    .select('id')
    .is('user_id', null)
    .eq('email', email)
    .maybeSingle();

  if (findError) {
    console.error('[register] Erreur recherche collaborateur:', findError.message);
    return;
  }

  if (!collab) return;

  const { error: updateError } = await supabase
    .from('collaborateurs')
    .update({ user_id: userId })
    .eq('id', collab.id);

  if (updateError) {
    console.error('[register] Erreur liaison collaborateur:', updateError.message);
    return;
  }

  console.log(
    `[register] Liaison automatique : collaborateur ${collab.id} → utilisateur ${userId} (${email})`,
  );
};

const register = async (req, res) => {
  const { email, password, full_name } = req.body;
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name } }
  });
  if (error) return res.status(400).json({ error: error.message });

  if (data?.user?.id && email) {
    try {
      await linkCollaborateurByEmail(data.user.id, email);
    } catch (linkErr) {
      console.error('[register] Liaison collaborateur ignorée:', linkErr.message);
    }
  }

  res.status(201).json({ message: 'Inscription réussie', user: data.user });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });
  res.json({ token: data.session.access_token, user: data.user });
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, getMe, linkCollaborateurByEmail };

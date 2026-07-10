const supabase = require('../db/supabaseClient');

const ROLES_VALIDES = ['RH', 'Manager', 'Collaborateur'];

const buildFullname = (nom, prenom) => `${prenom} ${nom}`.trim();

const splitFullName = (fullName) => {
  const trimmed = (fullName || '').trim();
  if (!trimmed) return { prenom: '', nom: '' };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { prenom: parts[0], nom: '' };
  return { prenom: parts[0], nom: parts.slice(1).join(' ') };
};

/** Liste tous les utilisateurs Auth via l'API Admin (service_role). */
const fetchAllAuthUsers = async () => {
  const users = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }

  return users;
};

/** Récupère un utilisateur Auth par id (API Admin, pas de requête sur auth.users). */
const findAuthUserById = async (userId) => {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;
  return data.user;
};

/** Ajoute role et has_account via collaborateurs.user_id → profiles.id */
const enrichWithRoles = async (collaborateurs) => {
  if (!collaborateurs?.length) return collaborateurs;

  const userIds = collaborateurs.map((c) => c.user_id).filter(Boolean);
  if (!userIds.length) {
    return collaborateurs.map((c) => ({ ...c, role: null, has_account: false }));
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, role')
    .in('id', userIds);

  if (error) return collaborateurs;

  const roleById = new Map((profiles || []).map((p) => [p.id, p.role]));
  return collaborateurs.map((c) => ({
    ...c,
    role: c.user_id ? roleById.get(c.user_id) ?? null : null,
    has_account: !!(c.user_id && roleById.has(c.user_id)),
  }));
};

/** Utilisateurs Supabase Auth sans fiche collaborateur liée (RH). */
const getUtilisateursInscrits = async (req, res) => {
  try {
    const { data: collaborateurs, error: collabError } = await supabase
      .from('collaborateurs')
      .select('user_id');

    if (collabError) {
      return res.status(500).json({ error: collabError.message ?? collabError });
    }

    const linkedIds = new Set(
      (collaborateurs || []).map((c) => c.user_id).filter(Boolean),
    );

    const authUsers = await fetchAllAuthUsers();

    const authUserIds = authUsers.map((u) => u.id);
    let profileById = new Map();
    if (authUserIds.length) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', authUserIds);

      if (profileError) {
        return res.status(500).json({ error: profileError.message });
      }
      profileById = new Map((profiles || []).map((p) => [p.id, p]));
    }

    const disponibles = authUsers
      .filter((u) => !linkedIds.has(u.id))
      .map((u) => {
        const profile = profileById.get(u.id);
        const fullName =
          profile?.full_name || u.user_metadata?.full_name || u.email?.split('@')[0] || '';
        const { prenom, nom } = splitFullName(fullName);
        return {
          id: u.id,
          email: u.email,
          full_name: fullName,
          prenom,
          nom,
          role: profile?.role ?? null,
        };
      })
      .sort((a, b) => (a.email || '').localeCompare(b.email || ''));

    res.json(disponibles);
  } catch (err) {
    console.error('[collaborateurs] getUtilisateursInscrits:', err.message);
    return res.status(500).json({ error: 'Impossible de charger les utilisateurs inscrits' });
  }
};

const getAll = async (req, res) => {
  const { data, error } = await supabase
    .from('collaborateurs')
    .select('*')
    .order('nom');
  if (error) return res.status(500).json({ error });
  const enriched = await enrichWithRoles(data);
  res.json(enriched);
};

const create = async (req, res) => {
  const {
    user_id: bodyUserId,
    email: _email,
    password: _password,
    compteExistant: _compteExistant,
    nom,
    prenom,
    poste,
    service,
    date_embauche,
    salaire,
    contrat,
    status,
    role: _role,
    ...rest
  } = req.body;

  if (!bodyUserId) {
    return res.status(400).json({
      error: 'Sélectionnez un utilisateur inscrit pour créer la fiche collaborateur',
    });
  }

  const authUser = await findAuthUserById(bodyUserId);
  if (!authUser) {
    return res.status(404).json({ error: 'Utilisateur introuvable dans Supabase Auth' });
  }

  const { data: dejaLie, error: checkError } = await supabase
    .from('collaborateurs')
    .select('id')
    .eq('user_id', bodyUserId)
    .maybeSingle();

  if (checkError) {
    return res.status(500).json({ error: checkError.message });
  }
  if (dejaLie) {
    return res.status(400).json({
      error: 'Cet utilisateur est déjà lié à une fiche collaborateur',
    });
  }

  const collabPayload = {
    nom,
    prenom,
    poste,
    service,
    date_embauche,
    salaire,
    contrat,
    status: status ?? 'Actif',
    email: authUser.email,
    user_id: bodyUserId,
    created_by: req.user.id,
    ...rest,
  };

  const { data: collab, error: insertError } = await supabase
    .from('collaborateurs')
    .insert([collabPayload])
    .select()
    .single();

  if (insertError) {
    return res.status(400).json({ error: insertError.message ?? insertError });
  }

  const [enriched] = await enrichWithRoles([collab]);
  res.status(201).json(enriched);
};

const getById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('collaborateurs')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Collaborateur non trouvé' });
  const [enriched] = await enrichWithRoles([data]);
  res.json(enriched);
};

const update = async (req, res) => {
  const { id } = req.params;
  const {
    role,
    email: _email,
    password: _password,
    user_id: _userId,
    compteExistant: _compteExistant,
    ...collabFields
  } = req.body;

  if (role !== undefined && !ROLES_VALIDES.includes(role)) {
    return res.status(400).json({ error: 'Rôle invalide' });
  }

  const { data, error } = await supabase
    .from('collaborateurs')
    .update(collabFields)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error });

  if (role !== undefined) {
    const userId = data?.user_id;

    if (!userId) {
      // Fiche sans compte lié : les champs collaborateur sont enregistrés, le rôle applicatif ne s'applique pas.
    } else {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) return res.status(500).json({ error: profileError.message });

      if (!profile) {
        return res.status(400).json({
          error: 'Aucun compte utilisateur lié à cette fiche (impossible de modifier le rôle)',
        });
      }

      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (roleError) return res.status(400).json({ error: roleError.message });
    }
  }

  const [enriched] = await enrichWithRoles([data]);
  res.json(enriched);
};

const remove = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('collaborateurs')
    .delete()
    .eq('id', id);
  if (error) return res.status(400).json({ error });
  res.status(204).send();
};

module.exports = {
  getAll,
  getUtilisateursInscrits,
  create,
  getById,
  update,
  remove,
  enrichWithRoles,
  splitFullName,
  findAuthUserById,
  fetchAllAuthUsers,
};

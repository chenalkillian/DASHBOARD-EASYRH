const supabase = require('../db/supabaseClient');

const ROLES_VALIDES = ['RH', 'Manager', 'Collaborateur'];

const buildFullname = (nom, prenom) => `${prenom} ${nom}`.trim();

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
    email,
    password,
    nom,
    prenom,
    poste,
    service,
    date_embauche,
    salaire,
    contrat,
    status,
    role: _role,
    user_id: _userId,
    ...rest
  } = req.body;

  const collabPayload = {
    nom,
    prenom,
    poste,
    service,
    date_embauche,
    salaire,
    contrat,
    status: status ?? 'Actif',
    email,
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

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: buildFullname(nom, prenom) },
  });

  if (authError || !authData?.user) {
    await supabase.from('collaborateurs').delete().eq('id', collab.id);
    return res.status(400).json({
      error: authError?.message ?? 'Échec de la création du compte utilisateur',
    });
  }

  const userId = authData.user.id;

  // Le trigger Supabase (on_auth_user_created) crée souvent déjà la ligne profiles → upsert
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      full_name: buildFullname(nom, prenom),
      role: 'Collaborateur',
    },
    { onConflict: 'id' },
  );

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    await supabase.from('collaborateurs').delete().eq('id', collab.id);
    return res.status(400).json({ error: profileError.message });
  }

  const { data: linked, error: linkError } = await supabase
    .from('collaborateurs')
    .update({ user_id: userId })
    .eq('id', collab.id)
    .select()
    .single();

  if (linkError) {
    await supabase.auth.admin.deleteUser(userId);
    await supabase.from('profiles').delete().eq('id', userId);
    await supabase.from('collaborateurs').delete().eq('id', collab.id);
    return res.status(400).json({ error: linkError.message });
  }

  const [enriched] = await enrichWithRoles([linked]);
  res.status(201).json(enriched);
};

const getById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('collaborateurs')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Collaborateur non trouvé' });
  const [enriched] = await enrichWithRoles([data]);
  res.json(enriched);
};

const update = async (req, res) => {
  const { id } = req.params;
  const { role, email: _email, password: _password, user_id: _userId, ...collabFields } = req.body;

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
    const { data: collab, error: collabErr } = await supabase
      .from('collaborateurs')
      .select('user_id')
      .eq('id', id)
      .single();

    if (collabErr || !collab) {
      return res.status(404).json({ error: 'Collaborateur non trouvé' });
    }

    if (!collab.user_id) {
      return res.status(400).json({
        error: 'Aucun compte utilisateur lié à cette fiche (impossible de modifier le rôle)',
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', collab.user_id)
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
      .eq('id', collab.user_id);

    if (roleError) return res.status(400).json({ error: roleError.message });
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

module.exports = { getAll, create, getById, update, remove, enrichWithRoles };

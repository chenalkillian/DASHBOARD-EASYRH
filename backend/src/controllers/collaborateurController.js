const supabase = require('../db/supabaseClient');
const ROLES_VALIDES = ['RH', 'Manager', 'Collaborateur'];

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
  const { nom, prenom, poste, service, date_embauche, salaire, contrat } = req.body;
  const { data, error } = await supabase
    .from('collaborateurs')
    .insert([{ ...req.body, created_by: req.user.id }])
    .select()
    .single();
  if (error) return res.status(400).json({ error });
  res.status(201).json(data);
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
  const { role, ...collabFields } = req.body;
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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
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
      .eq('id', id);
    if (roleError) return res.status(400).json({ error: roleError.message });
  }
  const [enriched] = await enrichWithRoles([data]);
  res.json(enriched);};

const remove = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('collaborateurs')
    .delete()
    .eq('id', id);
  if (error) return res.status(400).json({ error });
  res.status(204).send();
};

const enrichWithRoles = async (collaborateurs) => {
  if (!collaborateurs?.length) return collaborateurs;
  const ids = collaborateurs.map((c) => c.id).filter(Boolean);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, role')
    .in('id', ids);
  const roleById = new Map((profiles || []).map((p) => [p.id, p.role]));
  return collaborateurs.map((c) => ({
    ...c,
    role: roleById.get(c.id) ?? null,
    has_account: roleById.has(c.id),
  }));
};


module.exports = { getAll, create, getById, update, remove , enrichWithRoles};

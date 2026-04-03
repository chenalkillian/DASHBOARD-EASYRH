const supabase = require('../db/supabaseClient');

const getAll = async (req, res) => {
  const { statut } = req.query;

  let query = supabase
    .from('candidats')
    .select('*')
    .order('created_at', { ascending: false });

  if (statut) query = query.eq('statut', statut);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const create = async (req, res) => {
  const payload = {
    ...req.body,
    created_by: req.user.id,
  };

  const { data, error } = await supabase
    .from('candidats')
    .insert([payload])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

const getById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('candidats')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Candidat non trouvé' });
  res.json(data);
};

const update = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('candidats')
    .update(req.body)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

const remove = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('candidats')
    .delete()
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
};

module.exports = { getAll, create, getById, update, remove };

const supabase = require('../db/supabaseClient');

const getAll = async (req, res) => {
  const { data, error } = await supabase
    .from('collaborateurs')
    .select('*')
    .order('nom');
  if (error) return res.status(500).json({ error });
  res.json(data);
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
  res.json(data);
};

const update = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('collaborateurs')
    .update(req.body)
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(400).json({ error });
  res.json(data);
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

module.exports = { getAll, create, getById, update, remove };

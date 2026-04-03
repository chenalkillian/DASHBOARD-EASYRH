const supabase = require('../db/supabaseClient');

const getTasksByCollaborateur = async (req, res) => {
  const { collaborateurId } = req.params;

  const { data, error } = await supabase
    .from('onboarding_tasks')
    .select('*')
    .eq('collaborateur_id', collaborateurId)
    .order('ordre', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const createTask = async (req, res) => {
  const { collaborateurId } = req.params;
  const payload = {
    ...req.body,
    collaborateur_id: collaborateurId,
    created_by: req.user.id,
  };

  const { data, error } = await supabase
    .from('onboarding_tasks')
    .insert([payload])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

const updateTask = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('onboarding_tasks')
    .update(req.body)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

const deleteTask = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('onboarding_tasks')
    .delete()
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
};

module.exports = { getTasksByCollaborateur, createTask, updateTask, deleteTask };


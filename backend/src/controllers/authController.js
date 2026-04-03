const supabase = require('../db/supabaseClient');

const register = async (req, res) => {
  const { email, password, full_name } = req.body;
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name } }
  });
  if (error) return res.status(400).json({ error: error.message });
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

module.exports = { register, login, getMe };

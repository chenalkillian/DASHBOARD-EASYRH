// src/db/supabaseClient.js
require('./applyDevTls');
const { createClient } = require('@supabase/supabase-js');

// Service role : tables + supabase.auth.admin (createUser, deleteUser)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;

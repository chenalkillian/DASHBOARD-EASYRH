// Contrôleur de gestion des congés.
// Je centralise ici la logique métier liée aux demandes de congés (création, liste, décision, suppression).
const supabase = require('../db/supabaseClient');

/** Enrichit les demandes avec nom/prénom du demandeur (table collaborateurs, lien via created_by). */
const attachDemandeurs = async (congesList) => {
  if (!congesList?.length) return congesList;

  const userIds = [...new Set(congesList.map((c) => c.created_by).filter(Boolean))];
  if (!userIds.length) return congesList;

  const [byIdRes, byCreatedByRes] = await Promise.all([
    supabase.from('collaborateurs').select('id, nom, prenom').in('id', userIds),
    supabase.from('collaborateurs').select('nom, prenom, created_by').in('created_by', userIds),
  ]);

  const demandeurMap = new Map();
  for (const col of byIdRes.data || []) {
    if (userIds.includes(col.id)) demandeurMap.set(col.id, col);
  }
  for (const col of byCreatedByRes.data || []) {
    if (col.created_by && userIds.includes(col.created_by)) {
      demandeurMap.set(col.created_by, col);
    }
  }

  return congesList.map((c) => {
    const d = demandeurMap.get(c.created_by);
    return {
      ...c,
      demandeur_nom: d?.nom ?? null,
      demandeur_prenom: d?.prenom ?? null,
    };
  });
};

const getAll = async (req, res) => {
  const { statut } = req.query;

  let query = supabase
    .from('conges')
    .select('*')
    .order('created_at', { ascending: false });

  if (statut) query = query.eq('statut', statut);

  // Si l'utilisateur est un simple collaborateur, je limite la vue à ses propres demandes.
  if (req.user?.role === 'Collaborateur') {
    query = query.eq('created_by', req.user.id);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const enriched = await attachDemandeurs(data);
  res.json(enriched);
};

const create = async (req, res) => {
  if (req.user?.role === 'RH' || req.user?.role === 'Manager') {
    return res.status(403).json({
      error: 'Les rôles RH et Manager ne peuvent pas créer de demande de congé',
    });
  }

  const payload = {
    ...req.body,
    created_by: req.user.id,
    statut: 'En attente',
  };

  const { data, error } = await supabase
    .from('conges')
    .insert([payload])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

// Décision RH/Manager : on approuve ou refuse une demande existante.
const decide = async (req, res) => {
  const { id } = req.params;
  const { decision } = req.body; // 'Approuvé' | 'Refusé'

  if (!['Approuvé', 'Refusé'].includes(decision)) {
    return res.status(400).json({ error: 'Décision invalide' });
  }

  const { data, error } = await supabase
    .from('conges')
    .update({
      statut: decision,
      validated_by: req.user.id,
      validated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Demande introuvable' });
  res.json(data);
};

// Suppression d'une demande.
// Règle métier : un collaborateur ne peut supprimer que ses propres demandes encore "En attente".
const remove = async (req, res) => {
  const { id } = req.params;

  // Collaborateur: ne peut supprimer que ses demandes en attente
  if (req.user?.role === 'Collaborateur') {
    const { data: existing, error: findError } = await supabase
      .from('conges')
      .select('id, statut, created_by')
      .eq('id', id)
      .single();

    if (findError || !existing) return res.status(404).json({ error: 'Demande introuvable' });
    if (existing.created_by !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });
    if (existing.statut !== 'En attente') return res.status(400).json({ error: 'Suppression impossible (déjà traitée)' });
  }

  const { error } = await supabase
    .from('conges')
    .delete()
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
};

module.exports = { getAll, create, decide, remove };


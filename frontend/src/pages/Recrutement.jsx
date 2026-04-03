import { useEffect, useMemo, useState } from 'react';
import { getTokenFromCookie, useAuth } from '../hooks/useAuth';

const STATUTS = ['Nouveau', 'En cours', 'Entretien', 'Offre', 'Rejeté', 'Embauché'];

const emptyForm = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  poste: '',
  source: '',
  statut: 'Nouveau',
  date_candidature: '',
  notes: '',
};

const toDateInputValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return '';
};

const Recrutement = () => {
  const { user } = useAuth();
  const role = user?.role || 'Collaborateur';

  const [candidats, setCandidats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const [filterStatut, setFilterStatut] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const canAccess = role === 'RH' || role === 'Manager';

  const stats = useMemo(() => {
    const counts = STATUTS.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
    for (const c of candidats) {
      const s = c.statut || 'Nouveau';
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [candidats]);

  const fetchCandidats = async () => {
    const token = getTokenFromCookie();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const qs = filterStatut ? `?statut=${encodeURIComponent(filterStatut)}` : '';
      const res = await fetch(`/api/recrutement${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || (res.status === 403 ? 'Accès réservé RH/Manager' : 'Erreur chargement candidats');
        throw new Error(msg);
      }
      setCandidats(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (path, filename) => {
    const token = getTokenFromCookie();
    if (!token) return;

    setExporting(true);
    setError('');
    try {
      const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error || 'Erreur export';
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (!user || !canAccess) return;
    fetchCandidats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, canAccess, filterStatut]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getTokenFromCookie();
    if (!token) return;

    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        date_candidature: form.date_candidature || null,
        email: form.email || null,
        telephone: form.telephone || null,
        source: form.source || null,
        notes: form.notes || null,
      };

      const url = editingId ? `/api/recrutement/${editingId}` : '/api/recrutement';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || 'Erreur enregistrement candidat';
        throw new Error(msg);
      }

      resetForm();
      await fetchCandidats();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setError('');
    setForm({
      nom: c.nom || '',
      prenom: c.prenom || '',
      email: c.email || '',
      telephone: c.telephone || '',
      poste: c.poste || '',
      source: c.source || '',
      statut: c.statut || 'Nouveau',
      date_candidature: toDateInputValue(c.date_candidature),
      notes: c.notes || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce candidat ?')) return;
    const token = getTokenFromCookie();
    if (!token) return;

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/recrutement/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error || 'Erreur suppression';
        throw new Error(msg);
      }
      await fetchCandidats();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <div>Chargement...</div>;
  if (!canAccess) return <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">Accès réservé RH/Manager.</div>;
  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Recrutement</h1>
          <p className="text-slate-600">Suivi des candidats, statuts et pipeline.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={exporting || saving}
            onClick={() => downloadFile('/api/exports/recrutement.xlsx', 'recrutement.xlsx')}
            className="bg-slate-900 text-white px-3 py-2 rounded-xl text-sm disabled:opacity-50"
          >
            {exporting ? 'Export...' : 'Excel'}
          </button>
          <button
            type="button"
            disabled={exporting || saving}
            onClick={() => downloadFile('/api/exports/recrutement.pdf', 'recrutement.pdf')}
            className="bg-slate-900 text-white px-3 py-2 rounded-xl text-sm disabled:opacity-50"
          >
            {exporting ? 'Export...' : 'PDF'}
          </button>
          <label className="text-sm text-slate-600">Filtre statut</label>
          <select className="border border-slate-200 rounded-xl px-3 py-2 bg-white" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
            <option value="">Tous</option>
            {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUTS.map((s) => (
          <div key={s} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3">
            <div className="text-xs text-slate-500">{s}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats[s] || 0}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border p-2 rounded" placeholder="Nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Prénom" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Poste visé" value={form.poste} onChange={e => setForm({ ...form, poste: e.target.value })} required />

          <input className="border p-2 rounded" placeholder="Email (optionnel)" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Téléphone (optionnel)" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Source (LinkedIn, cooptation...)" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} />

          <select className="border p-2 rounded" value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
            {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" className="border p-2 rounded" value={form.date_candidature} onChange={e => setForm({ ...form, date_candidature: e.target.value })} />
          <input className="border p-2 rounded md:col-span-3" placeholder="Notes (optionnel)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
            {saving ? 'Enregistrement...' : (editingId ? 'Enregistrer' : 'Ajouter')}
          </button>
          {editingId && (
            <button type="button" disabled={saving} onClick={resetForm} className="bg-slate-200 text-slate-900 px-4 py-2 rounded disabled:opacity-50">
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-slate-600">
              <th className="p-3 border-b">Nom</th>
              <th className="p-3 border-b">Prénom</th>
              <th className="p-3 border-b">Poste</th>
              <th className="p-3 border-b">Statut</th>
              <th className="p-3 border-b">Date</th>
              <th className="p-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidats.map((c) => (
              <tr key={c.id} className="text-sm text-slate-800">
                <td className="p-3 border-b">{c.nom}</td>
                <td className="p-3 border-b">{c.prenom}</td>
                <td className="p-3 border-b">{c.poste}</td>
                <td className="p-3 border-b">{c.statut}</td>
                <td className="p-3 border-b">{toDateInputValue(c.date_candidature)}</td>
                <td className="p-3 border-b">
                  <button disabled={saving} onClick={() => handleEdit(c)} className="bg-yellow-600 text-white px-2 py-1 mr-2 rounded disabled:opacity-50">
                    Edit
                  </button>
                  <button disabled={saving} onClick={() => handleDelete(c.id)} className="bg-red-600 text-white px-2 py-1 rounded disabled:opacity-50">
                    Suppr
                  </button>
                </td>
              </tr>
            ))}
            {!candidats.length && (
              <tr>
                <td className="p-3 text-slate-500" colSpan={6}>Aucun candidat.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Recrutement;


import { useState, useEffect } from 'react';
import { getTokenFromCookie, useAuth } from '../hooks/useAuth';

const Collaborateurs = () => {
  const { user } = useAuth();
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    poste: '',
    service: '',
    contrat: 'CDI',
    date_embauche: '',
    salaire: '',
    status: 'Actif',
  });

  useEffect(() => {
    if (!user) return;
    fetchCollaborateurs();
  }, [user]);

  const fetchCollaborateurs = async () => {
    const token = getTokenFromCookie();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/collaborateurs`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error?.message || data?.error || (res.status === 403 ? 'Accès réservé RH' : 'Erreur chargement collaborateurs');
        throw new Error(msg);
      }
      setCollaborateurs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      nom: '',
      prenom: '',
      poste: '',
      service: '',
      contrat: 'CDI',
      date_embauche: '',
      salaire: '',
      status: 'Actif',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getTokenFromCookie();
    if (!token) return;

    setSaving(true);
    setError('');

    const payload = {
      ...form,
      salaire: form.salaire === '' ? null : Number(form.salaire),
    };

    try {
      const url = editingId ? `/api/collaborateurs/${editingId}` : '/api/collaborateurs';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error?.message || data?.error || 'Erreur enregistrement';
        throw new Error(msg);
      }
      resetForm();
      await fetchCollaborateurs();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toDateInputValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value.slice(0, 10);
    return '';
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setError('');
    setForm({
      nom: c.nom || '',
      prenom: c.prenom || '',
      poste: c.poste || '',
      service: c.service || '',
      contrat: c.contrat || 'CDI',
      date_embauche: toDateInputValue(c.date_embauche),
      salaire: c.salaire ?? '',
      status: c.status || 'Actif',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ?')) return;
    const token = getTokenFromCookie();
    if (!token) return;

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/collaborateurs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error?.message || data?.error || 'Erreur suppression';
        throw new Error(msg);
      }
      await fetchCollaborateurs();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
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

  if (!user) return <div>Chargement...</div>;
  if (user?.role && user.role !== 'RH') {
    return <div className="p-6 max-w-7xl mx-auto">Accès réservé au rôle RH.</div>;
  }
  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Collaborateurs</h1>
          <p className="text-slate-600">Gestion et exports.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={exporting || saving}
            onClick={() => downloadFile('/api/exports/collaborateurs.xlsx', 'collaborateurs.xlsx')}
            className="bg-slate-900 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {exporting ? 'Export...' : 'Exporter Excel'}
          </button>
          <button
            type="button"
            disabled={exporting || saving}
            onClick={() => downloadFile('/api/exports/collaborateurs.pdf', 'collaborateurs.pdf')}
            className="bg-slate-900 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {exporting ? 'Export...' : 'Exporter PDF'}
          </button>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border p-2 rounded" placeholder="Nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Prénom" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Poste" value={form.poste} onChange={e => setForm({ ...form, poste: e.target.value })} required />

          <input className="border p-2 rounded" placeholder="Service" value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} required />
          <select className="border p-2 rounded" value={form.contrat} onChange={e => setForm({ ...form, contrat: e.target.value })}>
            <option value="CDI">CDI</option>
            <option value="CDD">CDD</option>
            <option value="Alternance">Alternance</option>
            <option value="Stage">Stage</option>
            <option value="Freelance">Freelance</option>
          </select>
          <select className="border p-2 rounded" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="Actif">Actif</option>
            <option value="Suspendu">Suspendu</option>
          </select>

          <input type="date" className="border p-2 rounded" value={form.date_embauche} onChange={e => setForm({ ...form, date_embauche: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Salaire €" value={form.salaire} onChange={e => setForm({ ...form, salaire: e.target.value })} required />
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
      <table className="w-full bg-white border">
        <thead>
          <tr>
            <th className="text-left p-2 border-b">Nom</th>
            <th className="text-left p-2 border-b">Prénom</th>
            <th className="text-left p-2 border-b">Poste</th>
            <th className="text-left p-2 border-b">Service</th>
            <th className="text-left p-2 border-b">Contrat</th>
            <th className="text-left p-2 border-b">Date</th>
            <th className="text-left p-2 border-b">Statut</th>
            <th className="text-left p-2 border-b">Salaire</th>
            <th className="text-left p-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {collaborateurs.map((c) => (
            <tr key={c.id}>
              <td className="p-2 border-b">{c.nom}</td>
              <td className="p-2 border-b">{c.prenom}</td>
              <td className="p-2 border-b">{c.poste}</td>
              <td className="p-2 border-b">{c.service}</td>
              <td className="p-2 border-b">{c.contrat}</td>
              <td className="p-2 border-b">{toDateInputValue(c.date_embauche)}</td>
              <td className="p-2 border-b">{c.status}</td>
              <td className="p-2 border-b">{c.salaire}€</td>
              <td className="p-2 border-b">
                <button disabled={saving} onClick={() => handleEdit(c)} className="bg-yellow-600 text-white px-2 py-1 mr-2 rounded disabled:opacity-50">
                  Edit
                </button>
                <button disabled={saving} onClick={() => handleDelete(c.id)} className="bg-red-600 text-white px-2 py-1 rounded disabled:opacity-50">
                  Suppr
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Collaborateurs;

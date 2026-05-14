import { useEffect, useMemo, useState } from 'react';
import { getTokenFromCookie, useAuth } from '../hooks/useAuth';

const TYPES = ['Congés payés', 'RTT', 'Maladie', 'Sans solde'];
const STATUTS = ['', 'En attente', 'Approuvé', 'Refusé'];
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const toDateInputValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return '';
};

const formatDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('fr-FR');
};

const statusBadgeClass = (statut) => {
  if (statut === 'Approuvé') return 'bg-green-50 text-green-700 border-green-200';
  if (statut === 'Refusé') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-yellow-50 text-yellow-800 border-yellow-200';
};

const Conges = () => {
  const { user } = useAuth();
  const role = user?.role || 'Collaborateur';
  const token = getTokenFromCookie();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const [form, setForm] = useState({
    type: 'Congés payés',
    date_debut: '',
    date_fin: '',
    motif: '',
  });

  const canDecide = role === 'RH' || role === 'Manager';

  const downloadFile = async (path, filename) => {
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

  const fetchConges = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const qs = filterStatut ? `?statut=${encodeURIComponent(filterStatut)}` : '';
      const res = await fetch(`${BACKEND_URL}/api/conges${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || 'Erreur chargement congés';
        throw new Error(msg);
      }
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      fetchConges();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filterStatut]);

  const stats = useMemo(() => {
    const base = { total: items.length, attente: 0, approuve: 0, refuse: 0 };
    for (const it of items) {
      if (it.statut === 'En attente') base.attente += 1;
      if (it.statut === 'Approuvé') base.approuve += 1;
      if (it.statut === 'Refusé') base.refuse += 1;
    }
    return base;
  }, [items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/conges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: form.type,
          date_debut: form.date_debut,
          date_fin: form.date_fin,
          motif: form.motif || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || 'Erreur création demande';
        throw new Error(msg);
      }
      setForm({ type: 'Congés payés', date_debut: '', date_fin: '', motif: '' });
      await fetchConges();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const decide = async (id, decision) => {
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/conges/${id}/decision`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || 'Erreur décision';
        throw new Error(msg);
      }
      await fetchConges();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!token) return;
    if (!window.confirm('Supprimer cette demande ?')) return;

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/conges/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error || 'Erreur suppression';
        throw new Error(msg);
      }
      await fetchConges();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <div>Chargement...</div>;
  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Congés</h1>
          <p className="text-slate-600">
            {canDecide ? 'Validation des demandes (RH/Manager).' : 'Vos demandes de congés.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canDecide && (
            <>
              <button
                type="button"
                disabled={exporting || saving}
                onClick={() => downloadFile(`${BACKEND_URL}/api/exports/conges.xlsx`, 'conges.xlsx')}
                className="bg-slate-900 text-white px-3 py-2 rounded-xl text-sm disabled:opacity-50"
              >
                {exporting ? 'Export...' : 'Excel'}
              </button>
              <button
                type="button"
                disabled={exporting || saving}
                onClick={() => downloadFile(`${BACKEND_URL}/api/exports/conges.pdf`, 'conges.pdf')}
                className="bg-slate-900 text-white px-3 py-2 rounded-xl text-sm disabled:opacity-50"
              >
                {exporting ? 'Export...' : 'PDF'}
              </button>
            </>
          )}
          <label className="text-sm text-slate-600">Filtre statut</label>
          <select className="border border-slate-200 rounded-xl px-3 py-2 bg-white" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
            {STATUTS.map(s => <option key={s || 'all'} value={s}>{s || 'Tous'}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3">
          <div className="text-xs text-slate-500">Total</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3">
          <div className="text-xs text-slate-500">En attente</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.attente}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3">
          <div className="text-xs text-slate-500">Approuvés</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.approuve}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3">
          <div className="text-xs text-slate-500">Refusés</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.refuse}</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Nouvelle demande</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select className="border p-2 rounded" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="date" className="border p-2 rounded" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} required />
          <input type="date" className="border p-2 rounded" value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} required />
          <input className="border p-2 rounded md:col-span-4" placeholder="Motif (optionnel)" value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} />
        </div>
        <div className="mt-4">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
            {saving ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr className="text-left text-sm text-slate-600">
              <th scope="col" className="p-3 border-b">Type</th>
              <th scope="col" className="p-3 border-b">Début</th>
              <th scope="col" className="p-3 border-b">Fin</th>
              <th scope="col" className="p-3 border-b">Statut</th>
              <th scope="col" className="p-3 border-b">Traité le</th>
              <th scope="col" className="p-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="text-sm text-slate-800">
                <td className="p-3 border-b">{it.type}</td>
                <td className="p-3 border-b">{toDateInputValue(it.date_debut)}</td>
                <td className="p-3 border-b">{toDateInputValue(it.date_fin)}</td>
                <td className="p-3 border-b">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${statusBadgeClass(it.statut)}`}>
                    {it.statut}
                  </span>
                </td>
                <td className="p-3 border-b text-slate-600">
                  {it.validated_at ? formatDateTime(it.validated_at) : '—'}
                </td>
                <td className="p-3 border-b">
                  {canDecide && it.statut === 'En attente' && (
                    <>
                      <button disabled={saving} onClick={() => decide(it.id, 'Approuvé')} className="bg-green-600 text-white px-2 py-1 mr-2 rounded disabled:opacity-50">
                        Approuver
                      </button>
                      <button disabled={saving} onClick={() => decide(it.id, 'Refusé')} className="bg-red-600 text-white px-2 py-1 mr-2 rounded disabled:opacity-50">
                        Refuser
                      </button>
                    </>
                  )}
                  {(canDecide || it.statut === 'En attente') && (
                    <button disabled={saving} onClick={() => remove(it.id)} className="bg-slate-200 text-slate-900 px-2 py-1 rounded disabled:opacity-50">
                      Suppr
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td className="p-3 text-slate-500" colSpan={6}>Aucune demande.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Conges;


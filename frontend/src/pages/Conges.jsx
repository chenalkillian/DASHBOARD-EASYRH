import { useEffect, useMemo, useState } from 'react';
import { Inbox } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../utils/api';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import { useNavigate } from 'react-router-dom';

const TYPES = ['Congés payés', 'RTT', 'Maladie', 'Sans solde'];
const STATUTS = ['', 'En attente', 'Approuvé', 'Refusé'];
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

const formatDemandeur = (it) => {
  const parts = [it.demandeur_prenom, it.demandeur_nom].filter(Boolean);
  const unique = [...new Set(parts)];
  const label = unique.join(' ').trim();
  if (label) return label;
  if (it.demandeur_email) return it.demandeur_email;
  return 'Non renseigné';
};

const statusBadgeClass = (statut) => {
  if (statut === 'Approuvé') return 'bg-green-50 text-green-700 border-green-200';
  if (statut === 'Refusé') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-yellow-50 text-yellow-800 border-yellow-200';
};

const Conges = () => {
  const { user } = useAuth();
  
  const role = user?.role || 'Collaborateur';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [exportingFormat, setExportingFormat] = useState(null);
const navigate = useNavigate();

useEffect(() => {
  if (user?.hasAccount === false) {

    navigate('/compte-en-attente', { replace: true });

  }
}, [user, navigate]);

if (user?.hasAccount === false) return null;

  const [form, setForm] = useState({
    type: 'Congés payés',
    date_debut: '',
    date_fin: '',
    motif: '',
  });

  const canViewAll = role === 'RH' || role === 'Manager';
  const canApprove = role === 'RH';
  const canRequestLeave = role === 'Collaborateur';

const downloadFile = async (path, filename, format) => {
  setExportingFormat(format);
  setError('');
  try {
    const res = await apiFetch(path);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data?.error?.message || data?.error || 'Erreur export';
      throw new Error(msg);
    }
    const blob = await res.blob();
    if (blob.size === 0) throw new Error('Le fichier exporté est vide');

    const disposition = res.headers.get('Content-Disposition');
    const match = disposition?.match(/filename="?([^"]+)"?/);
    const finalFilename = match?.[1] || filename;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    setError(e.message);
  } finally {
    setExportingFormat(null);
  }
};

  const fetchConges = async () => {
    setLoading(true);
    setError('');
    try {
      const qs = filterStatut ? `?statut=${encodeURIComponent(filterStatut)}` : '';
      const res = await apiFetch(`/api/conges${qs}`);
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

    setSaving(true);
    setError('');
    try {
      const res = await apiFetch('/api/conges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`/api/conges/${id}/decision`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
    if (!window.confirm('Supprimer cette demande ?')) return;

    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`/api/conges/${id}`, {
        method: 'DELETE',
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

  const renderActions = (it) => (
    <div className="flex flex-wrap gap-2">
      {canApprove && it.statut === 'En attente' && (
        <>
          <button
            type="button"
            disabled={saving}
            onClick={() => decide(it.id, 'Approuvé')}
            className="btn-success"
          >
            Approuver
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => decide(it.id, 'Refusé')}
            className="btn-danger"
          >
            Refuser
          </button>
        </>
      )}
      {(canApprove || (canRequestLeave && it.statut === 'En attente')) && (
        <button
          type="button"
          disabled={saving}
          onClick={() => remove(it.id)}
          className="btn-secondary"
        >
          Supprimer
        </button>
      )}
    </div>
  );

  if (!user) return <LoadingState label="Chargement de la session…" />;
  if (loading) return <LoadingState label="Chargement des congés…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Congés"
        description={
          canViewAll
            ? role === 'Manager'
              ? 'Consultation de toutes les demandes — la validation est réservée au RH.'
              : 'Validation des demandes des collaborateurs — la création de demande est réservée aux collaborateurs.'
            : 'Vos demandes de congés.'
        }
        actions={
          <>
            {canViewAll && (
              <>
                            <button
              type="button"
              disabled={exportingFormat !== null || saving}
              onClick={() => downloadFile('/api/exports/Conges.xlsx', 'conges.xlsx', 'xlsx')}
              className="btn-secondary"
            >
              {exportingFormat === 'xlsx' ? 'Export…' : 'Excel'}
            </button>
            <button
              type="button"
              disabled={exportingFormat !== null || saving}
              onClick={() => downloadFile('/api/exports/Conges.pdf', 'conges.pdf', 'pdf')}
              className="btn-secondary"
            >
              {exportingFormat === 'pdf' ? 'Export…' : 'PDF'}
            </button>
              </>
            )}
            <label className="label-field mb-0" htmlFor="filter-statut">
              Statut
            </label>
            <select
              id="filter-statut"
              className="input-field w-auto min-w-[10rem]"
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
            >
              {STATUTS.map((s) => (
                <option key={s || 'all'} value={s}>
                  {s || 'Tous'}
                </option>
              ))}
            </select>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Total', stats.total],
          ['En attente', stats.attente],
          ['Approuvés', stats.approuve],
          ['Refusés', stats.refuse],
        ].map(([label, value]) => (
          <div key={label} className="card-panel py-3">
            <div className="text-xs font-medium text-slate-500">{label}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      {canViewAll && !canRequestLeave && (
        <div
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
          role="status"
        >
          En tant que <strong>{role}</strong>, vous traitez les demandes des collaborateurs. Pour
          poser vos propres congés, utilisez un compte au rôle Collaborateur.
        </div>
      )}

      {canRequestLeave && (
        <form onSubmit={handleSubmit} className="card-panel">
          <h2 className="section-title mb-4">Nouvelle demande</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label-field" htmlFor="conge-type">
                Type
              </label>
              <select
                id="conge-type"
                className="input-field"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field" htmlFor="conge-debut">
                Date de début
              </label>
              <input
                id="conge-debut"
                type="date"
                className="input-field"
                value={form.date_debut}
                onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label-field" htmlFor="conge-fin">
                Date de fin
              </label>
              <input
                id="conge-fin"
                type="date"
                className="input-field"
                value={form.date_fin}
                onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-4">
              <label className="label-field" htmlFor="conge-motif">
                Motif (optionnel)
              </label>
              <input
                id="conge-motif"
                className="input-field"
                placeholder="Précision éventuelle"
                value={form.motif}
                onChange={(e) => setForm({ ...form, motif: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Envoi…' : 'Envoyer la demande'}
            </button>
          </div>
        </form>
      )}

      <div className="card-panel p-0 overflow-hidden">
        {!items.length ? (
          <EmptyState
            icon={Inbox}
            title="Aucune demande de congé"
            description={
              filterStatut
                ? `Aucun résultat pour le statut « ${filterStatut} ».`
                : 'Les demandes apparaîtront ici une fois créées.'
            }
          />
        ) : (
          <>
            <div className="md:hidden divide-y divide-slate-100 p-2">
              {items.map((it) => (
                <article key={it.id} className="p-4 space-y-2">
                  {canViewAll && (
                    <p className="text-sm font-semibold text-slate-900">
                      Demandeur : <span className="font-medium">{formatDemandeur(it)}</span>
                    </p>
                  )}
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-800">{it.type}</span>
                    {' · '}
                    {toDateInputValue(it.date_debut)} → {toDateInputValue(it.date_fin)}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${statusBadgeClass(it.statut)}`}
                  >
                    {it.statut}
                  </span>
                  {it.validated_at && (
                    <p className="text-xs text-slate-500">
                      Traité le {formatDateTime(it.validated_at)}
                    </p>
                  )}
                  {renderActions(it)}
                </article>
              ))}
            </div>

            <div className="desktop-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {canViewAll && <th scope="col">Demandeur</th>}
                    <th scope="col">Type</th>
                    <th scope="col">Début</th>
                    <th scope="col">Fin</th>
                    <th scope="col">Statut</th>
                    <th scope="col">Traité le</th>
                   {canViewAll && <th scope="col">Actions</th> }
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      {canViewAll && (
                        <td className="font-medium">{formatDemandeur(it)}</td>
                      )}
                      <td>{it.type}</td>
                      <td>{toDateInputValue(it.date_debut)}</td>
                      <td>{toDateInputValue(it.date_fin)}</td>
                      <td>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${statusBadgeClass(it.statut)}`}
                        >
                          {it.statut}
                        </span>
                      </td>
                      <td className="text-slate-600">
                        {it.validated_at ? formatDateTime(it.validated_at) : '—'}
                      </td>
                      <td>{renderActions(it)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Conges;

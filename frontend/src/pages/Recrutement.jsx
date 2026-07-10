import { useEffect, useMemo, useRef, useState } from 'react';
import { Briefcase, Inbox } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../utils/api';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';

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

const display = (value) => {
  if (value == null || String(value).trim() === '') return '—';
  return String(value);
};

const statutBadgeClass = (statut) => {
  const map = {
    Nouveau: 'bg-slate-100 text-slate-700 border-slate-200',
    'En cours': 'bg-blue-50 text-blue-800 border-blue-200',
    Entretien: 'bg-violet-50 text-violet-800 border-violet-200',
    Offre: 'bg-amber-50 text-amber-900 border-amber-200',
    Rejeté: 'bg-red-50 text-red-800 border-red-200',
    Embauché: 'bg-green-50 text-green-800 border-green-200',
  };
  return map[statut] || 'bg-slate-50 text-slate-700 border-slate-200';
};

const Recrutement = () => {
  const { user } = useAuth();
  const role = user?.role || 'Collaborateur';
  const formRef = useRef(null);
  const [exportingFormat, setExportingFormat] = useState(null);

  const [candidats, setCandidats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [filterStatut, setFilterStatut] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const canAccess = role === 'RH';

  const stats = useMemo(() => {
    const counts = STATUTS.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
    for (const c of candidats) {
      const s = c.statut || 'Nouveau';
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [candidats]);

  const fetchCandidats = async () => {
    setLoading(true);
    setError('');

    try {
      const qs = filterStatut ? `?statut=${encodeURIComponent(filterStatut)}` : '';
      const res = await apiFetch(`/api/recrutement${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data?.error ||
          (res.status === 403 ? 'Accès réservé RH/Manager' : 'Erreur chargement candidats');
        throw new Error(msg);
      }
      setCandidats(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (!user || !canAccess) return;
    const timer = setTimeout(() => {
      fetchCandidats();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, canAccess, filterStatut]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      const path = editingId ? `/api/recrutement/${editingId}` : '/api/recrutement';
      const method = editingId ? 'PUT' : 'POST';

      const res = await apiFetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce candidat ?')) return;

    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`/api/recrutement/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error || 'Erreur suppression';
        throw new Error(msg);
      }
      if (editingId === id) resetForm();
      await fetchCandidats();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <LoadingState label="Chargement de la session…" />;
  if (!canAccess) {
    return (
      <div className="card-panel">
        <p className="text-slate-700">Accès réservé au rôle RH.</p>
      </div>
    );
  }
  if (loading) return <LoadingState label="Chargement du recrutement…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recrutement"
        description="Suivi des candidats, statuts et pipeline."
        actions={
          <>
                  <button
          type="button"
          disabled={exportingFormat !== null || saving}
          onClick={() => downloadFile('/api/exports/recrutement.xlsx', 'recrutement.xlsx', 'xlsx')}
          className="btn-secondary"
        >
          {exportingFormat === 'xlsx' ? 'Export…' : 'Excel'}
        </button>
        <button
          type="button"
          disabled={exportingFormat !== null || saving}
          onClick={() => downloadFile('/api/exports/recrutement.pdf', 'recrutement.pdf', 'pdf')}
          className="btn-secondary"
        >
          {exportingFormat === 'pdf' ? 'Export…' : 'PDF'}
        </button>
            <select
              className="input-field w-auto min-w-[10rem]"
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              aria-label="Filtrer par statut"
            >
              <option value="">Tous les statuts</option>
              {STATUTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUTS.map((s) => (
          <div key={s} className="card-panel py-3">
            <div className="text-xs font-medium text-slate-500">{s}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats[s] || 0}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      <form
        ref={formRef}
        id="recrutement-form"
        onSubmit={handleSubmit}
        className={`card-panel transition-shadow ${editingId ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
      >
        <h2 className="section-title mb-1">
          {editingId ? 'Modifier le candidat' : 'Nouveau candidat'}
        </h2>
        {editingId && (
          <p className="text-sm text-blue-700 mb-4">
            Modification en cours — mettez à jour le statut, les notes ou les coordonnées puis
            enregistrez.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label-field" htmlFor="cand-nom">
              Nom
            </label>
            <input
              id="cand-nom"
              className="input-field"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label-field" htmlFor="cand-prenom">
              Prénom
            </label>
            <input
              id="cand-prenom"
              className="input-field"
              value={form.prenom}
              onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label-field" htmlFor="cand-poste">
              Poste visé
            </label>
            <input
              id="cand-poste"
              className="input-field"
              value={form.poste}
              onChange={(e) => setForm({ ...form, poste: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label-field" htmlFor="cand-email">
              Email
            </label>
            <input
              id="cand-email"
              type="email"
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field" htmlFor="cand-tel">
              Téléphone
            </label>
            <input
              id="cand-tel"
              className="input-field"
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field" htmlFor="cand-source">
              Source
            </label>
            <input
              id="cand-source"
              className="input-field"
              placeholder="LinkedIn, cooptation…"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field" htmlFor="cand-statut">
              Statut
            </label>
            <select
              id="cand-statut"
              className="input-field"
              value={form.statut}
              onChange={(e) => setForm({ ...form, statut: e.target.value })}
            >
              {STATUTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field" htmlFor="cand-date">
              Date de candidature
            </label>
            <input
              id="cand-date"
              type="date"
              className="input-field"
              value={form.date_candidature}
              onChange={(e) => setForm({ ...form, date_candidature: e.target.value })}
            />
          </div>
          <div className="md:col-span-3">
            <label className="label-field" htmlFor="cand-notes">
              Notes
            </label>
            <input
              id="cand-notes"
              className="input-field"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Enregistrement…' : editingId ? 'Enregistrer les modifications' : 'Ajouter'}
          </button>
          {editingId && (
            <button type="button" disabled={saving} onClick={resetForm} className="btn-secondary">
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="card-panel p-0 overflow-hidden">
        {!candidats.length ? (
          <EmptyState
            icon={Briefcase}
            title="Aucun candidat"
            description="Ajoutez un candidat via le formulaire ci-dessus ou modifiez le filtre de statut."
          />
        ) : (
          <>
            <div className="md:hidden divide-y divide-slate-100">
              {candidats.map((c) => (
                <article key={c.id} className="p-4 space-y-2 text-sm">
                  <p className="font-semibold text-slate-900 text-base">
                    {c.prenom} {c.nom}
                  </p>
                  <p className="text-slate-600">{display(c.poste)}</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${statutBadgeClass(c.statut)}`}
                  >
                    {display(c.statut)}
                  </span>
                  <dl className="grid grid-cols-1 gap-1 text-slate-600">
                    <div>
                      <dt className="text-xs text-slate-400">Email</dt>
                      <dd>{display(c.email)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Téléphone</dt>
                      <dd>{display(c.telephone)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Source</dt>
                      <dd>{display(c.source)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Date candidature</dt>
                      <dd>{toDateInputValue(c.date_candidature) || '—'}</dd>
                    </div>
                    {c.notes && (
                      <div>
                        <dt className="text-xs text-slate-400">Notes</dt>
                        <dd className="text-slate-800">{c.notes}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleEdit(c)}
                      className="btn-warning"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleDelete(c.id)}
                      className="btn-danger"
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="desktop-table-wrap overflow-x-auto">
              <table className="data-table min-w-[1080px]">
                <thead>
                  <tr>
                    <th scope="col">Nom</th>
                    <th scope="col">Prénom</th>
                    <th scope="col">Poste</th>
                    <th scope="col">Statut</th>
                    <th scope="col">Email</th>
                    <th scope="col">Téléphone</th>
                    <th scope="col">Source</th>
                    <th scope="col">Date cand.</th>
                    <th scope="col">Notes</th>
                    <th scope="col" className="sticky right-0 bg-slate-50/95">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {candidats.map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium">{display(c.nom)}</td>
                      <td>{display(c.prenom)}</td>
                      <td>{display(c.poste)}</td>
                      <td>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap ${statutBadgeClass(c.statut)}`}
                        >
                          {display(c.statut)}
                        </span>
                      </td>
                      <td className="max-w-[180px] truncate" title={c.email || ''}>
                        {display(c.email)}
                      </td>
                      <td className="whitespace-nowrap">{display(c.telephone)}</td>
                      <td>{display(c.source)}</td>
                      <td className="whitespace-nowrap">
                        {toDateInputValue(c.date_candidature) || '—'}
                      </td>
                      <td className="max-w-[200px] truncate text-slate-600" title={c.notes || ''}>
                        {display(c.notes)}
                      </td>
                      <td className="sticky right-0 bg-white">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleEdit(c)}
                            className="btn-warning"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleDelete(c.id)}
                            className="btn-danger"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
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

export default Recrutement;

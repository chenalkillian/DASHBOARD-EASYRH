import { useState, useEffect, useCallback, useRef } from 'react';
import { Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../utils/api';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';

const Collaborateurs = () => {
  const { user } = useAuth();
  const formRef = useRef(null);
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
    role: 'Collaborateur',
    email: '',
    password: '',
  });
  const ROLES = ['RH', 'Manager', 'Collaborateur'];


  const fetchCollaborateurs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/collaborateurs');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data?.error?.message ||
          data?.error ||
          (res.status === 403 ? 'Accès réservé RH' : 'Erreur chargement collaborateurs');
        throw new Error(msg);
      }
      setCollaborateurs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      fetchCollaborateurs();
    }, 0);
    return () => clearTimeout(timer);
  }, [user, fetchCollaborateurs]);

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
      role: 'Collaborateur',
      email: '',
      password: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError('');
    const { role, email, password, ...rest } = form;
    const payload = {
      ...rest,
      salaire: form.salaire === '' ? null : Number(form.salaire),
    };

    if (editingId && user?.role === 'RH') {
      payload.role = role;
    } else if (!editingId) {
      payload.email = email;
      payload.password = password;
    }

    try {
      const path = editingId ? `/api/collaborateurs/${editingId}` : '/api/collaborateurs';
      const method = editingId ? 'PUT' : 'POST';
      const res = await apiFetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
      role: c.role || 'Collaborateur',

    });
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce collaborateur ?')) return;

    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`/api/collaborateurs/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error?.message || data?.error || 'Erreur suppression';
        throw new Error(msg);
      }
      if (editingId === id) resetForm();
      await fetchCollaborateurs();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const downloadFile = async (path, filename) => {
    setExporting(true);
    setError('');
    try {
      const res = await apiFetch(path);
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

  if (!user) return <LoadingState label="Chargement de la session…" />;
  if (user?.role && user.role !== 'RH') {
    return (
      <div className="card-panel">
        <p className="text-slate-700">Accès réservé au rôle RH.</p>
      </div>
    );
  }
  if (loading) return <LoadingState label="Chargement des collaborateurs…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collaborateurs"
        description="Gestion des fiches et exports."
        actions={
          <>
            <button
              type="button"
              disabled={exporting || saving}
              onClick={() => downloadFile('/api/exports/collaborateurs.xlsx', 'collaborateurs.xlsx')}
              className="btn-secondary"
            >
              {exporting ? 'Export…' : 'Excel'}
            </button>
            <button
              type="button"
              disabled={exporting || saving}
              onClick={() => downloadFile('/api/exports/collaborateurs.pdf', 'collaborateurs.pdf')}
              className="btn-secondary"
            >
              {exporting ? 'Export…' : 'PDF'}
            </button>
          </>
        }
      />

      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`card-panel transition-shadow ${editingId ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
      >
        <h2 className="section-title mb-4">
          {editingId ? 'Modifier le collaborateur' : 'Nouveau collaborateur'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label-field" htmlFor="collab-nom">
              Nom
            </label>
            <input
              id="collab-nom"
              className="input-field"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label-field" htmlFor="collab-prenom">
              Prénom
            </label>
            <input
              id="collab-prenom"
              className="input-field"
              value={form.prenom}
              onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label-field" htmlFor="collab-poste">
              Poste
            </label>
            <input
              id="collab-poste"
              className="input-field"
              value={form.poste}
              onChange={(e) => setForm({ ...form, poste: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label-field" htmlFor="collab-service">
              Service
            </label>
            <input
              id="collab-service"
              className="input-field"
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
              required
            />
          </div>
          {!editingId && (
            <>
              <div>
                <label className="label-field" htmlFor="collab-email">
                  Email (compte de connexion)
                </label>
                <input
                  id="collab-email"
                  type="email"
                  className="input-field"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="label-field" htmlFor="collab-password">
                  Mot de passe temporaire
                </label>
                <input
                  id="collab-password"
                  type="password"
                  className="input-field"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </>
          )}
          {editingId && user?.role === 'RH' && (
  <div>
    <label className="label-field" htmlFor="collab-role">
      Rôle applicatif
    </label>
    <select
      id="collab-role"
      className="input-field"
      value={form.role}
      onChange={(e) => setForm({ ...form, role: e.target.value })}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  </div>
)}
          <div>
            <label className="label-field" htmlFor="collab-contrat">
              Contrat
            </label>
            <select
              id="collab-contrat"
              className="input-field"
              value={form.contrat}
              onChange={(e) => setForm({ ...form, contrat: e.target.value })}
            >
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Alternance">Alternance</option>
              <option value="Stage">Stage</option>
            </select>
          </div>
          <div>
            <label className="label-field" htmlFor="collab-status">
              Statut
            </label>
            <select
              id="collab-status"
              className="input-field"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Actif">Actif</option>
              <option value="Suspendu">Suspendu</option>
            </select>
          </div>
          <div>
            <label className="label-field" htmlFor="collab-date">
              Date d&apos;embauche
            </label>
            <input
              id="collab-date"
              type="date"
              className="input-field"
              value={form.date_embauche}
              onChange={(e) => setForm({ ...form, date_embauche: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label-field" htmlFor="collab-salaire">
              Salaire (€)
            </label>
            <input
              id="collab-salaire"
              type="number"
              className="input-field"
              value={form.salaire}
              onChange={(e) => setForm({ ...form, salaire: e.target.value })}
              required
            />
          </div>
          
          
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Ajouter'}
          </button>
          {editingId && (
            <button type="button" disabled={saving} onClick={resetForm} className="btn-secondary">
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="card-panel p-0 overflow-hidden">
        {!collaborateurs.length ? (
          <EmptyState
            icon={Users}
            title="Aucun collaborateur"
            description="Ajoutez une fiche via le formulaire ci-dessus."
          />
        ) : (
          <>
            <div className="md:hidden divide-y divide-slate-100">
              {collaborateurs.map((c) => (
                <article key={c.id} className="p-4 space-y-2">
                  <p className="font-semibold text-slate-900">
                    {c.prenom} {c.nom}
                  </p>
                  <p className="text-sm text-slate-600">
                    {c.poste} · {c.service} · {c.contrat}
                  </p>
                  <p className="text-sm text-slate-500">
                    {toDateInputValue(c.date_embauche)} · {c.status} · {c.salaire} €
                  </p>
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

            <div className="desktop-table-wrap">
              <table className="data-table min-w-[720px]">
                <thead>
                  <tr>
                    <th scope="col">Nom</th>
                    <th scope="col">Prénom</th>
                    <th scope="col">Poste</th>
                    <th scope="col">Service</th>
                    <th scope="col">Contrat</th>
                    <th scope="col">Date</th>
                    <th scope="col">Statut</th>
                    <th scope="col">Salaire</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collaborateurs.map((c) => (
                    <tr key={c.id}>
                      <td>{c.nom}</td>
                      <td>{c.prenom}</td>
                      <td>{c.poste}</td>
                      <td>{c.service}</td>
                      <td>{c.contrat}</td>
                      <td>{toDateInputValue(c.date_embauche)}</td>
                      <td>{c.status}</td>
                      <td>{c.salaire} €</td>
                      <td>
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

export default Collaborateurs;

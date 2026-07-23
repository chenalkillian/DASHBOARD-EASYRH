import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../utils/api';
import PageHeader from '../components/ui/PageHeader';

const DEFAULT_TEMPLATE = [
  { titre: 'Préparer le contrat', categorie: 'RH' },
  { titre: 'Créer les accès IT', categorie: 'IT' },
  { titre: 'Préparer le poste de travail', categorie: 'Logistique' },
  { titre: 'Planifier le point de bienvenue', categorie: 'Manager' },
];

const Onboarding = () => {
  const { user } = useAuth();

  const [collaborateurs, setCollaborateurs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingCollab, setLoadingCollab] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newTaskTitre, setNewTaskTitre] = useState('');

  const canAccess = user?.role === 'RH' || user?.role === 'Manager';

  const selectedCollaborateur = useMemo(
    () => collaborateurs.find((c) => c.id === selectedId) || null,
    [collaborateurs, selectedId],
  );

  const fetchTasks = useCallback(async (collabId) => {
    if (!collabId) return;
    setLoadingTasks(true);
    setError('');
    try {
      const res = await apiFetch(`/api/onboarding/${collabId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || 'Erreur chargement checklist';
        throw new Error(msg);
      }
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  const fetchCollaborateurs = useCallback(async () => {
    setLoadingCollab(true);
    setError('');
    try {
      const res = await apiFetch('/api/collaborateurs');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error?.message || data?.error || 'Erreur chargement collaborateurs';
        throw new Error(msg);
      }
      setCollaborateurs(Array.isArray(data) ? data : []);
      if (!selectedId && data?.length) {
        setSelectedId(data[0].id);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingCollab(false);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!user || !canAccess) return;

    const timer = setTimeout(() => {
      fetchCollaborateurs();
    }, 0);

    return () => clearTimeout(timer);
  }, [user, canAccess, fetchCollaborateurs]);

  useEffect(() => {
    if (!selectedId) return undefined;

    const timer = setTimeout(() => {
      fetchTasks(selectedId);
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedId, fetchTasks]);



  const handleCreateFromTemplate = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError('');
    try {
      if (tasks.length > 0) return;

      for (let i = 0; i < DEFAULT_TEMPLATE.length; i += 1) {
        const t = DEFAULT_TEMPLATE[i];
        await apiFetch(`/api/onboarding/${selectedId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titre: t.titre,
            categorie: t.categorie,
            termine: false,
            ordre: i + 1,
          }),
        });
      }
      await fetchTasks(selectedId);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitre.trim() || !selectedId) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`/api/onboarding/${selectedId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: newTaskTitre.trim(),
          categorie: 'Personnalisé',
          termine: false,
          ordre: tasks.length + 1,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || 'Erreur ajout tâche';
        throw new Error(msg);
      }
      setNewTaskTitre('');
      await fetchTasks(selectedId);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (task) => {
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`/api/onboarding/task/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termine: !task.termine }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || 'Erreur mise à jour tâche';
        throw new Error(msg);
      }
      await fetchTasks(selectedId);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Supprimer cette tâche ?')) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`/api/onboarding/task/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error || 'Erreur suppression tâche';
        throw new Error(msg);
      }
      await fetchTasks(selectedId);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <div>Chargement...</div>;
  if (!canAccess) return <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">Accès réservé RH/Manager.</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding"
        description="Checklists d'arrivée pour vos nouveaux collaborateurs."
      />

      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card-panel">
          <h2 className="section-title mb-3">Collaborateurs</h2>
          {loadingCollab ? (
            <div className="text-sm text-slate-500">Chargement...</div>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {collaborateurs.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm ${
                      c.id === selectedId ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <div className="font-medium">{c.nom} {c.prenom}</div>
                    <div className="text-xs text-slate-500">{c.poste} • {c.service}</div>
                  </button>
                </li>
              ))}
              {!collaborateurs.length && <li className="text-sm text-slate-500">Aucun collaborateur.</li>}
            </ul>
          )}
        </div>

        <div className="card-panel lg:col-span-2">
          {selectedCollaborateur ? (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="section-title truncate">
                    Checklist • {selectedCollaborateur.nom} {selectedCollaborateur.prenom}
                  </h2>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    {selectedCollaborateur.poste} • {selectedCollaborateur.service}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={saving || loadingTasks || tasks.length > 0}
                  onClick={handleCreateFromTemplate}
                  className="btn-primary shrink-0 self-start"
                >
                  Générer depuis template
                </button>
              </div>

              {loadingTasks ? (
                <div className="text-sm text-slate-500">Chargement de la checklist...</div>
              ) : (
                <>
                  <ul className="mb-4 space-y-2">
                    {tasks.map((t) => (
                      <li
                        key={t.id}
                        className="flex flex-col gap-2 rounded-xl bg-slate-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-2"
                      >
                        <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-sm sm:items-center">
                          <input
                            type="checkbox"
                            checked={!!t.termine}
                            onChange={() => toggleDone(t)}
                            disabled={saving}
                            className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 sm:mt-0"
                          />
                          <span className="min-w-0 flex-1">
                            <span className={t.termine ? 'line-through text-slate-400' : ''}>{t.titre}</span>
                            {t.categorie && (
                              <span className="ml-2 inline-block whitespace-nowrap rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                                {t.categorie}
                              </span>
                            )}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => deleteTask(t.id)}
                          disabled={saving}
                          className="btn-danger self-end px-3 py-2 text-xs sm:self-auto"
                        >
                          Supprimer
                        </button>
                      </li>
                    ))}
                    {!tasks.length && (
                      <li className="text-sm text-slate-500">
                        Aucune tâche. Utilisez le template ou ajoutez une tâche.
                      </li>
                    )}
                  </ul>

                  <form onSubmit={handleAddTask} className="flex flex-col gap-2 sm:flex-row">
                    <input
                      className="input-field flex-1"
                      placeholder="Ajouter une tâche personnalisée"
                      value={newTaskTitre}
                      onChange={(e) => setNewTaskTitre(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={saving || !newTaskTitre.trim()}
                      className="btn-secondary sm:shrink-0"
                    >
                      Ajouter
                    </button>
                  </form>
                </>
              )}
            </>
          ) : (
            <div className="text-sm text-slate-500">
              Sélectionnez un collaborateur pour gérer son onboarding.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;


import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../utils/api';

const DEFAULT_TEMPLATE = [
  { titre: 'Préparer le contrat', categorie: 'RH' },
  { titre: 'Créer les accès IT', categorie: 'IT' },
  { titre: 'Préparer le poste de travail', categorie: 'Logistique' },
  { titre: 'Planifier le point de bienvenue', categorie: 'Manager' },
];
const Onboarding = () => {
  const { user } = useAuth();
  const role = user?.role || 'Collaborateur';

  const [collaborateurs, setCollaborateurs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingCollab, setLoadingCollab] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newTaskTitre, setNewTaskTitre] = useState('');

  const canAccess = role === 'RH' || role === 'Manager';

  const selectedCollaborateur = useMemo(
    () => collaborateurs.find((c) => c.id === selectedId) || null,
    [collaborateurs, selectedId],
  );


  const fetchCollaborateurs = async () => {
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
  };

  const fetchTasks = async (collabId) => {
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
  };

  useEffect(() => {
    if (!user || !canAccess) return;
    const timer = setTimeout(() => {
      fetchCollaborateurs();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, canAccess]);

  useEffect(() => {
    if (selectedId) {
      const timer = setTimeout(() => {
        fetchTasks(selectedId);
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const handleCreateFromTemplate = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError('');
    try {
      // créer toutes les tâches template si la checklist est vide
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Onboarding</h1>
          <p className="text-slate-600">Checklists d’arrivée pour vos nouveaux collaborateurs.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Collaborateurs</h2>
          {loadingCollab ? (
            <div>Chargement...</div>
          ) : (
            <ul className="space-y-1 max-h-80 overflow-y-auto">
              {collaborateurs.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm ${
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 lg:col-span-2">
          {selectedCollaborateur ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Checklist • {selectedCollaborateur.nom} {selectedCollaborateur.prenom}
                  </h2>
                  <p className="text-xs text-slate-500">{selectedCollaborateur.poste} • {selectedCollaborateur.service}</p>
                </div>
                <button
                  type="button"
                  disabled={saving || loadingTasks || tasks.length > 0}
                  onClick={handleCreateFromTemplate}
                  className="text-sm bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50"
                >
                  Générer depuis template
                </button>
              </div>

              {loadingTasks ? (
                <div>Chargement de la checklist...</div>
              ) : (
                <>
                  <ul className="space-y-2 mb-4">
                    {tasks.map((t) => (
                      <li key={t.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!t.termine}
                            onChange={() => toggleDone(t)}
                            disabled={saving}
                          />
                          <span className={t.termine ? 'line-through text-slate-400' : ''}>{t.titre}</span>
                          {t.categorie && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              {t.categorie}
                            </span>
                          )}
                        </label>
                        <button
                          type="button"
                          onClick={() => deleteTask(t.id)}
                          disabled={saving}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          Suppr
                        </button>
                      </li>
                    ))}
                    {!tasks.length && <li className="text-sm text-slate-500">Aucune tâche. Utilisez le template ou ajoutez une tâche.</li>}
                  </ul>

                  <form onSubmit={handleAddTask} className="flex gap-2">
                    <input
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                      placeholder="Ajouter une tâche personnalisée"
                      value={newTaskTitre}
                      onChange={(e) => setNewTaskTitre(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={saving || !newTaskTitre.trim()}
                      className="bg-slate-900 text-white px-3 py-2 rounded-xl text-sm disabled:opacity-50"
                    >
                      Ajouter
                    </button>
                  </form>
                </>
              )}
            </>
          ) : (
            <div className="text-sm text-slate-500">Sélectionnez un collaborateur pour gérer son onboarding.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;


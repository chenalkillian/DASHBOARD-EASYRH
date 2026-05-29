// Page de paramètres prévue pour une future version — route /parametres retirée de App.jsx ; fichier conservé pour réintégration ultérieure.
import { useAuth } from '../hooks/useAuth';

const Parametres = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Paramètres</h1>
      <p className="text-slate-600">
        Page à venir. Connecté en tant que <span className="font-medium">{user?.email}</span>.
      </p>
    </div>
  );
};

export default Parametres;

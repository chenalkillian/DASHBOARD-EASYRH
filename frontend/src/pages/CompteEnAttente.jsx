import { Clock3 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
const CompteEnAttente = () => {
const { user, logout } = useAuth();


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center space-y-6">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Clock3 className="h-8 w-8" aria-hidden />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Compte en attente de validation
          </h1>
          <p className="text-gray-500">
            Votre compte a bien été créé, mais il doit être validé par le service RH avant
            que vous puissiez accéder à l'application. Vous recevrez un accès une fois
            votre fiche collaborateur créée.
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-all"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

export default CompteEnAttente;
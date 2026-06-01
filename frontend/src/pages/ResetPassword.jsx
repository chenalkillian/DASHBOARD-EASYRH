import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabase';
import { formatAuthError } from '../utils/formatAuthError';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Si le lien de recovery est valide, Supabase peut établir une session automatiquement.
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data?.session);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (password !== password2) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(formatAuthError(error.message ?? ''));
      return;
    }

    setInfo('Mot de passe mis à jour. Vous pouvez vous reconnecter.');
    // Nettoyer session Supabase côté client (le backend gère l’app ensuite)
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouveau mot de passe</h1>
          <p className="text-gray-500">Finaliser la réinitialisation</p>
        </div>

        {!ready && (
          <div
            role="alert"
            aria-live="polite"
            className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-3 rounded-lg"
          >
            Lien invalide ou expiré. Recommence via{' '}
            <Link to="/forgot-password" className="underline font-medium">
              mot de passe oublié
            </Link>
            .
          </div>
        )}

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg"
          >
            {error}
          </div>
        )}
        {info && (
          <div
            role="status"
            aria-live="polite"
            className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg"
          >
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <label htmlFor="reset-password" className="sr-only">
              Nouveau mot de passe
            </label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nouveau mot de passe"
              autoComplete="new-password"
              required
              disabled={!ready || loading}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <label htmlFor="reset-password2" className="sr-only">
              Confirmer le mot de passe
            </label>
            <input
              id="reset-password2"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirmer"
              autoComplete="new-password"
              required
              disabled={!ready || loading}
            />
          </div>

          <button
            type="submit"
            disabled={!ready || loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            <span>{loading ? 'Mise à jour...' : 'Mettre à jour'}</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Retour connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;


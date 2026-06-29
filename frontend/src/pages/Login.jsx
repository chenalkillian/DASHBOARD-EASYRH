import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowRight, Mail, Lock } from 'lucide-react';
import { formatAuthError } from '../utils/formatAuthError';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const result = await login(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setErrorMessage(formatAuthError(result.error ?? ''));
    }

    setLoading(false);
  };

  return (
    <div className="min-h-dvh overflow-y-auto bg-gradient-to-br from-blue-500 to-purple-600 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-full max-w-md items-center justify-center">
        <div className="w-full space-y-6 rounded-2xl bg-white p-6 shadow-2xl sm:space-y-8 sm:p-8">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-4xl">Dashboard RH</h1>
            <p className="text-sm text-gray-500 sm:text-base">Connectez-vous pour accéder</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6" aria-busy={loading}>
            {errorMessage && (
              <div role="alert" aria-live="polite" className="alert-error">
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="label-field">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10 text-base"
                  placeholder="rh@entreprise.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="label-field">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 text-base"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Connexion...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <Link to="/forgot-password" className="min-h-11 font-medium text-blue-600 hover:underline">
              Mot de passe oublié ?
            </Link>
            <Link to="/register" className="min-h-11 font-medium text-blue-600 hover:underline sm:text-right">
              Créer un compte
            </Link>
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default Login;

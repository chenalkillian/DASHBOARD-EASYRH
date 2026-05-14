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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard RH</h1>
          <p className="text-gray-500">Connectez-vous pour accéder</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" aria-busy={loading}>
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg"
            >
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="rh@entreprise.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-blue-600 hover:underline font-medium">
            Mot de passe oublié ?
          </Link>
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Créer un compte
          </Link>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Test: <br />
            Email: killian.test+rh@outlook.com <br />
            MDP: Test1234!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Collaborateurs from './pages/Collaborateurs';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Recrutement from './pages/Recrutement';
import Onboarding from './pages/Onboarding';
import Conges from './pages/Conges';
import CompteEnAttente from './pages/CompteEnAttente';
function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;

return (
  <Router>
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
      <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to="/" />} />
      <Route
        path="/"
        element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />}
      />
      <Route
        path="/collaborateurs"
        element={user ? <Layout><Collaborateurs /></Layout> : <Navigate to="/login" />}
      />
      <Route
        path="/recrutement"
        element={user ? <Layout><Recrutement /></Layout> : <Navigate to="/login" />}
      />
      <Route
        path="/onboarding"
        element={user ? <Layout><Onboarding /></Layout> : <Navigate to="/login" />}
      />
      <Route
        path="/conges"
        element={user ? <Layout><Conges /></Layout> : <Navigate to="/login" />}
      />
      <Route path="/compte-en-attente" element={user ? <CompteEnAttente /> : <Navigate to="/login" />} />
    </Routes>
  </Router>
);
}

export default App;

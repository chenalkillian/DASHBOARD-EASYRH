import { useAuth } from '../hooks/useAuth';
import { Briefcase, Calendar, ClipboardList, LogOut, Users, BarChart3, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const role = user?.role || 'Collaborateur';

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Dashboard RH</h1>
              <p className="text-xs text-white/80">{role}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex space-x-1 text-white/80">
              <NavLink
                to="/"
                end
                className="p-2 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                aria-label="Aller au dashboard"
                title="Dashboard"
              >
                <BarChart3 className="h-5 w-5" />
              </NavLink>
              {(role === 'RH' || role === 'Manager') && (
                <NavLink
                  to="/recrutement"
                  className="p-2 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                  aria-label="Aller au module recrutement"
                  title="Recrutement"
                >
                  <Briefcase className="h-5 w-5" />
                </NavLink>
              )}
              {(role === 'RH' || role === 'Manager') && (
                <NavLink
                  to="/onboarding"
                  className="p-2 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                  aria-label="Aller au module onboarding"
                  title="Onboarding"
                >
                  <ClipboardList className="h-5 w-5" />
                </NavLink>
              )}
              <NavLink
                to="/conges"
                className="p-2 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                aria-label="Aller au module congés"
                title="Congés"
              >
                <Calendar className="h-5 w-5" />
              </NavLink>
              {role === 'RH' && (
                <NavLink
                  to="/collaborateurs"
                  className="p-2 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                  aria-label="Aller à la gestion des collaborateurs"
                  title="Collaborateurs"
                >
                  <Users className="h-5 w-5" />
                </NavLink>
              )}
              <NavLink
                to="/parametres"
                className="p-2 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                aria-label="Aller aux paramètres"
                title="Paramètres"
              >
                <Settings className="h-5 w-5" />
              </NavLink>
            </div>

            <button
              onClick={logout}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-white font-medium transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import { useCallback, useEffect, useId, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Briefcase,
  Calendar,
  ClipboardList,
  LogOut,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const iconNavClass = 'p-2 hover:text-white hover:bg-white/20 rounded-lg transition-all';

const Navbar = () => {
  const { user, logout } = useAuth();
  const role = user?.role || 'Collaborateur';
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileNavId = useId();

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeMobile();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen, closeMobile]);

  const mobileLinkClass = ({ isActive }) =>
    [
      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
      isActive ? 'bg-white text-blue-700 shadow' : 'text-white hover:bg-white/15',
    ].join(' ');

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg" aria-label="Barre principale">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex justify-between items-center gap-2 py-3 sm:py-4 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-white truncate">Dashboard RH</h1>
              <p className="text-xs text-white/90 truncate">{role}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2.5 rounded-xl text-white bg-white/15 hover:bg-white/25 border border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
              aria-expanded={mobileOpen}
              aria-controls={mobileNavId}
              aria-label={mobileOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
            </button>

            <div className="hidden md:flex space-x-1 text-white/80">
              <NavLink
                to="/"
                end
                className={iconNavClass}
                aria-label="Aller au dashboard"
                title="Dashboard"
              >
                <BarChart3 className="h-5 w-5" aria-hidden />
              </NavLink>
              {(role === 'RH' || role === 'Manager') && (
                <NavLink
                  to="/recrutement"
                  className={iconNavClass}
                  aria-label="Aller au module recrutement"
                  title="Recrutement"
                >
                  <Briefcase className="h-5 w-5" aria-hidden />
                </NavLink>
              )}
              {(role === 'RH' || role === 'Manager') && (
                <NavLink
                  to="/onboarding"
                  className={iconNavClass}
                  aria-label="Aller au module onboarding"
                  title="Onboarding"
                >
                  <ClipboardList className="h-5 w-5" aria-hidden />
                </NavLink>
              )}
              <NavLink
                to="/conges"
                className={iconNavClass}
                aria-label="Aller au module congés"
                title="Congés"
              >
                <Calendar className="h-5 w-5" aria-hidden />
              </NavLink>
              {role === 'RH' && (
                <NavLink
                  to="/collaborateurs"
                  className={iconNavClass}
                  aria-label="Aller à la gestion des collaborateurs"
                  title="Collaborateurs"
                >
                  <Users className="h-5 w-5" aria-hidden />
                </NavLink>
              )}
              <NavLink
                to="/parametres"
                className={iconNavClass}
                aria-label="Aller aux paramètres"
                title="Paramètres"
              >
                <Settings className="h-5 w-5" aria-hidden />
              </NavLink>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 sm:gap-2 bg-white/20 hover:bg-white/30 px-3 sm:px-4 py-2 rounded-xl text-white text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-xs sm:text-sm whitespace-nowrap">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 w-full h-full border-0 cursor-default"
            aria-label="Fermer le menu (cliquer hors du panneau)"
            onClick={closeMobile}
          />
          <div
            id={mobileNavId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navigation"
            className="absolute top-0 right-0 bottom-0 w-[min(100vw,18rem)] max-w-[100vw] bg-gradient-to-b from-blue-700 to-purple-900 shadow-2xl flex flex-col border-l border-white/10 overflow-y-auto"
          >
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <span className="text-sm font-semibold text-white">Navigation</span>
              <button
                type="button"
                className="p-2 rounded-lg text-white hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Fermer le menu"
                onClick={closeMobile}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav className="flex flex-col p-2 gap-1" aria-label="Menu principal">
              <NavLink to="/" end className={mobileLinkClass} onClick={closeMobile}>
                <BarChart3 className="h-5 w-5 shrink-0" aria-hidden />
                Dashboard
              </NavLink>
              {(role === 'RH' || role === 'Manager') && (
                <NavLink to="/recrutement" className={mobileLinkClass} onClick={closeMobile}>
                  <Briefcase className="h-5 w-5 shrink-0" aria-hidden />
                  Recrutement
                </NavLink>
              )}
              {(role === 'RH' || role === 'Manager') && (
                <NavLink to="/onboarding" className={mobileLinkClass} onClick={closeMobile}>
                  <ClipboardList className="h-5 w-5 shrink-0" aria-hidden />
                  Onboarding
                </NavLink>
              )}
              <NavLink to="/conges" className={mobileLinkClass} onClick={closeMobile}>
                <Calendar className="h-5 w-5 shrink-0" aria-hidden />
                Congés
              </NavLink>
              {role === 'RH' && (
                <NavLink to="/collaborateurs" className={mobileLinkClass} onClick={closeMobile}>
                  <Users className="h-5 w-5 shrink-0" aria-hidden />
                  Collaborateurs
                </NavLink>
              )}
              <NavLink to="/parametres" className={mobileLinkClass} onClick={closeMobile}>
                <Settings className="h-5 w-5 shrink-0" aria-hidden />
                Paramètres
              </NavLink>
            </nav>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

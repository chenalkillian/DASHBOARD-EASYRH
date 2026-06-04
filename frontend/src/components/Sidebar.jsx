import { NavLink } from 'react-router-dom';
import { BarChart3, Briefcase, Calendar, ClipboardList, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navLinkClass = ({ isActive }) =>
  [
    'flex items-center gap-3 px-3 py-2 rounded-xl transition-all',
    isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100',
  ].join(' ');

const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role || 'Collaborateur';

  return (
    <aside className="hidden md:block w-64 shrink-0">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sticky top-6">
        <div className="mb-4">
          <div className="text-sm font-semibold text-slate-900">{user?.email || 'Utilisateur'}</div>
          <div className="text-xs text-slate-500">{role}</div>
        </div>

        <nav className="space-y-1">
          <NavLink to="/" className={navLinkClass} end>
            <BarChart3 className="h-5 w-5" />
            <span>Dashboard</span>
          </NavLink>

          {role === 'RH' && (
            <NavLink to="/recrutement" className={navLinkClass}>
              <Briefcase className="h-5 w-5" />
              <span>Recrutement</span>
            </NavLink>
          )}

          {(role === 'RH' || role === 'Manager') && (
            <NavLink to="/onboarding" className={navLinkClass}>
              <ClipboardList className="h-5 w-5" />
              <span>Onboarding</span>
            </NavLink>
          )}

          <NavLink to="/conges" className={navLinkClass}>
            <Calendar className="h-5 w-5" />
            <span>Congés</span>
          </NavLink>

          {(role === 'RH' || role === 'Manager') && (
            <NavLink to="/collaborateurs" className={navLinkClass}>
              <Users className="h-5 w-5" />
              <span>Collaborateurs</span>
            </NavLink>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;

import { useState, useEffect } from 'react';
import { getTokenFromCookie, useAuth } from '../hooks/useAuth';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

const formatDaysAsDuration = (days) => {
  if (!Number.isFinite(days) || days <= 0) return '—';
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years > 0) return months > 0 ? `${years}a ${months}m` : `${years}a`;
  return `${months || 1}m`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, services: {}, contrats: {}, anciennete: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      const token = getTokenFromCookie();
      if (!token) alert('No token');

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      setError('');

      fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            const msg = data?.error || (res.status === 403 ? 'Accès réservé RH/Manager' : 'Erreur chargement KPI');
            throw new Error(msg);
          }
          return data;
        })
        .then(setStats)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const servicesEntries = Object.entries(stats.services || {}).sort((a, b) => (b[1] || 0) - (a[1] || 0));
  const contratsEntries = Object.entries(stats.contrats || {}).sort((a, b) => (b[1] || 0) - (a[1] || 0));

  const dataTotal = {
    labels: ['Total Collaborateurs'],
    datasets: [{ label: 'Nombre', data: [stats.total], backgroundColor: '#3B82F6' }],
  };
  const dataServices = {
    labels: servicesEntries.map(([k]) => k),
    datasets: [{ label: 'Par Service', data: servicesEntries.map(([, v]) => v), backgroundColor: '#10B981' }],
  };
  const dataContrats = {
    labels: contratsEntries.map(([k]) => k),
    datasets: [{ label: 'Par Contrat', data: contratsEntries.map(([, v]) => v), backgroundColor: '#F59E0B' }],
  };
  const dataAnciennete = {
    labels: stats.anciennete.map(a => `${a.range}`),
    datasets: [{ label: 'Ancienneté', data: stats.anciennete.map(a => a.count), borderColor: '#8B5CF6', tension: 0.4 }],
  };

  const options = { responsive: true, plugins: { legend: { position: 'top' } } };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard RH</h1>
          <p className="text-slate-600">Vue d’ensemble des indicateurs collaborateurs.</p>
        </div>
        <div className="text-sm text-slate-500">
          {user?.role ? `Rôle: ${user.role}` : null}
        </div>
      </div>

      {loading && <div className="text-slate-700">Chargement des KPI...</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Total collaborateurs</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{stats.total ?? 0}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Actifs</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{stats.status?.actif ?? 0}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Suspendus</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{stats.status?.suspendu ?? 0}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Ancienneté moyenne</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">
            {formatDaysAsDuration(stats.ancienneteMoyenne)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Total</h2>
          <Bar data={dataTotal} options={options} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Services</h2>
          <Doughnut data={dataServices} options={options} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Contrats</h2>
          <Bar data={dataContrats} options={options} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Ancienneté</h2>
          <Line data={dataAnciennete} options={options} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

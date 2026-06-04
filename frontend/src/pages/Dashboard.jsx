import { useState, useEffect, useMemo } from 'react';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../utils/api';
import {
  filterDashboardStatsForManager,
  getUserService,
} from '../utils/roleUi';
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
  Filler,
} from 'chart.js';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import {
  buildColorArray,
  doughnutOptions,
  horizontalBarOptions,
  verticalBarOptions,
  lineAreaOptions,
} from '../utils/chartTheme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

ChartJS.defaults.color = '#64748b';
ChartJS.defaults.borderColor = 'rgba(148, 163, 184, 0.25)';
ChartJS.defaults.font.family =
  'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';

const formatDaysAsDuration = (days) => {
  if (!Number.isFinite(days) || days <= 0) return '—';
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years > 0) return months > 0 ? `${years} an${years > 1 ? 's' : ''} ${months} mois` : `${years} an${years > 1 ? 's' : ''}`;
  return `${months || 1} mois`;
};

const ChartCard = ({ title, subtitle, children, className = '' }) => (
  <div className={`card-panel flex flex-col ${className}`}>
    <div className="mb-4">
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    <div className="relative flex-1 min-h-[260px]">{children}</div>
  </div>
);

const KpiCard = ({ label, value, accent, children }) => (
  <div className="card-panel flex items-start gap-4 border-l-4" style={{ borderLeftColor: accent }}>
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
      style={{ backgroundColor: `${accent}18`, color: accent }}
    >
      {children}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-3xl font-bold tracking-tight text-slate-900 mt-0.5">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role || 'Collaborateur';
  const managerService = getUserService(user);
  const [stats, setStats] = useState({
    total: 0,
    services: {},
    contrats: {},
    anciennete: [],
    status: { actif: 0, suspendu: 0 },
    ancienneteMoyenne: 0,
  });
  const [displayStats, setDisplayStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await apiFetch('/api/dashboard/stats');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            data?.error ||
            (res.status === 403 ? 'Accès réservé RH/Manager' : 'Erreur chargement KPI');
          throw new Error(msg);
        }
        if (cancelled) return;
        setStats(data);

        if (role === 'Manager' && managerService) {
          const collabRes = await apiFetch('/api/collaborateurs');
          const collabs = await collabRes.json().catch(() => []);
          if (cancelled) return;
          if (collabRes.ok && Array.isArray(collabs)) {
            const inService = collabs.filter((c) => c.service === managerService);
            setDisplayStats(filterDashboardStatsForManager(data, managerService, inService));
          } else {
            setDisplayStats(filterDashboardStatsForManager(data, managerService));
          }
        } else {
          setDisplayStats(data);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, role, managerService]);

  const view = displayStats ?? stats;

  const servicesEntries = useMemo(
    () => Object.entries(view.services || {}).sort((a, b) => (b[1] || 0) - (a[1] || 0)),
    [view.services],
  );
  const contratsEntries = useMemo(
    () => Object.entries(view.contrats || {}).sort((a, b) => (b[1] || 0) - (a[1] || 0)),
    [view.contrats],
  );

  const effectifsData = useMemo(
    () => ({
      labels: ['Actifs', 'Suspendus'],
      datasets: [
        {
          data: [view.status?.actif ?? 0, view.status?.suspendu ?? 0],
          backgroundColor: ['#10B981', '#F59E0B'],
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    }),
    [view.status],
  );

  const servicesData = useMemo(() => {
    const colors = buildColorArray(servicesEntries.length);
    return {
      labels: servicesEntries.map(([k]) => k),
      datasets: [
        {
          label: 'Collaborateurs',
          data: servicesEntries.map(([, v]) => v),
          backgroundColor: colors,
          borderRadius: 6,
          barThickness: 18,
        },
      ],
    };
  }, [servicesEntries]);

  const contratsData = useMemo(() => {
    const colors = buildColorArray(contratsEntries.length);
    return {
      labels: contratsEntries.map(([k]) => k),
      datasets: [
        {
          label: 'Effectif',
          data: contratsEntries.map(([, v]) => v),
          backgroundColor: colors.map((c) => `${c}CC`),
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    };
  }, [contratsEntries]);

  const ancienneteData = useMemo(() => {
    const counts = (view.anciennete || []).map((a) => a.count);
    return {
      labels: (view.anciennete || []).map((a) => a.range),
      datasets: [
        {
          label: 'Collaborateurs',
          data: counts,
          borderColor: '#7C3AED',
          backgroundColor: 'rgba(124, 58, 237, 0.15)',
          pointBackgroundColor: '#7C3AED',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.35,
        },
      ],
    };
  }, [view.anciennete]);

  const tauxActifs = useMemo(() => {
    const total = view.total || 0;
    const actifs = view.status?.actif ?? 0;
    if (!total) return 0;
    return Math.round((actifs / total) * 100);
  }, [view]);

  if (loading) return <LoadingState label="Chargement des indicateurs RH…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={role === 'Manager' ? 'Tableau de bord Manager' : 'Tableau de bord RH'}
        description={
          role === 'Manager' && managerService
            ? `Indicateurs limités au service ${managerService}.`
            : 'Pilotage des effectifs, répartitions et ancienneté — vue administrative.'
        }
        actions={
          user?.role ? (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800 border border-blue-100">
              {user.role}
            </span>
          ) : null
        }
      />

      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Effectif total" value={view.total ?? 0} accent="#2563EB">
          <Users className="h-6 w-6" aria-hidden />
        </KpiCard>
        <KpiCard label="Collaborateurs actifs" value={view.status?.actif ?? 0} accent="#10B981">
          <UserCheck className="h-6 w-6" aria-hidden />
        </KpiCard>
        <KpiCard label="Comptes suspendus" value={view.status?.suspendu ?? 0} accent="#F59E0B">
          <UserX className="h-6 w-6" aria-hidden />
        </KpiCard>
        <KpiCard
          label="Ancienneté moyenne"
          value={formatDaysAsDuration(view.ancienneteMoyenne)}
          accent="#7C3AED"
        >
          <Clock className="h-6 w-6" aria-hidden />
        </KpiCard>
      </div>

      <p className="text-sm text-slate-600 -mt-2">
        Taux d&apos;activité : <strong className="text-slate-900">{tauxActifs}%</strong> des
        fiches collaborateurs sont actives.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Statut des effectifs"
          subtitle="Répartition actifs / suspendus sur l'ensemble des fiches"
        >
          {view.total > 0 ? (
            <Doughnut data={effectifsData} options={doughnutOptions} />
          ) : (
            <p className="text-sm text-slate-500 flex items-center justify-center h-full">
              Aucune donnée collaborateur.
            </p>
          )}
        </ChartCard>

        <ChartCard
          title="Répartition par service"
          subtitle="Collaborateurs actifs par direction / service"
        >
          {servicesEntries.length > 0 ? (
            <Bar data={servicesData} options={horizontalBarOptions} />
          ) : (
            <p className="text-sm text-slate-500 flex items-center justify-center h-full">
              Aucun service renseigné.
            </p>
          )}
        </ChartCard>

        <ChartCard title="Types de contrat" subtitle="CDI, CDD, alternance, stage… (actifs)">
          {contratsEntries.length > 0 ? (
            <Bar data={contratsData} options={verticalBarOptions} />
          ) : (
            <p className="text-sm text-slate-500 flex items-center justify-center h-full">
              Aucun contrat renseigné.
            </p>
          )}
        </ChartCard>

        <ChartCard
          title="Pyramide d'ancienneté"
          subtitle="Tranches d'ancienneté des collaborateurs actifs"
        >
          {(view.anciennete || []).some((a) => a.count > 0) ? (
            <Line data={ancienneteData} options={lineAreaOptions} />
          ) : (
            <p className="text-sm text-slate-500 flex items-center justify-center h-full">
              Dates d&apos;embauche insuffisantes pour calculer l&apos;ancienneté.
            </p>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;

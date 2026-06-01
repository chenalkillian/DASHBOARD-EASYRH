/** Palette alignée Dashboard RH (bleu / violet / slate). */
export const CHART_PALETTE = [
  '#2563EB',
  '#7C3AED',
  '#10B981',
  '#F59E0B',
  '#06B6D4',
  '#EC4899',
  '#6366F1',
  '#14B8A6',
  '#F97316',
  '#64748B',
];

export const buildColorArray = (length) =>
  Array.from({ length }, (_, i) => CHART_PALETTE[i % CHART_PALETTE.length]);

const percentLabel = (context) => {
  const value = context.raw ?? 0;
  const data = context.dataset?.data ?? [];
  const total = data.reduce((sum, n) => sum + Number(n), 0);
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return ` ${context.label}: ${value} (${pct}%)`;
};

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 14,
        usePointStyle: true,
        pointStyle: 'circle',
        font: { size: 12 },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      titleFont: { size: 13, weight: '600' },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 8,
    },
  },
};

export const doughnutOptions = {
  ...baseChartOptions,
  cutout: '62%',
  plugins: {
    ...baseChartOptions.plugins,
    tooltip: {
      ...baseChartOptions.plugins.tooltip,
      callbacks: { label: percentLabel },
    },
  },
};

export const horizontalBarOptions = {
  ...baseChartOptions,
  indexAxis: 'y',
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.2)' },
      ticks: { precision: 0, font: { size: 11 } },
    },
    y: {
      grid: { display: false },
      ticks: { font: { size: 11 } },
    },
  },
  plugins: {
    ...baseChartOptions.plugins,
    legend: { display: false },
  },
};

export const verticalBarOptions = {
  ...baseChartOptions,
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.2)' },
      ticks: { precision: 0, font: { size: 11 } },
    },
  },
  plugins: {
    ...baseChartOptions.plugins,
    legend: { display: false },
  },
};

export const lineAreaOptions = {
  ...baseChartOptions,
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.2)' },
      ticks: { precision: 0, font: { size: 11 } },
    },
  },
  plugins: {
    ...baseChartOptions.plugins,
    legend: { display: false },
  },
  interaction: { intersect: false, mode: 'index' },
};

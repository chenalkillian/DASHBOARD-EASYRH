const LoadingState = ({ label = 'Chargement…' }) => (
  <div className="space-y-4 animate-pulse" role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">{label}</span>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-20 rounded-2xl bg-slate-200/80" />
      ))}
    </div>
    <div className="h-40 rounded-2xl bg-slate-200/80" />
    <div className="h-64 rounded-2xl bg-slate-200/80" />
  </div>
);

export default LoadingState;

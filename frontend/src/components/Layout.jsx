import Navbar from './Navbar';
import Sidebar from './Sidebar';

// Layout global de l'application connecté (navbar + sidebar + zone de contenu).
// J'essaie ici de garder un rendu sobre mais moderne, avec une carte centrale légèrement "glassmorphism".
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <div className="rounded-3xl border border-slate-200/80 bg-white/80 shadow-xl shadow-slate-200/80 backdrop-blur-sm p-6 transition-all">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;

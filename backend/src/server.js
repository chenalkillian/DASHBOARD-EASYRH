const app = require('./app');

// 1) Export pour Vercel (mode serverless)
module.exports = app;

// 2) Lancement en local uniquement
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  });
}
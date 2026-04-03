// App Express principale de l'API backend
// Je centralise ici la config sécurité (CORS, helmet, rate limiting) et le montage des routes.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const app = express();

// import des routes métiers
const collaborateurRoutes = require('./routes/collaborateurRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const recrutementRoutes = require('./routes/recrutementRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const congesRoutes = require('./routes/congesRoutes');
const exportsRoutes = require('./routes/exportsRoutes');

// Configuration CORS : en dev j'ouvre sur tout, en prod je pourrai restreindre sur le domaine du front.
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

// Sécurisation des en-têtes HTTP de base (OWASP)
app.use(helmet());

// Protection simple contre les floods sur les routes publiques (notamment login)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP sur la fenêtre
  standardHeaders: true,
  legacyHeaders: false,
});

// Parsing JSON avec limite de taille pour éviter les payloads trop gros
app.use(express.json({ limit: '1mb' }));


// initialisation des routes définies
// Health check pour vérifier que le serveur fonctionne (utilisé aussi par la CI)
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// route d'authentification, protégée par un rate limiting pour limiter les attaques par force brute
app.use('/api/auth', authLimiter, authRoutes);

// route collaborateurs (RH uniquement, voir middleware d'auth)
app.use('/api/collaborateurs', collaborateurRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/recrutement', recrutementRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/conges', congesRoutes);
app.use('/api/exports', exportsRoutes);

module.exports = app;

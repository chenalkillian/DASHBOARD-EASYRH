/** Tests onboarding : liste des tâches par collaborateur (RH/Manager). */
const request = require('supertest');

jest.mock('../src/middleware/authMiddleware', () => ({
  authenticate: (req, _res, next) => {
    req.user = { id: 'u-m', role: req.header('x-test-role') || 'Collaborateur' };
    next();
  },
  authorize: (...allowed) => (req, res, next) => {
    if (!req.user?.role || !allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    next();
  },
    requireAccount: (req, res, next) => {
    if (req.user?.role === 'RH') return next();

    if (!req.user?.hasAccount) {
      return res.status(403).json({
        error: 'compte_en_attente',
        message: 'Votre compte est en attente de validation par le service RH.',
      });
    }

    next();
  },
}));

jest.mock('../src/db/supabaseClient', () => ({
  from: jest.fn(),
}));

describe('Onboarding - GET /api/onboarding/:collaborateurId', () => {
  it('403 pour Collaborateur', async () => {
    const app = require('../src/app');
    const res = await request(app).get('/api/onboarding/c-1').set('x-test-role', 'Collaborateur');
    expect(res.status).toBe(403);
  });

  it('200 avec liste de tâches pour RH', async () => {
    const supabase = require('../src/db/supabaseClient');
    const tasks = [{ id: 1, titre: 'Badge', ordre: 1 }];
    const order = jest.fn().mockResolvedValueOnce({ data: tasks, error: null });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    supabase.from.mockReturnValueOnce({ select });

    const app = require('../src/app');
    const res = await request(app).get('/api/onboarding/c-42').set('x-test-role', 'RH');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ titre: 'Badge' });
    expect(eq).toHaveBeenCalledWith('collaborateur_id', 'c-42');
  });
});

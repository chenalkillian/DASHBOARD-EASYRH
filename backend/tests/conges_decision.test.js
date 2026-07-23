/** Tests décision congés : accès RH/Manager + réponse API. */
const request = require('supertest');

jest.mock('../src/middleware/authMiddleware', () => ({
  authenticate: (req, _res, next) => {
    // rôle piloté par un header pour simplifier les tests
    req.user = { id: 'u-test', role: req.header('x-test-role') || 'Collaborateur' };
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
  authorize: (...allowed) => (req, res, next) => {
    if (!req.user?.role || !allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès interdit' });
    }
    next();
  },
}));

jest.mock('../src/db/supabaseClient', () => ({
  from: jest.fn(),
}));

describe('Congés - PUT /api/conges/:id/decision', () => {
  it('refuse (403) pour un Collaborateur', async () => {
    const app = require('../src/app');
    const res = await request(app)
      .put('/api/conges/123/decision')
      .set('x-test-role', 'Collaborateur')
      .send({ decision: 'Approuvé' });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  it('accepte (200) pour RH et renvoie la demande mise à jour', async () => {
    const supabase = require('../src/db/supabaseClient');

    const maybeSingle = jest.fn().mockResolvedValueOnce({
      data: { id: 123, statut: 'Approuvé' },
      error: null,
    });
    const select = jest.fn(() => ({ maybeSingle }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));

    supabase.from.mockReturnValueOnce({ update });

    const app = require('../src/app');
    const res = await request(app)
      .put('/api/conges/123/decision')
      .set('x-test-role', 'RH')
      .send({ decision: 'Approuvé' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 123);
    expect(res.body).toHaveProperty('statut', 'Approuvé');
  });
});


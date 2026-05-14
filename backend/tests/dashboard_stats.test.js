/** Tests stats dashboard : droits RH/Manager + forme du JSON renvoyé. */
const request = require('supertest');

jest.mock('../src/middleware/authMiddleware', () => ({
  authenticate: (req, _res, next) => {
    req.user = { id: 'u-test', role: req.header('x-test-role') || 'Collaborateur' };
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

describe('Dashboard - GET /api/dashboard/stats', () => {
  it('refuse (403) pour un Collaborateur', async () => {
    const app = require('../src/app');
    const res = await request(app).get('/api/dashboard/stats').set('x-test-role', 'Collaborateur');
    expect(res.status).toBe(403);
  });

  it('renvoie 200 et des KPI cohérents pour RH', async () => {
    const supabase = require('../src/db/supabaseClient');

    // total collaborateurs (count)
    const totalSelect = jest.fn().mockResolvedValueOnce({ count: 10, error: null });
    // suspendus (count)
    const suspenduEq = jest.fn().mockResolvedValueOnce({ count: 2, error: null });
    const suspenduSelect = jest.fn(() => ({ eq: suspenduEq }));
    // actifs (data)
    const actifsNot = jest.fn().mockResolvedValueOnce({
      data: [
        { service: 'IT', contrat: 'CDI', date_embauche: '2024-01-01', status: 'Actif' },
        { service: 'IT', contrat: 'CDD', date_embauche: '2025-01-01', status: 'Actif' },
        { service: 'RH', contrat: 'CDI', date_embauche: '2020-01-01', status: 'Actif' },
      ],
      error: null,
    });
    const actifsSelect = jest.fn(() => ({ not: actifsNot }));

    supabase.from
      .mockReturnValueOnce({ select: totalSelect })
      .mockReturnValueOnce({ select: suspenduSelect })
      .mockReturnValueOnce({ select: actifsSelect });

    const app = require('../src/app');
    const res = await request(app).get('/api/dashboard/stats').set('x-test-role', 'RH');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total', 10);
    expect(res.body).toHaveProperty('services');
    expect(res.body.services).toHaveProperty('IT', 2);
    expect(res.body.services).toHaveProperty('RH', 1);
    expect(res.body).toHaveProperty('contrats');
    expect(res.body.contrats).toHaveProperty('CDI', 2);
    expect(res.body.contrats).toHaveProperty('CDD', 1);
    expect(res.body).toHaveProperty('anciennete');
    expect(Array.isArray(res.body.anciennete)).toBe(true);
    expect(res.body).toHaveProperty('ancienneteMoyenne');
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toHaveProperty('actif', 3);
    expect(res.body.status).toHaveProperty('suspendu', 2);
  });
});


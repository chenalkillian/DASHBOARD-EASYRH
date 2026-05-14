/** Tests exports : droits sur XLSX collaborateurs + en-têtes de réponse. */
const request = require('supertest');

jest.mock('../src/middleware/authMiddleware', () => ({
  authenticate: (req, _res, next) => {
    req.user = { id: 'u1', role: req.header('x-test-role') || 'Collaborateur' };
    next();
  },
  authorize: (...allowed) => (req, res, next) => {
    if (!req.user?.role || !allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    next();
  },
}));

jest.mock('../src/db/supabaseClient', () => ({
  from: jest.fn(),
}));

describe('Exports - GET /api/exports/collaborateurs.xlsx', () => {
  it('403 pour Manager (export collaborateurs réservé RH)', async () => {
    const app = require('../src/app');
    const res = await request(app).get('/api/exports/collaborateurs.xlsx').set('x-test-role', 'Manager');
    expect(res.status).toBe(403);
  });

  it('200 et Content-Type XLSX pour RH avec données', async () => {
    const supabase = require('../src/db/supabaseClient');
    const order = jest.fn().mockResolvedValueOnce({
      data: [{ nom: 'Test', prenom: 'User', poste: 'Dev', service: 'IT', contrat: 'CDI', date_embauche: '2025-01-01', status: 'Actif', salaire: 40000 }],
      error: null,
    });
    const select = jest.fn().mockReturnValue({ order });
    supabase.from.mockReturnValueOnce({ select });

    const app = require('../src/app');
    const res = await request(app).get('/api/exports/collaborateurs.xlsx').set('x-test-role', 'RH');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/spreadsheet/);
    expect(res.headers['content-disposition']).toMatch(/collaborateurs_/);
    expect(Buffer.byteLength(String(res.text || res.body || ''), 'utf8')).toBeGreaterThan(0);
  });
});

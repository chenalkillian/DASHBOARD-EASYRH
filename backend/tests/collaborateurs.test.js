const request = require('supertest');

jest.mock('../src/middleware/authMiddleware', () => ({
  authenticate: (req, _res, next) => {
    req.user = { id: 'u-test', role: req.header('x-test-role') || 'Collaborateur' };
    next();
  },
  authorize: (...allowed) => (req, res, next) => {
    if (!req.user?.role || !allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    next();
  },
}));

jest.mock('../src/db/supabaseClient', () => ({ from: jest.fn() }));

describe('Collaborateurs - GET /api/collaborateurs', () => {
  it('refuse (403) pour un Manager', async () => {
    const app = require('../src/app');
    const res = await request(app).get('/api/collaborateurs').set('x-test-role', 'Manager');
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  it('renvoie 200 et la liste pour RH', async () => {
    const supabase = require('../src/db/supabaseClient');
    const rows = [{ id: '1', nom: 'Dupont', prenom: 'Jean' }];

    // Mock 1 : collaborateurs.select().order()
    const order = jest.fn().mockResolvedValueOnce({ data: rows, error: null });
    supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ order }) });

    // Mock 2 : enrichWithRoles → profiles.select().in()
    const inFn = jest.fn().mockResolvedValueOnce({ data: [{ id: '1', role: 'Collaborateur' }], error: null });
    supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ in: inFn }) });

    const app = require('../src/app');
    const res = await request(app).get('/api/collaborateurs').set('x-test-role', 'RH');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ nom: 'Dupont' });
  });
});

describe('Collaborateurs — mutations (RH)', () => {
  it('POST / crée un collaborateur (201)', async () => {
    const supabase = require('../src/db/supabaseClient');
    const created = { id: 'n1', nom: 'Martin', prenom: 'Claire' };
    const single = jest.fn().mockResolvedValueOnce({ data: created, error: null });
    supabase.from.mockReturnValueOnce({ insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single }) }) });

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/collaborateurs')
      .set('x-test-role', 'RH')
      .send({ nom: 'Martin', prenom: 'Claire', poste: 'Dev', service: 'IT', contrat: 'CDI', date_embauche: '2025-01-01' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nom: 'Martin' });
  });

  it('PUT /:id met à jour un collaborateur (200)', async () => {
    const supabase = require('../src/db/supabaseClient');

    // Mock 1 : collaborateurs.update().eq().select().single()
    const single = jest.fn().mockResolvedValueOnce({ data: { id: '1', nom: 'Dupont', poste: 'Lead' }, error: null });
    const eq = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single }) });
    supabase.from.mockReturnValueOnce({ update: jest.fn().mockReturnValue({ eq }) });

    // Mock 2 : enrichWithRoles → profiles.select().in()
    const inFn = jest.fn().mockResolvedValueOnce({ data: [{ id: '1', role: 'Collaborateur' }], error: null });
    supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ in: inFn }) });

    const app = require('../src/app');
    const res = await request(app)
      .put('/api/collaborateurs/1')
      .set('x-test-role', 'RH')
      .send({ poste: 'Lead' });

    expect(res.status).toBe(200);
    expect(res.body.poste).toBe('Lead');
  });

  it('DELETE /:id supprime (204)', async () => {
    const supabase = require('../src/db/supabaseClient');
    const eq = jest.fn().mockResolvedValueOnce({ error: null });
    supabase.from.mockReturnValueOnce({ delete: jest.fn().mockReturnValue({ eq }) });

    const app = require('../src/app');
    const res = await request(app).delete('/api/collaborateurs/1').set('x-test-role', 'RH');
    expect(res.status).toBe(204);
  });

  it('POST / sans champs obligatoires retourne 400', async () => {
    const app = require('../src/app');
    const res = await request(app)
      .post('/api/collaborateurs')
      .set('x-test-role', 'RH')
      .send({ nom: 'CHENAL' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  describe('Collaborateurs — gestion des rôles (profiles)', () => {
    it('PUT /:id met à jour le rôle dans profiles (200) pour RH', async () => {
      const supabase = require('../src/db/supabaseClient');
      const app = require('../src/app');

      // Mock 1 : collaborateurs.update().eq().select().single()
      const single = jest.fn().mockResolvedValueOnce({ data: { id: 'user-1', poste: 'Lead' }, error: null });
      const eq1 = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single }) });
      supabase.from.mockReturnValueOnce({ update: jest.fn().mockReturnValue({ eq: eq1 }) });

      // Mock 2 : profiles.select().eq().maybeSingle()
      const maybeSingle = jest.fn().mockResolvedValueOnce({ data: { id: 'user-1' }, error: null });
      const eq2 = jest.fn().mockReturnValue({ maybeSingle });
      supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ eq: eq2 }) });

      // Mock 3 : profiles.update().eq()
      const eq3 = jest.fn().mockResolvedValueOnce({ error: null });
      supabase.from.mockReturnValueOnce({ update: jest.fn().mockReturnValue({ eq: eq3 }) });

      // Mock 4 : enrichWithRoles → profiles.select().in()
      const inFn = jest.fn().mockResolvedValueOnce({ data: [{ id: 'user-1', role: 'Manager' }], error: null });
      supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ in: inFn }) });

      const res = await request(app)
        .put('/api/collaborateurs/user-1')
        .set('x-test-role', 'RH')
        .send({ poste: 'Lead', role: 'Manager' });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('Manager');
    });

    it('PUT /:id avec role retourne 403 pour un Manager', async () => {
      const app = require('../src/app');
      const res = await request(app)
        .put('/api/collaborateurs/user-1')
        .set('x-test-role', 'Manager')
        .send({ role: 'RH' });
      expect(res.status).toBe(403);
    });
  });
});
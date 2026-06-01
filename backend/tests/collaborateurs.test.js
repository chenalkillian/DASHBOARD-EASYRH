  /** Tests API collaborateurs : droits RH + liste (Supabase mocké). */
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

  jest.mock('../src/db/supabaseClient', () => ({
    from: jest.fn(),
  }));

  describe('Collaborateurs - GET /api/collaborateurs', () => {
    it('refuse (403) pour un Manager (route RH uniquement)', async () => {
      const app = require('../src/app');
      const res = await request(app).get('/api/collaborateurs').set('x-test-role', 'Manager');
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');
    });

    it('renvoie 200 et la liste pour RH', async () => {
      const supabase = require('../src/db/supabaseClient');
      const rows = [{ id: '1', nom: 'Dupont', prenom: 'Jean' }];
      const order = jest.fn().mockResolvedValueOnce({ data: rows, error: null });
      const select = jest.fn().mockReturnValue({ order });
      supabase.from.mockReturnValueOnce({ select });

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
      const select = jest.fn().mockReturnValue({ single });
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({ select }),
      });

      const app = require('../src/app');
      const res = await request(app)
        .post('/api/collaborateurs')
        .set('x-test-role', 'RH')
        .send({
          nom: 'Martin',
          prenom: 'Claire',
          poste: 'Dev',
          service: 'IT',
          contrat: 'CDI',
          date_embauche: '2025-01-01',
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ nom: 'Martin' });
    });

    it('PUT /:id met à jour un collaborateur (200)', async () => {
      const supabase = require('../src/db/supabaseClient');
      const single = jest.fn().mockResolvedValueOnce({
        data: { id: '1', nom: 'Dupont', poste: 'Lead' },
        error: null,
      });
      const select = jest.fn().mockReturnValue({ single });
      const eq = jest.fn().mockReturnValue({ select });
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({ eq }),
      });

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
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({ eq }),
      });

      const app = require('../src/app');
      const res = await request(app).delete('/api/collaborateurs/1').set('x-test-role', 'RH');

      expect(res.status).toBe(204);
    });

    it('POST / sans champs obligatoires retourne 400', async () => {
  const app = require('../src/app');
  const res = await request(app)
    .post('/api/collaborateurs')
    .set('x-test-role', 'RH')
    .send({ nom: 'CHENAL' }); // prenom, poste, service manquants

  expect(res.status).toBe(400);
  expect(res.body.errors).toBeDefined();
});
  });

  
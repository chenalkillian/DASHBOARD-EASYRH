/** Tests congés : filtre collaborateur, création, décision invalide, suppression refusée. */
const request = require('supertest');

jest.mock('../src/middleware/authMiddleware', () => ({
  authenticate: (req, _res, next) => {
    req.user = {
      id: req.header('x-test-user-id') || 'u-collab',
      role: req.header('x-test-role') || 'Collaborateur',
    };
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

const mockCollaborateursLookup = () => {
  const inFn = jest.fn().mockResolvedValue({ data: [], error: null });
  const select = jest.fn().mockReturnValue({ in: inFn });
  return { select };
};

beforeEach(() => {
  const supabase = require('../src/db/supabaseClient');
  supabase.from.mockReset();
});

describe('Congés - GET /api/conges (filtrage collaborateur)', () => {
  it('applique eq(created_by) pour un Collaborateur', async () => {
    const supabase = require('../src/db/supabaseClient');
    const rows = [{ id: 1, type: 'CP', created_by: 'user-abc' }];
    const eqCreated = jest.fn().mockResolvedValueOnce({ data: rows, error: null });
    const order = jest.fn().mockReturnValue({ eq: eqCreated });
    const select = jest.fn().mockReturnValue({ order });
    supabase.from
      .mockReturnValueOnce({ select })
      .mockReturnValueOnce(mockCollaborateursLookup())
      .mockReturnValueOnce(mockCollaborateursLookup());

    const app = require('../src/app');
    const res = await request(app).get('/api/conges').set('x-test-role', 'Collaborateur').set('x-test-user-id', 'user-abc');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      demandeur_nom: null,
      demandeur_prenom: null,
    });
    expect(eqCreated).toHaveBeenCalledWith('created_by', 'user-abc');
  });
});

describe('Congés - POST /api/conges', () => {
  it('crée une demande En attente (201)', async () => {
    const supabase = require('../src/db/supabaseClient');
    const created = { id: 55, statut: 'En attente', type: 'RTT' };
    const single = jest.fn().mockResolvedValueOnce({ data: created, error: null });
    const select = jest.fn().mockReturnValue({ single });
    supabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({ select }),
    });

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/conges')
      .set('x-test-role', 'Collaborateur')
      .set('x-test-user-id', 'user-abc')
      .send({ type: 'RTT', date_debut: '2026-06-01', date_fin: '2026-06-03' });

    expect(res.status).toBe(201);
    expect(res.body.statut).toBe('En attente');
  });
});

describe('Congés - POST /api/conges (rôles validateurs)', () => {
  it('403 pour RH (validation uniquement)', async () => {
    const app = require('../src/app');
    const res = await request(app)
      .post('/api/conges')
      .set('x-test-role', 'RH')
      .send({ type: 'RTT', date_debut: '2026-06-01', date_fin: '2026-06-03' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/ne peuvent pas créer/i);
  });

  it('403 pour Manager', async () => {
    const app = require('../src/app');
    const res = await request(app)
      .post('/api/conges')
      .set('x-test-role', 'Manager')
      .send({ type: 'RTT', date_debut: '2026-06-01', date_fin: '2026-06-03' });

    expect(res.status).toBe(403);
  });
});

describe('Congés - PUT /api/conges/:id/decision', () => {
  it('400 si décision hors liste Approuvé/Refusé', async () => {
    const app = require('../src/app');
    const res = await request(app)
      .put('/api/conges/1/decision')
      .set('x-test-role', 'RH')
      .send({ decision: 'Peut-être' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Décision invalide');
  });
});

describe('Congés - DELETE /api/conges/:id (collaborateur)', () => {
  it('403 si la demande appartient à un autre utilisateur', async () => {
    const supabase = require('../src/db/supabaseClient');
    const single = jest.fn().mockResolvedValueOnce({
      data: { id: 1, statut: 'En attente', created_by: 'autre-user' },
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ single });
    const select = jest.fn().mockReturnValue({ eq });
    supabase.from.mockReturnValueOnce({ select });

    const app = require('../src/app');
    const res = await request(app).delete('/api/conges/1').set('x-test-role', 'Collaborateur').set('x-test-user-id', 'user-abc');

    expect(res.status).toBe(403);
  });
});

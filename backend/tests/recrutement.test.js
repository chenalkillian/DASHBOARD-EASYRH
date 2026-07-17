const request = require('supertest');

jest.mock('../src/middleware/authMiddleware', () => ({
  authenticate: (req, _res, next) => {
    req.user = { id: 'u-rh', role: req.header('x-test-role') || 'Collaborateur' };
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Recrutement - GET /api/recrutement', () => {
  it('refuse (403) pour un Collaborateur', async () => {
    const app = require('../src/app');
    const res = await request(app).get('/api/recrutement').set('x-test-role', 'Collaborateur');
    expect(res.status).toBe(403);
  });

  it('refuse (403) pour un Manager', async () => {
    const app = require('../src/app');
    const res = await request(app).get('/api/recrutement').set('x-test-role', 'Manager');
    expect(res.status).toBe(403);
  });

  it('renvoie la liste des candidats pour RH (200)', async () => {
    const supabase = require('../src/db/supabaseClient');
    const rows = [{ id: 1, nom: 'Durand', statut: 'Entretien' }];
    const order = jest.fn().mockResolvedValueOnce({ data: rows, error: null });
    const select = jest.fn().mockReturnValue({ order });
    supabase.from.mockReturnValueOnce({ select });

    const app = require('../src/app');
    const res = await request(app).get('/api/recrutement').set('x-test-role', 'RH');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ nom: 'Durand' });
  });

  it('filtre par statut quand query ?statut=…', async () => {
    const supabase = require('../src/db/supabaseClient');
    const filtered = [{ id: 2, statut: 'Embauché' }];
    const eq = jest.fn().mockResolvedValueOnce({ data: filtered, error: null });
    const order = jest.fn().mockReturnValue({ eq });
    const select = jest.fn().mockReturnValue({ order });
    supabase.from.mockReturnValueOnce({ select });

    const app = require('../src/app');
    const res = await request(app).get('/api/recrutement?statut=Embauché').set('x-test-role', 'RH');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(eq).toHaveBeenCalledWith('statut', 'Embauché');
  });
});

describe('Recrutement - POST /api/recrutement', () => {
  it('crée un candidat (201)', async () => {
    const supabase = require('../src/db/supabaseClient');
    const created = { id: 9, nom: 'Petit', poste: 'Designer' };
    const single = jest.fn().mockResolvedValueOnce({ data: created, error: null });
    const select = jest.fn().mockReturnValue({ single });

    supabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({ select }),
    });

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/recrutement')
      .set('x-test-role', 'RH')
      .send({ nom: 'Petit', prenom: 'Léa', poste: 'Designer', statut: 'CV reçu' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nom: 'Petit' });
  });
});
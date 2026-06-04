const request = require('supertest');

const mockCreateUser = jest.fn();
const mockDeleteUser = jest.fn();

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
  auth: {
    admin: {
      createUser: (...args) => mockCreateUser(...args),
      deleteUser: (...args) => mockDeleteUser(...args),
    },
  },
}));

beforeEach(() => {
  const supabase = require('../src/db/supabaseClient');
  supabase.from.mockReset();
  mockCreateUser.mockReset();
  mockDeleteUser.mockReset();
  mockDeleteUser.mockResolvedValue({ error: null });
  mockCreateUser.mockResolvedValue({
    data: { user: { id: 'auth-user-1' } },
    error: null,
  });
});

describe('Collaborateurs - GET /api/collaborateurs', () => {
  it('refuse (403) pour un Manager', async () => {
    const app = require('../src/app');
    const res = await request(app).get('/api/collaborateurs').set('x-test-role', 'Manager');
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  it('renvoie 200 et la liste pour RH', async () => {
    const supabase = require('../src/db/supabaseClient');
    const rows = [{ id: 'collab-1', user_id: 'auth-user-1', nom: 'Dupont', prenom: 'Jean' }];

    const order = jest.fn().mockResolvedValueOnce({ data: rows, error: null });
    supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ order }) });

    const inFn = jest.fn().mockResolvedValueOnce({
      data: [{ id: 'auth-user-1', role: 'Collaborateur' }],
      error: null,
    });
    supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ in: inFn }) });

    const app = require('../src/app');
    const res = await request(app).get('/api/collaborateurs').set('x-test-role', 'RH');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ nom: 'Dupont', role: 'Collaborateur', has_account: true });
  });
});

describe('Collaborateurs — mutations (RH)', () => {
  const validBody = {
    nom: 'Martin',
    prenom: 'Claire',
    poste: 'Dev',
    service: 'IT',
    contrat: 'CDI',
    date_embauche: '2025-01-01',
    email: 'claire@corp.com',
    password: 'secret12',
  };

  it('POST / crée collaborateur + compte Auth + profil (201)', async () => {
    const supabase = require('../src/db/supabaseClient');

    const collabInserted = { id: 'collab-new', nom: 'Martin', prenom: 'Claire' };
    const collabLinked = { ...collabInserted, user_id: 'auth-user-1', email: 'claire@corp.com' };

    supabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValueOnce({ data: collabInserted, error: null }),
        }),
      }),
    });

    supabase.from.mockReturnValueOnce({
      upsert: jest.fn().mockResolvedValueOnce({ error: null }),
    });

    const linkSingle = jest.fn().mockResolvedValueOnce({ data: collabLinked, error: null });
    supabase.from.mockReturnValueOnce({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({ single: linkSingle }),
        }),
      }),
    });

    const inFn = jest.fn().mockResolvedValueOnce({
      data: [{ id: 'auth-user-1', role: 'Collaborateur' }],
      error: null,
    });
    supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ in: inFn }) });

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/collaborateurs')
      .set('x-test-role', 'RH')
      .send(validBody);

    expect(res.status).toBe(201);
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'claire@corp.com', email_confirm: true }),
    );
    expect(res.body).toMatchObject({
      nom: 'Martin',
      user_id: 'auth-user-1',
      role: 'Collaborateur',
    });
  });

  it('POST / rollback collaborateur si createUser échoue', async () => {
    const supabase = require('../src/db/supabaseClient');
    mockCreateUser.mockResolvedValueOnce({
      data: null,
      error: { message: 'User already registered' },
    });

    supabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'collab-new' },
            error: null,
          }),
        }),
      }),
    });

    supabase.from.mockReturnValueOnce({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValueOnce({ error: null }),
      }),
    });

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/collaborateurs')
      .set('x-test-role', 'RH')
      .send(validBody);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already registered|compte utilisateur/i);
  });

  it('POST / sans email valide retourne 400', async () => {
    const app = require('../src/app');
    const res = await request(app)
      .post('/api/collaborateurs')
      .set('x-test-role', 'RH')
      .send({ ...validBody, email: 'pas-un-email' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('PUT /:id met à jour un collaborateur (200)', async () => {
    const supabase = require('../src/db/supabaseClient');

    const single = jest.fn().mockResolvedValueOnce({
      data: { id: 'collab-1', user_id: 'auth-user-1', nom: 'Dupont', poste: 'Lead' },
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single }) });
    supabase.from.mockReturnValueOnce({ update: jest.fn().mockReturnValue({ eq }) });

    const inFn = jest.fn().mockResolvedValueOnce({
      data: [{ id: 'auth-user-1', role: 'Collaborateur' }],
      error: null,
    });
    supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ in: inFn }) });

    const app = require('../src/app');
    const res = await request(app)
      .put('/api/collaborateurs/collab-1')
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
    const res = await request(app).delete('/api/collaborateurs/collab-1').set('x-test-role', 'RH');
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

      const single = jest.fn().mockResolvedValueOnce({
        data: { id: 'collab-1', user_id: 'auth-user-1', poste: 'Lead' },
        error: null,
      });
      const eq1 = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single }) });
      supabase.from.mockReturnValueOnce({ update: jest.fn().mockReturnValue({ eq: eq1 }) });

      const collabLookup = jest.fn().mockResolvedValueOnce({
        data: { user_id: 'auth-user-1' },
        error: null,
      });
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ single: collabLookup }),
        }),
      });

      const maybeSingle = jest.fn().mockResolvedValueOnce({ data: { id: 'auth-user-1' }, error: null });
      const eq2 = jest.fn().mockReturnValue({ maybeSingle });
      supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ eq: eq2 }) });

      const eq3 = jest.fn().mockResolvedValueOnce({ error: null });
      supabase.from.mockReturnValueOnce({ update: jest.fn().mockReturnValue({ eq: eq3 }) });

      const inFn = jest.fn().mockResolvedValueOnce({
        data: [{ id: 'auth-user-1', role: 'Manager' }],
        error: null,
      });
      supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ in: inFn }) });

      const res = await request(require('../src/app'))
        .put('/api/collaborateurs/collab-1')
        .set('x-test-role', 'RH')
        .send({ poste: 'Lead', role: 'Manager' });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('Manager');
    });

    it('PUT /:id avec role retourne 403 pour un Manager', async () => {
      const res = await request(require('../src/app'))
        .put('/api/collaborateurs/collab-1')
        .set('x-test-role', 'Manager')
        .send({ role: 'RH' });
      expect(res.status).toBe(403);
    });
  });
});

const request = require('supertest');

const mockListUsers = jest.fn();
const mockGetUserById = jest.fn();

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
      listUsers: (...args) => mockListUsers(...args),
      getUserById: (...args) => mockGetUserById(...args),
    },
  },
}));

const USER_ID = '11111111-1111-4111-8111-111111111111';

beforeEach(() => {
  const supabase = require('../src/db/supabaseClient');
  supabase.from.mockReset();
  mockListUsers.mockReset();
  mockGetUserById.mockReset();
  mockListUsers.mockResolvedValue({
    data: { users: [] },
    error: null,
  });
  mockGetUserById.mockResolvedValue({
    data: { user: { id: USER_ID, email: 'claire@corp.com' } },
    error: null,
  });
});

describe('Collaborateurs - GET /api/collaborateurs', () => {
  it('renvoie 200 et la liste pour Manager (lecture seule)', async () => {
    const supabase = require('../src/db/supabaseClient');
    const rows = [{ id: 'collab-2', user_id: 'auth-user-2', nom: 'Martin', prenom: 'Paul', service: 'IT' }];

    const order = jest.fn().mockResolvedValueOnce({ data: rows, error: null });
    supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ order }) });

    const inFn = jest.fn().mockResolvedValueOnce({
      data: [{ id: 'auth-user-2', role: 'Manager' }],
      error: null,
    });
    supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ in: inFn }) });

    const app = require('../src/app');
    const res = await request(app).get('/api/collaborateurs').set('x-test-role', 'Manager');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ nom: 'Martin', service: 'IT' });
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

describe('Collaborateurs - GET /api/collaborateurs/utilisateurs-inscrits', () => {
  it('renvoie les utilisateurs Auth sans fiche liée (200)', async () => {
    const supabase = require('../src/db/supabaseClient');

    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce({
        data: [{ user_id: 'auth-user-linked' }],
        error: null,
      }),
    });

    mockListUsers.mockResolvedValueOnce({
      data: {
        users: [
          { id: 'auth-user-linked', email: 'lie@corp.com', user_metadata: { full_name: 'Lie User' } },
          { id: USER_ID, email: 'claire@corp.com', user_metadata: { full_name: 'Claire Martin' } },
        ],
      },
      error: null,
    });

    const inFn = jest.fn().mockResolvedValueOnce({
      data: [
        { id: 'auth-user-linked', full_name: 'Lie User', role: 'Collaborateur' },
        { id: USER_ID, full_name: 'Claire Martin', role: 'Collaborateur' },
      ],
      error: null,
    });
    supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ in: inFn }) });

    const app = require('../src/app');
    const res = await request(app)
      .get('/api/collaborateurs/utilisateurs-inscrits')
      .set('x-test-role', 'RH');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: USER_ID,
      email: 'claire@corp.com',
      prenom: 'Claire',
      nom: 'Martin',
    });
  });

  it('retourne 403 pour un Manager', async () => {
    const app = require('../src/app');
    const res = await request(app)
      .get('/api/collaborateurs/utilisateurs-inscrits')
      .set('x-test-role', 'Manager');
    expect(res.status).toBe(403);
  });
});

describe('Collaborateurs — mutations (RH)', () => {
  const validBody = {
    user_id: USER_ID,
    nom: 'Martin',
    prenom: 'Claire',
    poste: 'Dev',
    service: 'IT',
    contrat: 'CDI',
    date_embauche: '2025-01-01',
  };

  it('POST / lie un utilisateur inscrit existant (201)', async () => {
    const supabase = require('../src/db/supabaseClient');

    const maybeSingleCheck = jest.fn().mockResolvedValueOnce({ data: null, error: null });
    const eqCheck = jest.fn().mockReturnValue({ maybeSingle: maybeSingleCheck });
    supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ eq: eqCheck }) });

    const collabLinked = {
      id: 'collab-new',
      nom: 'Martin',
      prenom: 'Claire',
      user_id: USER_ID,
      email: 'claire@corp.com',
    };
    supabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValueOnce({ data: collabLinked, error: null }),
        }),
      }),
    });

    const inFn = jest.fn().mockResolvedValueOnce({
      data: [{ id: USER_ID, role: 'Collaborateur' }],
      error: null,
    });
    supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ in: inFn }) });

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/collaborateurs')
      .set('x-test-role', 'RH')
      .send(validBody);

    expect(res.status).toBe(201);
    expect(mockGetUserById).toHaveBeenCalledWith(USER_ID);
    expect(res.body).toMatchObject({
      nom: 'Martin',
      user_id: USER_ID,
      has_account: true,
    });
  });

  it('POST / sans user_id retourne 400', async () => {
    const app = require('../src/app');
    const { user_id: _removed, ...bodySansUser } = validBody;
    const res = await request(app)
      .post('/api/collaborateurs')
      .set('x-test-role', 'RH')
      .send(bodySansUser);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('POST / avec user_id inconnu retourne 404', async () => {
    mockGetUserById.mockResolvedValueOnce({ data: { user: null }, error: null });

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/collaborateurs')
      .set('x-test-role', 'RH')
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Utilisateur introuvable dans Supabase Auth');
  });

  it('POST / avec user_id déjà lié retourne 400', async () => {
    const supabase = require('../src/db/supabaseClient');
    const maybeSingleCheck = jest.fn().mockResolvedValueOnce({
      data: { id: 'collab-existing' },
      error: null,
    });
    const eqCheck = jest.fn().mockReturnValue({ maybeSingle: maybeSingleCheck });
    supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ eq: eqCheck }) });

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/collaborateurs')
      .set('x-test-role', 'RH')
      .send(validBody);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/déjà lié/i);
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

  it('PUT /:id sans compte lié enregistre la fiche même si role est envoyé (200)', async () => {
    const supabase = require('../src/db/supabaseClient');

    const single = jest.fn().mockResolvedValueOnce({
      data: { id: 'collab-2', user_id: null, nom: 'Sans', poste: 'Junior', status: 'Suspendu' },
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single }) });
    supabase.from.mockReturnValueOnce({ update: jest.fn().mockReturnValue({ eq }) });

    const inFn = jest.fn().mockResolvedValueOnce({ data: [], error: null });
    supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ in: inFn }) });

    const app = require('../src/app');
    const res = await request(app)
      .put('/api/collaborateurs/collab-2')
      .set('x-test-role', 'RH')
      .send({ poste: 'Junior', status: 'Suspendu', role: 'Collaborateur' });

    expect(res.status).toBe(200);
    expect(res.body.poste).toBe('Junior');
    expect(res.body.status).toBe('Suspendu');
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

  it('POST / retourne 403 pour un Manager', async () => {
    const app = require('../src/app');
    const res = await request(app)
      .post('/api/collaborateurs')
      .set('x-test-role', 'Manager')
      .send(validBody);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Accès refusé');
  });

  it('POST / retourne 403 pour un Collaborateur', async () => {
    const app = require('../src/app');
    const res = await request(app)
      .post('/api/collaborateurs')
      .set('x-test-role', 'Collaborateur')
      .send(validBody);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Accès refusé');
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

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
  schema: jest.fn(),
  auth: {
    admin: {
      createUser: (...args) => mockCreateUser(...args),
      deleteUser: (...args) => mockDeleteUser(...args),
    },
  },
}));

const mockSchemaFrom = jest.fn();

beforeEach(() => {
  const supabase = require('../src/db/supabaseClient');
  supabase.from.mockReset();
  supabase.schema.mockReset();
  supabase.schema.mockReturnValue({ from: mockSchemaFrom });
  mockSchemaFrom.mockReset();
  mockCreateUser.mockReset();
  mockDeleteUser.mockReset();
  mockDeleteUser.mockResolvedValue({ error: null });
  mockCreateUser.mockResolvedValue({
    data: { user: { id: 'auth-user-1' } },
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

  it('POST / avec compteExistant=true lie un compte existant (201)', async () => {
    const supabase = require('../src/db/supabaseClient');

    const authMaybeSingle = jest.fn().mockResolvedValueOnce({
      data: { id: 'auth-user-existing' },
      error: null,
    });
    const authEq = jest.fn().mockReturnValue({ maybeSingle: authMaybeSingle });
    const authSelect = jest.fn().mockReturnValue({ eq: authEq });
    mockSchemaFrom.mockReturnValueOnce({ select: authSelect });

    const profileMaybeSingle = jest.fn().mockResolvedValueOnce({
      data: { id: 'auth-user-existing' },
      error: null,
    });
    const profileEq = jest.fn().mockReturnValue({ maybeSingle: profileMaybeSingle });
    supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ eq: profileEq }) });

    const collabLinked = {
      id: 'collab-linked',
      nom: 'Martin',
      prenom: 'Claire',
      user_id: 'auth-user-existing',
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
      data: [{ id: 'auth-user-existing', role: 'Collaborateur' }],
      error: null,
    });
    supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ in: inFn }) });

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/collaborateurs')
      .set('x-test-role', 'RH')
      .send({
        ...validBody,
        compteExistant: true,
        password: undefined,
      });

    expect(res.status).toBe(201);
    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(res.body).toMatchObject({
      user_id: 'auth-user-existing',
      has_account: true,
    });
  });

  it('POST / avec compteExistant=true et email inconnu retourne 404', async () => {
    const authMaybeSingle = jest.fn().mockResolvedValueOnce({
      data: null,
      error: null,
    });
    const authEq = jest.fn().mockReturnValue({ maybeSingle: authMaybeSingle });
    const authSelect = jest.fn().mockReturnValue({ eq: authEq });
    mockSchemaFrom.mockReturnValueOnce({ select: authSelect });

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/collaborateurs')
      .set('x-test-role', 'RH')
      .send({
        ...validBody,
        compteExistant: true,
        email: 'inconnu@corp.com',
        password: undefined,
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Aucun compte trouvé avec cet email');
    expect(mockCreateUser).not.toHaveBeenCalled();
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

  it('POST / retourne 403 pour un Collaborateur (compteExistant ne doit pas exposer la 404)', async () => {
    const app = require('../src/app');
    const res = await request(app)
      .post('/api/collaborateurs')
      .set('x-test-role', 'Collaborateur')
      .send({
        ...validBody,
        compteExistant: true,
        email: 'cible@corp.com',
        password: undefined,
      });
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

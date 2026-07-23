/** Tests protection auth réelle sur POST /api/collaborateurs (sans mock authMiddleware). */
const request = require('supertest');

jest.mock('../src/db/supabaseClient', () => ({
  from: jest.fn(),
  schema: jest.fn(() => ({ from: jest.fn() })),
  auth: {
    getUser: jest.fn(),
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    admin: {
      listUsers: jest.fn(),
      getUserById: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    },
  },
}));

const validBody = {
  user_id: '11111111-1111-4111-8111-111111111111',
  nom: 'Martin',
  prenom: 'Claire',
  poste: 'Dev',
  service: 'IT',
  contrat: 'CDI',
  date_embauche: '2025-01-01',
};

const mockAuthenticatedUser = (role, hasAccount = true) => {
  const supabase = require('../src/db/supabaseClient');

  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: 'test-user-id', email: 'test@corp.com' } },
    error: null,
  });

  supabase.from.mockImplementation((table) => {
    if (table === 'profiles') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { role },
              error: null,
            }),
          }),
        }),
      };
    }

    if (table === 'collaborateurs') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: hasAccount ? { id: 'collab-1' } : null,
                error: null,
              }),
            }),
          }),
        }),
      };
    }

    return {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
  });
};

describe('Collaborateurs - protection auth réelle (POST /)', () => {
  let app;
  let supabase;

  beforeEach(() => {
    jest.resetModules();

    supabase = require('../src/db/supabaseClient');
    supabase.from.mockReset();
    supabase.auth.getUser.mockReset();

    app = require('../src/app');
  });

  it('retourne 401 sans token Bearer', async () => {
    const res = await request(app).post('/api/collaborateurs').send(validBody);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token manquant');
  });

  it('retourne 403 pour un Collaborateur authentifié', async () => {
    mockAuthenticatedUser('Collaborateur');

    const res = await request(app)
      .post('/api/collaborateurs')
      .set('Authorization', 'Bearer fake-token')
      .send(validBody);

    console.log(res.status, res.body);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Accès refusé');
  });
});
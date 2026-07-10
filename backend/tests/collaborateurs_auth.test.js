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
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    },
  },
}));

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

const mockAuthenticatedUser = (role) => {
  const supabase = require('../src/db/supabaseClient');
  supabase.auth.getUser.mockResolvedValueOnce({
    data: { user: { id: 'test-user-id', email: 'test@corp.com' } },
    error: null,
  });
  const maybeSingle = jest.fn().mockResolvedValueOnce({ data: { role }, error: null });
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  supabase.from.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ eq }) });
};

describe('Collaborateurs - protection auth réelle (POST /)', () => {
  let app;

  beforeAll(() => {
    app = require('../src/app');
  });

  beforeEach(() => {
    const supabase = require('../src/db/supabaseClient');
    supabase.from.mockReset();
    supabase.auth.getUser.mockReset();
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

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Accès refusé');
  });
});

/** Tests API inscription (register). */
const request = require('supertest');

jest.mock('../src/db/supabaseClient', () => ({
  from: jest.fn(),
  auth: {
    signUp: jest.fn(),
  },
}));

describe('Auth - POST /api/auth/register', () => {
  beforeEach(() => {
    const supabase = require('../src/db/supabaseClient');
    supabase.from.mockReset();
    supabase.auth.signUp.mockReset();
  });

  it('renvoie 400 si Supabase renvoie une erreur', async () => {
    const supabase = require('../src/db/supabaseClient');
    supabase.auth.signUp.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Email déjà utilisé' },
    });

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@y.com', password: 'secret123', full_name: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Email déjà utilisé');
  });

  it('renvoie 201 si inscription OK', async () => {
    const supabase = require('../src/db/supabaseClient');
    supabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'new', email: 'x@y.com' } },
      error: null,
    });

    const collabMaybeSingle = jest.fn().mockResolvedValueOnce({ data: null, error: null });
    const collabEq = jest.fn().mockReturnValue({ maybeSingle: collabMaybeSingle });
    const collabIs = jest.fn().mockReturnValue({ eq: collabEq });
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({ is: collabIs }),
    });

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@y.com', password: 'secret123', full_name: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('user');
  });

  it('lie automatiquement une fiche collaborateur sans user_id (201)', async () => {
    const supabase = require('../src/db/supabaseClient');
    supabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'new-user', email: 'claire@corp.com' } },
      error: null,
    });

    const collabMaybeSingle = jest.fn().mockResolvedValueOnce({
      data: { id: 'collab-orphan' },
      error: null,
    });
    const collabEqFind = jest.fn().mockReturnValue({ maybeSingle: collabMaybeSingle });
    const collabIs = jest.fn().mockReturnValue({ eq: collabEqFind });
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({ is: collabIs }),
    });

    const collabEqUpdate = jest.fn().mockResolvedValueOnce({ error: null });
    supabase.from.mockReturnValueOnce({
      update: jest.fn().mockReturnValue({ eq: collabEqUpdate }),
    });

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'claire@corp.com', password: 'secret123', full_name: 'Claire Martin' });

    expect(res.status).toBe(201);
    expect(collabEqUpdate).toHaveBeenCalledWith('id', 'collab-orphan');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Liaison automatique'),
    );

    logSpy.mockRestore();
  });

  it('réussit sans fiche collaborateur correspondante (201)', async () => {
    const supabase = require('../src/db/supabaseClient');
    supabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'solo-user', email: 'solo@corp.com' } },
      error: null,
    });

    const collabMaybeSingle = jest.fn().mockResolvedValueOnce({ data: null, error: null });
    const collabEq = jest.fn().mockReturnValue({ maybeSingle: collabMaybeSingle });
    const collabIs = jest.fn().mockReturnValue({ eq: collabEq });
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({ is: collabIs }),
    });

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'solo@corp.com', password: 'secret123', full_name: 'Solo User' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });
});

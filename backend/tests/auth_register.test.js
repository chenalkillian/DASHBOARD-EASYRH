/** Tests API inscription (register). */
const request = require('supertest');

jest.mock('../src/db/supabaseClient', () => ({
  auth: {
    signUp: jest.fn(),
  },
}));

describe('Auth - POST /api/auth/register', () => {
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

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@y.com', password: 'secret123', full_name: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('user');
  });
});

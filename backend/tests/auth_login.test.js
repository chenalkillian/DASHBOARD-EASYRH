const request = require('supertest');

jest.mock('../src/db/supabaseClient', () => ({
  auth: {
    signInWithPassword: jest.fn(),
  },
}));

describe('Auth - POST /api/auth/login', () => {
  it('renvoie 401 si credentials invalides', async () => {
    const supabase = require('../src/db/supabaseClient');
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'bad' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('renvoie 200 et un token si login OK', async () => {
    const supabase = require('../src/db/supabaseClient');
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        session: { access_token: 'token123' },
        user: { id: 'u1', email: 'test@example.com' },
      },
      error: null,
    });

    const app = require('../src/app');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'good' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token', 'token123');
    expect(res.body).toHaveProperty('user');
  });
});


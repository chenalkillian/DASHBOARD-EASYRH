const request = require('supertest');

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(async () => ({ data: null, error: null })),
        })),
      })),
    })),
  })),
}));

const app = require('../src/app');

describe('API healthcheck', () => {
  it('GET /api/health renvoie status OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });
});


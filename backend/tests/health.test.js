const request = require('supertest');
const app = require('../src/app');

describe('API healthcheck', () => {
  it('GET /api/health renvoie status OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });
});


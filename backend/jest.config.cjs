module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  // Dette technique : mocks module-level (supabaseClient, authMiddleware) → conflits en parallèle.
  maxWorkers: 1,
};
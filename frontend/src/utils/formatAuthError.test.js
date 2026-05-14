import { describe, it, expect } from 'vitest';
import { formatAuthError } from './formatAuthError.js';

describe('formatAuthError', () => {
  it('mappe les erreurs Supabase connues', () => {
    expect(formatAuthError('Invalid login credentials')).toBe(
      'Email ou mot de passe incorrect. Veuillez réessayer.',
    );
    expect(formatAuthError('JWT expired')).toBe(
      'Votre session a expiré. Veuillez vous reconnecter.',
    );
    expect(formatAuthError('Email not confirmed')).toBe(
      'Veuillez confirmer votre adresse email avant de vous connecter.',
    );
  });

  it('renvoie le message générique pour le reste', () => {
    expect(formatAuthError('Autre erreur')).toBe(
      'Une erreur inattendue est survenue. Veuillez réessayer.',
    );
    expect(formatAuthError('')).toBe(
      'Une erreur inattendue est survenue. Veuillez réessayer.',
    );
  });
});

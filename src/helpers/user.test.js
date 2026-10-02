import { describe, expect, it } from 'vitest';

import { normalizeUser } from '@/helpers/user';

describe('normalizeUser', () => {
  it('returns null for null or undefined input', () => {
    expect(normalizeUser(null)).toBeNull();
    expect(normalizeUser(undefined)).toBeNull();
  });

  it('normalizes a user with first_name and last_name (snake_case from backend)', () => {
    const rawUser = {
      id: '123',
      name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      image: 'https://example.com/avatar.png',
    };

    const normalized = normalizeUser(rawUser);

    expect(normalized).toEqual({
      id: '123',
      name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      image: 'https://example.com/avatar.png',
    });
  });

  it('normalizes a user with firstName and lastName (camelCase)', () => {
    const rawUser = {
      id: '456',
      name: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
    };

    const normalized = normalizeUser(rawUser);

    expect(normalized.firstName).toBe('Jane');
    expect(normalized.first_name).toBe('Jane');
    expect(normalized.lastName).toBe('Smith');
    expect(normalized.last_name).toBe('Smith');
    expect(normalized.name).toBe('Jane Smith');
    expect(normalized.email).toBe('jane@example.com');
  });

  it('infers firstName and lastName from name if specific fields are missing', () => {
    const rawUser = {
      id: '789',
      name: 'Alan Turing Silva',
      email: 'alan@example.com',
    };

    const normalized = normalizeUser(rawUser);

    expect(normalized.firstName).toBe('Alan');
    expect(normalized.first_name).toBe('Alan');
    expect(normalized.lastName).toBe('Turing Silva');
    expect(normalized.last_name).toBe('Turing Silva');
  });

  it('constructs name from firstName and lastName if name is missing', () => {
    const rawUser = {
      id: '101',
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@example.com',
    };

    const normalized = normalizeUser(rawUser);

    expect(normalized.name).toBe('Ada Lovelace');
    expect(normalized.firstName).toBe('Ada');
    expect(normalized.lastName).toBe('Lovelace');
  });
});

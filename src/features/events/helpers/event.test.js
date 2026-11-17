import { describe, expect, it } from 'vitest';

import { mapEventToCalendarItem, normalizeEventAuthor } from './event';

describe('normalizeEventAuthor', () => {
  it('returns default fallback when event and user have no author data', () => {
    const result = normalizeEventAuthor({});
    expect(result).toEqual({
      name: 'Membro',
      email: '',
      avatar: null,
      initials: '—',
      hasAuthor: false,
    });
  });

  it('normalizes author when author is a string', () => {
    const result = normalizeEventAuthor({ author: 'Maria Clara' });
    expect(result).toEqual({
      name: 'Maria Clara',
      email: '',
      avatar: null,
      initials: 'MC',
      hasAuthor: true,
    });
  });

  it('normalizes author with single word string', () => {
    const result = normalizeEventAuthor({ author: 'Lucas' });
    expect(result).toEqual({
      name: 'Lucas',
      email: '',
      avatar: null,
      initials: 'LU',
      hasAuthor: true,
    });
  });

  it('normalizes author when author is an object with name and image', () => {
    const result = normalizeEventAuthor({
      author: {
        name: 'Carlos Drummond',
        image: 'https://example.com/carlos.png',
        email: 'carlos@example.com',
      },
    });
    expect(result).toEqual({
      name: 'Carlos Drummond',
      email: 'carlos@example.com',
      avatar: 'https://example.com/carlos.png',
      initials: 'CD',
      hasAuthor: true,
    });
  });

  it('normalizes author when author is on creator or user or rawEvent', () => {
    const fromRawCreator = normalizeEventAuthor({
      rawEvent: {
        creator: {
          firstName: 'Ana',
          lastName: 'Beatriz',
          avatar: 'https://example.com/ana.png',
        },
      },
    });
    expect(fromRawCreator).toEqual({
      name: 'Ana Beatriz',
      email: '',
      avatar: 'https://example.com/ana.png',
      initials: 'AB',
      hasAuthor: true,
    });
  });

  it('falls back to authenticated user when createdByUserId matches or no author provided', () => {
    const mockUser = {
      id: 'usr-123',
      name: 'Allan Rodrigues',
      image: 'https://example.com/allan.png',
    };

    const result = normalizeEventAuthor(
      { createdByUserId: 'usr-123' },
      mockUser
    );
    expect(result.name).toBe('Allan Rodrigues');
    expect(result.avatar).toBe('https://example.com/allan.png');
    expect(result.initials).toBe('AR');
    expect(result.hasAuthor).toBe(true);
  });

  it('returns "Membro" fallback when createdByUserId is null even if fallbackUser is provided', () => {
    const mockUser = {
      id: 'usr-123',
      name: 'Allan Rodrigues',
      image: 'https://example.com/allan.png',
    };

    const result = normalizeEventAuthor(
      { createdByUserId: null, author: null },
      mockUser
    );
    expect(result).toEqual({
      name: 'Membro',
      email: '',
      avatar: null,
      initials: '—',
      hasAuthor: false,
    });
  });

  it('prefers API author object over fallbackUser even when another member created the event', () => {
    const mockUser = {
      id: 'usr-123',
      name: 'Allan Rodrigues',
    };

    const result = normalizeEventAuthor(
      {
        createdByUserId: 'usr-other',
        author: {
          id: 'usr-other',
          name: '',
          first_name: 'João',
          last_name: 'Souza',
          email: 'joao@example.com',
          image: null,
        },
      },
      mockUser
    );
    expect(result).toEqual({
      name: 'João Souza',
      email: 'joao@example.com',
      avatar: null,
      initials: 'JS',
      hasAuthor: true,
    });
  });
});

describe('mapEventToCalendarItem', () => {
  it('maps description and author attributes faithfully', () => {
    const rawEvent = {
      id: 'ev-test-1',
      name: 'Conferência Anual',
      description: 'Planejamento estratégico e metas',
      author: { name: 'Diretoria' },
      startDate: '2026-11-20T10:00:00',
      endDate: '2026-11-20T18:00:00',
    };

    const item = mapEventToCalendarItem(rawEvent);
    expect(item.id).toBe('ev-test-1');
    expect(item.title).toBe('Conferência Anual');
    expect(item.description).toBe('Planejamento estratégico e metas');
    expect(item.author).toEqual({ name: 'Diretoria' });
    expect(item.rawEvent).toBe(rawEvent);
  });
});

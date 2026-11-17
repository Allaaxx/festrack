import { describe, expect, it } from 'vitest';

import {
  DEFAULT_UNTAGGED_CALENDAR_CLASS,
  DEFAULT_UNTAGGED_DOT_CLASS,
  getEventColorClasses,
  getEventDotColor,
} from './calendar-styles';

describe('calendar-styles (#145: Neutral Pink for Untagged & Orphan Events)', () => {
  const shopTagOptions = [
    { value: 'workshop', label: 'Workshop', dotClass: 'bg-indigo-400' },
    { value: 'meetup', label: 'Meetup', dotClass: 'bg-teal-400' },
  ];

  describe('getEventColorClasses', () => {
    it('returns neutral pink calendar classes as fallback for null, undefined, empty string or etc', () => {
      expect(getEventColorClasses(null)).toBe(DEFAULT_UNTAGGED_CALENDAR_CLASS);
      expect(getEventColorClasses(undefined)).toBe(DEFAULT_UNTAGGED_CALENDAR_CLASS);
      expect(getEventColorClasses('')).toBe(DEFAULT_UNTAGGED_CALENDAR_CLASS);
      expect(getEventColorClasses('etc')).toBe(DEFAULT_UNTAGGED_CALENDAR_CLASS);
      expect(DEFAULT_UNTAGGED_CALENDAR_CLASS).toContain('bg-pink-200/50');
      expect(DEFAULT_UNTAGGED_CALENDAR_CLASS).toContain('text-pink-950/80');
      expect(DEFAULT_UNTAGGED_CALENDAR_CLASS).toContain('dark:bg-pink-400/25');
      expect(DEFAULT_UNTAGGED_CALENDAR_CLASS).toContain('dark:text-pink-200');
    });

    it('returns neutral pink calendar classes for untagged event objects', () => {
      const untaggedEvent = { id: '1', title: 'Sem etiqueta', tag: null };
      expect(getEventColorClasses(untaggedEvent)).toBe(DEFAULT_UNTAGGED_CALENDAR_CLASS);

      const emptyTagEvent = { id: '2', title: 'Tag vazia', tag: '' };
      expect(getEventColorClasses(emptyTagEvent)).toBe(DEFAULT_UNTAGGED_CALENDAR_CLASS);

      const missingTagEvent = { id: '3', title: 'Sem prop tag' };
      expect(getEventColorClasses(missingTagEvent)).toBe(DEFAULT_UNTAGGED_CALENDAR_CLASS);
    });

    it('treats orphan tag (tag not in shop tagOptions) as untagged (pink)', () => {
      const orphanEvent = {
        id: '4',
        title: 'Tag excluída',
        tag: 'deleted-tag-slug',
      };
      expect(getEventColorClasses(orphanEvent, shopTagOptions)).toBe(
        DEFAULT_UNTAGGED_CALENDAR_CLASS
      );
    });

    it('returns matched tag color classes when tag exists in shop tagOptions', () => {
      const taggedEvent = {
        id: '5',
        title: 'Workshop Intensivo',
        tag: 'workshop',
      };
      const classes = getEventColorClasses(taggedEvent, shopTagOptions);
      expect(classes).toContain('bg-indigo-200/50');
      expect(classes).toContain('text-indigo-950/80');
    });

    it('returns status calendar classes when a known status is passed', () => {
      expect(getEventColorClasses('scheduled')).toContain('bg-violet-200/50');
      expect(getEventColorClasses('in_progress')).toContain('bg-amber-200/50');
      expect(getEventColorClasses('completed')).toContain('bg-rose-200/50');
    });
  });

  describe('getEventDotColor', () => {
    it('returns neutral pink dot (bg-pink-400) for untagged events and null/undefined values', () => {
      expect(getEventDotColor(null)).toBe(DEFAULT_UNTAGGED_DOT_CLASS);
      expect(getEventDotColor(undefined)).toBe(DEFAULT_UNTAGGED_DOT_CLASS);
      expect(getEventDotColor('')).toBe(DEFAULT_UNTAGGED_DOT_CLASS);
      expect(getEventDotColor('etc')).toBe(DEFAULT_UNTAGGED_DOT_CLASS);
      expect(DEFAULT_UNTAGGED_DOT_CLASS).toBe('bg-pink-400');

      expect(getEventDotColor({ tag: null })).toBe('bg-pink-400');
      expect(getEventDotColor({})).toBe('bg-pink-400');
    });

    it('returns neutral pink dot for orphan tag events', () => {
      const orphanEvent = { tag: 'non-existent-tag' };
      expect(getEventDotColor(orphanEvent, shopTagOptions)).toBe('bg-pink-400');
    });

    it('returns matched dot color for valid tagged event', () => {
      const taggedEvent = { tag: 'workshop' };
      expect(getEventDotColor(taggedEvent, shopTagOptions)).toBe('bg-indigo-400');
    });
  });
});

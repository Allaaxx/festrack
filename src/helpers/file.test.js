import { describe, expect, it } from 'vitest';

import { formatFileSize, getFileCategory, getFileId } from '@/helpers/file';

describe('formatFileSize', () => {
  it('returns "0 B" for non-positive or falsy values', () => {
    expect(formatFileSize(null)).toBe('0 B');
    expect(formatFileSize(undefined)).toBe('0 B');
    expect(formatFileSize(NaN)).toBe('0 B');
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(-100)).toBe('0 B');
  });

  it('formats bytes correctly', () => {
    expect(formatFileSize(1)).toBe('1 B');
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  it('formats kilobytes correctly without trailing zero for whole numbers', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(373 * 1024)).toBe('373 KB');
  });

  it('formats megabytes correctly with decimal places when appropriate', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(25 * 1024 * 1024)).toBe('25 MB');
    // 1,3 MB approx
    expect(formatFileSize(1.3 * 1024 * 1024)).toBe('1,3 MB');
  });

  it('formats gigabytes and terabytes', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1,5 GB');
    expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
  });

  it('respects the decimals parameter', () => {
    const bytes = 1.256 * 1024 * 1024;
    expect(formatFileSize(bytes, 2)).toBe('1,26 MB');
    expect(formatFileSize(bytes, 0)).toBe('1 MB');
    expect(formatFileSize(bytes, -1)).toBe('1 MB');
  });
});

describe('getFileId', () => {
  it('generates a synthetic id using name, size, and lastModified', () => {
    const file = { name: 'document.pdf', size: 1024, lastModified: 1700000000 };
    expect(getFileId(file)).toBe('document.pdf-1024-1700000000');
  });

  it('falls back to index if lastModified is missing', () => {
    const file = { name: 'photo.png', size: 2048 };
    expect(getFileId(file, 3)).toBe('photo.png-2048-3');
  });

  it('handles falsy file gracefully', () => {
    expect(getFileId(null, 5)).toBe('5');
    expect(getFileId(undefined, 0)).toBe('0');
  });
});

describe('getFileCategory', () => {
  it('returns "generic" for falsy or empty inputs', () => {
    expect(getFileCategory(null)).toBe('generic');
    expect(getFileCategory(undefined)).toBe('generic');
    expect(getFileCategory({})).toBe('generic');
  });

  it('identifies image files by mime type or extension', () => {
    expect(getFileCategory({ type: 'image/png', name: 'photo.png' })).toBe('image');
    expect(getFileCategory({ type: 'image/jpeg', name: 'photo.jpg' })).toBe('image');
    expect(getFileCategory({ type: 'image/webp', name: 'photo.webp' })).toBe('image');
    expect(getFileCategory({ type: '', name: 'photo.svg' })).toBe('image');
    expect(getFileCategory({ type: '', name: 'photo.GIF' })).toBe('image');
  });

  it('identifies pdf files', () => {
    expect(getFileCategory({ type: 'application/pdf', name: 'doc.pdf' })).toBe('pdf');
    expect(getFileCategory({ type: '', name: 'document.PDF' })).toBe('pdf');
  });

  it('identifies spreadsheets and csv files', () => {
    expect(getFileCategory({ type: 'text/csv', name: 'data.csv' })).toBe('spreadsheet');
    expect(
      getFileCategory({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        name: 'sheet.xlsx',
      })
    ).toBe('spreadsheet');
    expect(getFileCategory({ type: '', name: 'report.xls' })).toBe('spreadsheet');
  });

  it('identifies word/text documents', () => {
    expect(getFileCategory({ type: 'application/msword', name: 'doc.doc' })).toBe('document');
    expect(
      getFileCategory({
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        name: 'doc.docx',
      })
    ).toBe('document');
    expect(getFileCategory({ type: 'text/plain', name: 'notes.txt' })).toBe('document');
  });

  it('identifies archive files', () => {
    expect(getFileCategory({ type: 'application/zip', name: 'bundle.zip' })).toBe('archive');
    expect(getFileCategory({ type: 'application/x-tar', name: 'archive.tar' })).toBe('archive');
    expect(getFileCategory({ type: '', name: 'files.7z' })).toBe('archive');
    expect(getFileCategory({ type: '', name: 'files.rar' })).toBe('archive');
  });

  it('returns "generic" for unknown file types', () => {
    expect(getFileCategory({ type: 'audio/mp3', name: 'audio.mp3' })).toBe('generic');
    expect(getFileCategory({ type: 'video/mp4', name: 'video.mp4' })).toBe('generic');
    expect(getFileCategory({ type: 'application/octet-stream', name: 'unknown.bin' })).toBe('generic');
  });
});

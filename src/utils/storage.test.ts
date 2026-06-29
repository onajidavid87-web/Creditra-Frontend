import { describe, it, expect, beforeEach } from 'vitest';
import { readJson, writeJson, removeKey } from './storage';

describe('storage helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips JSON values through write/read', () => {
    writeJson('user', { name: 'Ada', age: 36 });
    expect(readJson('user', null)).toEqual({ name: 'Ada', age: 36 });
  });

  it('returns the fallback when the key is missing', () => {
    expect(readJson('missing', 'fallback-value')).toBe('fallback-value');
  });

  it('returns the fallback when the stored value is malformed JSON', () => {
    window.localStorage.setItem('broken', '{not json');
    expect(readJson('broken', 42)).toBe(42);
  });

  it('removes a key', () => {
    writeJson('temp', { ok: true });
    removeKey('temp');
    expect(window.localStorage.getItem('temp')).toBeNull();
  });
});

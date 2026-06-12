import { describe, it, expect } from 'vitest';
import { cx } from './classnames';

describe('cx', () => {
  it('joins truthy string values with a single space', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c');
  });

  it('skips falsy values', () => {
    expect(cx('a', null, undefined, false, '', 'b')).toBe('a b');
  });

  it('treats numbers as class names', () => {
    expect(cx('a', 0, 1)).toBe('a 1');
  });

  it('expands arrays recursively', () => {
    expect(cx(['a', ['b', ['c']]], 'd')).toBe('a b c d');
  });

  it('includes object keys whose values are truthy', () => {
    expect(cx({ a: true, b: false, c: 1, d: '' })).toBe('a c');
  });

  it('returns an empty string when given no truthy input', () => {
    expect(cx()).toBe('');
    expect(cx(null, false, undefined)).toBe('');
  });
});

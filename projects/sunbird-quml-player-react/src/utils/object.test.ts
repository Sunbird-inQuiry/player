import { describe, it, expect } from 'vitest';
import { deepClone, isEmpty } from './object';

describe('object utils', () => {
  it('deep clones without sharing references', () => {
    const original = { a: 1, nested: { b: 2 } };
    const clone = deepClone(original);
    clone.nested.b = 99;

    expect(original.nested.b).toBe(2);
    expect(clone).toEqual({ a: 1, nested: { b: 99 } });
  });

  it('detects empty objects', () => {
    expect(isEmpty({})).toBe(true);
    expect(isEmpty({ a: 1 })).toBe(false);
  });
});

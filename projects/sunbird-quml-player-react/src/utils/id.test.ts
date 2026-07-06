import { describe, it, expect } from 'vitest';
import { generateID } from './id';

describe('id utils', () => {
  it('generates unique UUIDs', () => {
    const id1 = generateID();
    const id2 = generateID();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^[0-9a-f-]{36}$/);
  });
});

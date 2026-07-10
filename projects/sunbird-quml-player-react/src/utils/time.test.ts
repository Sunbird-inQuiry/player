import { describe, it, expect } from 'vitest';
import { formatTime } from './time';

describe('time utils', () => {
  it('formats seconds as HH:MM:SS', () => {
    expect(formatTime(0)).toBe('00:00:00');
    expect(formatTime(65)).toBe('00:01:05');
    expect(formatTime(3661)).toBe('01:01:01');
  });
});

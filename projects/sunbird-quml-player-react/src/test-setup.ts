import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.jQuery (used by KaTeX)
if (typeof window !== 'undefined') {
  (window as unknown as { jQuery: { noConflict: () => null } }).jQuery = {
    noConflict: () => null,
  };
}

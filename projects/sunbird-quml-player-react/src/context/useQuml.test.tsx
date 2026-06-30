import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QumlProvider } from './QumlContext';
import { useQuml, useQumlState, useQumlActions } from './useQuml';
import type { PlayerConfig } from '../types';

const mockPlayerConfig: PlayerConfig = {
  context: { uid: '1' },
  config: { language: 'en' },
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <QumlProvider playerConfig={mockPlayerConfig}>{children}</QumlProvider>
);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useQuml', () => {
  it('throws when used outside of QumlProvider', () => {
    // Suppress React's expected error log for this render.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useQuml())).toThrow(
      'useQuml must be used within QumlProvider',
    );
  });

  it('returns the context value (state + actions) within the provider', () => {
    const { result } = renderHook(() => useQuml(), { wrapper });
    expect(result.current.state).toBeDefined();
    expect(typeof result.current.storeAnswer).toBe('function');
    expect(typeof result.current.setLanguage).toBe('function');
  });
});

describe('useQumlState', () => {
  it('returns just the state slice', () => {
    const { result } = renderHook(() => useQumlState(), { wrapper });
    expect(result.current.language).toBe('en');
    expect(result.current.answers).toEqual({});
  });
});

describe('useQumlActions', () => {
  it('returns the action creators and they update state', () => {
    const { result } = renderHook(
      () => ({ actions: useQumlActions(), state: useQumlState() }),
      { wrapper },
    );
    expect(typeof result.current.actions.storeAnswer).toBe('function');
    act(() => result.current.actions.storeAnswer('q1', { value: 5 }));
    expect(result.current.state.answers.q1).toEqual({ value: 5 });
  });
});
